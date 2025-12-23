import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ExerciseImage {
    imageUrl: string;
    generatedAt: Date;
    prompt: string;
}

export const getStoredExerciseImage = async (exerciseName: string, userId?: string): Promise<ExerciseImage | null> => {
    try {
        // Sanitize exercise name to use as document ID (remove special chars/spaces)
        const docId = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        // Check user-specific collection first if userId is provided
        if (userId) {
            const userDocRef = doc(db, 'users', userId, 'exercise_images', docId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                return {
                    imageUrl: data.imageUrl,
                    generatedAt: data.generatedAt.toDate(),
                    prompt: data.prompt
                };
            }
        }

        // Fallback to global root-level collection
        const docRef = doc(db, 'exercise_images', docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                imageUrl: data.imageUrl,
                generatedAt: data.generatedAt.toDate(),
                prompt: data.prompt
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching exercise image:', error);
        return null;
    }
};

export const saveExerciseImage = async (exerciseName: string, imageUrl: string, prompt: string, userId?: string): Promise<void> => {
    try {
        const docId = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        let docRef;
        if (userId) {
            // Store in user-specific collection
            docRef = doc(db, 'users', userId, 'exercise_images', docId);
        } else {
            // Store in a global root-level collection for shared access
            docRef = doc(db, 'exercise_images', docId);
        }

        await setDoc(docRef, {
            imageUrl,
            prompt,
            generatedAt: new Date()
        });
    } catch (error) {
        console.error('Error saving exercise image:', error);
        throw error;
    }
};
