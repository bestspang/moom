import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocations } from '@/hooks/useLocations';
import { useClassCategories } from '@/hooks/useClassCategories';
import { useCreateRoom } from '@/hooks/useRooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useLanguage();
  const { data: locations } = useLocations();
  const { data: classCategories } = useClassCategories();
  const createRoom = useCreateRoom();

  // Memoized schema for i18n support
  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('validation.required')),
        name_th: z.string().optional(),
        location_id: z.string().min(1, t('validation.required')),
        all_categories: z.boolean(),
        categories: z.array(z.string()).optional(),
        layout_type: z.enum(['open', 'fixed']),
        max_capacity: z.coerce.number().min(1, t('validation.required')),
      }),
    [t]
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      name_th: '',
      location_id: '',
      all_categories: true,
      categories: [],
      layout_type: 'open',
      max_capacity: 20,
    },
  });

  const allCategories = form.watch('all_categories');
  const selectedCategories = form.watch('categories') || [];

  const handleCategoryToggle = (categoryName: string, checked: boolean) => {
    const current = form.getValues('categories') || [];
    if (checked) {
      form.setValue('categories', [...current, categoryName]);
    } else {
      form.setValue(
        'categories',
        current.filter((c) => c !== categoryName)
      );
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await createRoom.mutateAsync({
        name: values.name,
        name_th: values.name_th || null,
        location_id: values.location_id,
        categories: values.all_categories ? [] : values.categories,
        layout_type: values.layout_type as 'open' | 'fixed',
        max_capacity: values.max_capacity,
        status: 'open',
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleDiscard = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t('rooms.create.title')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section: Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary">
                {t('rooms.create.information')}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('rooms.create.roomNameEn')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('rooms.create.roomNamePlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name_th"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rooms.create.roomNameTh')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('rooms.create.roomNamePlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('rooms.create.location')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('rooms.create.selectLocation')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations?.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section: Access */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary">
                {t('rooms.create.access')}
              </h3>

              <FormField
                control={form.control}
                name="all_categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('rooms.create.categoriesCanUse')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(val) => field.onChange(val === 'all')}
                        value={field.value ? 'all' : 'specific'}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div
                          className={cn(
                            'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                            field.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => field.onChange(true)}
                        >
                          <RadioGroupItem value="all" id="all-categories" />
                          <Label htmlFor="all-categories" className="cursor-pointer">
                            {t('rooms.create.allCategories')}
                          </Label>
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                            !field.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => field.onChange(false)}
                        >
                          <RadioGroupItem value="specific" id="specific-categories" />
                          <Label htmlFor="specific-categories" className="cursor-pointer">
                            {t('rooms.create.specificCategories')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category selection when specific is chosen */}
              {!allCategories && (
                <div className="grid grid-cols-2 gap-2 p-4 bg-muted/50 rounded-lg">
                  {classCategories?.map((category) => (
                    <div key={category.id} className="flex items-center gap-2">
                      <Checkbox
                        id={category.id}
                        checked={selectedCategories.includes(category.name)}
                        onCheckedChange={(checked) =>
                          handleCategoryToggle(category.name, checked as boolean)
                        }
                      />
                      <Label htmlFor={category.id} className="cursor-pointer text-sm">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Room Layout */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary">
                {t('rooms.create.roomLayout')}
              </h3>

              <FormField
                control={form.control}
                name="layout_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('rooms.create.roomLayout')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div
                          className={cn(
                            'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                            field.value === 'open'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => field.onChange('open')}
                        >
                          <RadioGroupItem value="open" id="layout-open" />
                          <Label htmlFor="layout-open" className="cursor-pointer">
                            {t('rooms.create.openSpaceDesc')}
                          </Label>
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                            field.value === 'fixed'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => field.onChange('fixed')}
                        >
                          <RadioGroupItem value="fixed" id="layout-fixed" />
                          <Label htmlFor="layout-fixed" className="cursor-pointer">
                            {t('rooms.create.fixedPositionsDesc')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('rooms.create.maxCapacity')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder={t('rooms.create.maxCapacityPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t('rooms.create.helperText')}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDiscard}
                >
                  {t('rooms.create.discard')}
                </Button>
                <Button
                  type="submit"
                  disabled={createRoom.isPending}
                  className="bg-primary hover:bg-primary-hover"
                >
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
