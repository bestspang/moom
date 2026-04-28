/**
 * MoodCheckinStrip — Daily mood check-in (V2 tile layout).
 *
 * STORAGE: localStorage only — backend table not yet implemented.
 * Key: `moom-mood-${YYYY-MM-DD}` → mood key (string)
 *
 * V2 redesign: large card, tile-style mood pickers with emoji + label below.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const MOODS = [
  { key: 'tired', emoji: '😴', labelKey: 'member.mood.tired' },
  { key: 'ok', emoji: '😐', labelKey: 'member.mood.ok' },
  { key: 'good', emoji: '🙂', labelKey: 'member.mood.good' },
  { key: 'ready', emoji: '💪', labelKey: 'member.mood.ready' },
  { key: 'onfire', emoji: '🔥', labelKey: 'member.mood.onfire' },
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
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-extrabold text-foreground">
          {t('member.moodPrompt')}
        </h3>
        {picked && (
          <button
            onClick={() => {
              try { localStorage.removeItem(todayKey()); } catch {}
              setPicked(null);
            }}
            className="text-xs font-semibold text-primary px-2 py-1 rounded hover:bg-primary/5"
          >
            {t('member.change')}
          </button>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {MOODS.map((m) => {
          const isPicked = picked === m.key;
          return (
            <button
              key={m.key}
              onClick={() => handlePick(m.key)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 px-1 transition-all active:scale-95 ${
                isPicked
                  ? 'bg-primary/10 ring-2 ring-primary'
                  : 'bg-muted/50 hover:bg-muted'
              }`}
              aria-label={t(m.labelKey)}
              aria-pressed={isPicked}
            >
              <span className="text-2xl leading-none">{m.emoji}</span>
              <span className="text-[10px] font-medium text-foreground/80 leading-none">
                {t(m.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
