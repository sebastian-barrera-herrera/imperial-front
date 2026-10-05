import { Check } from 'lucide-react';
import { CASE_STAGE_LABELS, STAGE_ORDER, type CaseStage } from '@/lib/types';
import { cn } from './ui';

/** Barra de progreso por etapas del caso (horizontal en pantallas amplias, vertical en móvil). */
export function StageStepper({ stage }: { stage: CaseStage }) {
  const current = STAGE_ORDER.indexOf(stage);
  return (
    <ol className="grid gap-3 sm:grid-cols-7 sm:gap-2" aria-label="Etapas del caso">
      {STAGE_ORDER.map((s, i) => {
        const done = i < current || stage === 'CLOSED';
        const active = i === current && stage !== 'CLOSED';
        return (
          <li key={s} aria-current={active ? 'step' : undefined} className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
              done ? 'border-[#16a34a] bg-[#16a34a] text-white' : active ? 'border-accent-strong bg-accent-strong text-white' : 'border-slate-300 bg-surface text-slate-500')}>
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn('text-xs', active ? 'font-semibold text-navy-900' : done ? 'text-slate-700' : 'text-slate-500')}>{CASE_STAGE_LABELS[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}
