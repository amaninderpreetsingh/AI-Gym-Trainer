import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home,
    Clock,
    TrendingUp,
    Settings,
    User,
    Dumbbell,
    LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { path: '/dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { path: '/history', label: 'History', icon: <Clock className="w-5 h-5" /> },
    { path: '/progress', label: 'Progress', icon: <TrendingUp className="w-5 h-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

const Navigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    };

    return (
        <>
            {/* Desktop Navigation - Top Header */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:flex fixed top-0 left-0 right-0 z-50 glass border-b border-dark-700/50 px-6 py-3"
            >
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate('/dashboard')}
                    >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <Dumbbell className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold gradient-text">AI Gym Trainer</span>
                    </div>

                    {/* Nav Links */}
                    <div className="flex items-center gap-1">
                        {navItems.map((item) => (
                            <motion.button
                                key={item.path}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive(item.path)
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'text-dark-300 hover:bg-dark-700/50 hover:text-white'
                                    }`}
                            >
                                {item.icon}
                                <span className="text-sm font-medium">{item.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 glass rounded-full py-1.5 px-3">
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || 'User'}
                                    className="w-6 h-6 rounded-full"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                    <User className="w-3 h-3 text-white" />
                                </div>
                            )}
                            <span className="text-sm text-dark-200">
                                {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0]}
                            </span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="p-2 rounded-lg glass hover:bg-dark-700 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4 text-dark-400" />
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Navigation - Bottom Bar */}
            <motion.nav
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-dark-700/50 px-2 py-2 safe-area-pb"
            >
                <div className="flex items-center justify-around">
                    {navItems.map((item) => (
                        <motion.button
                            key={item.path}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[60px] transition-all ${isActive(item.path)
                                    ? 'text-primary-400'
                                    : 'text-dark-400'
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg transition-all ${isActive(item.path) ? 'bg-primary-500/20' : ''
                                }`}>
                                {item.icon}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.nav>
        </>
    );
};

export default Navigation;
