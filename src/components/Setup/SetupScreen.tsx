import { useState } from 'react';
import type { AppSettings } from '../../types/app';
import { RegionStep } from './RegionStep';
import { ServicesStep } from './ServicesStep';

interface Props {
  onComplete: (settings: AppSettings) => void;
  initial?: Partial<AppSettings>;
}

type Step = 'region' | 'services';
const STEPS: Step[] = ['region', 'services'];

export function SetupScreen({ onComplete, initial }: Props) {
  const [step, setStep] = useState<Step>('region');
  const [draft, setDraft] = useState<Partial<AppSettings>>({
    region: 'CZ',
    selectedServices: [],
    ...initial,
  });

  const stepIndex = STEPS.indexOf(step);

  function handleRegion(region: string) {
    setDraft(d => ({ ...d, region }));
    setStep('services');
  }

  function handleServices(selectedServices: string[]) {
    onComplete({ region: draft.region!, selectedServices });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
      {/* Logo */}
      <div className="mb-8">
        <img src="/logo_mimoovie.png" alt="Mimoovie" className="h-12 w-auto" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < stepIndex
                  ? 'bg-red-600 text-white'
                  : i === stepIndex
                  ? 'bg-red-600 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-gray-950'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {i < stepIndex ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 ${i < stepIndex ? 'bg-red-600' : 'bg-gray-800'}`} />
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
