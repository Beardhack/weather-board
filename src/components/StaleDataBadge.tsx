import { AlertTriangle, RefreshCw } from "lucide-react";

type StaleDataBadgeProps = {
  isRefreshing?: boolean;
  message?: string | null;
};

export function StaleDataBadge({ isRefreshing = false, message }: StaleDataBadgeProps) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-amber-300/35 bg-amber-300/12 px-3 py-1.5 text-xs font-medium text-amber-100 shadow-sm">
      {isRefreshing ? (
        <RefreshCw aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      <span className="truncate">
        {isRefreshing ? "Refreshing cached weather" : message ?? "Showing cached weather"}
      </span>
    </div>
  );
}
