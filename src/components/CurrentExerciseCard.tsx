import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { Exercise } from '../types';

interface CurrentExerciseCardProps {
    exercise: Exercise;
    currentSet: number;
    totalSets: number;
    lastWeight?: number;
    lastReps?: number;
    onLogSet: (weight: number, reps: number) => void;
    onNextExercise?: () => void;
    isLastExercise: boolean;
}

const CurrentExerciseCard = ({
    exercise,
    currentSet,
    totalSets,
    lastWeight,
    lastReps,
    onLogSet,
    onNextExercise,
    isLastExercise
}: CurrentExerciseCardProps) => {
    const [weight, setWeight] = useState<string>(lastWeight?.toString() || '');
    const [reps, setReps] = useState<string>(exercise.targetReps.toString());
    const allSetsComplete = currentSet > totalSets;

    const handleLogSet = () => {
        const w = parseFloat(weight) || 0;
        const r = parseInt(reps) || exercise.targetReps;
        onLogSet(w, r);

        // Pre-fill with last weight for next set
        if (!allSetsComplete) {
            setWeight(w.toString());
            setReps(exercise.targetReps.toString());
        }
    };

    const handleFinish = () => {
        if (onNextExercise) {
            onNextExercise();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, x: -100 }}
            className="w-full max-w-lg mx-auto"
        >
            {/* Main Card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700/50 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-32 bg-primary-500/20 blur-3xl" />

                {/* Content */}
                <div className="relative p-6">
                    {/* Muscle Group Tag */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium mb-3"
                    >
                        {exercise.muscleGroup}
                    </motion.div>

                    {/* Exercise Name */}
                    <AnimatePresence mode="wait">
                        <motion.h2
                            key={exercise.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-3xl md:text-4xl font-bold text-white mb-1"
                        >
                            {exercise.name}
                        </motion.h2>
                    </AnimatePresence>

                    {/* Target Info */}
                    <p className="text-dark-400 mb-4">
                        Target: {exercise.targetSets} sets × {exercise.targetReps} reps
                    </p>

                    {/* Set Progress */}
                    <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-dark-400">Set Progress</span>
                            <span className="text-sm font-medium text-white">{Math.min(currentSet, totalSets)} / {totalSets}</span>
                        </div>
                        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(Math.min(currentSet, totalSets) / totalSets) * 100}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Weight & Reps Input */}
                    {!allSetsComplete ? (
                        <div className="mb-5">
                            <p className="text-sm text-dark-400 mb-3">Log Set {currentSet}</p>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {/* Weight Input */}
                                <div>
                                    <label className="block text-xs text-dark-500 mb-1.5">Weight (lbs)</label>
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors text-white text-center text-2xl font-bold placeholder-dark-600"
                                    />
                                </div>

                                {/* Reps Input */}
                                <div>
                                    <label className="block text-xs text-dark-500 mb-1.5">Reps</label>
                                    <input
                                        type="number"
                                        value={reps}
                                        onChange={(e) => setReps(e.target.value)}
                                        placeholder={exercise.targetReps.toString()}
                                        className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors text-white text-center text-2xl font-bold placeholder-dark-600"
                                    />
                                </div>
                            </div>

                            {/* Log Set Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleLogSet}
                                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-lg glow hover:from-primary-600 hover:to-primary-700 transition-all"
                            >
                                <Check className="w-5 h-5" />
                                Log Set {currentSet}
                            </motion.button>
                        </div>
                    ) : (
                        <div className="mb-5">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 rounded-2xl bg-green-500/20 border border-green-500/30 text-center mb-4"
                            >
                                <p className="text-green-400 font-medium">All sets complete! ✓</p>
                            </motion.div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleFinish}
                                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-lg glow hover:from-primary-600 hover:to-primary-700 transition-all"
                            >
                                {isLastExercise ? 'Finish Workout' : 'Next Exercise'}
                                <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        </div>
                    )}

                    {/* Last Logged Set */}
                    {lastWeight !== undefined && lastWeight > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-xl bg-dark-700/30 border border-dark-600/30"
                        >
                            <p className="text-xs text-dark-500 mb-0.5">Previous set:</p>
                            <p className="text-lg font-semibold text-white">
                                {lastWeight} lbs × {lastReps} reps
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default CurrentExerciseCard;
