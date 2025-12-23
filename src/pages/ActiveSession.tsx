import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Timer, Dumbbell, Settings, Mic, ChevronDown, CheckCircle, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { getRoutine, getExerciseMuscleGroupMap } from '../services/routineService';
import { saveWorkoutLog } from '../services/workoutLogService';
import { Routine, CompletedExercise, LoggedSet } from '../types';
import CurrentExerciseCard from '../components/CurrentExerciseCard';
import ListeningIndicator from '../components/ListeningIndicator';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useVoiceCommands from '../hooks/useVoiceCommands';

const ActiveSession = () => {
    const { routineId } = useParams<{ routineId: string }>();
    const { user } = useAuth();
    const { voiceEnabled: globalVoiceEnabled, triggerPhrases } = useSettings();
    const navigate = useNavigate();

    const [routine, setRoutine] = useState<Routine | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSetIndex, setCurrentSetIndex] = useState(1);
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [voiceEnabled, setVoiceEnabled] = useState(globalVoiceEnabled);
    const [lastVoiceLog, setLastVoiceLog] = useState<string | null>(null);
    const sessionStartTimeRef = useRef<Date | null>(null);

    // Voice hooks
    const { announceExercise, announceSetLogged, announceNextExercise, announceWorkoutComplete } = useTextToSpeech();

    // Browser speech recognition (always use this for now)
    const browserSpeech = useSpeechRecognition();

    // For now, always use browser speech - AssemblyAI has CORS issues from localhost
    const transcript = browserSpeech.transcript;
    const isListening = browserSpeech.isListening;
    const startListening = browserSpeech.startListening;
    const stopListening = browserSpeech.stopListening;
    const resetTranscript = browserSpeech.resetTranscript;
    const isSupported = browserSpeech.isSupported;
    const [micError, setMicError] = useState<string | null>(null);
    const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
    const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);

    const currentExercise = routine?.exercises[currentExerciseIndex];
    const isLastExercise = currentExerciseIndex === (routine?.exercises.length || 0) - 1;

    // Debug: Log transcript changes
    useEffect(() => {
        if (transcript) {
            console.log('📝 Transcript updated:', transcript);
        }
    }, [transcript]);

    // Reset transcript after 2 seconds of silence
    useEffect(() => {
        if (transcript) {
            const timer = setTimeout(() => {
                console.log('🤫 Silence detected - resetting transcript');
                resetTranscript();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [transcript, resetTranscript]);

    // Fetch routine
    useEffect(() => {
        const fetchRoutine = async () => {
            if (!user || !routineId) return;

            try {
                const data = await getRoutine(user.uid, routineId);
                setRoutine(data);
            } catch (error) {
                console.error('Error fetching routine:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoutine();
    }, [user, routineId]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSessionStarted) {
            interval = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isSessionStarted]);

    // Cleanup: Stop listening when leaving the page
    useEffect(() => {
        return () => {
            console.log('🛑 Leaving routine - stopping mic');
            stopListening();
        };
    }, [stopListening]);

    // Announce exercise when it changes
    useEffect(() => {
        if (isSessionStarted && currentExercise && voiceEnabled) {
            announceExercise(currentExercise.name, currentSetIndex, currentExercise.targetSets);
        }
    }, [currentExerciseIndex, isSessionStarted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getCurrentExerciseLog = (): CompletedExercise | undefined => {
        return completedExercises.find(e => e.name === currentExercise?.name);
    };

    const getLastLoggedSet = (): LoggedSet | undefined => {
        const exerciseLog = getCurrentExerciseLog();
        return exerciseLog?.sets[exerciseLog.sets.length - 1];
    };

    const handleLogSet = (weight: number, reps: number) => {
        if (!currentExercise) return;

        const newSet: LoggedSet = {
            weight,
            reps,
            timestamp: new Date()
        };

        // Calculate updated exercises immediately to handle race condition on last set
        let updatedExercises: CompletedExercise[] = [];
        const existing = completedExercises.find(e => e.name === currentExercise.name);

        if (existing) {
            updatedExercises = completedExercises.map(e =>
                e.name === currentExercise.name
                    ? { ...e, sets: [...e.sets, newSet] }
                    : e
            );
        } else {
            updatedExercises = [...completedExercises, { name: currentExercise.name, sets: [newSet] }];
        }

        setCompletedExercises(updatedExercises);

        if (currentSetIndex < currentExercise.targetSets) {
            console.log(`📈 Set ${currentSetIndex}/${currentExercise.targetSets} logged, moving to next set`);
            setCurrentSetIndex((prev) => prev + 1);
        } else {
            console.log(`✅ All ${currentExercise.targetSets} sets complete, advancing to next exercise`);
            // Pass the updated exercises to ensure the last set is saved
            handleNextExercise(updatedExercises);
        }
    };

    const updateSetIndexForExercise = (exerciseIndex: number) => {
        const exercise = routine?.exercises[exerciseIndex];
        if (!exercise) return;

        const completed = completedExercises.find(e => e.name === exercise.name);
        setCurrentSetIndex((completed?.sets.length || 0) + 1);
    };

    const handleNextExercise = (exercisesOverride?: CompletedExercise[]) => {
        if (isLastExercise) {
            if (voiceEnabled) {
                announceWorkoutComplete();
            }
            handleEndSession(true, exercisesOverride);
        } else {
            const nextIndex = currentExerciseIndex + 1;
            const nextExercise = routine?.exercises[nextIndex];
            if (nextExercise && voiceEnabled) {
                announceNextExercise(nextExercise.name);
            }
            setCurrentExerciseIndex(nextIndex);
            updateSetIndexForExercise(nextIndex);
        }
    };



    const handleUpdateSet = (setIndex: number, weight: number, reps: number) => {
        if (!currentExercise) return;

        setCompletedExercises(prev => prev.map(e => {
            if (e.name === currentExercise.name) {
                const newSets = [...e.sets];
                if (newSets[setIndex]) {
                    newSets[setIndex] = { ...newSets[setIndex], weight, reps };
                }
                return { ...e, sets: newSets };
            }
            return e;
        }));
    };

    // Handle voice commands - use regular function to avoid stale closure
    const handleVoiceCommand = (command: { type: string; weight?: number; reps?: number; rawText: string }) => {
        console.log('🗣️ Voice command received:', command);
        if (!currentExercise || !voiceEnabled) {
            console.log('⚠️ Cannot process - no exercise or voice disabled');
            return;
        }

        if (command.type === 'log_set' && command.weight !== undefined && command.reps !== undefined) {
            console.log(`📝 Logging set: ${command.weight} lbs × ${command.reps} reps`);
            handleLogSet(command.weight, command.reps);
            setLastVoiceLog(`Logged: ${command.weight} lbs × ${command.reps} reps`);
            announceSetLogged(command.weight, command.reps);
            setTimeout(() => setLastVoiceLog(null), 3000);
        } else if (command.type === 'next_exercise') {
            handleNextExercise();
        }

        resetTranscript();
    };

    // Voice commands hook
    useVoiceCommands(transcript, {
        triggerPhrases: triggerPhrases,
        onCommand: handleVoiceCommand,
        enabled: voiceEnabled && isSessionStarted
    });

    const handleStartSession = () => {
        setIsSessionStarted(true);
        sessionStartTimeRef.current = new Date();
        setMicError(null);

        // Start listening - SpeechRecognition will handle mic permission
        startListening();
    };

    const handleEndSession = async (saveData: boolean = true, exercisesToSave?: CompletedExercise[]) => {
        stopListening();

        const exercises = exercisesToSave || completedExercises;

        // Save workout to Firestore if we have data
        if (saveData && user && routine && routineId && exercises.length > 0 && sessionStartTimeRef.current) {
            try {
                // Get muscle group mapping from routine for denormalized storage
                const muscleGroupMap = getExerciseMuscleGroupMap(routine);

                await saveWorkoutLog(
                    user.uid,
                    routineId,
                    routine.name,
                    sessionStartTimeRef.current,
                    new Date(),
                    exercises,
                    muscleGroupMap
                );
            } catch (error) {
                console.error('Error saving workout:', error);
            }
        }

        navigate('/dashboard');
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const checkIsRoutineComplete = () => {
        if (!routine) return false;
        return routine.exercises.every(ex => {
            const completed = completedExercises.find(e => e.name === ex.name);
            return completed && completed.sets.length >= ex.targetSets;
        });
    };

    const handleFinishClick = () => {
        if (checkIsRoutineComplete()) {
            handleEndSession(true);
        } else {
            setShowFinishConfirmation(true);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Dumbbell className="w-12 h-12 text-primary-500" />
                </motion.div>
            </div>
        );
    }

    if (!routine) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <Dumbbell className="w-12 h-12 text-dark-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Routine not found</h2>
                <p className="text-dark-400 mb-4">This routine may have been deleted.</p>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/dashboard')}
                    className="text-primary-500 font-medium"
                >
                    Back to Dashboard
                </motion.button>
            </div>
        );
    }

    // Pre-session view
    if (!isSessionStarted) {
        return (
            <div className="min-h-screen p-4 md:p-6">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/dashboard')}
                            className="p-2 rounded-xl glass hover:bg-dark-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </motion.button>
                        <h1 className="text-xl font-bold">{routine.name}</h1>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/settings')}
                        className="p-2 rounded-xl glass hover:bg-dark-700 transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5 text-dark-400" />
                    </motion.button>
                </motion.header>

                {/* Exercise Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-lg mx-auto"
                >
                    <div className="glass rounded-2xl p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Workout Overview</h2>
                        <div className="space-y-3">
                            {routine.exercises.map((exercise, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50">
                                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-sm font-medium text-primary-400">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{exercise.name}</p>
                                        <p className="text-xs text-dark-400">
                                            {exercise.targetSets} sets × {exercise.targetReps} reps
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Voice Provider Info */}
                    <div className="glass rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Mic className="w-4 h-4 text-green-400" />
                                <span className="text-sm font-medium">Browser Voice</span>
                                <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                                    Free
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-dark-500">
                            Say <span className="text-primary-400 font-medium">"Hey Trainer, 50 pounds 10 reps"</span> to log sets
                        </p>
                    </div>

                    {/* Start Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStartSession}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-lg glow hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center gap-3"
                    >
                        <Dumbbell className="w-5 h-5" />
                        Start Workout
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    // Active session view
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border-b border-dark-800"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-dark-400">
                        <Timer className="w-4 h-4" />
                        <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
                    </div>

                    {/* Provider indicator */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                        <Mic className="w-3 h-3" />
                        Free
                    </div>


                </div>



                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEndSession(false)}
                    className="p-2 rounded-lg hover:bg-dark-800 transition-colors"
                    title="End workout without saving"
                >
                    <X className="w-5 h-5 text-dark-400" />
                </motion.button>
            </motion.header>

            {/* Voice Log Feedback */}
            <AnimatePresence>
                {lastVoiceLog && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mx-4 mt-2 p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-center"
                    >
                        <p className="text-green-400 text-sm font-medium">🎤 {lastVoiceLog}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Debug Info */}
            <div className="mx-4 mt-2 p-2 rounded-lg bg-dark-800/50 text-xs text-dark-400">
                <div className="flex gap-4 items-center flex-wrap">
                    <span>🎤 Status: {isListening ? '✅ Listening' : '❌ Not listening'}</span>
                    <span>🔧 Supported: {isSupported ? '✅ Yes' : '❌ No'}</span>
                    <span>🧠 Provider: Browser</span>
                </div>
                {transcript && (
                    <div className="mt-1 truncate">
                        💬 Heard: {transcript.slice(-100)}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-4 gap-6 overflow-y-auto">
                {/* Exercise Dropdown */}
                <div className="relative z-50 w-full max-w-lg mx-auto">
                    <button
                        onClick={() => setShowExerciseDropdown(!showExerciseDropdown)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 hover:border-primary-500/50 hover:bg-dark-700/50 transition-all w-full"
                    >
                        <div className="p-1 rounded bg-primary-500/10 text-primary-400">
                            <List className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-sm font-medium text-white truncate text-left">
                            {currentExerciseIndex + 1}. {currentExercise?.name || routine.name}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${showExerciseDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showExerciseDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowExerciseDropdown(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 max-h-[60vh] overflow-y-auto bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50 py-1"
                                >
                                    {routine.exercises.map((ex, idx) => {
                                        const isComplete = completedExercises.find(e => e.name === ex.name)?.sets.length === ex.targetSets;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCurrentExerciseIndex(idx);
                                                    updateSetIndexForExercise(idx);
                                                    setShowExerciseDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-dark-700 flex items-center justify-between gap-3 ${idx === currentExerciseIndex ? 'bg-primary-500/10' : ''
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${idx === currentExerciseIndex ? 'text-primary-400' : 'text-white'
                                                        }`}>
                                                        {idx + 1}. {ex.name}
                                                    </p>
                                                    <p className="text-xs text-dark-500">
                                                        {ex.targetSets} sets × {ex.targetReps} reps
                                                    </p>
                                                </div>
                                                {isComplete && (
                                                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {showFinishConfirmation && (
                        <>
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-sm w-full shadow-xl"
                                >
                                    <h3 className="text-lg font-bold text-white mb-2">Finish Workout?</h3>
                                    <p className="text-dark-400 mb-6">
                                        You haven't completed all exercises. Are you sure you want to finish now?
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowFinishConfirmation(false)}
                                            className="flex-1 py-3 px-4 rounded-xl bg-dark-700 text-white font-medium hover:bg-dark-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowFinishConfirmation(false);
                                                handleEndSession(true);
                                            }}
                                            className="flex-1 py-3 px-4 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                                        >
                                            Finish
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {currentExercise && (
                        <CurrentExerciseCard
                            key={`${currentExerciseIndex}-${currentExercise.name}`}
                            exercise={currentExercise}
                            currentSet={currentSetIndex}
                            totalSets={currentExercise.targetSets}
                            completedSets={getCurrentExerciseLog()?.sets || []}
                            lastWeight={getLastLoggedSet()?.weight}
                            lastReps={getLastLoggedSet()?.reps}
                            onLogSet={handleLogSet}
                            onUpdateSet={handleUpdateSet}
                            onNextExercise={handleNextExercise}
                            isLastExercise={isLastExercise}
                        />
                    )}
                </AnimatePresence>

                {/* Footer Controls: Mic & Finish */}
                <div className="flex items-center justify-center gap-6 py-2">
                    {/* Mic Button */}
                    <div onClick={toggleListening} className="cursor-pointer">
                        <ListeningIndicator
                            isListening={isListening}
                            isSupported={isSupported}
                            error={micError}
                        />
                    </div>

                    {/* Finish Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleFinishClick}
                        className="px-5 py-3 rounded-xl bg-primary-500/10 text-primary-400 font-medium hover:bg-primary-500/20 transition-colors border border-primary-500/20 shadow-lg shadow-primary-900/20"
                    >
                        Finish
                    </motion.button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="p-4 border-t border-dark-800">
                <div className="flex items-center justify-between text-xs text-dark-400 mb-2">
                    <span>Progress</span>
                    <span>{currentExerciseIndex + 1} / {routine.exercises.length} exercises</span>
                </div>
                <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentExerciseIndex) / routine.exercises.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default ActiveSession;
