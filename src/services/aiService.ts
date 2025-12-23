import { GoogleGenerativeAI } from '@google/generative-ai';
import { Exercise } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

export const generateWorkoutPlan = async (prompt: string): Promise<Exercise[]> => {
    if (!genAI) {
        throw new Error('Gemini API Key is missing. Please check your environment configuration.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `
    You are an expert fitness trainer. Create a workout routine based on the user's request.
    
    Return ONLY a raw JSON array of objects. Do not include markdown formatting (like \`\`\`json ... \`\`\`), explanations, or any other text.
    
    Each object in the array must follow this structure exactly:
    {
        "name": "Exercise Name",
        "targetSets": number (integer between 1-10),
        "targetReps": number (integer between 1-100),
        "muscleGroup": "Muscle Group Name"
    }

    Valid muscle groups are: 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Full Body', 'Cardio'.
    Choose the most appropriate muscle group from this list.

    Example Output:
    [
        { "name": "Push Ups", "targetSets": 3, "targetReps": 15, "muscleGroup": "Chest" },
        { "name": "Squats", "targetSets": 3, "targetReps": 12, "muscleGroup": "Legs" }
    ]
    `;

    try {
        const result = await model.generateContent([systemPrompt, `User Request: ${prompt}`]);
        const response = await result.response;
        const text = response.text();

        // Clean up the response just in case
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const exercises: Exercise[] = JSON.parse(cleanedText);
        return exercises;
    } catch (error) {
        console.error('Error generating workout plan:', error);
        throw new Error('Failed to generate workout plan. Please try again.');
    }
};
