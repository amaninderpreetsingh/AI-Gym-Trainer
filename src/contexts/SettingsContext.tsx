import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserSettings, updateTriggerPhrases as updateTriggerPhrasesInDb, DEFAULT_TRIGGER_PHRASES } from '../services/userService';

type SpeechProvider = 'browser' | 'assemblyai';

interface SettingsContextType {
    speechProvider: SpeechProvider;
    setSpeechProvider: (provider: SpeechProvider) => void;
    assemblyApiKey: string;
    setAssemblyApiKey: (key: string) => void;
    voiceEnabled: boolean;
    setVoiceEnabled: (enabled: boolean) => void;
    triggerPhrases: string[];
    setTriggerPhrases: (phrases: string[]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

interface SettingsProviderProps {
    children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
    const { user } = useAuth();

    const [speechProvider, setSpeechProviderState] = useState<SpeechProvider>(() => {
        const saved = localStorage.getItem('speechProvider');
        return (saved as SpeechProvider) || 'browser';
    });

    const [assemblyApiKey, setAssemblyApiKeyState] = useState(() => {
        return localStorage.getItem('assemblyApiKey') || import.meta.env.VITE_ASSEMBLYAI_API_KEY || '';
    });

    const [voiceEnabled, setVoiceEnabledState] = useState(() => {
        const saved = localStorage.getItem('voiceEnabled');
        return saved !== 'false';
    });

    const [triggerPhrases, setTriggerPhrasesState] = useState<string[]>(DEFAULT_TRIGGER_PHRASES);

    // Load settings from DB when user logs in
    useEffect(() => {
        const loadSettings = async () => {
            if (user) {
                try {
                    const settings = await getUserSettings(user.uid);
                    setTriggerPhrasesState(settings.triggerPhrases);
                } catch (error) {
                    console.error('Failed to load user settings:', error);
                }
            } else {
                setTriggerPhrasesState(DEFAULT_TRIGGER_PHRASES);
            }
        };
        loadSettings();
    }, [user]);

    const setSpeechProvider = (provider: SpeechProvider) => {
        setSpeechProviderState(provider);
        localStorage.setItem('speechProvider', provider);
    };

    const setAssemblyApiKey = (key: string) => {
        setAssemblyApiKeyState(key);
        localStorage.setItem('assemblyApiKey', key);
    };

    const setVoiceEnabled = (enabled: boolean) => {
        setVoiceEnabledState(enabled);
        localStorage.setItem('voiceEnabled', enabled.toString());
    };

    const setTriggerPhrases = async (phrases: string[]) => {
        setTriggerPhrasesState(phrases);
        if (user) {
            try {
                await updateTriggerPhrasesInDb(user.uid, phrases);
            } catch (error) {
                console.error('Failed to save trigger phrases:', error);
            }
        }
    };

    // Check if env has AssemblyAI key
    useEffect(() => {
        const envKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
        if (envKey && !assemblyApiKey) {
            setAssemblyApiKey(envKey);
        }
    }, []);

    const value = {
        speechProvider,
        setSpeechProvider,
        assemblyApiKey,
        setAssemblyApiKey,
        voiceEnabled,
        setVoiceEnabled,
        triggerPhrases,
        setTriggerPhrases
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
