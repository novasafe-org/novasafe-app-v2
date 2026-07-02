/** Parked Enterprise product surface — loaded only when the enterprise flag is enabled. */
export function EnterpriseHomePage() {
  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-ink-muted">Enterprise</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Enterprise console</h1>
        <p className="mt-3 text-ink-muted">
          Organization policies, SCIM, and enterprise controls will appear here at launch.
        </p>
      </div>
    </div>
  );
}
