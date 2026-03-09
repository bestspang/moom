import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface StreakFreezeButtonProps {
  memberId: string;
  availablePoints: number;
}

const FREEZE_COST = 50;

export function StreakFreezeButton({ memberId, availablePoints }: StreakFreezeButtonProps) {
  const [freezing, setFreezing] = useState(false);
  const queryClient = useQueryClient();
  const canAfford = availablePoints >= FREEZE_COST;

  const handleFreeze = async () => {
    if (!canAfford) {
      toast.error(`Need ${FREEZE_COST} Coin to freeze streak (you have ${availablePoints})`);
      return;
    }

    setFreezing(true);
    try {
      const { data, error } = await supabase.functions.invoke('streak-freeze');
      if (error) throw error;
      
      const result = data as { ok?: boolean; error?: string; freeze_until?: string };
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Streak frozen until ${result.freeze_until} 🛡️`, {
        description: `${FREEZE_COST} RP spent`,
      });
      queryClient.invalidateQueries({ queryKey: ['momentum-profile'] });
    } catch {
      toast.error('Failed to freeze streak');
    } finally {
      setFreezing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleFreeze}
      disabled={freezing || !canAfford}
      className="gap-1.5 text-xs"
    >
      <Shield className="h-3.5 w-3.5" />
      {freezing ? 'Freezing...' : `Freeze (${FREEZE_COST} Coin)`}
    </Button>
  );
}
