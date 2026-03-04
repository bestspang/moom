import React, { useState } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useAnnouncements,
  useAnnouncementStats,
  useDeleteAnnouncement,
  type Announcement,
} from '@/hooks/useAnnouncements';
import { PageHeader, SearchBar, StatusTabs, EmptyState, type StatusTab } from '@/components/common';
import { CreateAnnouncementDialog } from '@/components/announcements/CreateAnnouncementDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trash2, Smartphone, MessageCircle, MapPin } from 'lucide-react';
import { getDateLocale } from '@/lib/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Database } from '@/integrations/supabase/types';

type AnnouncementStatus = Database['public']['Enums']['announcement_status'];

const Announcements = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('active');
  const [dialogOpen, setDialogOpen] = useState(false);

  const statusFilter = activeTab === 'all' ? undefined : (activeTab as AnnouncementStatus);
  const { data: announcements, isLoading } = useAnnouncements(statusFilter, search);
  const { data: stats } = useAnnouncementStats();
  const deleteAnnouncement = useDeleteAnnouncement();

  const statusTabs: StatusTab[] = [
    { key: 'active', label: t('common.active'), count: stats?.active || 0, color: 'teal' },
    { key: 'scheduled', label: t('packages.scheduled'), count: stats?.scheduled || 0 },
    { key: 'completed', label: t('announcements.completed'), count: stats?.completed || 0 },
  ];

  const getStatusBadge = (ann: Announcement) => {
    const status = ann.computed_status;
    const styles: Record<string, string> = {
      active: 'bg-accent-teal/10 text-accent-teal',
      scheduled: 'bg-primary/10 text-primary',
      completed: 'bg-muted text-muted-foreground',
    };
    return (
      <Badge variant="secondary" className={styles[status]}>
        {status === 'active' ? t('common.active') :
         status === 'completed' ? t('announcements.completed') :
         t('packages.scheduled')}
      </Badge>
    );
  };

  /** Show message_th when in Thai locale if available, otherwise message_en */
  const getDisplayMessage = (ann: Announcement) => {
    if (language === 'th' && ann.message_th) return ann.message_th;
    return ann.message_en || ann.message || '';
  };

  const renderChannelBadges = (channels: { in_app?: boolean; line?: boolean } | null) => {
    const ch = channels ?? { in_app: true, line: false };
    return (
      <div className="flex gap-1">
        {ch.in_app && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Smartphone className="h-3 w-3" />
            {t('announcements.inApp')}
          </Badge>
        )}
        {ch.line && (
          <Badge variant="outline" className="gap-1 text-xs">
            <MessageCircle className="h-3 w-3" />
            {t('announcements.line')}
          </Badge>
        )}
      </div>
    );
  };

  const renderTarget = (mode: string | null, ids: string[] | null) => {
    if (!mode || mode === 'all') {
      return <span className="text-sm text-muted-foreground">{t('announcements.allLocations')}</span>;
    }
    const count = ids?.length || 0;
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <MapPin className="h-3 w-3" />
        {count} {count === 1 ? 'location' : 'locations'}
      </Badge>
    );
  };

  return (
    <div>
      <PageHeader
        title={t('announcements.title')}
        breadcrumbs={[
          { label: t('nav.yourGym') },
          { label: t('announcements.title') },
        ]}
        actions={
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-primary hover:bg-primary-hover"
          >
            {t('common.create')}
          </Button>
        }
      />

      <SearchBar
        placeholder={t('announcements.searchPlaceholder')}
        value={search}
        onChange={setSearch}
        className="max-w-md mb-6"
      />

      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !announcements || announcements.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('announcements.publishDate')}</TableHead>
                <TableHead>{t('announcements.endDate')}</TableHead>
                <TableHead>{t('announcements.message')}</TableHead>
                <TableHead>{t('announcements.channels')}</TableHead>
                <TableHead>{t('announcements.targetLocations')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="whitespace-nowrap">
                    {announcement.publish_date
                      ? format(new Date(announcement.publish_date), 'd MMM yyyy', { locale })
                      : '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {announcement.end_date
                      ? format(new Date(announcement.end_date), 'd MMM yyyy', { locale })
                      : '-'}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate">{getDisplayMessage(announcement)}</p>
                  </TableCell>
                  <TableCell>
                    {renderChannelBadges(announcement.channels as unknown as { in_app?: boolean; line?: boolean } | null)}
                  </TableCell>
                  <TableCell>
                    {renderTarget(announcement.target_mode, announcement.target_location_ids)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(announcement)}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('announcements.deleteConfirm')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAnnouncement.mutate(announcement.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateAnnouncementDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default Announcements;
