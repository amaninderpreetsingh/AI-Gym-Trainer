import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateRoutine from './pages/CreateRoutine';
import ActiveSession from './pages/ActiveSession';
import Settings from './pages/Settings';
import History from './pages/History';
import Progress from './pages/Progress';
import Navigation from './components/Navigation';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Dumbbell className="w-12 h-12 text-primary-500" />
                </motion.div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

// Layout with Navigation (for pages that need nav)
const WithNavigation = ({ children }: { children: ReactNode }) => {
    return (
        <>
            <Navigation />
            <div className="md:pt-16 pb-20 md:pb-0">
                {children}
            </div>
        </>
    );
};

// App Routes
const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <WithNavigation>
                            <Dashboard />
                        </WithNavigation>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/create-routine"
                element={
                    <ProtectedRoute>
                        <WithNavigation>
                            <CreateRoutine />
                        </WithNavigation>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/session/:routineId"
                element={
                    <ProtectedRoute>
                        <ActiveSession />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <WithNavigation>
                            <Settings />
                        </WithNavigation>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/history"
                element={
                    <ProtectedRoute>
                        <WithNavigation>
                            <History />
                        </WithNavigation>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/progress"
                element={
                    <ProtectedRoute>
                        <WithNavigation>
                            <Progress />
                        </WithNavigation>
                    </ProtectedRoute>
                }
            />
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <SettingsProvider>
                    <AppRoutes />
                </SettingsProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
