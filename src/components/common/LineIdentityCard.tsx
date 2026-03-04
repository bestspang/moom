import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLineIdentity, useRequestLineLink, useUnlinkLineIdentity } from '@/hooks/useLineIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Link2, Unlink } from 'lucide-react';

interface LineIdentityCardProps {
  ownerType: 'member' | 'lead' | 'staff';
  ownerId: string;
}

const statusConfig = {
  linked: { variant: 'default' as const, className: 'bg-accent-teal text-white' },
  pending: { variant: 'secondary' as const, className: 'bg-primary text-primary-foreground' },
  unlinked: { variant: 'outline' as const, className: '' },
};

export const LineIdentityCard: React.FC<LineIdentityCardProps> = ({ ownerType, ownerId }) => {
  const { t } = useLanguage();
  const { data: identity, isLoading } = useLineIdentity(ownerType, ownerId);
  const requestLink = useRequestLineLink();
  const unlinkIdentity = useUnlinkLineIdentity();

  const status = identity?.status || 'unlinked';
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unlinked;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[#06C755]" />
          LINE
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('line.status')}</span>
          <Badge variant={config.variant} className={config.className}>
            {t(`line.${status}`)}
          </Badge>
        </div>

        {/* Profile info if linked */}
        {status === 'linked' && identity && (
          <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
            <Avatar className="h-10 w-10">
              {identity.line_picture_url && <AvatarImage src={identity.line_picture_url} />}
              <AvatarFallback className="bg-[#06C755] text-white text-xs">
                {identity.line_display_name?.charAt(0) || 'L'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {identity.line_display_name || t('line.displayName')}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {identity.line_user_id}
              </p>
            </div>
          </div>
        )}

        {/* Pending state */}
        {status === 'pending' && (
          <p className="text-sm text-muted-foreground">{t('line.linkRequested')}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {status === 'unlinked' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => requestLink.mutate({ ownerType, ownerId })}
                    disabled={requestLink.isPending}
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    {t('line.linkLine')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('line.comingSoon')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {(status === 'linked' || status === 'pending') && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => unlinkIdentity.mutate({ ownerType, ownerId })}
              disabled={unlinkIdentity.isPending}
            >
              <Unlink className="h-4 w-4 mr-1" />
              {t('line.unlinkLine')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
