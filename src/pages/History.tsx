import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Dumbbell,
    Calendar,
    Clock,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Flame,
    Weight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getWorkoutLogs, getWorkoutStats } from '../services/workoutLogService';
import { WorkoutLog } from '../types';

const History = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [stats, setStats] = useState<{
        totalWorkouts: number;
        totalSets: number;
        totalWeight: number;
        totalDuration: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const [logsData, statsData] = await Promise.all([
                    getWorkoutLogs(user.uid),
                    getWorkoutStats(user.uid)
                ]);
                setLogs(logsData);
                setStats(statsData);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    };

    const formatDuration = (start: Date, end: Date) => {
        const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
        if (diff < 60) return `${diff}m`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    };

    const getWorkoutVolume = (log: WorkoutLog) => {
        return log.exercisesCompleted.reduce((acc, ex) =>
            acc + ex.sets.reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0), 0
        );
    };

    const toggleExpand = (logId: string) => {
        setExpandedLogId(expandedLogId === logId ? null : logId);
    };

    return (
        <div className="min-h-screen p-4 md:p-6">
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
                <h1 className="text-2xl font-bold">Workout History</h1>
            </motion.header>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                        <Dumbbell className="w-8 h-8 text-primary-500" />
                    </motion.div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    {/* Stats Cards */}
                    {stats && stats.totalWorkouts > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
                        >
                            <div className="glass rounded-xl p-4 text-center">
                                <Flame className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
                                <p className="text-xs text-dark-400">Workouts</p>
                            </div>
                            <div className="glass rounded-xl p-4 text-center">
                                <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{stats.totalSets}</p>
                                <p className="text-xs text-dark-400">Total Sets</p>
                            </div>
                            <div className="glass rounded-xl p-4 text-center">
                                <Weight className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{(stats.totalWeight / 1000).toFixed(1)}k</p>
                                <p className="text-xs text-dark-400">Lbs Lifted</p>
                            </div>
                            <div className="glass rounded-xl p-4 text-center">
                                <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{stats.totalDuration}</p>
                                <p className="text-xs text-dark-400">Minutes</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Workout Logs */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h2 className="text-sm font-medium text-dark-400 mb-3">Recent Workouts</h2>

                        {logs.length === 0 ? (
                            <div className="glass rounded-xl p-8 text-center">
                                <Dumbbell className="w-10 h-10 text-dark-500 mx-auto mb-3" />
                                <h3 className="font-medium mb-1">No workouts yet</h3>
                                <p className="text-dark-400 text-sm mb-4">
                                    Complete your first workout to see it here
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/dashboard')}
                                    className="text-primary-500 font-medium text-sm"
                                >
                                    Start a workout
                                </motion.button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {logs.map((log, index) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="glass rounded-xl overflow-hidden"
                                        >
                                            {/* Log Header */}
                                            <button
                                                onClick={() => toggleExpand(log.id)}
                                                className="w-full p-4 flex items-center justify-between hover:bg-dark-800/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                                                        <Dumbbell className="w-5 h-5 text-primary-500" />
                                                    </div>
                                                    <div className="text-left">
                                                        <h3 className="font-semibold text-white">{log.routineName}</h3>
                                                        <div className="flex items-center gap-3 text-xs text-dark-400">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(log.startTime)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDuration(log.startTime, log.endTime)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-white">
                                                            {getWorkoutVolume(log).toLocaleString()} lbs
                                                        </p>
                                                        <p className="text-xs text-dark-400">
                                                            {log.exercisesCompleted.reduce((acc, ex) => acc + ex.sets.length, 0)} sets
                                                        </p>
                                                    </div>
                                                    {expandedLogId === log.id ? (
                                                        <ChevronUp className="w-5 h-5 text-dark-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-dark-400" />
                                                    )}
                                                </div>
                                            </button>

                                            {/* Expanded Details */}
                                            <AnimatePresence>
                                                {expandedLogId === log.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="border-t border-dark-700"
                                                    >
                                                        <div className="p-4 space-y-3">
                                                            {log.exercisesCompleted.map((exercise, exIndex) => (
                                                                <div key={exIndex} className="bg-dark-800/50 rounded-lg p-3">
                                                                    <h4 className="font-medium text-sm mb-2">{exercise.name}</h4>
                                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                                        <span className="text-dark-500">Set</span>
                                                                        <span className="text-dark-500">Weight</span>
                                                                        <span className="text-dark-500">Reps</span>
                                                                        {exercise.sets.map((set, setIndex) => (
                                                                            <>
                                                                                <span key={`set-${setIndex}`} className="text-dark-300">{setIndex + 1}</span>
                                                                                <span key={`weight-${setIndex}`} className="text-white font-medium">{set.weight} lbs</span>
                                                                                <span key={`reps-${setIndex}`} className="text-white font-medium">{set.reps}</span>
                                                                            </>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.section>
                </div>
            )}
        </div>
    );
};

export default History;
