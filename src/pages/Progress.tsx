import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Dumbbell,
    TrendingUp,
    ChevronDown
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getWorkoutLogs } from '../services/workoutLogService';
import { WorkoutLog } from '../types';

interface ExerciseDataPoint {
    index: number;
    date: string;
    fullDate: Date;
    weight: number;
    reps: number;
}

interface ExerciseProgress {
    [exerciseName: string]: ExerciseDataPoint[];
}

// Custom tooltip component to show weight and reps
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as ExerciseDataPoint;
        return (
            <div className="glass rounded-lg p-3 border border-dark-600 shadow-xl">
                <p className="text-xs text-dark-400 mb-1">{label}</p>
                <p className="text-white font-semibold">
                    {data.weight} lbs
                </p>
                <p className="text-dark-300 text-sm">
                    {data.reps} reps
                </p>
            </div>
        );
    }
    return null;
};

const Progress = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const logsData = await getWorkoutLogs(user.uid, 100);
                setLogs(logsData);
            } catch (error) {
                console.error('Error fetching workout logs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Process logs to get exercise progress data
    const exerciseProgress = useMemo((): ExerciseProgress => {
        const progress: ExerciseProgress = {};
        let globalIndex = 0;

        logs.forEach(log => {
            log.exercisesCompleted.forEach(exercise => {
                if (!progress[exercise.name]) {
                    progress[exercise.name] = [];
                }

                // For each set, record the data point
                exercise.sets.forEach(set => {
                    progress[exercise.name].push({
                        index: globalIndex++,
                        date: new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric'
                        }).format(log.startTime),
                        fullDate: log.startTime,
                        weight: set.weight,
                        reps: set.reps
                    });
                });
            });
        });

        // Sort each exercise's data by date and re-index
        Object.keys(progress).forEach(exerciseName => {
            progress[exerciseName].sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
            // Re-index after sorting
            progress[exerciseName].forEach((point, i) => {
                point.index = i;
            });
        });

        return progress;
    }, [logs]);

    // Get list of unique exercise names
    const exerciseNames = useMemo(() => {
        return Object.keys(exerciseProgress).sort();
    }, [exerciseProgress]);

    // Set default selected exercise
    useEffect(() => {
        if (exerciseNames.length > 0 && !selectedExercise) {
            setSelectedExercise(exerciseNames[0]);
        }
    }, [exerciseNames, selectedExercise]);

    const currentExerciseData = selectedExercise ? exerciseProgress[selectedExercise] || [] : [];

    // Calculate max weight for the selected exercise
    const maxWeight = currentExerciseData.length > 0
        ? Math.max(...currentExerciseData.map(d => d.weight))
        : 0;

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
                <div>
                    <h1 className="text-2xl font-bold">Progress</h1>
                    <p className="text-dark-400 text-sm">Track your growth over time</p>
                </div>
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
            ) : exerciseNames.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-8 text-center max-w-lg mx-auto"
                >
                    <TrendingUp className="w-12 h-12 text-dark-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No workout data yet</h3>
                    <p className="text-dark-400 text-sm mb-4">
                        Complete some workouts to see your progress here
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/dashboard')}
                        className="text-primary-500 font-medium"
                    >
                        Start a workout
                    </motion.button>
                </motion.div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    {/* Exercise Selector */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <label className="text-sm text-dark-400 mb-2 block">Select Exercise</label>
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full md:w-80 glass rounded-xl p-4 flex items-center justify-between hover:bg-dark-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                        <Dumbbell className="w-4 h-4 text-primary-500" />
                                    </div>
                                    <span className="font-medium">{selectedExercise}</span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-dark-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute z-10 w-full md:w-80 mt-2 glass rounded-xl overflow-hidden shadow-xl border border-dark-600"
                                >
                                    <div className="max-h-60 overflow-y-auto">
                                        {exerciseNames.map(name => (
                                            <button
                                                key={name}
                                                onClick={() => {
                                                    setSelectedExercise(name);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full p-3 text-left hover:bg-dark-700/50 transition-colors flex items-center gap-3 ${name === selectedExercise ? 'bg-primary-500/10 text-primary-500' : ''
                                                    }`}
                                            >
                                                <Dumbbell className="w-4 h-4" />
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Stats Summary */}
                    {currentExerciseData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6"
                        >
                            <div className="glass rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-primary-500">{maxWeight}</p>
                                <p className="text-xs text-dark-400">Max Weight (lbs)</p>
                            </div>
                            <div className="glass rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold">{currentExerciseData.length}</p>
                                <p className="text-xs text-dark-400">Total Sets</p>
                            </div>
                            <div className="glass rounded-xl p-4 text-center hidden md:block">
                                <p className="text-2xl font-bold text-green-400">
                                    {currentExerciseData.length >= 2
                                        ? `${currentExerciseData[currentExerciseData.length - 1].weight - currentExerciseData[0].weight >= 0 ? '+' : ''}${currentExerciseData[currentExerciseData.length - 1].weight - currentExerciseData[0].weight}`
                                        : '—'}
                                </p>
                                <p className="text-xs text-dark-400">Weight Change (lbs)</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-xl p-4 md:p-6"
                    >
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-500" />
                            Weight Over Time
                        </h3>

                        {currentExerciseData.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={currentExerciseData}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="index"
                                            stroke="#9CA3AF"
                                            fontSize={12}
                                            tickLine={false}
                                            tickFormatter={(value) => {
                                                const point = currentExerciseData[value];
                                                return point ? point.date : '';
                                            }}
                                        />
                                        <YAxis
                                            stroke="#9CA3AF"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                            domain={[0, 'dataMax + 10']}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#8B5CF6"
                                            strokeWidth={3}
                                            dot={{
                                                fill: '#8B5CF6',
                                                strokeWidth: 2,
                                                r: 4
                                            }}
                                            activeDot={{
                                                r: 6,
                                                fill: '#8B5CF6',
                                                stroke: '#fff',
                                                strokeWidth: 2
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-dark-400">
                                No data available for this exercise
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Progress;
