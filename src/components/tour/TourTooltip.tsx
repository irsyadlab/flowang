import type { TooltipRenderProps } from 'react-joyride';
import type { TourStepMeta } from '@/lib/tourSteps';

export function TourTooltip({
  step,
  index,
  size,
  isLastStep,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  const stepNumber = index + 1;
  const meta = step as TourStepMeta;
  const isFirst = index === 0;
  const announcementText = `Langkah ${stepNumber} dari ${size}: ${step.title}`;

  if (isFirst) {
    return (
      <div
        {...tooltipProps}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tour-title-${index}`}
        aria-describedby={`tour-content-${index}`}
        className="rounded-2xl bg-background border border-border/80 shadow-2xl overflow-hidden w-[min(90vw,420px)]"
      >
        <span aria-live="polite" aria-atomic="true" className="sr-only">
          {announcementText}
        </span>

        <div className="p-6 flex flex-col items-center text-center">
          {/* Skip button top-right */}
          <div className="w-full flex justify-end mb-2">
            <button
              {...skipProps}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[36px] px-2 flex items-center justify-center rounded-lg hover:bg-muted/50"
              aria-label="Lewati tour"
            >
              Lewati
            </button>
          </div>

          {/* Icon */}
          {meta.icon && (
            <span className="text-5xl mb-4 leading-none" aria-hidden="true">
              {meta.icon}
            </span>
          )}

          {/* Title */}
          <h2
            id={`tour-title-${index}`}
            className="text-xl font-bold text-foreground leading-snug mb-3"
          >
            {step.title as string}
          </h2>

          {/* Content */}
          {step.content && (
            <p
              id={`tour-content-${index}`}
              className="text-sm text-muted-foreground leading-relaxed max-w-[320px]"
            >
              {step.content as string}
            </p>
          )}

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-5">
            {Array.from({ length: size }).map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-4 h-1.5 bg-primary'
                    : 'w-1.5 h-1.5 bg-muted-foreground/25'
                }`}
              />
            ))}
          </div>

          {/* CTA button */}
          <button
            {...primaryProps}
            className="mt-4 w-full text-sm font-semibold bg-primary text-primary-foreground rounded-xl min-h-[44px] hover:bg-primary/90 active:scale-95 transition-all"
            aria-label="Lanjut ke langkah berikutnya"
          >
            Mulai Tour →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...tooltipProps}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`tour-title-${index}`}
      aria-describedby={`tour-content-${index}`}
      className="rounded-2xl bg-background border border-border/80 shadow-2xl overflow-hidden w-[min(90vw,320px)]"
    >
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {announcementText}
      </span>

      <div className="p-4">
        {/* Header: progress dots + skip */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: size }).map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-4 h-1.5 bg-primary'
                    : i < index
                    ? 'w-1.5 h-1.5 bg-primary/40'
                    : 'w-1.5 h-1.5 bg-muted-foreground/25'
                }`}
              />
            ))}
          </div>

          <button
            {...skipProps}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[36px] px-2 flex items-center justify-center rounded-lg hover:bg-muted/50"
            aria-label="Lewati tour"
          >
            Lewati
          </button>
        </div>

        {/* Icon + Title row */}
        <div className="flex items-start gap-3 mb-2">
          {meta.icon && (
            <span className="text-2xl leading-none shrink-0 mt-0.5" aria-hidden="true">
              {meta.icon}
            </span>
          )}
          <h2
            id={`tour-title-${index}`}
            className="text-base font-semibold text-foreground leading-snug"
          >
            {step.title as string}
          </h2>
        </div>

        {/* Content */}
        {step.content && (
          <p
            id={`tour-content-${index}`}
            className="text-sm text-muted-foreground leading-relaxed pl-9"
          >
            {step.content as string}
          </p>
        )}

        {/* Details list */}
        {meta.details && meta.details.length > 0 && (
          <ul className="mt-3 pl-9 flex flex-col gap-2" aria-label="Detail fitur">
            {meta.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-base leading-none shrink-0 mt-0.5" aria-hidden="true">
                  {detail.icon}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">{detail.label}</span>
                  {' — '}
                  {detail.description}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Step counter */}
        <p className="text-[11px] text-muted-foreground/50 mt-3 pl-9">
          {stepNumber} / {size}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex-1">
            {index > 0 && (
              <button
                {...backProps}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[40px] px-3 rounded-xl hover:bg-muted/50"
                aria-label="Kembali ke langkah sebelumnya"
              >
                ← Kembali
              </button>
            )}
          </div>
          <button
            {...primaryProps}
            className="text-sm font-semibold bg-primary text-primary-foreground rounded-xl px-4 min-h-[40px] hover:bg-primary/90 active:scale-95 transition-all"
            aria-label={isLastStep ? 'Selesai dan tutup tour' : 'Lanjut ke langkah berikutnya'}
          >
            {isLastStep ? '🎉 Selesai' : 'Lanjut →'}
          </button>
        </div>
      </div>
    </div>
  );
}
