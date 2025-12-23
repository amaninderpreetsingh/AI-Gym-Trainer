import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Dumbbell,
    Plus,
    Play,
    Trash2,
    Zap
} from 'lucide-react';
import { getRoutines, deleteRoutine } from '../services/routineService';
import { Routine } from '../types';

const muscleColors: Record<string, string> = {
    'Chest': 'from-red-500/20 to-orange-500/20',
    'Back': 'from-blue-500/20 to-cyan-500/20',
    'Shoulders': 'from-purple-500/20 to-pink-500/20',
    'Biceps': 'from-green-500/20 to-emerald-500/20',
    'Triceps': 'from-yellow-500/20 to-amber-500/20',
    'Legs': 'from-indigo-500/20 to-violet-500/20',
    'Core': 'from-teal-500/20 to-cyan-500/20',
    'Full Body': 'from-primary-500/20 to-orange-500/20',
    'Cardio': 'from-rose-500/20 to-red-500/20',
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [routines, setRoutines] = useState<Routine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoutines = async () => {
            if (!user) return;

            try {
                const data = await getRoutines(user.uid);
                setRoutines(data);
            } catch (error) {
                console.error('Error fetching routines:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoutines();
    }, [user]);



    const handleDeleteRoutine = async (routineId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;

        setDeletingId(routineId);
        try {
            await deleteRoutine(user.uid, routineId);
            setRoutines(routines.filter(r => r.id !== routineId));
        } catch (error) {
            console.error('Error deleting routine:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleStartSession = (routineId: string) => {
        navigate(`/session/${routineId}`);
    };

    const getRoutineGradient = (routine: Routine) => {
        const primaryMuscle = routine.exercises[0]?.muscleGroup || 'Full Body';
        return muscleColors[primaryMuscle] || muscleColors['Full Body'];
    };

    return (
        <div className="min-h-screen p-4 md:p-6">
            {/* Header - Mobile only (desktop nav is in Navigation component) */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6 md:hidden"
            >
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <Dumbbell className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="text-lg font-bold gradient-text">AI Gym Trainer</h1>
                </div>
            </motion.header>

            {/* Welcome + Action Row */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
            >
                <div>
                    <h2 className="text-2xl font-bold">
                        Hey, <span className="gradient-text">{user?.displayName?.split(' ')[0] || 'Trainer'}</span>
                    </h2>
                    <p className="text-dark-400 text-sm">Ready for your next workout?</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/create-routine')}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium py-2.5 px-5 rounded-xl glow hover:from-primary-600 hover:to-primary-700 transition-all text-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Routine
                </motion.button>
            </motion.section>

            {/* Routines */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="text-sm font-medium text-dark-400 mb-3">Your Routines</h3>

                {isLoading ? (
                    <div className="glass rounded-xl p-8 text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="inline-block"
                        >
                            <Dumbbell className="w-6 h-6 text-primary-500" />
                        </motion.div>
                    </div>
                ) : routines.length === 0 ? (
                    <div className="glass rounded-xl p-8 text-center">
                        <Dumbbell className="w-10 h-10 text-dark-500 mx-auto mb-3" />
                        <h4 className="font-medium mb-1">No routines yet</h4>
                        <p className="text-dark-400 text-sm mb-4">Create your first workout routine</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/create-routine')}
                            className="text-primary-500 font-medium text-sm hover:text-primary-400"
                        >
                            + Create routine
                        </motion.button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <AnimatePresence mode="popLayout">
                            {routines.map((routine, index) => (
                                <motion.div
                                    key={routine.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.03 }}
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    layout
                                    className="relative group cursor-pointer"
                                    onClick={() => handleStartSession(routine.id)}
                                >
                                    {/* Card Background with Gradient */}
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${getRoutineGradient(routine)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                    {/* Card Content */}
                                    <div className="relative rounded-2xl bg-dark-800/80 backdrop-blur-xl border border-dark-700/50 group-hover:border-primary-500/30 p-4 transition-all duration-300 overflow-hidden">
                                        {/* Glow Effect */}
                                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {/* Header */}
                                        <div className="relative flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRoutineGradient(routine)} flex items-center justify-center ring-1 ring-white/10`}>
                                                    <Dumbbell className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-white leading-tight">{routine.name}</h4>
                                                    <p className="text-dark-400 text-xs mt-0.5">{routine.exercises.length} exercises</p>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => handleDeleteRoutine(routine.id, e)}
                                                disabled={deletingId === routine.id}
                                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-dark-500 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </motion.button>
                                        </div>

                                        {/* Exercise Pills */}
                                        <div className="relative flex flex-wrap gap-1.5 mb-4">
                                            {routine.exercises.slice(0, 3).map((exercise, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-dark-700/50 text-xs text-dark-300"
                                                >
                                                    <span className="w-1 h-1 rounded-full bg-primary-500" />
                                                    {exercise.name}
                                                </span>
                                            ))}
                                            {routine.exercises.length > 3 && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-dark-700/50 text-xs text-dark-500">
                                                    +{routine.exercises.length - 3}
                                                </span>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="relative flex items-center justify-between pt-3 border-t border-dark-700/50">
                                            <div className="flex items-center gap-1 text-xs text-dark-500">
                                                <Zap className="w-3 h-3" />
                                                ~{routine.exercises.reduce((acc, ex) => acc + ex.targetSets * 2, 0)} min
                                            </div>
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-400 font-medium text-xs group-hover:bg-primary-500 group-hover:text-white transition-all"
                                            >
                                                <Play className="w-3 h-3" />
                                                Start
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.section>
        </div>
    );
};

export default Dashboard;
