'use client';
import { useAppStore } from '@/lib/store';
import { CheckCircle2, Clock, FolderKanban, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function Dashboard({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { projects } = useAppStore();

  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'done').length, 0);
  const pendingTasks = totalTasks - completedTasks;

  const recentProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Ringkasan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          title="Total Proyek" 
          value={totalProjects} 
          icon={<FolderKanban className="w-6 h-6 text-blue-600" />} 
          bg="bg-blue-50" 
        />
        <StatCard 
          title="Total Tugas" 
          value={totalTasks} 
          icon={<ListTodo className="w-6 h-6 text-indigo-600" />} 
          bg="bg-indigo-50" 
        />
        <StatCard 
          title="Tugas Selesai" 
          value={completedTasks} 
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />} 
          bg="bg-emerald-50" 
        />
        <StatCard 
          title="Tugas Tertunda" 
          value={pendingTasks} 
          icon={<Clock className="w-6 h-6 text-amber-600" />} 
          bg="bg-amber-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Proyek Terbaru</h2>
            <button onClick={() => onNavigate('projects')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Lihat Semua</button>
          </div>
          {recentProjects.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada proyek.</p>
          ) : (
            <div className="space-y-4">
              {recentProjects.map(project => {
                const pTotalTasks = project.tasks.length;
                const pCompletedTasks = project.tasks.filter(t => t.status === 'done').length;
                const progress = pTotalTasks === 0 ? 0 : Math.round((pCompletedTasks / pTotalTasks) * 100);

                return (
                  <div key={project.id} onClick={() => onNavigate(`project-${project.id}`)} className="group cursor-pointer p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">{project.name}</h3>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{progress}%</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-1">{project.description}</p>
                    
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <ListTodo className="w-3.5 h-3.5" />
                        {pCompletedTasks}/{pTotalTasks} tugas
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(project.createdAt, 'd MMM yyyy', { locale: id })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bg }: { title: string, value: number, icon: React.ReactNode, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
