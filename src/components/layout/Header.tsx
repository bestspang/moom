import React from 'react';
import { Phone, Bell, ChevronDown, Menu, LogOut, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle: () => void;
  unreadNotifications?: number;
}

export const Header = ({ onMenuToggle, unreadNotifications = 0 }: HeaderProps) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
      {/* Left side - Logo and menu */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-lg hidden sm:block">MOOM CLUB</span>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Support button */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Phone className="h-4 w-4" />
          <span>{t('common.support')}: 099-616-3666</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {t('notifications.title')} ({unreadNotifications})
                </span>
                <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                  {t('common.viewAll')}
                </Button>
              </div>
            </div>
            <div className="p-4 text-center text-muted-foreground text-sm">
              {t('notifications.noUnread')}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              {language.toUpperCase()}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setLanguage('en')}
              className={cn(language === 'en' && 'bg-accent')}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLanguage('th')}
              className={cn(language === 'th' && 'bg-accent')}
            >
              ไทย
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  KS
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    KS
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">Admin User</p>
                </div>
              </div>
            </div>
            <DropdownMenuItem className="text-primary cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              {t('profile.editProfile')}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-primary cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              {t('profile.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
