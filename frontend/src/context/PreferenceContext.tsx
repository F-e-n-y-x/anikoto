'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type AudioMode = 'SUB' | 'DUB';

interface PreferenceContextType {
  audioMode: AudioMode;
  setAudioMode: (mode: AudioMode) => void;
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

export function PreferenceProvider({ children }: { children: React.ReactNode }) {
  const [audioMode, setAudioModeState] = useState<AudioMode>('SUB');

  useEffect(() => {
    // Read from local storage on mount
    const savedMode = localStorage.getItem('yugen_preferred_audio');
    if (savedMode === 'SUB' || savedMode === 'DUB') {
      setAudioModeState(savedMode);
    }
  }, []);

  const setAudioMode = (mode: AudioMode) => {
    setAudioModeState(mode);
    localStorage.setItem('yugen_preferred_audio', mode);
  };

  return (
    <PreferenceContext.Provider value={{ audioMode, setAudioMode }}>
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferenceContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferenceProvider');
  }
  return context;
}
