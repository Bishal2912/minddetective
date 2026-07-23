'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type UserMe = { id: string; name: string; email: string };

async function fetchMe(): Promise<UserMe> {
  const response = await fetch('/api/v1/user/me');
  const result = (await response.json()) as { data?: UserMe; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load profile');
  return result.data!;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tracks', label: 'Tracks' },
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
];

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: fetchMe });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      queryClient.clear();
      router.push('/login');
    }
  };

  const initial = me?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-lg text-gray-900 dark:text-gray-50">
            MindDetective
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Open user menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            {initial}
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 py-1">
                {me && (
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{me.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{me.email}</p>
                  </div>
                )}
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                >
                  {loggingOut ? 'Logging out...' : 'Log out'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
