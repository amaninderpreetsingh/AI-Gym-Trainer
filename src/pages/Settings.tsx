import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Zap, Key, Check, AlertCircle } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Settings = () => {
    const navigate = useNavigate();
    const {
        speechProvider,
        setSpeechProvider,
        assemblyApiKey,
        setAssemblyApiKey,
        voiceEnabled,
        setVoiceEnabled
    } = useSettings();

    const [tempApiKey, setTempApiKey] = useState(assemblyApiKey);
    const [saved, setSaved] = useState(false);

    const handleSaveApiKey = () => {
        setAssemblyApiKey(tempApiKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="min-h-screen p-4 md:p-6">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8"
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard')}
                    className="p-2 rounded-xl glass hover:bg-dark-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </motion.button>
                <h1 className="text-2xl font-bold">Settings</h1>
            </motion.header>

            <div className="max-w-lg mx-auto space-y-6">
                {/* Voice Settings */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6"
                >
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Mic className="w-5 h-5 text-primary-500" />
                        Voice Recognition
                    </h2>

                    {/* Enable/Disable Voice */}
                    <div className="flex items-center justify-between py-3 border-b border-dark-700">
                        <div>
                            <p className="font-medium">Voice Commands</p>
                            <p className="text-sm text-dark-400">Say "Hey Trainer" to log sets</p>
                        </div>
                        <button
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${voiceEnabled ? 'bg-primary-500' : 'bg-dark-600'
                                }`}
                        >
                            <motion.div
                                animate={{ x: voiceEnabled ? 24 : 2 }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full"
                            />
                        </button>
                    </div>

                    {/* Provider Selection */}
                    <div className="py-4">
                        <p className="font-medium mb-3">Speech Recognition Provider</p>
                        <div className="space-y-3">
                            {/* Browser (Free) */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSpeechProvider('browser')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${speechProvider === 'browser'
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-dark-700 hover:border-dark-600'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${speechProvider === 'browser' ? 'bg-primary-500' : 'bg-dark-700'
                                        }`}>
                                        <Mic className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">Browser (Free)</p>
                                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">Free</span>
                                        </div>
                                        <p className="text-sm text-dark-400 mt-1">
                                            Uses Chrome's built-in speech recognition. Works well in quiet environments.
                                        </p>
                                    </div>
                                    {speechProvider === 'browser' && (
                                        <Check className="w-5 h-5 text-primary-500" />
                                    )}
                                </div>
                            </motion.button>

                            {/* AssemblyAI */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSpeechProvider('assemblyai')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${speechProvider === 'assemblyai'
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-dark-700 hover:border-dark-600'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${speechProvider === 'assemblyai' ? 'bg-primary-500' : 'bg-dark-700'
                                        }`}>
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">AssemblyAI</p>
                                            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">100h free</span>
                                        </div>
                                        <p className="text-sm text-dark-400 mt-1">
                                            Premium accuracy, works great with background noise. Requires API key.
                                        </p>
                                    </div>
                                    {speechProvider === 'assemblyai' && (
                                        <Check className="w-5 h-5 text-primary-500" />
                                    )}
                                </div>
                            </motion.button>
                        </div>
                    </div>

                    {/* API Key Input (only for AssemblyAI) */}
                    {speechProvider === 'assemblyai' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-4 border-t border-dark-700"
                        >
                            <label className="block mb-2">
                                <span className="text-sm font-medium flex items-center gap-2">
                                    <Key className="w-4 h-4" />
                                    AssemblyAI API Key
                                </span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={tempApiKey}
                                    onChange={(e) => setTempApiKey(e.target.value)}
                                    placeholder="Enter your API key"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors text-white placeholder-dark-500"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSaveApiKey}
                                    className="px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                                >
                                    {saved ? <Check className="w-5 h-5" /> : 'Save'}
                                </motion.button>
                            </div>
                            <p className="text-xs text-dark-500 mt-2">
                                Get your free API key at{' '}
                                <a
                                    href="https://www.assemblyai.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-400 hover:underline"
                                >
                                    assemblyai.com
                                </a>
                            </p>

                            {!assemblyApiKey && (
                                <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                                    <p className="text-xs text-yellow-400">
                                        API key required to use AssemblyAI. Voice will fall back to browser if not set.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </motion.section>

                {/* Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center text-dark-500 text-sm"
                >
                    Settings are saved automatically to your browser.
                </motion.div>
            </div>
        </div>
    );
};

export default Settings;
