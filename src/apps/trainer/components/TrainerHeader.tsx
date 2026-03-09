import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TrainerHeader() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();

  const firstName = user?.user_metadata?.first_name ?? 'Trainer';
  const lastName = user?.user_metadata?.last_name ?? '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'T';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background shadow-sm px-4">
      <Link to="/trainer" className="text-lg font-bold tracking-tight text-primary">
        MOOM
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setLanguage(language === 'en' ? 'th' : 'en')} className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'ไทย' : 'English'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
