import type { ReactNode } from "react";
import {
  LogIn,
  Shield,
  Files,
  CreditCard,
  Smartphone,
  KeyRound,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Download,
} from "lucide-react";
import type { AuditEvent, AuditCategory, AuditSeverity } from "@/lib/account/audit";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/account/profile/profile-ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  formatEventDateTime,
  formatEventTime,
  type AccountInsight,
  type AnomalyItem,
  type AuditFilterCategory,
  type DateRangePreset,
} from "./audit-helpers";

export { SectionCard };

const severityStyles: Record<AuditSeverity, string> = {
  info: "bg-brand/12 text-brand border-brand/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  critical: "bg-destructive/12 text-destructive border-destructive/25",
};

const severityLabels: Record<AuditSeverity, string> = {
  info: "INFO",
  warning: "WARNING",
  critical: "CRITICAL",
};

const categoryIcons: Record<AuditCategory, typeof LogIn> = {
  login: LogIn,
  vault: Files,
  devices: Smartphone,
  security: Shield,
  recovery: KeyRound,
  billing: CreditCard,
  subscription: CreditCard,
  api: Shield,
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: AuditSeverity;
  className?: string;
}) {
  const Icon =
    severity === "critical" ? AlertTriangle : severity === "warning" ? AlertTriangle : Info;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        severityStyles[severity],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {severityLabels[severity]}
    </span>
  );
}

export function TrendIndicator({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-ink-muted">
        <Minus className="size-3" /> 0%
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        up ? "text-success" : "text-destructive",
      )}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

export function AuditMetricCard({
  icon,
  label,
  value,
  description,
  trend,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
  trend: number;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/80 p-4 flex flex-col gap-3 min-h-[120px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {label}
        </span>
        <span className="text-ink-muted">{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</span>
        <TrendIndicator value={trend} />
      </div>
      <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
    </div>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-lg text-xs font-medium transition whitespace-nowrap",
        active
          ? "bg-brand text-brand-foreground shadow-sm"
          : "hairline text-ink-muted hover:bg-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function AuditFilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  severity,
  onSeverityChange,
  device,
  onDeviceChange,
  location,
  onLocationChange,
  dateRange,
  onDateRangeChange,
  devices,
  locations,
}: {
  categories: AuditFilterCategory[];
  activeCategory: AuditFilterCategory;
  onCategoryChange: (c: AuditFilterCategory) => void;
  search: string;
  onSearchChange: (v: string) => void;
  severity: AuditSeverity | "all";
  onSeverityChange: (v: AuditSeverity | "all") => void;
  device: string;
  onDeviceChange: (v: string) => void;
  location: string;
  onLocationChange: (v: string) => void;
  dateRange: DateRangePreset;
  onDateRangeChange: (v: DateRangePreset) => void;
  devices: string[];
  locations: string[];
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <FilterChip
            key={cat}
            active={activeCategory === cat}
            onClick={() => onCategoryChange(cat)}
          >
            {cat === "all"
              ? "All Events"
              : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="relative md:col-span-2 xl:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events…"
            className="w-full h-9 pl-9 pr-3 rounded-lg hairline bg-surface text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/30"
            aria-label="Search events"
          />
        </div>

        <select
          value={severity}
          onChange={(e) => onSeverityChange(e.target.value as AuditSeverity | "all")}
          className="h-9 px-3 rounded-lg hairline bg-surface text-sm"
          aria-label="Severity filter"
        >
          <option value="all">All severities</option>
          <option value="info">Information</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={device}
          onChange={(e) => onDeviceChange(e.target.value)}
          className="h-9 px-3 rounded-lg hairline bg-surface text-sm"
          aria-label="Device filter"
        >
          <option value="all">All devices</option>
          {devices.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="h-9 px-3 rounded-lg hairline bg-surface text-sm"
          aria-label="Location filter"
        >
          <option value="all">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All time"],
            ["24h", "Last 24 hours"],
            ["7d", "Last 7 days"],
            ["30d", "Last 30 days"],
          ] as const
        ).map(([value, label]) => (
          <FilterChip
            key={value}
            active={dateRange === value}
            onClick={() => onDateRangeChange(value)}
          >
            {label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

export function AuditEventCard({
  event,
  onClick,
}: {
  event: AuditEvent;
  onClick: () => void;
}) {
  const Icon = categoryIcons[event.category] || Shield;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-hairline bg-surface-elev/50 p-4 hover:border-brand/30 hover:bg-surface-elev transition"
    >
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-lg brand-gradient-soft grid place-items-center text-brand shrink-0">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink">{event.title}</span>
            <SeverityBadge severity={event.severity} />
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">{event.description}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-ink-faint">
            {event.deviceName && (
              <span>
                {event.browser && event.os
                  ? `${event.browser} on ${event.os}`
                  : event.deviceName}
              </span>
            )}
            {event.location && event.location !== "—" && <span>{event.location}</span>}
            <span className="capitalize">{event.category}</span>
            <time className="text-ink-muted">{formatEventTime(event.at)}</time>
          </div>
        </div>
      </div>
    </button>
  );
}

export function AuditTimelineGroup({
  label,
  events,
  onEventClick,
}: {
  label: string;
  events: AuditEvent[];
  onEventClick: (e: AuditEvent) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-3 sticky top-0 bg-background/80 backdrop-blur py-1 z-10">
        {label}
      </h3>
      <div className="space-y-2 pl-2 border-l-2 border-hairline ml-1">
        {events.map((event) => (
          <AuditEventCard key={event.id} event={event} onClick={() => onEventClick(event)} />
        ))}
      </div>
    </div>
  );
}

export function EventDetailsDrawer({
  event,
  open,
  onOpenChange,
}: {
  event: AuditEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!event) return null;

  const riskClass =
    event.riskLevel === "high"
      ? "text-destructive"
      : event.riskLevel === "medium"
        ? "text-warning"
        : "text-success";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-surface border-hairline">
        <SheetHeader className="text-left pb-4 border-b border-hairline">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SeverityBadge severity={event.severity} />
            <span className="text-[10px] uppercase tracking-wide text-ink-faint font-medium capitalize">
              {event.category}
            </span>
          </div>
          <SheetTitle className="text-ink pt-2">{event.title}</SheetTitle>
          <SheetDescription className="text-ink-muted">{event.description}</SheetDescription>
        </SheetHeader>

        <dl className="py-5 space-y-0 text-sm">
          {[
            { label: "Event ID", value: event.id, mono: true },
            { label: "Timestamp", value: formatEventDateTime(event.at) },
            { label: "IP address", value: event.ipAddress || "—", mono: true },
            { label: "Country", value: event.country || "—" },
            { label: "City", value: event.city || "—" },
            { label: "Browser", value: event.browser || "—" },
            { label: "Operating system", value: event.os || "—" },
            { label: "Device name", value: event.deviceName || "—" },
            { label: "User agent", value: event.userAgent || "—", mono: true, wrap: true },
            {
              label: "Risk level",
              value: event.riskLevel.charAt(0).toUpperCase() + event.riskLevel.slice(1),
              valueClass: riskClass,
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 py-2.5 border-b border-hairline last:border-0"
            >
              <dt className="text-xs text-ink-muted shrink-0">{row.label}</dt>
              <dd
                className={cn(
                  "font-medium text-ink text-xs sm:text-right sm:max-w-[60%]",
                  row.mono && "font-mono text-[11px]",
                  row.wrap && "break-all",
                  row.valueClass,
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {event.relatedActions && event.relatedActions.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-2">
              Related actions
            </p>
            <ul className="space-y-1">
              {event.relatedActions.map((action) => (
                <li key={action} className="text-xs text-ink-muted flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-brand" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function LoginStatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "success" | "warning" | "danger";
}) {
  const accentClass =
    accent === "success"
      ? "text-success"
      : accent === "warning"
        ? "text-warning"
        : accent === "danger"
          ? "text-destructive"
          : "text-ink";

  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/50 p-4 text-center">
      <div className={cn("text-2xl font-semibold tabular-nums", accentClass)}>{value}</div>
      <div className="text-xs text-ink-muted mt-1">{label}</div>
    </div>
  );
}

export function InsightCard({ insight }: { insight: AccountInsight }) {
  const toneClass =
    insight.tone === "success"
      ? "border-success/20 bg-success/5"
      : insight.tone === "warning"
        ? "border-warning/20 bg-warning/5"
        : "border-hairline bg-surface-elev/40";

  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        {insight.label}
      </p>
      <p className="text-sm font-semibold text-ink mt-1 truncate">{insight.value}</p>
      {insight.hint && <p className="text-xs text-ink-muted mt-1 truncate">{insight.hint}</p>}
    </div>
  );
}

export function AnomalyCard({
  item,
  onClick,
}: {
  item: AnomalyItem;
  onClick?: () => void;
}) {
  const isClear = item.id === "anomaly-clear";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isClear || !item.eventId}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition",
        isClear
          ? "border-success/20 bg-success/5 cursor-default"
          : "border-hairline bg-surface-elev/40 hover:border-brand/30 disabled:cursor-default",
      )}
    >
      <div className="flex items-start gap-2">
        {!isClear && <SeverityBadge severity={item.severity} />}
        {isClear && <Shield className="size-4 text-success shrink-0 mt-0.5" />}
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{item.title}</p>
          <p className="text-xs text-ink-muted mt-0.5">{item.description}</p>
        </div>
      </div>
    </button>
  );
}

export function ExportPanel({
  dateRange,
  onDateRangeChange,
  onExportCsv,
  onExportJson,
  onExportPdf,
  eventCount,
}: {
  dateRange: DateRangePreset;
  onDateRangeChange: (v: DateRangePreset) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onExportPdf: () => void;
  eventCount: number;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/40 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Download className="size-4 text-ink-muted" />
        <p className="text-sm font-semibold text-ink">Export audit log</p>
      </div>
      <p className="text-xs text-ink-muted mb-4">
        Download {eventCount} event{eventCount === 1 ? "" : "s"} for compliance and security reviews.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["24h", "Last 24 hours"],
            ["7d", "Last 7 days"],
            ["30d", "Last 30 days"],
            ["all", "All events"],
          ] as const
        ).map(([value, label]) => (
          <FilterChip
            key={value}
            active={dateRange === value}
            onClick={() => onDateRangeChange(value)}
          >
            {label}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExportCsv}
          className="h-9 px-4 rounded-lg hairline text-sm font-medium hover:bg-muted transition"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={onExportJson}
          className="h-9 px-4 rounded-lg hairline text-sm font-medium hover:bg-muted transition"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-medium hover:opacity-95 transition"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}

export function VaultMetricRow({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-hairline last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-semibold text-ink tabular-nums">{count}</span>
    </div>
  );
}
