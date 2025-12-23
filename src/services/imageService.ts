import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ExerciseImage {
    imageUrl: string;
    generatedAt: Date;
    prompt: string;
}

export const getStoredExerciseImage = async (exerciseName: string): Promise<ExerciseImage | null> => {
    try {
        // Sanitize exercise name to use as document ID (remove special chars/spaces)
        const docId = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        // Store in a global root-level collection for shared access
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

export const saveExerciseImage = async (exerciseName: string, imageUrl: string, prompt: string): Promise<void> => {
    try {
        const docId = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        // Store in a global root-level collection for shared access
        const docRef = doc(db, 'exercise_images', docId);

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
