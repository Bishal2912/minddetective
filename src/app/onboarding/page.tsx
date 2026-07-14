import { redirect } from 'next/navigation';

import { getCurrentSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

import { OnboardingForm } from './OnboardingForm';

export default async function OnboardingPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  const db = getDb();
  const stats = await db
    .prepare('SELECT onboarding_complete FROM user_stats WHERE user_id = ? LIMIT 1')
    .bind(session.userId)
    .first<{ onboarding_complete: number }>();

  if (stats?.onboarding_complete) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <OnboardingForm />
    </main>
  );
}
