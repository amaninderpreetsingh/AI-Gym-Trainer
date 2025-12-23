import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Dumbbell,
    Sparkles,
    X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createRoutine, getRoutine, updateRoutine } from '../services/routineService';
import { generateWorkoutPlan } from '../services/aiService';
import { Exercise } from '../types';

const muscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Full Body', 'Cardio'
];

const CreateRoutine = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { routineId } = useParams(); // Get routineId if editing

    const [routineName, setRoutineName] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(!!routineId);
    const [error, setError] = useState<string | null>(null);

    // AI Generation State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch existing routine if editing
    useEffect(() => {
        const fetchRoutine = async () => {
            if (!user || !routineId) return;

            try {
                const routine = await getRoutine(user.uid, routineId);
                if (routine) {
                    setRoutineName(routine.name);
                    setExercises(routine.exercises);
                } else {
                    setError('Routine not found');
                }
            } catch (err) {
                console.error('Error fetching routine:', err);
                setError('Failed to load routine');
            } finally {
                setIsFetching(false);
            }
        };

        if (routineId) {
            fetchRoutine();
        }
    }, [user, routineId]);

    const addExercise = () => {
        setExercises([
            ...exercises,
            { name: '', targetSets: 3, targetReps: 10, muscleGroup: 'Chest' }
        ]);
    };

    const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
        const updated = [...exercises];
        updated[index] = { ...updated[index], [field]: value };
        setExercises(updated);
    };

    const removeExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const handleAiGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiPrompt.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const generatedExercises = await generateWorkoutPlan(aiPrompt);
            setExercises(generatedExercises);
            setShowAiModal(false);
            setAiPrompt('');
        } catch (err) {
            console.error('AI Generation Error:', err);
            setError('Failed to generate workout. Please try again or create manually.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;
        if (!routineName.trim()) {
            setError('Please enter a routine name');
            return;
        }
        if (exercises.length === 0) {
            setError('Please add at least one exercise');
            return;
        }
        if (exercises.some(ex => !ex.name.trim())) {
            setError('Please fill in all exercise names');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (routineId) {
                // Update existing routine
                await updateRoutine(user.uid, routineId, routineName.trim(), exercises);
            } else {
                // Create new routine
                await createRoutine(user.uid, routineName.trim(), exercises);
            }
            navigate('/dashboard');
        } catch (err) {
            console.error('Error saving routine:', err);
            setError('Failed to save routine. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
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

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-6"
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard')}
                    className="p-2 rounded-xl glass hover:bg-dark-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </motion.button>
                <h1 className="text-2xl font-bold">{routineId ? 'Edit Routine' : 'Create New Routine'}</h1>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAiModal(true)}
                    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium text-sm shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Generate with AI</span>
                </motion.button>
            </motion.header>

            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                {/* Routine Name */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <input
                        type="text"
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        placeholder="Routine name (e.g., Back Day)"
                        className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors text-white placeholder-dark-500 text-lg font-medium"
                    />
                </motion.div>

                {/* Exercises Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    {/* Header Row */}
                    <div className="hidden md:grid grid-cols-[1fr_70px_70px_120px_40px] gap-2 mb-2 px-2 text-xs text-dark-400 font-medium">
                        <span>Exercise Name</span>
                        <span className="text-center">Sets</span>
                        <span className="text-center">Reps</span>
                        <span className="text-center">Muscle</span>
                        <span></span>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {exercises.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="glass rounded-xl p-6 text-center"
                            >
                                <Dumbbell className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                                <p className="text-dark-400 text-sm">Click "Add Exercise" to get started</p>
                            </motion.div>
                        ) : (
                            <div className="space-y-2">
                                {exercises.map((exercise, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        layout
                                        className="glass rounded-xl p-2 md:p-3"
                                    >
                                        <div className="grid grid-cols-[1fr_60px_60px_auto] md:grid-cols-[1fr_70px_70px_120px_40px] gap-2 items-center">
                                            {/* Exercise Name */}
                                            <input
                                                type="text"
                                                value={exercise.name}
                                                onChange={(e) => updateExercise(index, 'name', e.target.value)}
                                                placeholder="Exercise name"
                                                className="px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 focus:border-primary-500 outline-none transition-colors text-white placeholder-dark-500 text-sm"
                                            />

                                            {/* Sets */}
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={exercise.targetSets}
                                                onChange={(e) => updateExercise(index, 'targetSets', parseInt(e.target.value) || 1)}
                                                className="px-2 py-2 rounded-lg bg-dark-800 border border-dark-700 focus:border-primary-500 outline-none transition-colors text-white text-center text-sm"
                                                title="Sets"
                                            />

                                            {/* Reps */}
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={exercise.targetReps}
                                                onChange={(e) => updateExercise(index, 'targetReps', parseInt(e.target.value) || 1)}
                                                className="px-2 py-2 rounded-lg bg-dark-800 border border-dark-700 focus:border-primary-500 outline-none transition-colors text-white text-center text-sm"
                                                title="Reps"
                                            />

                                            {/* Muscle Group - Hidden on mobile, shown on md+ */}
                                            <select
                                                value={exercise.muscleGroup}
                                                onChange={(e) => updateExercise(index, 'muscleGroup', e.target.value)}
                                                className="hidden md:block px-2 py-2 rounded-lg bg-dark-800 border border-dark-700 focus:border-primary-500 outline-none transition-colors text-white text-sm"
                                            >
                                                {muscleGroups.map(group => (
                                                    <option key={group} value={group}>{group}</option>
                                                ))}
                                            </select>

                                            {/* Delete Button */}
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => removeExercise(index)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 text-dark-400 hover:text-red-400 transition-colors justify-self-center"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        </div>

                                        {/* Mobile: Muscle Group on second row */}
                                        <div className="md:hidden mt-2">
                                            <select
                                                value={exercise.muscleGroup}
                                                onChange={(e) => updateExercise(index, 'muscleGroup', e.target.value)}
                                                className="w-full px-2 py-1.5 rounded-lg bg-dark-800 border border-dark-700 focus:border-primary-500 outline-none transition-colors text-white text-xs"
                                            >
                                                {muscleGroups.map(group => (
                                                    <option key={group} value={group}>{group}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Add Exercise Button */}
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={addExercise}
                        className="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-dark-600 hover:border-primary-500 text-dark-400 hover:text-primary-500 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Exercise
                    </motion.button>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-3"
                >
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 py-3 px-6 rounded-xl glass font-medium hover:bg-dark-700 transition-colors"
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold glow hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <Dumbbell className="w-5 h-5" />
                            </motion.div>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                {routineId ? 'Update Routine' : 'Create Routine'}
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </form>

            {/* AI Generation Modal */}
            <AnimatePresence>
                {showAiModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2 text-purple-400">
                                        <Sparkles className="w-5 h-5" />
                                        <h3 className="text-lg font-bold text-white">Generate Workout</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowAiModal(false)}
                                        className="text-dark-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <p className="text-dark-400 text-sm mb-4">
                                    Describe your fitness goals, available equipment, or focus areas, and AI will create a routine for you.
                                </p>

                                <form onSubmit={handleAiGenerate}>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="e.g., 'High intensity interval training for legs' or '30 minute full body dumbbell workout'"
                                        className="w-full h-32 px-4 py-3 rounded-xl bg-dark-900 border border-dark-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors text-white placeholder-dark-500 resize-none mb-4"
                                    />

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowAiModal(false)}
                                            className="flex-1 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-white font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isGenerating || !aiPrompt.trim()}
                                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isGenerating ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                >
                                                    <Sparkles className="w-5 h-5" />
                                                </motion.div>
                                            ) : (
                                                'Generate'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default CreateRoutine;
