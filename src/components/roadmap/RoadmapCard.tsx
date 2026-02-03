import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { VersionBadge, VersionStatus } from './VersionBadge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface RoadmapCardProps {
  version: string;
  title: string;
  description: string;
  status: VersionStatus;
  progress?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const RoadmapCard = ({
  version,
  title,
  description,
  status,
  progress,
  children,
  defaultOpen = false,
}: RoadmapCardProps) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Card
      className={cn(
        'transition-all',
        status === 'completed' && 'border-accent-teal/30',
        status === 'inProgress' && 'border-primary shadow-md',
        status === 'planned' && 'border-border/50 opacity-80'
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <VersionBadge version={version} status={status} />
                  <CardTitle className="text-xl">{title}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>

                {/* Progress bar for inProgress */}
                {status === 'inProgress' && progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>

              <div className="ml-4 p-2 hover:bg-muted rounded-md">
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
