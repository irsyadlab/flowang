import type { TooltipRenderProps } from 'react-joyride';
import { TOUR_STEPS, type TourStepMeta } from '@/lib/tourSteps';

/** Build per-page dot data for the current step */
function usePageDots(currentIndex: number) {
  const currentPage = (TOUR_STEPS[currentIndex] as TourStepMeta).page;

  // All step indices that belong to the same page
  const pageIndices = TOUR_STEPS.reduce<number[]>((acc, step, i) => {
    if ((step as TourStepMeta).page === currentPage) acc.push(i);
    return acc;
  }, []);

  const positionInPage = pageIndices.indexOf(currentIndex);

  return { pageIndices, positionInPage, pageSize: pageIndices.length };
}

function PageDots({
  positionInPage,
  pageSize,
}: {
  positionInPage: number;
  pageSize: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: pageSize }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === positionInPage
              ? 'w-4 h-1.5 bg-primary'
              : i < positionInPage
              ? 'w-1.5 h-1.5 bg-primary/40'
              : 'w-1.5 h-1.5 bg-muted-foreground/25'
          }`}
        />
      ))}
    </div>
  );
}

export function TourTooltip({
  step,
  index,
  isLastStep,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  const meta = step as TourStepMeta;
  const isFirst = index === 0;
  const announcementText = `${step.title}`;

  const { positionInPage, pageSize } = usePageDots(index);

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

          {/* Page dots */}
          <div className="mt-5">
            <PageDots positionInPage={positionInPage} pageSize={pageSize} />
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
        {/* Header: page dots + skip */}
        <div className="flex items-center justify-between mb-3">
          <PageDots positionInPage={positionInPage} pageSize={pageSize} />
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

        {/* Page label */}
        <p className="text-[11px] text-muted-foreground/50 mt-3 pl-9 capitalize">
          {meta.page} · {positionInPage + 1}/{pageSize}
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
