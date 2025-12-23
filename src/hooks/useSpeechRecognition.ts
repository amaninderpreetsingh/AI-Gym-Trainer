import SpeechRecognition, { useSpeechRecognition as useReactSpeechRecognition } from 'react-speech-recognition';
import { useCallback, useEffect } from 'react';

interface UseSpeechRecognitionReturn {
    transcript: string;
    interimTranscript: string;
    isListening: boolean;
    isSupported: boolean;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
    const {
        transcript,
        interimTranscript,
        finalTranscript,
        listening,
        resetTranscript: resetTranscriptBase,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable
    } = useReactSpeechRecognition();

    // Debug: Log all transcript changes
    useEffect(() => {
        console.log('🔍 useSpeechRecognition state:', {
            transcript,
            interimTranscript,
            finalTranscript,
            listening,
            browserSupportsSpeechRecognition,
            isMicrophoneAvailable
        });
    }, [transcript, interimTranscript, finalTranscript, listening, browserSupportsSpeechRecognition, isMicrophoneAvailable]);

    const startListening = useCallback(() => {
        console.log('🎤 Starting speech recognition via library...');
        SpeechRecognition.startListening({
            continuous: true,
            language: 'en-US'
        }).then(() => {
            console.log('✅ startListening promise resolved');
        }).catch((err) => {
            console.error('❌ startListening failed:', err);
        });
    }, []);

    const stopListening = useCallback(() => {
        console.log('🛑 Stopping speech recognition');
        SpeechRecognition.stopListening();
    }, []);

    const resetTranscript = useCallback(() => {
        console.log('🔄 Resetting transcript');
        resetTranscriptBase();
    }, [resetTranscriptBase]);

    // Determine error state
    let error: string | null = null;
    if (!browserSupportsSpeechRecognition) {
        error = 'Speech recognition not supported in this browser. Try Chrome.';
    } else if (!isMicrophoneAvailable) {
        error = 'Microphone not available. Check system permissions.';
    }

    return {
        transcript,
        interimTranscript: interimTranscript || '',
        isListening: listening,
        isSupported: browserSupportsSpeechRecognition,
        error,
        startListening,
        stopListening,
        resetTranscript
    };
};

export default useSpeechRecognition;
