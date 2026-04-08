import { useTranslation } from 'react-i18next';
import { th, enUS } from 'date-fns/locale';

export function useDateLocale() {
  const { i18n } = useTranslation();
  return i18n.language === 'th' ? th : enUS;
}
