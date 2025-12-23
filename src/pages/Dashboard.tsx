import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Dumbbell,
    Plus,
    LogOut,
    User,
    ChevronRight
} from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold gradient-text">AI Gym Trainer</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* User Info */}
                    <div className="hidden sm:flex items-center gap-3 glass rounded-full py-2 px-4">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || 'User'}
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <span className="text-sm font-medium text-dark-200">
                            {user?.displayName || user?.email}
                        </span>
                    </div>

                    {/* Logout Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="p-2 rounded-xl glass hover:bg-dark-700 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5 text-dark-400" />
                    </motion.button>
                </div>
            </motion.header>

            {/* Welcome Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
            >
                <h2 className="text-3xl font-bold mb-2">
                    Welcome back, <span className="gradient-text">{user?.displayName?.split(' ')[0] || 'Trainer'}</span>!
                </h2>
                <p className="text-dark-400">Ready for your next workout?</p>
            </motion.section>

            {/* Quick Actions */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/create-routine')}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold py-4 px-8 rounded-2xl glow hover:from-primary-600 hover:to-primary-700 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Create New Routine
                </motion.button>
            </motion.section>

            {/* Routines Grid */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-xl font-semibold mb-4">Your Routines</h3>

                {/* Empty State */}
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4">
                        <Dumbbell className="w-8 h-8 text-dark-500" />
                    </div>
                    <h4 className="text-lg font-medium mb-2">No routines yet</h4>
                    <p className="text-dark-400 mb-6 max-w-sm mx-auto">
                        Create your first workout routine to get started with voice-guided training sessions.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/create-routine')}
                        className="inline-flex items-center gap-2 text-primary-500 font-medium hover:text-primary-400 transition-colors"
                    >
                        Create your first routine
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </div>
            </motion.section>
        </div>
    );
};

export default Dashboard;
