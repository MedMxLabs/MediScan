import { useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import usePwaInstall from '../../hooks/usePwaInstall';
import { applyPwaUpdate } from '../../pwa/registerPwa';

function PwaBanner({ children, onDismiss, action }) {
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-white/20 bg-navy/95 text-white shadow-2xl backdrop-blur-md px-4 py-3 flex items-start gap-3">
        <div className="flex-1 min-w-0 text-sm leading-snug">{children}</div>
        <div className="flex items-center gap-1 shrink-0">
          {action}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PwaShell() {
  const online = useOnlineStatus();
  const { canInstall, install, dismiss } = usePwaInstall();
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineDismissed, setOfflineDismissed] = useState(false);

  useEffect(() => {
    const onReady = () => setOfflineReady(true);
    const onRefresh = () => setNeedRefresh(true);
    window.addEventListener('medscan-pwa-offline-ready', onReady);
    window.addEventListener('medscan-pwa-need-refresh', onRefresh);
    return () => {
      window.removeEventListener('medscan-pwa-offline-ready', onReady);
      window.removeEventListener('medscan-pwa-need-refresh', onRefresh);
    };
  }, []);

  useEffect(() => {
    if (online) setOfflineDismissed(false);
  }, [online]);

  if (needRefresh) {
    return (
      <PwaBanner
        onDismiss={() => setNeedRefresh(false)}
        action={
          <button
            type="button"
            onClick={() => applyPwaUpdate()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark transition-colors"
          >
            <RefreshCw size={14} />
            Update
          </button>
        }
      >
        A new version of MedMx LABS is ready.
      </PwaBanner>
    );
  }

  if (!online && !offlineDismissed) {
    return (
      <PwaBanner
        onDismiss={() => setOfflineDismissed(true)}
        action={<WifiOff size={18} className="text-amber-300 mt-0.5" aria-hidden />}
      >
        You&apos;re offline. Cached pages work; sign-in and uploads need a connection.
      </PwaBanner>
    );
  }

  if (canInstall) {
    return (
      <PwaBanner
        onDismiss={dismiss}
        action={
          <button
            type="button"
            onClick={() => install()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-brand hover:opacity-95 transition-opacity"
          >
            <Download size={14} />
            Install
          </button>
        }
      >
        Install MedMx LABS for quick access from your home screen.
      </PwaBanner>
    );
  }

  if (offlineReady) {
    return (
      <PwaBanner onDismiss={() => setOfflineReady(false)}>
        App shell cached — you can open MedMx LABS offline.
      </PwaBanner>
    );
  }

  return null;
}
