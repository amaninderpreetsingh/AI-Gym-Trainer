import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type SpeechProvider = 'browser' | 'assemblyai';

interface SettingsContextType {
    speechProvider: SpeechProvider;
    setSpeechProvider: (provider: SpeechProvider) => void;
    assemblyApiKey: string;
    setAssemblyApiKey: (key: string) => void;
    voiceEnabled: boolean;
    setVoiceEnabled: (enabled: boolean) => void;
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
        setVoiceEnabled
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
