'use client';

import { usePathname } from 'next/navigation';
import AuthProvider from './AuthProvider';
import Sidebar from './Sidebar';

const PUBLIC_PATHS = ['/login', '/signup'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  return (
    <AuthProvider>
      {isPublic ? (
        children
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      )}
    </AuthProvider>
  );
}
