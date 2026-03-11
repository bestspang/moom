import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ClassRatingSheetProps {
  open: boolean;
  onClose: () => void;
  scheduleId: string | null;
  memberId: string;
  className?: string;
}

export function ClassRatingSheet({ open, onClose, scheduleId, memberId, className }: ClassRatingSheetProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!scheduleId || rating === 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('class_ratings')
        .upsert({
          schedule_id: scheduleId,
          member_id: memberId,
          rating,
          comment: comment.trim() || null,
        }, { onConflict: 'schedule_id,member_id' });

      if (error) throw error;
      toast.success(t('member.ratingSubmitted'));
      handleClose();
    } catch {
      toast.error(t('member.ratingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHovered(0);
    setComment('');
    onClose();
  };

  const handleSkip = () => {
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className={cn('max-w-sm mx-auto rounded-2xl border-0 p-0 overflow-hidden shadow-lg bg-card', className)}>
        <div className="h-1.5 bg-primary" />

        <div className="px-6 pt-8 pb-2 text-center">
          <p className="text-lg font-bold text-foreground">{t('member.howWasClass')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('member.ratingHint')}</p>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className="transition-transform hover:scale-110 active:scale-95"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={cn(
                  'h-10 w-10 transition-colors duration-150',
                  (hovered || rating) >= star
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-muted-foreground/30'
                )}
              />
            </button>
          ))}
        </div>

        {/* Rating label */}
        {rating > 0 && (
          <p className="text-center text-sm font-medium text-foreground animate-in fade-in-0 duration-200">
            {t(`member.ratingLabel${rating}`)}
          </p>
        )}

        {/* Comment */}
        <div className="px-6 py-3">
          <Textarea
            placeholder={t('member.ratingCommentPlaceholder')}
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
            className="resize-none text-sm"
            maxLength={500}
          />
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          <Button
            className="w-full font-bold text-base gap-2"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
          >
            <Send className="h-4 w-4" />
            {submitting ? t('common.saving') : t('member.submitRating')}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
            onClick={handleSkip}
          >
            {t('member.skipRating')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
