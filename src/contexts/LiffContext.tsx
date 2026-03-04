import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface MemberData {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  member_id: string;
  avatar_url?: string;
  status?: string;
  email?: string;
  phone?: string;
}

interface LiffContextType {
  isInLiff: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  lineProfile: LineProfile | null;
  memberData: MemberData | null;
  isLinked: boolean;
  error: string | null;
  setLineProfile: (profile: LineProfile | null) => void;
  setMemberData: (data: MemberData | null) => void;
  setIsLinked: (linked: boolean) => void;
  logout: () => void;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (!context) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  return context;
};

const detectLiffEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const url = new URL(window.location.href);
  // Check if opened from LIFF (has liff params or is on /liff/ route)
  return (
    url.searchParams.has('liff.state') ||
    url.pathname.startsWith('/liff') ||
    navigator.userAgent.includes('Line')
  );
};

export const LiffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInLiff = detectLiffEnvironment();

  useEffect(() => {
    // Try to restore session from sessionStorage
    try {
      const savedProfile = sessionStorage.getItem('liff_line_profile');
      const savedMember = sessionStorage.getItem('liff_member_data');
      
      if (savedProfile) {
        setLineProfile(JSON.parse(savedProfile));
      }
      if (savedMember) {
        const member = JSON.parse(savedMember);
        setMemberData(member);
        setIsLinked(true);
      }
    } catch (e) {
      console.error('Failed to restore LIFF session:', e);
    }
    
    setIsInitialized(true);
    setIsLoading(false);
  }, []);

  // Persist profile changes to sessionStorage
  useEffect(() => {
    if (lineProfile) {
      sessionStorage.setItem('liff_line_profile', JSON.stringify(lineProfile));
    } else {
      sessionStorage.removeItem('liff_line_profile');
    }
  }, [lineProfile]);

  useEffect(() => {
    if (memberData) {
      sessionStorage.setItem('liff_member_data', JSON.stringify(memberData));
    } else {
      sessionStorage.removeItem('liff_member_data');
    }
  }, [memberData]);

  const logout = useCallback(() => {
    setLineProfile(null);
    setMemberData(null);
    setIsLinked(false);
    setError(null);
    sessionStorage.removeItem('liff_line_profile');
    sessionStorage.removeItem('liff_member_data');
  }, []);

  return (
    <LiffContext.Provider
      value={{
        isInLiff,
        isInitialized,
        isLoading,
        lineProfile,
        memberData,
        isLinked,
        error,
        setLineProfile,
        setMemberData,
        setIsLinked,
        logout,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
};
