'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';

type UserMe = { id: string; name: string; email: string };

async function fetchMe(): Promise<UserMe> {
  const response = await fetch('/api/v1/user/me');
  const result = (await response.json()) as { data?: UserMe; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load profile');
  return result.data!;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: me, isError: meIsError } = useQuery({ queryKey: ['me'], queryFn: fetchMe });

  const [name, setName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // UI-only: no notification-preference column in the DB yet and no email-sending
  // system exists, so this toggle doesn't do anything real yet.
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [deleteStep, setDeleteStep] = useState(0);

  useEffect(() => {
    if (me?.name) setName(me.name);
  }, [me]);

  const nameMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? 'Failed to update name');
    },
    onSuccess: () => {
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/user/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? 'Failed to change password');
    },
    onSuccess: () => {
      setPasswordSaved(true);
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSaved(false), 2000);
    },
    onError: (err: Error) => setPasswordError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/user/me', { method: 'DELETE' });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? 'Failed to delete account');
    },
    onSuccess: () => router.push('/'),
  });

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {meIsError && (
        <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load your account details. Try refreshing the page.</p>
      )}

      <Card>
        <h2 className="font-semibold mb-3">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
            <Input value={me?.email ?? ''} disabled />
          </div>
          <Button onClick={() => nameMutation.mutate()} disabled={nameMutation.isPending}>
            {nameMutation.isPending ? 'Saving...' : nameSaved ? 'Saved ✓' : 'Save Name'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Theme</span>
          <ThemeToggle />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Change Password</h2>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="New password (min 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {passwordError && <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>}
          <Button
            onClick={() => passwordMutation.mutate()}
            disabled={passwordMutation.isPending || !currentPassword || !newPassword}
          >
            {passwordMutation.isPending ? 'Saving...' : passwordSaved ? 'Saved ✓' : 'Change Password'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Notifications</h2>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
          />
          Daily reminder notifications (coming soon — not yet active)
        </label>
      </Card>

      <Card className="border-2 border-red-200 dark:border-red-900">
        <h2 className="font-semibold mb-3 text-red-600 dark:text-red-400">Danger Zone</h2>
        {deleteStep === 0 && (
          <Button
            onClick={() => setDeleteStep(1)}
            className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
          >
            Delete Account
          </Button>
        )}
        {deleteStep === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              This permanently deletes your account and all progress. This cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, permanently delete my account'}
              </Button>
              <Button onClick={() => setDeleteStep(0)} className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
