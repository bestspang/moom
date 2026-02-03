import React from 'react';
import { LucideIcon, Check, Clock, Loader2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export type FeatureStatus = 'done' | 'inProgress' | 'planned';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  status: FeatureStatus;
  href?: string;
  onPreview?: () => void;
}

const statusConfig = {
  done: {
    border: 'border-accent-teal',
    badge: 'bg-accent-teal text-white',
    icon: Check,
    label: 'completed',
  },
  inProgress: {
    border: 'border-primary',
    badge: 'bg-primary text-primary-foreground',
    icon: Loader2,
    label: 'inProgress',
  },
  planned: {
    border: 'border-border',
    badge: 'bg-muted text-muted-foreground',
    icon: Clock,
    label: 'planned',
  },
};

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  features,
  status,
  onPreview,
}: FeatureCardProps) => {
  const { t } = useLanguage();
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-lg',
        config.border,
        'border-2'
      )}
    >
      {/* Status badge */}
      <div className="absolute top-3 right-3">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            config.badge
          )}
        >
          <StatusIcon
            className={cn(
              'h-3 w-3',
              status === 'inProgress' && 'animate-spin'
            )}
          />
          {t(`roadmap.${config.label}`)}
        </span>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              status === 'done' && 'bg-accent-teal/10 text-accent-teal',
              status === 'inProgress' && 'bg-primary/10 text-primary',
              status === 'planned' && 'bg-muted text-muted-foreground'
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ul className="space-y-2 mb-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check
                className={cn(
                  'h-4 w-4 mt-0.5 flex-shrink-0',
                  status === 'done'
                    ? 'text-accent-teal'
                    : 'text-muted-foreground'
                )}
              />
              <span
                className={
                  status === 'planned' ? 'text-muted-foreground' : ''
                }
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {status !== 'done' && onPreview && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={onPreview}
          >
            {t('roadmap.preview')}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
