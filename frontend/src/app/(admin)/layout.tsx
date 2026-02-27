'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DoorOpen,
  Layers,
  Calendar,
  Upload,
  ClipboardList,
  LogOut,
  Clock,
  CheckSquare,
  Search,
  Bell,
} from 'lucide-react';
import { signOut, useSession } from '@/lib/auth-client';
import { useState, useEffect } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Management',
    items: [
      { href: '/classes', label: 'Classes', icon: Layers },
      { href: '/subjects', label: 'Subjects', icon: BookOpen },
      { href: '/rooms', label: 'Rooms', icon: DoorOpen },
    ],
  },
  {
    title: 'People',
    items: [
      { href: '/students', label: 'Students', icon: GraduationCap },
      { href: '/teachers', label: 'Faculty', icon: Users },
    ],
  },
  {
    title: 'Attendance',
    items: [
      { href: '/sessions', label: 'Sessions', icon: Clock },
      { href: '/attendance', label: 'Records', icon: CheckSquare },
      { href: '/timetable', label: 'Timetable', icon: Calendar },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/upload', label: 'CSV Upload', icon: Upload },
      { href: '/jobs', label: 'Import Jobs', icon: ClipboardList },
    ],
  },
];

/* ─── Layout Component ────────────────────────────────────────── */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [searchQuery, setSearchQuery] = useState('');

  // Get current page title for header
  const getCurrentPageTitle = () => {
    const path = pathname.split('/')[1] || 'dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [session, isPending, router, pathname]);

  // Show loading while checking auth
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-500 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-lg">UA</span>
          </div>
          <div className="text-[#a3a3a3]">Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect is happening)
  if (!session) {
    return null;
  }

  const userName = session?.user?.name || 'Admin';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen flex bg-[#0d0d0d]">
      {/* Grain overlay for texture */}
      <div className="grain-overlay" />
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0d0d] border-r border-[#1f1f1f] flex flex-col shrink-0 fixed h-screen z-40">
        {/* Logo area */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/20">
              <span className="text-white font-bold text-sm">UA</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight">UniAttendance</span>
              <span className="text-[10px] text-[#737373] uppercase tracking-wider">Admin Portal</span>
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
            <input
              type="text"
              placeholder="Search Project"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-accent-500 text-white placeholder-white/70 text-sm pl-10 pr-4 py-2.5 rounded-lg border-0 focus:ring-2 focus:ring-accent-400"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#525252] px-3 mb-2">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                        isActive
                          ? 'bg-accent-500 text-white font-medium shadow-lg shadow-accent-500/20'
                          : 'text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-400 rounded-r-full -ml-3" />
                      )}
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-[#1f1f1f] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#2d4a3e] flex items-center justify-center text-emerald-400 font-semibold text-sm ring-2 ring-emerald-500/30">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-[#737373] truncate">{session?.user?.email || 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              window.location.href = '/sign-in';
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#737373] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">{getCurrentPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-[#737373] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full" />
            </button>
            
            {/* User quick profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-[#1f1f1f]">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{userName}</p>
                <p className="text-xs text-[#737373]">Super Admin</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#2d4a3e] flex items-center justify-center text-emerald-400 text-sm font-semibold">
                {userInitials}
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#111111]">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
