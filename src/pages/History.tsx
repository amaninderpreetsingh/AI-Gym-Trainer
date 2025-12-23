import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Dumbbell,
    Calendar,
    Clock,
    ChevronDown,
    ChevronUp,
    Trash2,
    Edit2,
    Save,
    X,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getWorkoutLogs, updateWorkoutLog, deleteWorkoutLog } from '../services/workoutLogService';
import { WorkoutLog, CompletedExercise } from '../types';

const History = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [logs, setLogs] = useState<WorkoutLog[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    // Edit state
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editingData, setEditingData] = useState<CompletedExercise[] | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete state
    const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

    const fetchData = async () => {
        if (!user) return;

        try {
            const logsData = await getWorkoutLogs(user.uid);
            setLogs(logsData);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
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



    const toggleExpand = (logId: string) => {
        if (editingLogId) return; // Prevent collapsing while editing
        setExpandedLogId(expandedLogId === logId ? null : logId);
    };

    const startEditing = (log: WorkoutLog, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingLogId(log.id);
        setExpandedLogId(log.id); // Ensure expanded
        // Deep copy while preserving Date objects
        setEditingData(log.exercisesCompleted.map(ex => ({
            ...ex,
            sets: ex.sets.map(set => ({ ...set }))
        })));
    };

    const cancelEditing = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setEditingLogId(null);
        setEditingData(null);
    };

    const saveEditing = async (log: WorkoutLog, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || !editingData) return;

        setIsSaving(true);
        try {
            await updateWorkoutLog(
                user.uid,
                log.id,
                editingData,
                log.routineName,
                log.startTime
            );
            await fetchData(); // Reload data
            setEditingLogId(null);
            setEditingData(null);
        } catch (error) {
            console.error('Error updating log:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteLog = async (logId: string) => {
        if (!user) return;
        try {
            await deleteWorkoutLog(user.uid, logId);
            setDeletingLogId(null);
            // Optimistic update or reload
            setLogs(logs.filter(l => l.id !== logId));

        } catch (error) {
            console.error('Error deleting log:', error);
        }
    };

    const updateSetData = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
        if (!editingData) return;

        const newData = [...editingData];
        const numValue = parseInt(value) || 0;

        newData[exerciseIndex].sets[setIndex] = {
            ...newData[exerciseIndex].sets[setIndex],
            [field]: numValue
        };

        setEditingData(newData);
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
                                            <div
                                                onClick={() => toggleExpand(log.id)}
                                                className={`w-full p-4 flex items-center justify-between hover:bg-dark-800/50 transition-colors cursor-pointer ${editingLogId === log.id ? 'bg-dark-800/50' : ''}`}
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
                                                    {editingLogId === log.id ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => saveEditing(log, e)}
                                                                disabled={isSaving}
                                                                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={cancelEditing}
                                                                disabled={isSaving}
                                                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => startEditing(log, e)}
                                                                className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-primary-500 transition-colors"
                                                                title="Edit Workout"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeletingLogId(log.id);
                                                                }}
                                                                className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-red-500 transition-colors"
                                                                title="Delete Workout"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="w-px h-4 bg-dark-700 mx-1" />
                                                            {expandedLogId === log.id ? (
                                                                <ChevronUp className="w-4 h-4 text-dark-400" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-dark-400" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Delete Confirmation */}
                                            <AnimatePresence>
                                                {deletingLogId === log.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden bg-red-500/10 border-t border-red-500/20"
                                                    >
                                                        <div className="p-4">
                                                            <div className="flex items-center gap-2 text-red-400 mb-3">
                                                                <AlertTriangle className="w-5 h-5" />
                                                                <span className="font-medium text-sm">Delete this workout?</span>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <button
                                                                    onClick={() => deleteLog(log.id)}
                                                                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                                                                >
                                                                    Confirm Delete
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingLogId(null)}
                                                                    className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg text-xs font-medium transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

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
                                                        {editingLogId === log.id ? (
                                                            // Edit Mode
                                                            <div className="p-4 space-y-3">
                                                                {editingData?.map((exercise, exIndex) => (
                                                                    <div key={exIndex} className="bg-dark-800/50 rounded-lg p-3">
                                                                        <h4 className="font-medium text-sm mb-2 text-white">{exercise.name}</h4>
                                                                        <div className="grid grid-cols-[30px_1fr_1fr] gap-3 text-xs mb-2 px-1">
                                                                            <span className="text-dark-500">#</span>
                                                                            <span className="text-dark-500">Weight (lbs)</span>
                                                                            <span className="text-dark-500">Reps</span>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {exercise.sets.map((set, setIndex) => (
                                                                                <div key={setIndex} className="grid grid-cols-[30px_1fr_1fr] gap-3 items-center">
                                                                                    <span className="text-dark-300 text-xs">{setIndex + 1}</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={set.weight}
                                                                                        onChange={(e) => updateSetData(exIndex, setIndex, 'weight', e.target.value)}
                                                                                        className="bg-dark-900 border border-dark-600 rounded px-2 py-1 text-white text-sm focus:border-primary-500 focus:outline-none"
                                                                                    />
                                                                                    <input
                                                                                        type="number"
                                                                                        value={set.reps}
                                                                                        onChange={(e) => updateSetData(exIndex, setIndex, 'reps', e.target.value)}
                                                                                        className="bg-dark-900 border border-dark-600 rounded px-2 py-1 text-white text-sm focus:border-primary-500 focus:outline-none"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            // View Mode
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
                                                        )}
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
