/**
 * MoodCheckinStrip — UI shell for daily mood check-in.
 *
 * STORAGE: localStorage only — backend table not yet implemented.
 * Key: `moom-mood-${YYYY-MM-DD}` → mood key (string)
 *
 * When backed by a future `member_mood_log` table, swap the storage layer
 * for a Supabase mutation. The UI contract stays the same.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const MOODS = [
  { key: 'low', emoji: '😩', labelKey: 'member.moodLow' },
  { key: 'ok', emoji: '😐', labelKey: 'member.moodOk' },
  { key: 'good', emoji: '🙂', labelKey: 'member.moodGood' },
  { key: 'strong', emoji: '😎', labelKey: 'member.moodStrong' },
  { key: 'fire', emoji: '🔥', labelKey: 'member.moodFire' },
] as const;

type MoodKey = typeof MOODS[number]['key'];

function todayKey() {
  return `moom-mood-${new Date().toISOString().slice(0, 10)}`;
}

export function MoodCheckinStrip() {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<MoodKey | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(todayKey()) as MoodKey | null;
    if (stored) setPicked(stored);
  }, []);

  const handlePick = (key: MoodKey) => {
    setPicked(key);
    try {
      localStorage.setItem(todayKey(), key);
    } catch {
      // localStorage unavailable (private mode) — silently ignore
    }
  };

  if (picked) {
    const m = MOODS.find((x) => x.key === picked);
    return (
      <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl leading-none">{m?.emoji}</span>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-foreground">
              {t('member.moodToday')}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {m && t(m.labelKey)}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            try { localStorage.removeItem(todayKey()); } catch {}
            setPicked(null);
          }}
          className="text-[11px] font-semibold text-primary px-2 py-1 rounded hover:bg-primary/5"
        >
          {t('member.change')}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5">
      <div className="text-[11px] font-bold text-foreground mb-1.5">
        {t('member.moodPrompt')}
      </div>
      <div className="flex items-center justify-between gap-1">
        {MOODS.map((m) => (
          <button
            key={m.key}
            onClick={() => handlePick(m.key)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-xl hover:border-primary hover:bg-primary/5 active:scale-95 transition-all"
            aria-label={t(m.labelKey)}
          >
            {m.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
