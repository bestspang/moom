import React from 'react';
import {
  Bike, Flame, Heart, Dumbbell, Activity, Waves, Leaf, Zap,
  Music, Sun, Moon, Target, Sparkles, Clock, Award, Tag,
} from 'lucide-react';

/**
 * Deterministic visual identity (icon + accent class) derived from a category name.
 * No DB columns required — purely presentational, mirrors DS Categories.jsx visual style.
 */
const ICONS = [Bike, Flame, Heart, Dumbbell, Activity, Waves, Leaf, Zap, Music, Sun, Moon, Target, Sparkles, Clock, Award, Tag];

const ACCENTS = [
  { fg: 'text-primary',                       bg: 'bg-primary/10',                   bar: 'bg-primary' },
  { fg: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-500/10',                  bar: 'bg-blue-500' },
  { fg: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10',              bar: 'bg-purple-500' },
  { fg: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10',          bar: 'bg-emerald-500' },
  { fg: 'text-pink-600 dark:text-pink-400',   bg: 'bg-pink-500/10',                  bar: 'bg-pink-500' },
  { fg: 'text-red-600 dark:text-red-400',     bg: 'bg-red-500/10',                   bar: 'bg-red-500' },
  { fg: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10',                 bar: 'bg-amber-500' },
  { fg: 'text-teal-600 dark:text-teal-400',   bg: 'bg-teal-500/10',                  bar: 'bg-teal-500' },
];

const KEYWORD_MAP: Array<{ test: RegExp; icon: number; accent: number }> = [
  { test: /spin|cycle|bike/i,            icon: 0, accent: 1 },
  { test: /hiit|cardio|burn/i,           icon: 1, accent: 0 },
  { test: /yoga|meditat/i,               icon: 4, accent: 2 },
  { test: /strength|weight|lift/i,       icon: 3, accent: 3 },
  { test: /mobility|stretch|flex/i,      icon: 6, accent: 4 },
  { test: /box|fight|mma|muay/i,         icon: 1, accent: 5 },
  { test: /pilates|core/i,               icon: 4, accent: 7 },
  { test: /dance|zumba/i,                icon: 8, accent: 4 },
  { test: /swim|aqua/i,                  icon: 5, accent: 1 },
  { test: /run|jog|tread/i,              icon: 4, accent: 6 },
];

const hashIndex = (s: string, len: number) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % len;
};

export const getCategoryVisual = (name: string) => {
  const matched = KEYWORD_MAP.find((k) => k.test.test(name));
  const iconIdx = matched ? matched.icon : hashIndex(name + 'i', ICONS.length);
  const accentIdx = matched ? matched.accent : hashIndex(name + 'a', ACCENTS.length);
  return { Icon: ICONS[iconIdx], accent: ACCENTS[accentIdx] };
};
