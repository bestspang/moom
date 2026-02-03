import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name.charAt(0)}${user.user_metadata.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleSave = () => {
    toast({
      title: t('common.success'),
      description: t('profile.profileUpdated'),
    });
  };

  return (
    <div>
      <PageHeader 
        title={t('profile.title')} 
        breadcrumbs={[{ label: t('profile.title') }]} 
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.accountInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <Input 
                  id="firstName" 
                  defaultValue={user?.user_metadata?.first_name || ''} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <Input 
                  id="lastName" 
                  defaultValue={user?.user_metadata?.last_name || ''} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input 
                id="email" 
                type="email" 
                defaultValue={user?.email || ''} 
                disabled 
              />
              <p className="text-xs text-muted-foreground">{t('profile.emailCannotChange')}</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave}>{t('common.save')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
