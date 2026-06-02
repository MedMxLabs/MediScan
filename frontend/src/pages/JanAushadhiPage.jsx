import { MapPin } from 'lucide-react';
import PublicLayout from '../layout/PublicLayout';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import ComingSoonPanel from '../components/ComingSoonPanel';

const COPY =
  'Jan Aushadhi Kendra locator (PMBJP) will help you find affordable generic medicines at government kendras near you.';

export default function JanAushadhiPage({ publicMode = false }) {
  const panel = (
    <ComingSoonPanel
      title="Jan Aushadhi — coming soon"
      subtitle={COPY}
      icon={MapPin}
      accent="amber"
      backTo={publicMode ? '/' : '/dashboard'}
      backLabel={publicMode ? 'Back to home' : 'Back to dashboard'}
    />
  );

  if (publicMode) {
    return (
      <PublicLayout title="Jan Aushadhi" accent="amber">
        <div className="max-w-3xl mx-auto">{panel}</div>
      </PublicLayout>
    );
  }

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        title="Jan Aushadhi Locator"
        subtitle="Find nearby PMBJP kendras — launching soon."
        icon={MapPin}
        lightSurface
      />
      {panel}
    </PageShell>
  );
}
