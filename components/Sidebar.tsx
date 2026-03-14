'use client';
import { LayoutDashboard, FolderKanban, Bell } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { clsx } from 'clsx';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  const { projects, notifications } = useAppStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FolderKanban className="w-6 h-6 text-indigo-600" />
          Manajer Proyek
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="space-y-1">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              currentView === 'dashboard' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('projects')}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              currentView === 'projects' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <FolderKanban className="w-4 h-4" />
            Semua Proyek
          </button>
          <button
            onClick={() => setCurrentView('notifications')}
            className={clsx(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              currentView === 'notifications' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4" />
              Notifikasi
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="mt-8">
          <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Proyek Aktif
          </h2>
          <div className="space-y-1">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setCurrentView(`project-${project.id}`)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors truncate",
                  currentView === `project-${project.id}` ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
