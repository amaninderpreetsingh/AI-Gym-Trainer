import { useState, useEffect, useCallback, useRef } from 'react';

interface ParsedCommand {
    type: 'log_set' | 'next_exercise' | 'next_set' | 'unknown';
    weight?: number;
    reps?: number;
    rawText: string;
}

interface UseVoiceCommandsOptions {
    triggerPhrases?: string[];
    onCommand?: (command: ParsedCommand) => void;
    enabled?: boolean;
}

// Convert word numbers to digits
const wordToNumber: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
    'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    'hundred': 100
};

const convertWordsToNumbers = (text: string): string => {
    let result = text.toLowerCase();

    // Replace word numbers with digits
    Object.entries(wordToNumber).forEach(([word, num]) => {
        result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), num.toString());
    });

    // Handle compound numbers like "twenty five" -> "25"
    result = result.replace(/(\d+)\s+(\d+)/g, (_, a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (numA >= 20 && numA <= 90 && numB >= 1 && numB <= 9) {
            return (numA + numB).toString();
        }
        return `${a} ${b}`;
    });

    return result;
};

export const useVoiceCommands = (
    transcript: string,
    options: UseVoiceCommandsOptions = {}
) => {
    const {
        triggerPhrases = [
            'hey trainer', 'hey traina', 'a trainer', 'trainer',
            'who trainer', 'the trainer', 'eight trainer', 'hey train',
            'hey trener', 'hey training'
        ],
        onCommand,
        enabled = true
    } = options;

    const [lastCommand, setLastCommand] = useState<ParsedCommand | null>(null);
    const [isTriggered, setIsTriggered] = useState(false);
    const processedRef = useRef<Set<string>>(new Set());

    // Parse weight and reps from text
    const parseWeightAndReps = useCallback((text: string): { weight?: number; reps?: number } => {
        // First convert word numbers to digits
        const normalizedText = convertWordsToNumbers(text.toLowerCase());
        console.log('🔢 Normalized text:', normalizedText);

        // Patterns to match weight and reps
        const patterns = [
            // "180 lb 6 reps" or "180 lbs 6 reps" or "180 pounds 6 reps"
            /(\d+)\s*(?:lb|lbs|pounds?|pound)s?\s*(\d+)\s*(?:reps?)?/i,
            // "180 6" (weight then reps)
            /(\d+)\s+(\d+)(?:\s*reps?)?/i,
            // "6 reps 180 pounds"
            /(\d+)\s*reps?\s*(?:at|with|@)?\s*(\d+)\s*(?:lb|lbs|pounds?)?/i,
            // "180 for 6" or "180 x 6"
            /(\d+)\s*(?:for|by|x|times)\s*(\d+)/i,
        ];

        for (const pattern of patterns) {
            const match = normalizedText.match(pattern);
            if (match) {
                const num1 = parseInt(match[1]);
                const num2 = parseInt(match[2]);

                console.log('📊 Matched numbers:', num1, num2);

                // Determine which is weight and which is reps
                // Weight is typically larger (>20), reps are typically 1-30
                if (num1 > 30 && num2 <= 30) {
                    return { weight: num1, reps: num2 };
                } else if (num2 > 30 && num1 <= 30) {
                    return { weight: num2, reps: num1 };
                } else if (num1 > num2) {
                    // Assume larger number is weight
                    return { weight: num1, reps: num2 };
                } else {
                    return { weight: num2, reps: num1 };
                }
            }
        }

        return {};
    }, []);

    // Parse command type
    const parseCommandType = useCallback((text: string): ParsedCommand['type'] => {
        const normalizedText = text.toLowerCase();

        if (normalizedText.includes('next exercise') || normalizedText.includes('skip')) {
            return 'next_exercise';
        }

        if (normalizedText.includes('next set') || normalizedText.includes('done')) {
            return 'next_set';
        }

        // Check if it contains numbers (likely a log command)
        if (/\d+/.test(convertWordsToNumbers(normalizedText))) {
            return 'log_set';
        }

        return 'unknown';
    }, []);

    // Find trigger phrase in text
    const findTrigger = useCallback((text: string): { found: boolean; afterTrigger: string; beforeTrigger: string } => {
        const normalizedText = text.toLowerCase();

        for (const phrase of triggerPhrases) {
            const index = normalizedText.indexOf(phrase);
            if (index !== -1) {
                return {
                    found: true,
                    beforeTrigger: normalizedText.slice(0, index).trim(),
                    afterTrigger: normalizedText.slice(index + phrase.length).trim()
                };
            }
        }

        return { found: false, beforeTrigger: '', afterTrigger: '' };
    }, [triggerPhrases]);

    // Process transcript for commands
    useEffect(() => {
        if (!transcript || !enabled) return;

        const normalizedTranscript = transcript.toLowerCase().trim();

        // Skip if we've already processed this exact transcript
        if (processedRef.current.has(normalizedTranscript)) return;

        console.log('🎯 Processing transcript:', normalizedTranscript);

        const { found, afterTrigger } = findTrigger(normalizedTranscript);

        if (found) {
            console.log('✅ Trigger found! After trigger:', afterTrigger);

            // Look for numbers AFTER the trigger phrase
            const { weight, reps } = parseWeightAndReps(afterTrigger);

            console.log('📊 Parsed weight:', weight, 'reps:', reps);

            if (weight !== undefined && reps !== undefined) {
                const command: ParsedCommand = {
                    type: 'log_set',
                    weight,
                    reps,
                    rawText: afterTrigger
                };

                console.log('🎉 COMMAND DETECTED:', command);
                setLastCommand(command);
                setIsTriggered(true);

                if (onCommand) {
                    onCommand(command);
                    processedRef.current.add(normalizedTranscript);
                }

                setTimeout(() => setIsTriggered(false), 500);
            }
        }
    }, [transcript, enabled, findTrigger, parseWeightAndReps, onCommand]);

    // Clear processed when transcript resets
    useEffect(() => {
        if (transcript === '') {
            processedRef.current.clear();
        }
    }, [transcript]);

    return {
        lastCommand,
        isTriggered,
        parseWeightAndReps,
        parseCommandType
    };
};

export default useVoiceCommands;
