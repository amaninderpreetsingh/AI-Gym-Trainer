import { motion } from 'framer-motion';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { Exercise } from '../types';

interface NextUpPreviewProps {
    exercises: Exercise[];
    currentIndex: number;
}

const NextUpPreview = ({ exercises, currentIndex }: NextUpPreviewProps) => {
    const upcomingExercises = exercises.slice(currentIndex + 1, currentIndex + 4);

    if (upcomingExercises.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6"
            >
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                    <Dumbbell className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-dark-400 text-sm">Last exercise! 💪</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg mx-auto"
        >
            <div className="flex items-center gap-2 mb-3">
                <ChevronRight className="w-4 h-4 text-dark-500" />
                <h3 className="text-sm font-medium text-dark-400">Up Next</h3>
            </div>

            <div className="space-y-2">
                {upcomingExercises.map((exercise, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
              flex items-center gap-3 p-3 rounded-xl 
              ${index === 0
                                ? 'bg-dark-800/80 border border-dark-700/50'
                                : 'bg-dark-800/40'
                            }
            `}
                    >
                        <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium
              ${index === 0
                                ? 'bg-primary-500/20 text-primary-400'
                                : 'bg-dark-700 text-dark-500'
                            }
            `}>
                            {currentIndex + index + 2}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${index === 0 ? 'text-white' : 'text-dark-400'}`}>
                                {exercise.name}
                            </p>
                            <p className="text-xs text-dark-500">
                                {exercise.targetSets}×{exercise.targetReps} • {exercise.muscleGroup}
                            </p>
                        </div>
                    </motion.div>
                ))}

                {exercises.length > currentIndex + 4 && (
                    <p className="text-xs text-dark-600 text-center pt-2">
                        +{exercises.length - currentIndex - 4} more exercises
                    </p>
                )}
            </div>
        </motion.div>
    );
};

export default NextUpPreview;
