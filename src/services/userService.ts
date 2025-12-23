import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserSettings {
    triggerPhrases: string[];
}

export const DEFAULT_TRIGGER_PHRASES = ['hey trainer', 'trainer'];

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return {
                triggerPhrases: data.triggerPhrases || DEFAULT_TRIGGER_PHRASES
            };
        } else {
            // New user or no settings doc - create default
            const defaultSettings: UserSettings = {
                triggerPhrases: DEFAULT_TRIGGER_PHRASES
            };
            await setDoc(userRef, defaultSettings, { merge: true });
            return defaultSettings;
        }
    } catch (error) {
        console.error('Error fetching user settings:', error);
        return { triggerPhrases: DEFAULT_TRIGGER_PHRASES };
    }
};

export const updateTriggerPhrases = async (userId: string, phrases: string[]): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { triggerPhrases: phrases }, { merge: true });
    } catch (error) {
        console.error('Error updating trigger phrases:', error);
        throw error;
    }
};
