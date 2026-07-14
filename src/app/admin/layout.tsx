'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('/api/v1/user/me')
      .then((res) => res.json())
      .then((result: { data?: { id: string } }) => {
        if (!result.data) {
          router.replace('/dashboard');
          return;
        }
        return fetch('/api/v1/admin/tracks').then((res) => {
          if (res.status === 403) {
            router.replace('/dashboard');
          } else {
            setChecked(true);
          }
        });
      });
  }, [router]);

  if (!checked) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-500">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <nav className="flex gap-4 mb-6 border-b pb-3 text-sm font-medium">
        <Link href="/admin/tracks" className="text-blue-600 hover:underline">
          Tracks
        </Link>
        <Link href="/admin/lessons" className="text-blue-600 hover:underline">
          Lessons
        </Link>
        <Link href="/admin/questions" className="text-blue-600 hover:underline">
          Questions
        </Link>
      </nav>
      {children}
    </div>
  );
}
