import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatWidget from '../AIChatbot/ChatWidget';
import Paywall from '../common/Paywall';

import { useAuthStore } from '../../stores/authStore';

export default function Layout() {
  const { user } = useAuthStore();
  const isBronze = user?.tenant?.tier === 'bronze';
  const isSuspended = user?.tenant && !user.tenant.is_active;

  const trialEndsAt = user?.tenant?.trial_ends_at;
  let trialDaysRemaining = null;
  let isTrialExpired = false;

  if (trialEndsAt) {
      const endsAt = new Date(trialEndsAt);
      const now = new Date();
      const diffTime = endsAt - now;
      trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (trialDaysRemaining <= 0) {
          isTrialExpired = true;
      }
  }

  // If trial is expired and they are still on a tier that requires payment (e.g. bronze or they haven't upgraded)
  // Let's assume having a trial_ends_at that is in the past means they are expired, UNLESS they upgraded
  // Our mock upgrade sets trial_ends_at to null, so this check works.

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-auto bg-gray-100 print:bg-white print:overflow-visible print:p-0">
        {isSuspended && (
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-3 text-center text-sm font-bold shadow-md z-50 flex-shrink-0 animate-pulse print:hidden">
            ⚠️ Your account has been suspended. You are in read-only mode and can only view historical sales data.
          </div>
        )}
        {trialDaysRemaining !== null && !isTrialExpired && (
          <div className="bg-yellow-500 text-gray-900 p-3 text-center text-sm font-bold shadow-md z-50 flex-shrink-0">
            ⏳ Free trial ends in {trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'}. <button onClick={() => window.location.href='/settings'} className="underline ml-2">Upgrade now</button>
          </div>
        )}
        <div className="p-4 md:p-6 print:p-0 flex-1">
          {isTrialExpired ? <Paywall /> : <Outlet />}
        </div>
      </main>
      {!isBronze && <ChatWidget />}
    </div>
  );
}
