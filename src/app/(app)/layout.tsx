import AppHeader from '@/components/layout/AppHeader';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <AppHeader />
      {children}
    </div>
  );
}
