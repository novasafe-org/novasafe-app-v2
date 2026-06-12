import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import type { loadRecoveryAction } from "@/lib/account/server-actions";
import { createExportAction } from "@/lib/account/server-actions";
import {
  downloadRecoveryKit,
  formatRecoveryDate,
  generateLocalRecoveryKit,
} from "@/components/account/recovery/recovery-helpers";
import {
  SettingsPage,
  SettingsCard,
  SettingsRow,
  SettingsButton,
  StatusBadge,
} from "./settings-ui";

type RecoveryData = Awaited<ReturnType<typeof loadRecoveryAction>>;

const GUIDES = [
  {
    title: "Lost device",
    body: "Sign out of the lost device from the Devices page, then change your master password if you're worried someone else could access it.",
  },
  {
    title: "Forgot password",
    body: "Use your recovery kit to regain access. If you don't have one, contact NovaSafe support with your verified email.",
  },
  {
    title: "Account recovery",
    body: "Keep your recovery kit offline and up to date. Generate a new kit after major account changes.",
  },
] as const;

export function RecoverySettings({ data }: { data: RecoveryData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [localKit, setLocalKit] = useState<string | null>(null);

  const hasKit = data.history.length > 0 || Boolean(localKit);
  const latest = data.history[0];

  async function handleGenerate() {
    setBusy(true);
    try {
      await createExportAction();
      setLocalKit(generateLocalRecoveryKit());
      toast.success("Recovery kit created. Download and store it offline.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate recovery kit.");
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (localKit) {
      downloadRecoveryKit(localKit);
      toast.success("Recovery kit downloaded.");
      return;
    }
    if (data.history.length > 0) {
      toast.info("Generate a new kit to download a fresh recovery code.");
      return;
    }
    toast.info("Generate a recovery kit first.");
  }

  return (
    <SettingsPage
      title="Recovery"
      description="Get back into your account if something goes wrong."
    >
      <SettingsCard>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-medium text-ink">Recovery kit</p>
            <p className="text-xs text-ink-muted mt-0.5">
              {hasKit
                ? `Last updated ${formatRecoveryDate(latest?.createdAt)}`
                : "You haven't created a recovery kit yet."}
            </p>
          </div>
          <StatusBadge variant={hasKit ? "success" : "warning"}>
            {hasKit ? "Ready" : "Not set up"}
          </StatusBadge>
        </div>

        {localKit && (
          <pre className="mono text-xs bg-muted/60 p-3 rounded-lg whitespace-pre-wrap break-all mb-4">
            {localKit}
          </pre>
        )}

        <p className="text-xs text-ink-muted mb-4">
          Store your recovery kit offline. Don't share it with anyone.
        </p>

        <div className="flex flex-wrap gap-2">
          <SettingsButton disabled={busy} variant="primary" onClick={() => void handleGenerate()}>
            Generate recovery kit
          </SettingsButton>
          <SettingsButton disabled={!hasKit && !localKit} onClick={handleDownload}>
            Download
          </SettingsButton>
        </div>
      </SettingsCard>

      <SettingsCard title="Recovery guide">
        <div className="space-y-4">
          {GUIDES.map((guide) => (
            <div key={guide.title}>
              <p className="text-sm font-medium text-ink">{guide.title}</p>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">{guide.body}</p>
            </div>
          ))}
        </div>
      </SettingsCard>
    </SettingsPage>
  );
}
