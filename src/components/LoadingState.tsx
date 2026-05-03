import { CloudSun } from "lucide-react";

type LoadingStateProps = {
  title?: string;
  compact?: boolean;
};

export function LoadingState({
  title = "Loading weather",
  compact = false,
}: LoadingStateProps) {
  if (compact) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/55 p-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-white/15" />
        <div className="mt-3 h-7 w-16 animate-pulse rounded-full bg-white/10" />
      </div>
    );
  }

  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-lg border border-zinc-800/90 bg-zinc-950/70 p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-sky-200/25 bg-sky-200/10 text-sky-100">
          <CloudSun aria-hidden="true" className="h-7 w-7 animate-pulse" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-zinc-400">Pulling the latest forecast from Open-Meteo.</p>
      </div>
    </section>
  );
}
