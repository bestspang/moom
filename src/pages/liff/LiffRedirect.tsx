import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface LiffRedirectProps {
  target: 'member' | 'trainer';
}

/**
 * Legacy /liff/member and /liff/trainer routes now redirect to the real
 * Member/Trainer apps at /member and /trainer. Preserves query params, hash,
 * and honors LINE's `liff.state` deep-link convention.
 */
const LiffRedirect: React.FC<LiffRedirectProps> = ({ target }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const liffState = params.get('liff.state');

    let destination: string;
    if (liffState) {
      // liff.state is a full path (usually URL-encoded by LINE)
      destination = liffState.startsWith('/') ? liffState : `/${liffState}`;
    } else {
      // Strip liff.state (none here) and forward remaining params
      params.delete('liff.state');
      const qs = params.toString();
      destination = `/${target}${qs ? `?${qs}` : ''}${location.hash || ''}`;
    }

    navigate(destination, { replace: true });
  }, [navigate, location.search, location.hash, target]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default LiffRedirect;
