import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AppSettings } from '../../types/app';
import { RegionStep } from './RegionStep';
import { ServicesStep } from './ServicesStep';

interface Props {
  onComplete: (settings: AppSettings) => void;
  initial?: Partial<AppSettings>;
}

type Step = 'welcome' | 'region' | 'services' | 'done';
const PROGRESS_STEPS: Step[] = ['region', 'services'];

export function SetupScreen({ onComplete, initial }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('welcome');
  const [draft, setDraft] = useState<Partial<AppSettings>>({
    region: 'CZ',
    selectedServices: [],
    ...initial,
  });

  const progressIndex = PROGRESS_STEPS.indexOf(step as any);

  function handleRegion(region: string) {
    setDraft(d => ({ ...d, region }));
    setStep('services');
  }

  function handleServices(selectedServices: string[]) {
    setDraft(d => ({ ...d, selectedServices }));
    setStep('done');
  }

  function handleDone() {
    onComplete({ region: draft.region!, selectedServices: draft.selectedServices! });
  }

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <img src="/logo_mimoovie.png" alt="Mimoovie" className="h-16 w-auto mb-10" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {t('onboarding.welcomeTitle')}
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-sm">
            {t('onboarding.welcomeSubtitle')}
          </p>
          <button
            onClick={() => setStep('region')}
            className="w-full max-w-xs py-3.5 bg-red-600 hover:bg-red-700 text-white text-base font-semibold rounded-xl transition-colors shadow-lg"
          >
            {t('onboarding.getStarted')}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mb-8" strokeWidth={1.5} />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {t('onboarding.doneTitle')}
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-sm">
            {t('onboarding.doneSubtitle')}
          </p>
          <button
            onClick={handleDone}
            className="w-full max-w-xs py-3.5 bg-red-600 hover:bg-red-700 text-white text-base font-semibold rounded-xl transition-colors shadow-lg"
          >
            {t('onboarding.startBrowsing')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
      {/* Logo */}
      <div className="mb-8">
        <img src="/logo_mimoovie.png" alt="Mimoovie" className="h-12 w-auto" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {PROGRESS_STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < progressIndex
                  ? 'bg-red-600 text-white'
                  : i === progressIndex
                  ? 'bg-red-600 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-gray-950'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {i < progressIndex ? '✓' : i + 1}
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <div className={`w-12 h-0.5 ${i < progressIndex ? 'bg-red-600' : 'bg-gray-800'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
        {step === 'region' && (
          <RegionStep onNext={handleRegion} initial={draft.region} />
        )}
        {step === 'services' && (
          <ServicesStep
            onNext={handleServices}
            onBack={() => setStep('region')}
            initial={draft.selectedServices}
            region={draft.region!}
          />
        )}
      </div>
    </div>
  );
}
