import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLinkLineAccount } from '@/hooks/useLineUsers';

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface LineAuthResult {
  success: boolean;
  needsLinking: boolean;
  lineProfile: LineProfile | null;
  member: Record<string, unknown> | null;
  lineUser: {
    id: string;
    linkedAt: string;
    lastLoginAt: string;
  } | null;
  error?: string;
  code?: string;
}

export const useLineAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkMutation = useLinkLineAccount();

  const loginWithLine = useCallback(async (idToken: string): Promise<LineAuthResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('line-auth', {
        body: { idToken },
      });

      if (fnError) {
        const errorMessage = fnError.message || 'Failed to authenticate with LINE';
        setError(errorMessage);
        return null;
      }

      if (data?.error) {
        setError(data.message || data.error);
        return data as LineAuthResult;
      }

      return data as LineAuthResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const linkAccountToMember = useCallback(
    async (lineUserId: string, memberId: string, displayName?: string, pictureUrl?: string) => {
      return linkMutation.mutateAsync({
        lineUserId,
        memberId,
        lineDisplayName: displayName,
        linePictureUrl: pictureUrl,
      });
    },
    [linkMutation]
  );

  return {
    loginWithLine,
    linkAccountToMember,
    isLoading: isLoading || linkMutation.isPending,
    error,
    clearError: () => setError(null),
  };
};
