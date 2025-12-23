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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

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

export const generateExerciseImage = async (exerciseName: string, muscleGroup: string): Promise<string> => {
    if (!genAI) {
        throw new Error('Gemini API Key is missing.');
    }

    try {


        // Real implementation using the Nano Banana Pro model as requested
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${API_KEY}`;

        const promptText = `Generate a black and white educational fitness illustration of ${exerciseName}. Split view showing starting and ending positions. Highlight ${muscleGroup} muscle in red. Anatomically accurate, educational, white background.`;

        console.log(`[AI Service] Generating image for ${exerciseName} using Nano Banana Pro...`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[AI Service] Image generation failed:', response.status, errorData);
            if (response.status === 404 || response.status === 403) {
                throw new Error('Image generation not available with current API Key permissions or model not found.');
            }
            throw new Error(`Failed to generate image: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle Gemini GenerateContent response which could contain inlineData for images
        // Structure: candidates[0].content.parts[].inlineData
        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts || [];

        // Find the image part
        const imagePart = parts.find((p: any) => p.inlineData && p.inlineData.mimeType.startsWith('image/'));

        if (imagePart) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }

        // Sometimes it might return a text description if it refused to generate input-bound image?
        // Or if the model is text-only but named confusingly. 
        // But assuming "Image Preview" model generates images.

        console.warn('[AI Service] No image found in response:', data);

        // Fallback: Check if there is text and log it
        const textPart = parts.find((p: any) => p.text);
        if (textPart) {
            console.log('[AI Service] Model returned text instead of image:', textPart.text);
            throw new Error('Model returned text description instead of image. Prompt might need adjustment.');
        }

        throw new Error('Invalid response from Image Generation API');

    } catch (error) {
        console.error('Error generating exercise image:', error);
        throw error;
    }
};
