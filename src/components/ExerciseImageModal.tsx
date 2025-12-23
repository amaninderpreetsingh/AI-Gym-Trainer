import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ImageIcon } from 'lucide-react';

interface ExerciseImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseName: string;
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    onRegenerate?: () => void;
}

const ExerciseImageModal = ({ isOpen, onClose, exerciseName, imageUrl, isLoading, error, onRegenerate }: ExerciseImageModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-dark-700">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-primary-400" />
                                    {exerciseName}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
                                {isLoading ? (
                                    <div className="flex flex-col items-center gap-4 text-center p-8">
                                        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                                        <div>
                                            <p className="text-white font-medium text-lg">Generating Visualization...</p>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="text-center p-8 text-red-400">
                                        <p>{error}</p>
                                    </div>
                                ) : imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={exerciseName}
                                        className="w-full h-full object-contain"
                                    />
                                ) : null}
                            </div>

                            <div className="p-4 bg-dark-800 flex items-center justify-between gap-4">
                                <p className="text-xs text-dark-400">
                                    Generated instructions highlight the active muscle group.
                                </p>
                                {onRegenerate && !isLoading && !error && (
                                    <button
                                        onClick={onRegenerate}
                                        className="px-4 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-white text-xs font-medium transition-colors"
                                    >
                                        Regenerate Image
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ExerciseImageModal;
