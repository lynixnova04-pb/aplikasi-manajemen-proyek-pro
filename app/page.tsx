'use client';
import { useState } from 'react';
import { AppProvider } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { ProjectList } from '@/components/ProjectList';
import { ProjectDetail } from '@/components/ProjectDetail';
import { Notifications } from '@/components/Notifications';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 overflow-y-auto">
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        {currentView === 'projects' && <ProjectList onNavigate={setCurrentView} />}
        {currentView === 'notifications' && <Notifications />}
        {currentView.startsWith('project-') && (
          <ProjectDetail projectId={currentView.replace('project-', '')} />
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
