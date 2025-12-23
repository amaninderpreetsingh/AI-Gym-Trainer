import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Timer, Dumbbell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRoutine } from '../services/routineService';
import { Routine, CompletedExercise, LoggedSet } from '../types';
import CurrentExerciseCard from '../components/CurrentExerciseCard';
import NextUpPreview from '../components/NextUpPreview';
import ListeningIndicator from '../components/ListeningIndicator';

const ActiveSession = () => {
    const { routineId } = useParams<{ routineId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [routine, setRoutine] = useState<Routine | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSetIndex, setCurrentSetIndex] = useState(1);
    const [isListening, setIsListening] = useState(false);
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);

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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const currentExercise = routine?.exercises[currentExerciseIndex];
    const isLastExercise = currentExerciseIndex === (routine?.exercises.length || 0) - 1;

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

        setCompletedExercises((prev) => {
            const existing = prev.find(e => e.name === currentExercise.name);
            if (existing) {
                return prev.map(e =>
                    e.name === currentExercise.name
                        ? { ...e, sets: [...e.sets, newSet] }
                        : e
                );
            }
            return [...prev, { name: currentExercise.name, sets: [newSet] }];
        });

        // Move to next set or next exercise
        if (currentSetIndex < currentExercise.targetSets) {
            setCurrentSetIndex((prev) => prev + 1);
        } else {
            // Last set logged, go to next exercise
            handleNextExercise();
        }
    };

    const handleNextExercise = () => {
        if (isLastExercise) {
            handleEndSession();
        } else {
            setCurrentExerciseIndex((prev) => prev + 1);
            setCurrentSetIndex(1);
        }
    };

    const handleStartSession = () => {
        setIsSessionStarted(true);
        setIsListening(true);
    };

    const handleEndSession = () => {
        // TODO: Save to Firestore in Phase 5
        navigate('/dashboard');
    };

    const toggleListening = () => {
        setIsListening((prev) => !prev);
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
                    className="flex items-center gap-4 mb-8"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-xl glass hover:bg-dark-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                    <h1 className="text-xl font-bold">{routine.name}</h1>
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
                </div>

                <span className="text-sm font-medium text-dark-300">{routine.name}</span>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEndSession}
                    className="p-2 rounded-lg hover:bg-dark-800 transition-colors"
                >
                    <X className="w-5 h-5 text-dark-400" />
                </motion.button>
            </motion.header>

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
                        <ListeningIndicator isListening={isListening} />
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
