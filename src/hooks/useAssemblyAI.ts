import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAssemblyAIOptions {
    apiKey: string;
}

interface UseAssemblyAIReturn {
    transcript: string;
    isListening: boolean;
    isConnected: boolean;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

export const useAssemblyAI = (options: UseAssemblyAIOptions): UseAssemblyAIReturn => {
    const { apiKey } = options;

    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const socketRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startListening = useCallback(async () => {
        if (!apiKey) {
            setError('AssemblyAI API key is required');
            return;
        }

        try {
            setError(null);

            // Get temporary token from AssemblyAI
            const tokenResponse = await fetch('https://api.assemblyai.com/v2/realtime/token', {
                method: 'POST',
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ expires_in: 3600 })
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to get AssemblyAI token');
            }

            const { token } = await tokenResponse.json();

            // Connect to WebSocket
            const socket = new WebSocket(
                `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
            );

            socket.onopen = () => {
                setIsConnected(true);
                setIsListening(true);
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.message_type === 'FinalTranscript' && data.text) {
                    setTranscript((prev) => prev + ' ' + data.text);
                }
            };

            socket.onerror = () => {
                setError('WebSocket connection error');
                setIsConnected(false);
                setIsListening(false);
            };

            socket.onclose = () => {
                setIsConnected(false);
                setIsListening(false);
            };

            socketRef.current = socket;

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                    // Convert to base64 and send
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64Audio = (reader.result as string).split(',')[1];
                        socket.send(JSON.stringify({ audio_data: base64Audio }));
                    };
                    reader.readAsDataURL(event.data);
                }
            };

            mediaRecorder.start(250); // Send audio every 250ms
            mediaRecorderRef.current = mediaRecorder;

        } catch (err) {
            console.error('AssemblyAI error:', err);
            setError(err instanceof Error ? err.message : 'Failed to start AssemblyAI');
            setIsListening(false);
        }
    }, [apiKey]);

    const stopListening = useCallback(() => {
        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        // Stop audio stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Close WebSocket
        if (socketRef.current) {
            socketRef.current.close();
        }

        setIsListening(false);
        setIsConnected(false);
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListening();
        };
    }, [stopListening]);

    return {
        transcript,
        isListening,
        isConnected,
        error,
        startListening,
        stopListening,
        resetTranscript
    };
};

export default useAssemblyAI;
