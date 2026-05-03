import { AlertCircle, RefreshCw } from "lucide-react";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Weather unavailable",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <section className="rounded-lg border border-rose-300/25 bg-rose-300/10 p-6 text-rose-50 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-rose-200/25 bg-rose-100/10">
            <AlertCircle aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-rose-100/80">{message}</p>
          </div>
        </div>
        {onRetry ? (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-rose-100/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-rose-100/60"
            type="button"
            onClick={onRetry}
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Retry
          </button>
        ) : null}
      </div>
    </section>
  );
}
