import { motion } from 'framer-motion';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface ListeningIndicatorProps {
    isListening: boolean;
    isProcessing?: boolean;
    isSupported?: boolean;
    error?: string | null;
}

const ListeningIndicator = ({
    isListening,
    isProcessing = false,
    isSupported = true,
    error = null
}: ListeningIndicatorProps) => {

    // Show error state
    if (error) {
        return (
            <div className="relative flex flex-col items-center justify-center gap-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/20 border border-red-500/30">
                    <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <span className="text-xs text-red-400 max-w-[200px] text-center">{error}</span>
            </div>
        );
    }

    // Show not supported state
    if (!isSupported) {
        return (
            <div className="relative flex flex-col items-center justify-center gap-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-dark-700 border border-dark-600">
                    <MicOff className="w-7 h-7 text-dark-500" />
                </div>
                <span className="text-xs text-dark-500 text-center">Voice not supported in this browser</span>
            </div>
        );
    }

    return (
        <div className="relative flex items-center justify-center">
            {/* Pulsing rings when listening */}
            {isListening && (
                <>
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute w-16 h-16 rounded-full bg-primary-500/30"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        className="absolute w-16 h-16 rounded-full bg-primary-500/20"
                    />
                    <motion.div
                        animate={{ scale: [1, 2.2, 1], opacity: [0.2, 0, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                        className="absolute w-16 h-16 rounded-full bg-primary-500/10"
                    />
                </>
            )}

            {/* Main microphone button */}
            <motion.div
                animate={isListening ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className={`
          relative z-10 w-16 h-16 rounded-full flex items-center justify-center
          ${isListening
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30'
                        : 'bg-dark-700 border border-dark-600'
                    }
          ${isProcessing ? 'animate-pulse' : ''}
        `}
            >
                <Mic className={`w-7 h-7 ${isListening ? 'text-white' : 'text-dark-400'}`} />
            </motion.div>

            {/* Status text */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-8 whitespace-nowrap"
            >
                <span className={`text-sm font-medium ${isListening ? 'text-primary-400' : 'text-dark-500'}`}>
                    {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Tap to start'}
                </span>
            </motion.div>
        </div>
    );
};

export default ListeningIndicator;
