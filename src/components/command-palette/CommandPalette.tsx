import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home, DoorOpen, Calendar, LayoutGrid, List, Grid3X3,
  Users, Star, Tag, Gift, UserCheck, Shield, MapPin,
  FileText, Megaphone, Dumbbell, Receipt, DollarSign,
  BarChart3, Settings, Search, User, Plus, Bell, Trophy,
} from 'lucide-react';
import { dispatchCommand } from '@/lib/commandEvents';

interface SearchResult {
  id: string;
  name: string;
  subtitle?: string;
  type: 'member' | 'lead';
}

const PAGE_ITEMS = [
  { labelKey: 'commandPalette.pageDashboard', path: '/', icon: Home, group: 'pages' },
  { labelKey: 'commandPalette.pageLobby', path: '/lobby', icon: DoorOpen, group: 'pages' },
  { labelKey: 'commandPalette.pageSchedule', path: '/calendar', icon: Calendar, group: 'pages' },
  { labelKey: 'commandPalette.pageRooms', path: '/room', icon: LayoutGrid, group: 'pages' },
  { labelKey: 'commandPalette.pageClasses', path: '/class', icon: List, group: 'pages' },
  { labelKey: 'commandPalette.pageClassCategories', path: '/class-category', icon: Grid3X3, group: 'pages' },
  { labelKey: 'commandPalette.pageMembers', path: '/members', icon: Users, group: 'pages' },
  { labelKey: 'commandPalette.pageLeads', path: '/leads', icon: Star, group: 'pages' },
  { labelKey: 'commandPalette.pagePackages', path: '/package', icon: Tag, group: 'pages' },
  { labelKey: 'commandPalette.pagePromotions', path: '/promotion', icon: Gift, group: 'pages' },
  { labelKey: 'commandPalette.pageStaff', path: '/admin', icon: UserCheck, group: 'pages' },
  { labelKey: 'commandPalette.pageRoles', path: '/roles', icon: Shield, group: 'pages' },
  { labelKey: 'commandPalette.pageLocations', path: '/location', icon: MapPin, group: 'pages' },
  { labelKey: 'commandPalette.pageActivityLog', path: '/activity-log', icon: FileText, group: 'pages' },
  { labelKey: 'commandPalette.pageAnnouncements', path: '/announcement', icon: Megaphone, group: 'pages' },
  { labelKey: 'commandPalette.pageWorkouts', path: '/workout-list', icon: Dumbbell, group: 'pages' },
  { labelKey: 'commandPalette.pageTransferSlips', path: '/transfer-slip', icon: Receipt, group: 'pages' },
  { labelKey: 'commandPalette.pageFinance', path: '/finance', icon: DollarSign, group: 'pages' },
  { labelKey: 'commandPalette.pageReports', path: '/report', icon: BarChart3, group: 'pages' },
  { labelKey: 'commandPalette.pageSettings', path: '/setting/general', icon: Settings, group: 'pages' },
  { labelKey: 'commandPalette.pageProfile', path: '/profile', icon: User, group: 'pages' },
  { labelKey: 'commandPalette.pageNotifications', path: '/notifications', icon: Bell, group: 'pages' },
  { labelKey: 'commandPalette.pageGamification', path: '/gamification', icon: Trophy, group: 'pages' },
];

interface QuickAction {
  labelKey: string;
  icon: typeof Plus;
  path: string;
  command?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { labelKey: 'commandPalette.checkIn', path: '/lobby', icon: DoorOpen, command: 'open-checkin' },
  { labelKey: 'commandPalette.actionCreateMember', path: '/members', icon: Plus, command: 'open-create-member' },
  { labelKey: 'commandPalette.actionCreateLead', path: '/leads', icon: Plus, command: 'open-create-lead' },
  { labelKey: 'commandPalette.actionCreateClass', path: '/class/create', icon: Plus },
  { labelKey: 'commandPalette.actionCreatePackage', path: '/package/create', icon: Plus },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search members/leads
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const q = `%${query}%`;
        const [membersRes, leadsRes] = await Promise.all([
          supabase
            .from('members')
            .select('id, first_name, last_name, nickname, phone, member_id')
            .or(`first_name.ilike.${q},last_name.ilike.${q},nickname.ilike.${q},phone.ilike.${q},member_id.ilike.${q}`)
            .limit(5),
          supabase
            .from('leads')
            .select('id, first_name, last_name, phone')
            .or(`first_name.ilike.${q},last_name.ilike.${q},phone.ilike.${q}`)
            .limit(3),
        ]);

        const memberResults: SearchResult[] = (membersRes.data || []).map((m) => ({
          id: m.id,
          name: `${m.first_name} ${m.last_name}${m.nickname ? ` (${m.nickname})` : ''}`,
          subtitle: `${m.member_id}${m.phone ? ` · ${m.phone}` : ''}`,
          type: 'member' as const,
        }));

        const leadResults: SearchResult[] = (leadsRes.data || []).map((l) => ({
          id: l.id,
          name: `${l.first_name} ${l.last_name || ''}`.trim(),
          subtitle: l.phone || undefined,
          type: 'lead' as const,
        }));

        setResults([...memberResults, ...leadResults]);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredPages = useMemo(() => {
    if (!query) return PAGE_ITEMS;
    const q = query.toLowerCase();
    return PAGE_ITEMS.filter((p) => t(p.labelKey).toLowerCase().includes(q));
  }, [query, t]);

  const filteredActions = useMemo(() => {
    if (!query) return QUICK_ACTIONS;
    const q = query.toLowerCase();
    return QUICK_ACTIONS.filter((a) => t(a.labelKey).toLowerCase().includes(q));
  }, [query, t]);

  const handleSelect = (path: string, command?: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
    if (command) {
      setTimeout(() => dispatchCommand(command), 150);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={t('commandPalette.placeholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searching ? t('common.loading') : t('commandPalette.noResults')}
        </CommandEmpty>

        {/* People results */}
        {results.length > 0 && (
          <CommandGroup heading={t('commandPalette.people')}>
            {results.map((r) => (
              <CommandItem
                key={`${r.type}-${r.id}`}
                onSelect={() =>
                  handleSelect(r.type === 'member' ? `/members/${r.id}/detail` : `/leads?id=${r.id}`)
                }
              >
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm">{r.name}</span>
                  {r.subtitle && (
                    <span className="text-xs text-muted-foreground">{r.subtitle}</span>
                  )}
                </div>
                <span className="ml-auto text-xs text-muted-foreground capitalize">
                  {r.type}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.length > 0 && <CommandSeparator />}

        {/* Quick actions */}
        {filteredActions.length > 0 && (
          <CommandGroup heading={t('commandPalette.quickActions')}>
            {filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.path + (action.command || '')}
                  onSelect={() => handleSelect(action.path, action.command)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{t(action.labelKey)}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Pages */}
        {filteredPages.length > 0 && (
          <CommandGroup heading={t('commandPalette.goTo')}>
            {filteredPages.map((page) => {
              const Icon = page.icon;
              return (
                <CommandItem
                  key={page.path}
                  onSelect={() => handleSelect(page.path)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{t(page.labelKey)}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
