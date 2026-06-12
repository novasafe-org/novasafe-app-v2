import { useMemo, useState } from "react";
import {
  Activity,
  LogIn,
  Shield,
  Files,
  CreditCard,
  Globe,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import type { loadAuditCenterAction } from "@/lib/account/server-actions";
import type { AuditEvent, AuditSeverity } from "@/lib/account/audit";
import { HeroScoreRing } from "@/components/account/security/security-ui";
import {
  computeAuditStats,
  filterAuditEvents,
  groupEventsByDate,
  uniqueDevices,
  uniqueLocations,
  computeLoginAnalytics,
  computeVaultMetrics,
  computeSecurityEvents,
  computeAccountInsights,
  detectAnomalies,
  exportAuditCsv,
  exportAuditJson,
  exportAuditReport,
  type AuditFilterCategory,
  type DateRangePreset,
} from "./audit-helpers";
import {
  SectionCard,
  AuditMetricCard,
  AuditFilterBar,
  AuditTimelineGroup,
  EventDetailsDrawer,
  LoginStatTile,
  InsightCard,
  AnomalyCard,
  ExportPanel,
  VaultMetricRow,
  AuditEventCard,
} from "./audit-ui";

type AuditData = Awaited<ReturnType<typeof loadAuditCenterAction>>;

const FILTER_CATEGORIES: AuditFilterCategory[] = [
  "all",
  "login",
  "vault",
  "devices",
  "security",
  "recovery",
  "billing",
  "subscription",
];

export function AuditCenter({ data }: { data: AuditData }) {
  const [category, setCategory] = useState<AuditFilterCategory>("all");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<AuditSeverity | "all">("all");
  const [device, setDevice] = useState("all");
  const [location, setLocation] = useState("all");
  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [exportRange, setExportRange] = useState<DateRangePreset>("7d");
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const stats = useMemo(() => computeAuditStats(data.events), [data.events]);
  const devices = useMemo(() => uniqueDevices(data.events), [data.events]);
  const locations = useMemo(() => uniqueLocations(data.events), [data.events]);

  const filtered = useMemo(
    () =>
      filterAuditEvents(data.events, {
        category,
        search,
        severity,
        device,
        location,
        dateRange,
      }),
    [data.events, category, search, severity, device, location, dateRange],
  );

  const exportEvents = useMemo(
    () =>
      filterAuditEvents(data.events, {
        category: "all",
        search: "",
        severity: "all",
        device: "all",
        location: "all",
        dateRange: exportRange,
      }),
    [data.events, exportRange],
  );

  const timeline = useMemo(() => groupEventsByDate(filtered), [filtered]);
  const loginAnalytics = useMemo(() => computeLoginAnalytics(data.events), [data.events]);
  const vaultMetrics = useMemo(() => computeVaultMetrics(data.events), [data.events]);
  const securityEvents = useMemo(() => computeSecurityEvents(data.events).slice(0, 8), [data.events]);
  const insights = useMemo(() => computeAccountInsights(data.events), [data.events]);
  const anomalies = useMemo(() => detectAnomalies(filtered), [filtered]);

  function openEvent(event: AuditEvent) {
    setSelected(event);
    setDrawerOpen(true);
  }

  function handleExportCsv() {
    if (exportEvents.length === 0) {
      toast.info("No events to export for the selected range.");
      return;
    }
    exportAuditCsv(exportEvents);
    toast.success(`Exported ${exportEvents.length} events as CSV.`);
  }

  function handleExportJson() {
    if (exportEvents.length === 0) {
      toast.info("No events to export for the selected range.");
      return;
    }
    exportAuditJson(exportEvents);
    toast.success(`Exported ${exportEvents.length} events as JSON.`);
  }

  function handleExportPdf() {
    if (exportEvents.length === 0) {
      toast.info("No events to export for the selected range.");
      return;
    }
    exportAuditReport(exportEvents);
    toast.success("Audit report opened for printing / PDF save.");
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface shadow-float">
        <div className="absolute inset-0 brand-gradient-soft opacity-50 pointer-events-none" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              Audit Center
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink mt-1">
              Security Activity
            </h1>
            <p className="text-sm text-ink-muted mt-2 max-w-2xl">
              Complete visibility into logins, vault changes, security events, and billing activity
              across your NovaSafe account.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <HeroScoreRing score={loginAnalytics.successRate} size={88} />
            <div>
              <p className="text-xs text-ink-faint uppercase tracking-wide">Login success</p>
              <p className="text-xl font-semibold text-ink">{loginAnalytics.successRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Activity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <AuditMetricCard
          icon={<Activity className="size-5" />}
          label="Events Today"
          value={stats.today}
          description="Total audit events recorded today"
          trend={stats.trends.today}
        />
        <AuditMetricCard
          icon={<LogIn className="size-5" />}
          label="Login Events"
          value={stats.login}
          description="Authentication and session activity"
          trend={stats.trends.login}
        />
        <AuditMetricCard
          icon={<Shield className="size-5" />}
          label="Security Events"
          value={stats.security}
          description="2FA, recovery, and account security"
          trend={stats.trends.security}
        />
        <AuditMetricCard
          icon={<Files className="size-5" />}
          label="Vault Changes"
          value={stats.vault}
          description="Password and vault item updates"
          trend={stats.trends.vault}
        />
        <AuditMetricCard
          icon={<CreditCard className="size-5" />}
          label="Billing Events"
          value={stats.billing}
          description="Subscription and payment activity"
          trend={stats.trends.billing}
        />
      </div>

      {/* SECTION 2: Smart Filter Bar */}
      <AuditFilterBar
        categories={FILTER_CATEGORIES}
        activeCategory={category}
        onCategoryChange={setCategory}
        search={search}
        onSearchChange={setSearch}
        severity={severity}
        onSeverityChange={setSeverity}
        device={device}
        onDeviceChange={setDevice}
        location={location}
        onLocationChange={setLocation}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        devices={devices}
        locations={locations}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* SECTION 3: Audit Timeline */}
        <SectionCard
          title="Audit timeline"
          description={`${filtered.length} event${filtered.length === 1 ? "" : "s"} matching filters`}
          className="xl:col-span-2"
        >
          {timeline.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">
              No events match your current filters.
            </p>
          ) : (
            <div className="space-y-6 max-h-[720px] overflow-y-auto pr-1">
              {timeline.map((group) => (
                <AuditTimelineGroup
                  key={group.label}
                  label={group.label}
                  events={group.events}
                  onEventClick={openEvent}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          {/* SECTION 11: Anomaly Detection */}
          <SectionCard title="Anomaly detection" description="AI-ready risk monitoring">
            <div className="space-y-2">
              {anomalies.map((item) => (
                <AnomalyCard
                  key={item.id}
                  item={item}
                  onClick={
                    item.eventId
                      ? () => {
                          const ev = data.events.find((e) => e.id === item.eventId);
                          if (ev) openEvent(ev);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </SectionCard>

          {/* SECTION 9: Account Insights */}
          <SectionCard title="Account insights" description="Patterns across your activity">
            <div className="grid grid-cols-1 gap-2">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* SECTION 6: Login Monitoring */}
      <SectionCard title="Login monitoring" description="Authentication analytics and access patterns">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <LoginStatTile label="Successful logins" value={loginAnalytics.successful} accent="success" />
          <LoginStatTile label="Failed logins" value={loginAnalytics.failed} accent={loginAnalytics.failed > 0 ? "danger" : undefined} />
          <LoginStatTile label="New devices" value={loginAnalytics.newDevices} accent={loginAnalytics.newDevices > 0 ? "warning" : undefined} />
          <LoginStatTile label="New locations" value={loginAnalytics.newLocations} accent={loginAnalytics.newLocations > 0 ? "warning" : undefined} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-hairline bg-surface-elev/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-3">
              Login success rate
            </p>
            <div className="flex items-center gap-4">
              <HeroScoreRing score={loginAnalytics.successRate} size={72} />
              <p className="text-sm text-ink-muted">
                {loginAnalytics.successful} successful of{" "}
                {loginAnalytics.successful + loginAnalytics.failed} attempts
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-surface-elev/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-3 flex items-center gap-1.5">
              <Globe className="size-3.5" />
              Recent login countries
            </p>
            {loginAnalytics.countries.length === 0 ? (
              <p className="text-xs text-ink-muted">No location data</p>
            ) : (
              <ul className="space-y-2">
                {loginAnalytics.countries.map((c) => (
                  <li key={c.country} className="flex justify-between text-sm">
                    <span className="text-ink">{c.country}</span>
                    <span className="text-ink-muted tabular-nums">{c.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-hairline bg-surface-elev/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-3 flex items-center gap-1.5">
              <Monitor className="size-3.5" />
              Most used devices
            </p>
            {loginAnalytics.topDevices.length === 0 ? (
              <p className="text-xs text-ink-muted">No device data</p>
            ) : (
              <ul className="space-y-2">
                {loginAnalytics.topDevices.map((d) => (
                  <li key={d.device} className="flex justify-between text-sm gap-2">
                    <span className="text-ink truncate">{d.device}</span>
                    <span className="text-ink-muted tabular-nums shrink-0">{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SECTION 7: Security Events */}
        <SectionCard title="Security events" description="Account protection activity">
          {securityEvents.length === 0 ? (
            <p className="text-sm text-ink-muted">No security events recorded.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {securityEvents.map((event) => (
                <AuditEventCard key={event.id} event={event} onClick={() => openEvent(event)} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* SECTION 8: Vault Events */}
        <SectionCard title="Vault activity" description="Credential and export metrics">
          <div className="mb-4">
            <VaultMetricRow label="Passwords updated" count={vaultMetrics.passwordsUpdated} />
            <VaultMetricRow label="Passwords added" count={vaultMetrics.passwordsAdded} />
            <VaultMetricRow label="Passwords deleted" count={vaultMetrics.passwordsDeleted} />
            <VaultMetricRow label="Notes created" count={vaultMetrics.notesCreated} />
            <VaultMetricRow label="Notes updated" count={vaultMetrics.notesUpdated} />
            <VaultMetricRow label="Exports generated" count={vaultMetrics.exportsGenerated} />
          </div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {data.events
              .filter((e) => e.category === "vault" || e.category === "recovery")
              .slice(0, 5)
              .map((event) => (
                <AuditEventCard key={event.id} event={event} onClick={() => openEvent(event)} />
              ))}
          </div>
        </SectionCard>
      </div>

      {/* SECTION 10: Export & Compliance */}
      <SectionCard title="Export & compliance" description="Download audit logs for security reviews">
        <ExportPanel
          dateRange={exportRange}
          onDateRangeChange={setExportRange}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
          onExportPdf={handleExportPdf}
          eventCount={exportEvents.length}
        />
      </SectionCard>

      {/* SECTION 5: Event Details Drawer */}
      <EventDetailsDrawer event={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
