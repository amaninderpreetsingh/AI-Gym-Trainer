import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Dumbbell,
    TrendingUp,
    ChevronDown,
    Filter,
    X,
    Check
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
import { getExerciseLogs, getExerciseNamesWithMuscleGroups } from '../services/exerciseLogService';
import { ExerciseLog } from '../types';

interface ExerciseDataPoint {
    index: number;
    date: string;
    fullDate: Date;
    weight: number;
    reps: number;
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

    const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
    const [availableExercises, setAvailableExercises] = useState<Array<{ name: string; muscleGroup: string }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);

    // Fetch available exercises on mount
    useEffect(() => {
        const fetchExercises = async () => {
            if (!user) return;

            try {
                const exercises = await getExerciseNamesWithMuscleGroups(user.uid);
                setAvailableExercises(exercises);

                // Set default selected exercise if available
                if (exercises.length > 0 && !selectedExercise) {
                    setSelectedExercise(exercises[0].name);
                }
            } catch (error) {
                console.error('Error fetching exercises:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExercises();
    }, [user]);

    // Fetch logs when selected exercise changes
    useEffect(() => {
        const fetchLogs = async () => {
            if (!user || !selectedExercise) return;

            setIsLoadingLogs(true);
            try {
                const logs = await getExerciseLogs(user.uid, selectedExercise);
                setExerciseLogs(logs);
            } catch (error) {
                console.error('Error fetching exercise logs:', error);
            } finally {
                setIsLoadingLogs(false);
            }
        };

        fetchLogs();
    }, [user, selectedExercise]);

    // Get all unique muscle groups
    const allMuscleGroups = useMemo(() => {
        const groups = new Set<string>();
        availableExercises.forEach(ex => groups.add(ex.muscleGroup));
        return Array.from(groups).sort();
    }, [availableExercises]);

    // Toggle muscle group selection
    const toggleMuscleGroup = (group: string) => {
        setSelectedMuscleGroups(prev =>
            prev.includes(group)
                ? prev.filter(g => g !== group)
                : [...prev, group]
        );
        // Reset selected exercise when filter changes to ensure consistent UI
        // We'll let the effect below pick a valid one
    };

    // Clear all muscle group filters
    const clearMuscleFilters = () => {
        setSelectedMuscleGroups([]);
    };

    // Filter available exercises based on selected muscle groups
    const filteredExercises = useMemo(() => {
        if (selectedMuscleGroups.length === 0) {
            return availableExercises;
        }
        return availableExercises.filter(ex => selectedMuscleGroups.includes(ex.muscleGroup));
    }, [availableExercises, selectedMuscleGroups]);

    // Ensure selected exercise is valid for current filter
    useEffect(() => {
        // If we have exercises but none selected, or current selection is invalid
        if (filteredExercises.length > 0) {
            const isCurrentValid = filteredExercises.some(ex => ex.name === selectedExercise);
            if (!selectedExercise || !isCurrentValid) {
                setSelectedExercise(filteredExercises[0].name);
            }
        } else if (filteredExercises.length === 0) {
            setSelectedExercise('');
        }
    }, [filteredExercises, selectedExercise]);

    // Process logs to get chart data
    const chartData = useMemo((): ExerciseDataPoint[] => {
        const dataPoints: ExerciseDataPoint[] = [];
        let index = 0;

        exerciseLogs.forEach(log => {
            // For each set, record the data point
            log.sets.forEach(set => {
                dataPoints.push({
                    index: index++,
                    date: new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric'
                    }).format(log.date),
                    fullDate: log.date,
                    weight: set.weight,
                    reps: set.reps
                });
            });
        });

        return dataPoints;
    }, [exerciseLogs]);

    // Calculate max weight for the selected exercise
    const maxWeight = exerciseLogs.length > 0 && exerciseLogs[0].maxWeight !== undefined
        ? Math.max(...exerciseLogs.map(l => l.maxWeight))
        : chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : 0;

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
            ) : availableExercises.length === 0 ? (
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
                    {/* Muscle Group Filter */}
                    {allMuscleGroups.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm text-dark-400 flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    Filter by Muscle Group
                                </label>
                                {selectedMuscleGroups.length > 0 && (
                                    <button
                                        onClick={clearMuscleFilters}
                                        className="text-xs text-dark-400 hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {allMuscleGroups.map(group => (
                                    <motion.button
                                        key={group}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => toggleMuscleGroup(group)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${selectedMuscleGroups.includes(group)
                                            ? 'bg-primary-500 text-white'
                                            : 'glass text-dark-300 hover:text-white hover:bg-dark-700/50'
                                            }`}
                                    >
                                        {selectedMuscleGroups.includes(group) && (
                                            <Check className="w-3 h-3" />
                                        )}
                                        {group}
                                    </motion.button>
                                ))}
                            </div>
                            {selectedMuscleGroups.length > 0 && (
                                <p className="text-xs text-dark-500 mt-2">
                                    Showing {availableExercises.filter(ex => selectedMuscleGroups.includes(ex.muscleGroup)).length} exercise{availableExercises.filter(ex => selectedMuscleGroups.includes(ex.muscleGroup)).length !== 1 ? 's' : ''} matching {selectedMuscleGroups.length} muscle group{selectedMuscleGroups.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </motion.div>
                    )}

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
                                disabled={filteredExercises.length === 0}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                        <Dumbbell className="w-4 h-4 text-primary-500" />
                                    </div>
                                    <span className="font-medium">
                                        {selectedExercise || 'No exercises found'}
                                    </span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-dark-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && filteredExercises.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute z-10 w-full md:w-80 mt-2 glass rounded-xl overflow-hidden shadow-xl border border-dark-600"
                                >
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredExercises.map(ex => (
                                            <button
                                                key={ex.name}
                                                onClick={() => {
                                                    setSelectedExercise(ex.name);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full p-3 text-left hover:bg-dark-700/50 transition-colors flex items-center gap-3 ${ex.name === selectedExercise ? 'bg-primary-500/10 text-primary-500' : ''
                                                    }`}
                                            >
                                                <Dumbbell className="w-4 h-4" />
                                                {ex.name}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Stats Summary */}
                    {chartData.length > 0 && (
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
                                <p className="text-2xl font-bold">{chartData.length}</p>
                                <p className="text-xs text-dark-400">Total Sets</p>
                            </div>
                            <div className="glass rounded-xl p-4 text-center hidden md:block">
                                <p className="text-2xl font-bold text-green-400">
                                    {chartData.length >= 2
                                        ? `${chartData[chartData.length - 1].weight - chartData[0].weight >= 0 ? '+' : ''}${chartData[chartData.length - 1].weight - chartData[0].weight}`
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

                        {isLoadingLogs ? (
                            <div className="h-80 flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <Dumbbell className="w-6 h-6 text-dark-500" />
                                </motion.div>
                            </div>
                        ) : chartData.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="index"
                                            stroke="#9CA3AF"
                                            fontSize={12}
                                            tickLine={false}
                                            tickFormatter={(value) => {
                                                const point = chartData[value];
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
