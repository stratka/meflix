import { Film } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  message?: string;
}

export function EmptyState({ title, message }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Film className="w-10 h-10 text-gray-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">{title ?? t('empty.title')}</h3>
      <p className="text-gray-500 max-w-sm">{message ?? t('empty.message')}</p>
    </div>
  );
}
