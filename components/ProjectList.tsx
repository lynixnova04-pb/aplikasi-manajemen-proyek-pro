'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Plus, FolderKanban, Trash2, Clock, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function ProjectList({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { projects, addProject, deleteProject } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addProject(newName, newDesc);
    setNewName('');
    setNewDesc('');
    setIsAdding(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Semua Proyek</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Proyek Baru
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Buat Proyek Baru</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Proyek</label>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Contoh: Desain Website"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
              <textarea 
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Deskripsi singkat proyek..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={!newName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          const totalTasks = project.tasks.length;
          const completedTasks = project.tasks.filter(t => t.status === 'done').length;
          const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

          return (
            <div key={project.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group flex flex-col">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm('Yakin ingin menghapus proyek ini?')) deleteProject(project.id);
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div 
                className="cursor-pointer flex-1"
                onClick={() => onNavigate(`project-${project.id}`)}
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                  <FolderKanban className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 pr-8">{project.name}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 h-10">{project.description || 'Tidak ada deskripsi.'}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Progres</span>
                    <span className="text-indigo-600 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <ListTodo className="w-3.5 h-3.5" />
                    {completedTasks}/{totalTasks} tugas
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(project.createdAt, 'd MMM yyyy', { locale: id })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {projects.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Belum ada proyek</h3>
            <p className="text-slate-500 mb-4">Mulai dengan membuat proyek pertama Anda.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat Proyek
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
