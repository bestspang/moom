import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw, Save, X, Crown, Briefcase, Wrench, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRole, useSaveRoleWithPermissions, useRolePermissions } from '@/hooks/useRoles';
import { ALL_RESOURCES, getDefaultPermissions, type PermissionRow, type ResourceKey } from '@/hooks/usePermissions';
import type { Database } from '@/integrations/supabase/types';

type AccessLevel = Database['public']['Enums']['access_level'];

const accessLevelCards: { level: AccessLevel; icon: React.ElementType; labelKey: string; descKey: string }[] = [
  { level: 'level_4_master', icon: Crown, labelKey: 'master', descKey: 'masterDesc' },
  { level: 'level_3_manager', icon: Briefcase, labelKey: 'manager', descKey: 'managerDesc' },
  { level: 'level_2_operator', icon: Wrench, labelKey: 'operator', descKey: 'operatorDesc' },
  { level: 'level_1_minimum', icon: User, labelKey: 'minimum', descKey: 'minimumDesc' },
];

const RoleEditor = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existingRole, isLoading: roleLoading } = useRole(id || '');
  const { data: existingPermissions, isLoading: permsLoading } = useRolePermissions(id || '');
  const saveRole = useSaveRoleWithPermissions();

  const [name, setName] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('level_2_operator');
  const [permissions, setPermissions] = useState<PermissionRow[]>(() => getDefaultPermissions('level_2_operator'));

  // Load existing role data
  useEffect(() => {
    if (isEdit && existingRole) {
      setName(existingRole.name);
      setAccessLevel(existingRole.access_level);
    }
  }, [existingRole, isEdit]);

  useEffect(() => {
    if (isEdit && existingPermissions && existingPermissions.length > 0) {
      // Merge DB permissions with full resource list
      const permMap: Record<string, PermissionRow> = {};
      for (const p of existingPermissions) {
        permMap[p.resource] = {
          resource: p.resource as ResourceKey,
          can_read: p.can_read ?? false,
          can_write: p.can_write ?? false,
          can_delete: p.can_delete ?? false,
        };
      }
      setPermissions(
        ALL_RESOURCES.map((r) => permMap[r] || { resource: r, can_read: false, can_write: false, can_delete: false })
      );
    } else if (!isEdit) {
      setPermissions(getDefaultPermissions(accessLevel));
    }
  }, [existingPermissions, isEdit]);

  const handleAccessLevelChange = (level: AccessLevel) => {
    setAccessLevel(level);
    if (!isEdit) {
      setPermissions(getDefaultPermissions(level));
    }
  };

  const handleRestoreDefaults = () => {
    setPermissions(getDefaultPermissions(accessLevel));
  };

  const togglePermission = (resource: ResourceKey, field: 'can_read' | 'can_write' | 'can_delete') => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.resource !== resource) return p;
        const updated = { ...p, [field]: !p[field] };
        // If disabling read, also disable write/delete
        if (field === 'can_read' && !updated.can_read) {
          updated.can_write = false;
          updated.can_delete = false;
        }
        // If enabling write or delete, also enable read
        if ((field === 'can_write' || field === 'can_delete') && updated[field]) {
          updated.can_read = true;
        }
        return updated;
      })
    );
  };

  const toggleAll = (resource: ResourceKey) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.resource !== resource) return p;
        const allOn = p.can_read && p.can_write && p.can_delete;
        return { ...p, can_read: !allOn, can_write: !allOn, can_delete: !allOn };
      })
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('roles.nameRequired') || 'Role name is required');
      return;
    }

    saveRole.mutate(
      {
        role: {
          id: id || undefined,
          name: name.trim(),
          access_level: accessLevel,
        },
        permissions,
      },
      {
        onSuccess: () => {
          toast.success(isEdit ? t('roles.updateSuccess') : t('roles.createSuccess'));
          navigate('/roles');
        },
      }
    );
  };

  const isLoading = isEdit && (roleLoading || permsLoading);

  const resourceLabel = (r: ResourceKey): string => {
    return t(`roles.resources.${r}`) || r.replace(/_/g, ' ');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('roles.editRole') : t('roles.createRole')}
        breadcrumbs={[
          { label: t('nav.yourGym') },
          { label: t('roles.title'), href: '/roles' },
          { label: isEdit ? t('roles.editRole') : t('roles.createRole') },
        ]}
      />

      <div className="space-y-6 max-w-4xl">
        {/* Role Name */}
        <div className="space-y-2">
          <Label htmlFor="roleName">{t('roles.roleName')}</Label>
          <Input
            id="roleName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('roles.roleName')}
            className="max-w-md"
          />
        </div>

        {/* Access Level Cards */}
        <div className="space-y-2">
          <Label>{t('roles.accessLevel')}</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {accessLevelCards.map((card) => {
              const Icon = card.icon;
              const isSelected = accessLevel === card.level;
              return (
                <button
                  key={card.level}
                  onClick={() => handleAccessLevelChange(card.level)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-center',
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{t(`roles.levels.${card.labelKey}`)}</span>
                  <span className="text-xs text-muted-foreground">{t(`roles.accessLevelDescription.${card.descKey}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permission Matrix */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">{t('roles.permissionMatrix')}</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRestoreDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('roles.restoreDefaults')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">{t('roles.resource')}</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('roles.allPermissions')}</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('roles.read')}</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('roles.write')}</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('roles.deleteAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm) => {
                    const allOn = perm.can_read && perm.can_write && perm.can_delete;
                    return (
                      <tr key={perm.resource} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4 font-medium capitalize">{resourceLabel(perm.resource)}</td>
                        <td className="text-center py-3 px-4">
                          <Checkbox
                            checked={allOn}
                            onCheckedChange={() => toggleAll(perm.resource)}
                          />
                        </td>
                        <td className="text-center py-3 px-4">
                          <Checkbox
                            checked={perm.can_read}
                            onCheckedChange={() => togglePermission(perm.resource, 'can_read')}
                          />
                        </td>
                        <td className="text-center py-3 px-4">
                          <Checkbox
                            checked={perm.can_write}
                            onCheckedChange={() => togglePermission(perm.resource, 'can_write')}
                          />
                        </td>
                        <td className="text-center py-3 px-4">
                          <Checkbox
                            checked={perm.can_delete}
                            onCheckedChange={() => togglePermission(perm.resource, 'can_delete')}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => navigate('/roles')}>
            <X className="h-4 w-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveRole.isPending}
            className="bg-primary hover:bg-primary-hover"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveRole.isPending ? t('common.loading') : t('roles.saveRole')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleEditor;
