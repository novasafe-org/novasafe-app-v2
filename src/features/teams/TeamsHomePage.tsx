/** Parked Teams product surface — loaded only when the teams flag is enabled. */
export function TeamsHomePage() {
  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-ink-muted">Teams</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Team workspaces</h1>
        <p className="mt-3 text-ink-muted">
          Shared vaults and team administration will appear here when the Teams product launches.
        </p>
      </div>
    </div>
  );
}
