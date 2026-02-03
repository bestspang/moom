import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-primary">404</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold">{t('errors.pageNotFound')}</h1>
        <p className="mb-6 text-muted-foreground">{t('errors.pageNotFoundDescription')}</p>
        <Link to="/">
          <Button>
            <Home className="mr-2 h-4 w-4" />
            {t('errors.returnHome')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
