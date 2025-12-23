import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Edit2, Save, X as XIcon, HelpCircle } from 'lucide-react';
import { Exercise, LoggedSet } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generateExerciseImage } from '../services/aiService';
import { getStoredExerciseImage, saveExerciseImage } from '../services/imageService';
import ExerciseImageModal from './ExerciseImageModal';

interface CurrentExerciseCardProps {
    exercise: Exercise;
    currentSet: number;
    totalSets: number;
    completedSets: LoggedSet[];
    lastWeight?: number;
    lastReps?: number;
    onLogSet: (weight: number, reps: number) => void;
    onUpdateSet: (index: number, weight: number, reps: number) => void;
    onNextExercise?: () => void;
    isLastExercise: boolean;
}

const CurrentExerciseCard = ({
    exercise,
    currentSet,
    totalSets,
    completedSets,
    lastWeight,
    onLogSet,
    onUpdateSet,
    onNextExercise,
    isLastExercise
}: CurrentExerciseCardProps) => {
    const { user } = useAuth();
    const [weight, setWeight] = useState<string>(lastWeight?.toString() || '');
    const [reps, setReps] = useState<string>(exercise.targetReps.toString());
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editWeight, setEditWeight] = useState('');
    const [editReps, setEditReps] = useState('');

    // Image Modal and Cache State
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const [hasStoredImage, setHasStoredImage] = useState(false);

    // Reset state and check for stored image when exercise changes
    useEffect(() => {
        setImageUrl(null);
        setHasStoredImage(false);
        setImageError(null);

        const checkStoredImage = async () => {
            if (exercise.name) {
                try {
                    // Global check - no userId needed
                    const stored = await getStoredExerciseImage(exercise.name);
                    if (stored) {
                        setHasStoredImage(true);
                    }
                } catch (err) {
                    console.error("Error checking stored image:", err);
                }
            }
        };

        checkStoredImage();
    }, [exercise.name]);

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

    const startEditing = (index: number, set: LoggedSet) => {
        setEditingIndex(index);
        setEditWeight(set.weight.toString());
        setEditReps(set.reps.toString());
    };

    const saveEdit = (index: number) => {
        const w = parseFloat(editWeight) || 0;
        const r = parseInt(editReps) || 0;
        onUpdateSet(index, w, r);
        setEditingIndex(null);
    };

    const handleFinish = () => {
        if (onNextExercise) {
            onNextExercise();
        }
    };

    const handleShowImage = async () => {
        setShowImageModal(true);
        if (imageUrl) return; // Already loaded via cache or previous gen

        if (!user) return; // Still require user logged in for permission to generate/view? Assume yes for app usage.

        setIsGeneratingImage(true);
        setImageError(null);

        try {
            // Check global cache first
            const storedImage = await getStoredExerciseImage(exercise.name);

            if (storedImage) {
                setImageUrl(storedImage.imageUrl);
                setHasStoredImage(true);
            } else {
                // Generate new image
                const generatedUrl = await generateExerciseImage(exercise.name, exercise.muscleGroup);
                setImageUrl(generatedUrl);

                // Cache it globally
                await saveExerciseImage(exercise.name, generatedUrl, `Visual guide for ${exercise.name}`);
                setHasStoredImage(true);
            }
        } catch (err: any) {
            console.error(err);
            setImageError(err.message || "Failed to load visualization");
        } finally {
            setIsGeneratingImage(false);
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
            <div className="relative rounded-3xl bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700/50 overflow-hidden mb-6">
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

                    {/* Exercise Name with Help Button */}
                    <div className="flex items-center gap-3 mb-1">
                        <AnimatePresence mode="wait">
                            <motion.h2
                                key={exercise.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-3xl md:text-4xl font-bold text-white"
                            >
                                {exercise.name}
                            </motion.h2>
                        </AnimatePresence>

                        <button
                            onClick={handleShowImage}
                            className={`p-1.5 rounded-full transition-colors ${hasStoredImage
                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300'
                                : 'bg-dark-700 text-dark-400 hover:bg-primary-500/20 hover:text-primary-400'
                                }`}
                            title={hasStoredImage ? "View Visual Guide" : "Generate Visual Guide"}
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Target Info */}
                    <p className="text-dark-400 mb-6">
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
                        <div className="mb-2">
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
                        <div className="mb-2">
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
                    {/* Completed Sets List */}
                    {completedSets.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-dark-700/50 space-y-2">
                            <p className="text-xs text-dark-500 font-medium uppercase tracking-wider mb-2">Logged Sets</p>
                            {completedSets.map((set, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 rounded-xl border transition-colors ${editingIndex === index
                                        ? 'bg-primary-500/10 border-primary-500/50'
                                        : 'bg-dark-700/30 border-dark-700 hover:border-dark-600'
                                        }`}
                                >
                                    {editingIndex === index ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={editWeight}
                                                        onChange={(e) => setEditWeight(e.target.value)}
                                                        className="w-full px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-600 text-white text-center font-bold outline-none focus:border-primary-500"
                                                        placeholder="lbs"
                                                    />
                                                    <span className="absolute right-2 top-1.5 text-xs text-dark-500">lbs</span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={editReps}
                                                        onChange={(e) => setEditReps(e.target.value)}
                                                        className="w-full px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-600 text-white text-center font-bold outline-none focus:border-primary-500"
                                                        placeholder="reps"
                                                    />
                                                    <span className="absolute right-2 top-1.5 text-xs text-dark-500">reps</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => saveEdit(index)}
                                                className="p-2 rounded-lg bg-primary-500 text-white"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditingIndex(null)}
                                                className="p-2 rounded-lg bg-dark-600 text-dark-300"
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </span>
                                                <span className="text-white font-medium">
                                                    {set.weight} <span className="text-dark-400 text-sm">lbs</span>
                                                </span>
                                                <span className="text-dark-600">×</span>
                                                <span className="text-white font-medium">
                                                    {set.reps} <span className="text-dark-400 text-sm">reps</span>
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => startEditing(index, set)}
                                                className="p-2 rounded-lg text-dark-500 opacity-100 md:opacity-0 group-hover:opacity-100 hover:bg-dark-600 hover:text-white transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ExerciseImageModal
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)}
                exerciseName={exercise.name}
                imageUrl={imageUrl}
                isLoading={isGeneratingImage}
                error={imageError}
            />
        </motion.div>
    );
};

export default CurrentExerciseCard;
