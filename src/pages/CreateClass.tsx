import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useClassCategories } from '@/hooks/useClassCategories';
import { useCreateClass } from '@/hooks/useClasses';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

const classSchema = z.object({
  type: z.enum(['class', 'pt']),
  name: z.string().min(1, 'Required'),
  name_th: z.string().optional(),
  description: z.string().min(1, 'Required'),
  category_id: z.string().optional(),
  duration: z.number().min(1),
  level: z.enum(['all_levels', 'beginner', 'intermediate', 'advanced']).optional().nullable(),
}).refine(
  (d) => d.type === 'pt' || (d.category_id && d.level),
  { message: 'Category and level are required for Class type', path: ['category_id'] },
);

type ClassFormValues = z.infer<typeof classSchema>;

const CreateClass = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: categories } = useClassCategories();
  const createClass = useCreateClass();

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      type: 'class',
      name: '',
      name_th: '',
      description: '',
      category_id: '',
      duration: 60,
      level: 'all_levels',
    },
  });

  const classType = watch('type');

  const onSubmit = async (values: ClassFormValues, status: string) => {
    await createClass.mutateAsync({
      name: values.name,
      name_th: values.name_th || null,
      description: values.description,
      type: values.type as any,
      category_id: values.category_id || null,
      duration: values.duration,
      level: (values.type === 'class' ? values.level : null) as any,
      status,
    });
    navigate('/class');
  };

  return (
    <div>
      <PageHeader
        title={t('classes.createClass')}
        breadcrumbs={[
          { label: t('nav.class') },
          { label: t('classes.title'), href: '/class' },
          { label: t('classes.createClass') },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/class')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        }
      />

      <form className="space-y-6">
        {/* Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-primary">{t('classes.selectType')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-3"
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                      field.value === 'class' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => field.onChange('class')}
                  >
                    <RadioGroupItem value="class" id="type-class" />
                    <Label htmlFor="type-class" className="cursor-pointer">
                      <span className="font-medium">Class</span>
                      <p className="text-xs text-muted-foreground">{t('classes.classTypeDesc')}</p>
                    </Label>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                      field.value === 'pt' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => field.onChange('pt')}
                  >
                    <RadioGroupItem value="pt" id="type-pt" />
                    <Label htmlFor="type-pt" className="cursor-pointer">
                      <span className="font-medium">Personal Training</span>
                      <p className="text-xs text-muted-foreground">{t('classes.ptTypeDesc')}</p>
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </CardContent>
        </Card>

        {/* Class Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-primary">{t('classes.classInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('classes.classNameEn')} <span className="text-destructive">*</span></Label>
                <Input {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('classes.classNameTh')}</Label>
                <Input {...register('name_th')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('classes.descriptionEn')} <span className="text-destructive">*</span></Label>
              <Textarea {...register('description')} rows={3} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('packages.categories')} {classType === 'class' && <span className="text-destructive">*</span>}
                </Label>
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('classes.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('classes.duration')} <span className="text-destructive">*</span></Label>
                <Input type="number" min={1} {...register('duration', { valueAsNumber: true })} />
              </div>
            </div>

            {classType === 'class' && (
              <div className="space-y-2">
                <Label>{t('classes.level')} <span className="text-destructive">*</span></Label>
                <Controller
                  control={control}
                  name="level"
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('classes.level')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_levels">{t('classes.allLevels')}</SelectItem>
                        <SelectItem value="beginner">{t('classes.beginner')}</SelectItem>
                        <SelectItem value="intermediate">{t('classes.intermediate')}</SelectItem>
                        <SelectItem value="advanced">{t('classes.advanced')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/class')}>
            {t('classes.discard')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={createClass.isPending}
            onClick={handleSubmit((v) => onSubmit(v, 'drafts'))}
          >
            {t('classes.saveAsDraft')}
          </Button>
          <Button
            type="button"
            disabled={createClass.isPending}
            onClick={handleSubmit((v) => onSubmit(v, 'active'))}
          >
            {t('classes.publishClass')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateClass;
