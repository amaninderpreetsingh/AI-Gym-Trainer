import { useCallback, useRef } from 'react';

interface UseTextToSpeechOptions {
    rate?: number;
    pitch?: number;
    volume?: number;
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}) => {
    const { rate = 1, pitch = 1, volume = 1 } = options;
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = useCallback((text: string) => {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        // Try to get a good English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(
            (voice) => voice.lang.startsWith('en') && voice.name.includes('Google')
        ) || voices.find(
            (voice) => voice.lang.startsWith('en')
        );

        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);

        return new Promise<void>((resolve) => {
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
        });
    }, [rate, pitch, volume]);

    const cancel = useCallback(() => {
        window.speechSynthesis.cancel();
    }, []);

    const announceExercise = useCallback((exerciseName: string, setNumber: number, totalSets: number) => {
        const text = `${exerciseName}. Set ${setNumber} of ${totalSets}.`;
        return speak(text);
    }, [speak]);

    const announceSetLogged = useCallback((weight: number, reps: number) => {
        const text = `Logged ${weight} pounds, ${reps} reps.`;
        return speak(text);
    }, [speak]);

    const announceNextExercise = useCallback((exerciseName: string) => {
        const text = `Next exercise: ${exerciseName}`;
        return speak(text);
    }, [speak]);

    const announceWorkoutComplete = useCallback(() => {
        return speak("Great job! Workout complete.");
    }, [speak]);

    return {
        speak,
        cancel,
        announceExercise,
        announceSetLogged,
        announceNextExercise,
        announceWorkoutComplete
    };
};

export default useTextToSpeech;
