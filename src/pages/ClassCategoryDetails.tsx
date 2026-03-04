import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, DataTable, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Check, X } from 'lucide-react';
import { useClassCategory, useCategoryClasses, useUpdateClassCategory } from '@/hooks/useClassCategories';
import type { Tables } from '@/integrations/supabase/types';

type ClassRow = Pick<Tables<'classes'>, 'id' | 'name' | 'name_th' | 'type' | 'level' | 'status' | 'updated_at'>;

const ClassCategoryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { data: category, isLoading: catLoading } = useClassCategory(id!);
  const { data: classes, isLoading: classesLoading } = useCategoryClasses(id!);
  const updateMutation = useUpdateClassCategory();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNameTh, setEditNameTh] = useState('');

  const startEditing = () => {
    if (!category) return;
    setEditName(category.name);
    setEditNameTh((category as any).name_th || '');
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const saveEdit = () => {
    if (!id || !editName.trim()) return;
    updateMutation.mutate(
      {
        id,
        data: { name: editName.trim(), name_th: editNameTh.trim() || null } as any,
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const classColumns: Column<ClassRow>[] = [
    { key: 'index', header: '#', cell: (row) => {
      const idx = classes?.findIndex(c => c.id === row.id) ?? 0;
      return idx + 1;
    }},
    {
      key: 'name',
      header: t('classes.className'),
      cell: (row) => (language === 'th' && row.name_th ? row.name_th : row.name),
    },
    { key: 'type', header: t('classes.classType'), cell: (row) => row.type || '-' },
    { key: 'level', header: t('classes.level'), cell: (row) => row.level || '-' },
  ];

  if (catLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!category) {
    return <div className="p-8 text-center text-muted-foreground">{t('common.noData')}</div>;
  }

  const displayName = language === 'th' && (category as any).name_th
    ? (category as any).name_th
    : category.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayName}
        breadcrumbs={[
          { label: t('nav.class') },
          { label: t('categories.title'), href: '/class-category' },
          { label: displayName },
        ]}
      />

      {/* Category info card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('categories.categoryInfo')}</CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-1" /> {t('common.edit')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('categories.nameEn')}</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('categories.nameTh')}</Label>
                <Input value={editNameTh} onChange={(e) => setEditNameTh(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit} disabled={!editName.trim() || updateMutation.isPending}>
                  <Check className="h-4 w-4 mr-1" /> {t('common.save')}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditing}>
                  <X className="h-4 w-4 mr-1" /> {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('categories.nameEn')}</p>
                <p className="font-medium">{category.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('categories.nameTh')}</p>
                <p className="font-medium">{(category as any).name_th || '-'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classes in this category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('categories.classesInCategory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {classesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={classColumns}
              data={classes || []}
              rowKey={(row) => row.id}
              emptyMessage={t('categories.noClassesInCategory')}
              onRowClick={(row) => navigate(`/class/${row.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassCategoryDetails;
