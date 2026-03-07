import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard } from '@/components/common';
import { useClass, useClassPerformance, useUpdateClass } from '@/hooks/useClasses';
import { useClassCategories } from '@/hooks/useClassCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, X, ArrowLeft, CalendarDays, Users, TrendingUp, BarChart3 } from 'lucide-react';

type EditSection = 'information' | null;

const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: classData, isLoading } = useClass(id!);
  const { data: performance } = useClassPerformance(id!);
  const { data: categories } = useClassCategories();
  const updateClass = useUpdateClass();

  const [editSection, setEditSection] = useState<EditSection>(null);
  const [name, setName] = useState('');
  const [nameTh, setNameTh] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionTh, setDescriptionTh] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [duration, setDuration] = useState(60);
  const [level, setLevel] = useState('all_levels');

  useEffect(() => {
    if (classData) {
      setName(classData.name || '');
      setNameTh(classData.name_th || '');
      setDescription(classData.description || '');
      setDescriptionTh(classData.description_th || '');
      setCategoryId(classData.category_id || '');
      setDuration(classData.duration || 60);
      setLevel(classData.level || 'all_levels');
    }
  }, [classData]);

  const startEdit = () => {
    if (classData) {
      setName(classData.name || '');
      setNameTh(classData.name_th || '');
      setDescription(classData.description || '');
      setDescriptionTh(classData.description_th || '');
      setCategoryId(classData.category_id || '');
      setDuration(classData.duration || 60);
      setLevel(classData.level || 'all_levels');
    }
    setEditSection('information');
  };

  const cancelEdit = () => setEditSection(null);

  const saveInformation = async () => {
    if (!id || !name.trim()) return;
    const oldData = classData ? {
      name: classData.name,
      name_th: classData.name_th,
      description: classData.description,
      description_th: classData.description_th,
      category_id: classData.category_id,
      duration: classData.duration,
      level: classData.level,
    } : undefined;

    await updateClass.mutateAsync({
      id,
      data: {
        name: name.trim(),
        name_th: nameTh.trim() || null,
        description: description.trim(),
        description_th: descriptionTh.trim() || null,
        category_id: categoryId || null,
        duration,
        level: (classData?.type === 'class' ? level : null) as any,
      },
      oldData,
    });
    setEditSection(null);
  };

  const getLevelLabel = (lvl: string | null) => {
    switch (lvl) {
      case 'all_levels': return t('classes.allLevels');
      case 'beginner': return t('classes.beginner');
      case 'intermediate': return t('classes.intermediate');
      case 'advanced': return t('classes.advanced');
      default: return lvl || '-';
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="" breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('classes.title'), href: '/class' }, { label: '...' }]} />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div>
        <PageHeader title={t('common.noData')} />
        <Button variant="outline" onClick={() => navigate('/class')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('classes.backToList')}
        </Button>
      </div>
    );
  }

  const categoryName = classData.category?.name || '-';

  return (
    <div>
      <PageHeader
        title={classData.name}
        breadcrumbs={[
          { label: t('nav.yourGym') },
          { label: t('classes.title'), href: '/class' },
          { label: classData.name },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/class')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('classes.backToList')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={t('classes.scheduledThisWeek')}
          value={performance?.scheduledThisWeek ?? '-'}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          title={t('classes.bookingsThisWeek')}
          value={performance?.bookingsThisWeek ?? '-'}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title={t('classes.avgCapacity')}
          value={performance ? `${performance.avgCapacity}%` : '-'}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title={t('classes.totalBookings')}
          value={performance?.totalBookings ?? '-'}
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      {/* Class Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-primary">{t('classes.classInfo')}</CardTitle>
          {editSection !== 'information' && (
            <Button variant="ghost" size="icon" onClick={startEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editSection === 'information' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('classes.classNameEn')} <span className="text-destructive">*</span></Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('classes.classNameTh')}</Label>
                  <Input value={nameTh} onChange={(e) => setNameTh(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('classes.descriptionEn')}</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{t('classes.descriptionTh')}</Label>
                <Textarea value={descriptionTh} onChange={(e) => setDescriptionTh(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('packages.categories')}</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('classes.duration')}</Label>
                  <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                </div>
              </div>
              {classData.type === 'class' && (
                <div className="space-y-2">
                  <Label>{t('classes.level')}</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_levels">{t('classes.allLevels')}</SelectItem>
                      <SelectItem value="beginner">{t('classes.beginner')}</SelectItem>
                      <SelectItem value="intermediate">{t('classes.intermediate')}</SelectItem>
                      <SelectItem value="advanced">{t('classes.advanced')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-1" />{t('common.cancel')}
                </Button>
                <Button size="sm" onClick={saveInformation} disabled={updateClass.isPending || !name.trim()}>
                  {t('common.save')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">{t('classes.classNameEn')}</p>
                <p className="font-medium">{classData.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t('classes.classNameTh')}</p>
                <p className="font-medium">{classData.name_th || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">{t('classes.descriptionEn')}</p>
                <p className="font-medium">{classData.description || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">{t('classes.descriptionTh')}</p>
                <p className="font-medium">{classData.description_th || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t('packages.categories')}</p>
                <p className="font-medium">{categoryName}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t('classes.duration')}</p>
                <p className="font-medium">{classData.duration || 60} mins</p>
              </div>
              {classData.type === 'class' && (
                <div>
                  <p className="text-muted-foreground mb-1">{t('classes.level')}</p>
                  <p className="font-medium">{getLevelLabel(classData.level)}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1">{t('packages.type')}</p>
                <p className="font-medium">{classData.type === 'pt' ? 'Personal Training' : 'Class'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassDetails;
