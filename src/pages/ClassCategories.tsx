import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClassCategories, type ClassCategoryWithCount } from '@/hooks/useClassCategories';
import CreateClassCategoryDialog from '@/components/categories/CreateClassCategoryDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { getCategoryVisual } from '@/components/admin-ds';
import { cn } from '@/lib/utils';

const ClassCategories = () => {
  const { t, language } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: categories, isLoading } = useClassCategories(search);

  const total = categories?.length ?? 0;
  const subtitle = `${t('categories.title')} · ${total} ${t('categories.classCategory')}`;

  return (
    <div>
      <PageHeader
        title={t('categories.title')}
        subtitle={subtitle}
        breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('categories.title') }]}
        actions={
          can('class_categories', 'write') ? (
            <Button
              className="bg-primary hover:bg-primary-hover gap-1.5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t('common.create')}
            </Button>
          ) : undefined
        }
      />

      {/* DS toolbar card */}
      <div className="mb-5 rounded-xl border border-border bg-card shadow-sm p-3">
        <SearchBar
          placeholder={t('categories.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[148px] w-full rounded-xl" />
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              language={language}
              onClick={() => navigate(`/class-category/${cat.id}`)}
              t={t}
            />
          ))}
        </div>
      )}

      <CreateClassCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

interface CardProps {
  category: ClassCategoryWithCount;
  language: string;
  onClick: () => void;
  t: (k: string) => string;
}

const CategoryCard = ({ category, language, onClick, t }: CardProps) => {
  const displayName =
    language === 'th' && category.name_th ? category.name_th : category.name;
  const { Icon, accent } = getCategoryVisual(category.name);

  return (
    <button
      onClick={onClick}
      className={cn(
        'group text-left bg-card border border-border rounded-xl shadow-sm overflow-hidden',
        'transition-all duration-150 hover:-translate-y-px hover:shadow-md hover:border-primary/40',
        'flex flex-col'
      )}
    >
      {/* Top accent strip */}
      <div className={cn('h-1 w-full', accent.bar)} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0',
              accent.bg,
              accent.fg
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-extrabold text-foreground tracking-tight leading-tight truncate">
              {displayName}
            </div>
            {category.description && (
              <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>

        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[20px] font-extrabold text-foreground tabular-nums leading-none">
              {category.computed_class_count}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              {t('categories.classesInCategory')}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default ClassCategories;
