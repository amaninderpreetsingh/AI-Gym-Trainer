import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Timer, Dumbbell, Volume2, VolumeX, Settings, Mic } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { getRoutine, getExerciseMuscleGroupMap } from '../services/routineService';
import { saveWorkoutLog } from '../services/workoutLogService';
import { Routine, CompletedExercise, LoggedSet } from '../types';
import CurrentExerciseCard from '../components/CurrentExerciseCard';
import NextUpPreview from '../components/NextUpPreview';
import ListeningIndicator from '../components/ListeningIndicator';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useVoiceCommands from '../hooks/useVoiceCommands';

const ActiveSession = () => {
    const { routineId } = useParams<{ routineId: string }>();
    const { user } = useAuth();
    const { voiceEnabled: globalVoiceEnabled } = useSettings();
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
    const [isSaving, setIsSaving] = useState(false);
    const sessionStartTimeRef = useRef<Date | null>(null);

    // Voice hooks
    const { speak, announceExercise, announceSetLogged, announceNextExercise, announceWorkoutComplete } = useTextToSpeech();

    // Browser speech recognition (always use this for now)
    const browserSpeech = useSpeechRecognition();

    // For now, always use browser speech - AssemblyAI has CORS issues from localhost
    const transcript = browserSpeech.transcript;
    const isListening = browserSpeech.isListening;
    const startListening = browserSpeech.startListening;
    const stopListening = browserSpeech.stopListening;
    const resetTranscript = browserSpeech.resetTranscript;
    const isSupported = browserSpeech.isSupported;
    const speechError = browserSpeech.error;
    const [micError, setMicError] = useState<string | null>(null);

    const currentExercise = routine?.exercises[currentExerciseIndex];
    const isLastExercise = currentExerciseIndex === (routine?.exercises.length || 0) - 1;

    // Debug: Log transcript changes
    useEffect(() => {
        if (transcript) {
            console.log('📝 Transcript updated:', transcript);
        }
    }, [transcript]);

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

    const handleNextExercise = (exercisesOverride?: CompletedExercise[]) => {
        if (isLastExercise) {
            if (voiceEnabled) {
                announceWorkoutComplete();
            }
            handleEndSession(true, exercisesOverride);
        } else {
            const nextExercise = routine?.exercises[currentExerciseIndex + 1];
            if (nextExercise && voiceEnabled) {
                announceNextExercise(nextExercise.name);
            }
            setCurrentExerciseIndex((prev) => prev + 1);
            setCurrentSetIndex(1);
        }
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
        triggerPhrases: ['hey trainer', 'hey traina', 'a trainer', 'trainer', 'who trainer', 'the trainer'],
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
            setIsSaving(true);
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
            setIsSaving(false);
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

    const toggleVoice = () => {
        setVoiceEnabled((prev) => !prev);
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

                    {/* Voice toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleVoice}
                        className={`p-1.5 rounded-lg transition-colors ${voiceEnabled ? 'text-primary-400' : 'text-dark-500'}`}
                        title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
                    >
                        {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </motion.button>
                </div>

                <span className="text-sm font-medium text-dark-300">{routine.name}</span>

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
                <AnimatePresence mode="wait">
                    {currentExercise && (
                        <CurrentExerciseCard
                            key={`${currentExerciseIndex}-${currentExercise.name}`}
                            exercise={currentExercise}
                            currentSet={currentSetIndex}
                            totalSets={currentExercise.targetSets}
                            lastWeight={getLastLoggedSet()?.weight}
                            lastReps={getLastLoggedSet()?.reps}
                            onLogSet={handleLogSet}
                            onNextExercise={handleNextExercise}
                            isLastExercise={isLastExercise}
                        />
                    )}
                </AnimatePresence>

                {/* Listening Indicator */}
                <div className="flex justify-center py-2">
                    <div onClick={toggleListening} className="cursor-pointer">
                        <ListeningIndicator
                            isListening={isListening}
                            isSupported={isSupported}
                            error={micError}
                        />
                    </div>
                </div>

                {/* Next Up Preview */}
                {routine && (
                    <NextUpPreview
                        exercises={routine.exercises}
                        currentIndex={currentExerciseIndex}
                    />
                )}
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
