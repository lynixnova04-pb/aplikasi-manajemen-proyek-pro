'use client';
import { useState, useRef, useEffect } from 'react';
import { useAppStore, TaskStatus, TaskPriority, Task, Message, FileItem } from '@/lib/store';
import { 
  Plus, Trash2, Clock, CheckCircle2, Circle, ArrowRight, 
  Calendar, Flag, Edit2, X, MessageSquare, Paperclip, 
  Send, FileText, Image as ImageIcon, Download, LayoutGrid, FileDown
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx } from 'clsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type TabType = 'kanban' | 'chat' | 'files';

export function ProjectDetail({ projectId }: { projectId: string }) {
  const { projects, addTask, updateTaskStatus, updateTask, deleteTask, addMessage, addFile, deleteFile } = useAppStore();
  const project = projects.find(p => p.id === projectId);
  
  const [activeTab, setActiveTab] = useState<TabType>('kanban');

  // Kanban State
  const [isAddingTask, setIsAddingTask] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Chat State
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // File State
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [project?.messages, activeTab]);

  if (!project) {
    return <div className="p-8 text-center text-slate-500">Proyek tidak ditemukan.</div>;
  }

  const columns: { id: TaskStatus; title: string; color: string; icon: React.ReactNode }[] = [
    { id: 'todo', title: 'Akan Dilakukan', color: 'bg-slate-100', icon: <Circle className="w-4 h-4 text-slate-500" /> },
    { id: 'in-progress', title: 'Sedang Proses', color: 'bg-blue-50', icon: <Clock className="w-4 h-4 text-blue-500" /> },
    { id: 'done', title: 'Selesai', color: 'bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> }
  ];

  const priorityColors = {
    low: 'text-slate-600 bg-slate-100 border-slate-200',
    medium: 'text-amber-700 bg-amber-50 border-amber-200',
    high: 'text-red-700 bg-red-50 border-red-200'
  };

  const priorityLabels = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi'
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;
    updateTask(projectId, editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      dueDate: editingTask.dueDate
    });
    setEditingTask(null);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    addMessage(projectId, newMessage);
    setNewMessage('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 2MB for localStorage demo purposes
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB untuk versi demo ini.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      addFile(projectId, {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl
      });
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(`Laporan Proyek: ${project.name}`, 14, 22);

    // Info
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // slate-500
    
    // Handle long description by splitting it
    const splitDesc = doc.splitTextToSize(`Deskripsi: ${project.description || '-'}`, 180);
    doc.text(splitDesc, 14, 32);
    
    const descHeight = splitDesc.length * 5;
    const startY = 32 + descHeight;

    doc.text(`Tanggal Dibuat: ${format(project.createdAt, 'dd MMMM yyyy', { locale: id })}`, 14, startY);

    // Stats
    const completed = project.tasks.filter(t => t.status === 'done').length;
    const total = project.tasks.length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    doc.text(`Total Tugas: ${total}`, 14, startY + 8);
    doc.text(`Selesai: ${completed} (${progress}%)`, 14, startY + 16);

    // Table Data
    const tableData = project.tasks.map(t => [
      t.title,
      t.status === 'todo' ? 'Akan Dilakukan' : t.status === 'in-progress' ? 'Sedang Proses' : 'Selesai',
      t.priority === 'high' ? 'Tinggi' : t.priority === 'medium' ? 'Sedang' : 'Rendah',
      t.dueDate ? format(t.dueDate, 'dd MMM yyyy', { locale: id }) : '-'
    ]);

    autoTable(doc, {
      startY: startY + 26,
      head: [['Nama Tugas', 'Status', 'Prioritas', 'Tenggat Waktu']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
      styles: { font: 'helvetica', fontSize: 10 },
    });

    doc.save(`Laporan_${project.name.replace(/\s+/g, '_')}.pdf`);
  };

  const projectTasks = project.tasks || [];
  const projectMessages = project.messages || [];
  const projectFiles = project.files || [];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
          <p className="text-slate-500">{project.description}</p>
        </div>
        <button 
          onClick={generatePDF}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileDown className="w-4 h-4" />
          Unduh Laporan PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('kanban')}
          className={clsx(
            "px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'kanban' ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          Papan Tugas
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={clsx(
            "px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'chat' ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Obrolan Tim
          {projectMessages.length > 0 && (
            <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs ml-1">{projectMessages.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={clsx(
            "px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'files' ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          )}
        >
          <Paperclip className="w-4 h-4" />
          File & Dokumen
          {projectFiles.length > 0 && (
            <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs ml-1">{projectFiles.length}</span>
          )}
        </button>
      </div>

      {/* Kanban View */}
      {activeTab === 'kanban' && (
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
          {columns.map(col => {
            const columnTasks = projectTasks.filter(t => t.status === col.id);
            
            return (
              <div key={col.id} className={`flex-shrink-0 w-80 rounded-2xl p-4 flex flex-col ${col.color}`}>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    {col.icon}
                    {col.title}
                    <span className="bg-white/50 text-slate-500 text-xs py-0.5 px-2 rounded-full ml-1">
                      {columnTasks.length}
                    </span>
                  </h3>
                  <button 
                    onClick={() => setIsAddingTask(col.id)}
                    className="p-1 hover:bg-white/50 rounded text-slate-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {isAddingTask === col.id && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newTaskTitle.trim()) return;
                        addTask(
                          projectId, 
                          newTaskTitle, 
                          newTaskDesc, 
                          col.id, 
                          newTaskPriority, 
                          newTaskDueDate ? new Date(newTaskDueDate).getTime() : undefined
                        );
                        setNewTaskTitle('');
                        setNewTaskDesc('');
                        setNewTaskPriority('medium');
                        setNewTaskDueDate('');
                        setIsAddingTask(null);
                      }} 
                      className="bg-white p-3 rounded-xl shadow-sm border border-slate-200"
                    >
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        placeholder="Judul tugas..."
                        className="w-full text-sm font-medium text-slate-900 border-none focus:ring-0 p-0 mb-2 placeholder:text-slate-400 outline-none"
                        autoFocus
                      />
                      <textarea
                        value={newTaskDesc}
                        onChange={e => setNewTaskDesc(e.target.value)}
                        placeholder="Deskripsi..."
                        className="w-full text-xs text-slate-500 border-none focus:ring-0 p-0 resize-none placeholder:text-slate-400 outline-none mb-2"
                        rows={2}
                      />
                      
                      <div className="flex gap-2 mb-3">
                        <select 
                          value={newTaskPriority}
                          onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                          className="text-xs border border-slate-200 rounded p-1 text-slate-600 outline-none focus:border-indigo-300"
                        >
                          <option value="low">Prioritas Rendah</option>
                          <option value="medium">Prioritas Sedang</option>
                          <option value="high">Prioritas Tinggi</option>
                        </select>
                        <input 
                          type="date"
                          value={newTaskDueDate}
                          onChange={e => setNewTaskDueDate(e.target.value)}
                          className="text-xs border border-slate-200 rounded p-1 text-slate-600 outline-none focus:border-indigo-300 w-full"
                        />
                      </div>

                      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                        <button type="button" onClick={() => setIsAddingTask(null)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1">Batal</button>
                        <button type="submit" className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 font-medium">Simpan</button>
                      </div>
                    </form>
                  )}

                  {columnTasks.map(task => {
                    const isOverdue = task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate) && task.status !== 'done';
                    
                    return (
                      <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group relative">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1", priorityColors[task.priority || 'medium'])}>
                                <Flag className="w-3 h-3" />
                                {priorityLabels[task.priority || 'medium']}
                              </span>
                              {task.dueDate && (
                                <span className={clsx(
                                  "text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1",
                                  isOverdue ? "text-red-700 bg-red-50 border-red-200" : "text-slate-600 bg-slate-50 border-slate-200"
                                )}>
                                  <Calendar className="w-3 h-3" />
                                  {format(task.dueDate, 'd MMM', { locale: id })}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-slate-900 leading-tight pr-6">{task.title}</h4>
                          </div>
                          
                          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingTask(task)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                if(confirm('Hapus tugas ini?')) deleteTask(projectId, task.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                          <span className="text-[10px] text-slate-400 font-medium">
                            Dibuat {format(task.createdAt, 'd MMM', { locale: id })}
                          </span>
                          
                          <div className="flex gap-1">
                            {col.id !== 'todo' && (
                              <button 
                                onClick={() => updateTaskStatus(projectId, task.id, col.id === 'done' ? 'in-progress' : 'todo')}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Pindah ke sebelumnya"
                              >
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button 
                                onClick={() => updateTaskStatus(projectId, task.id, col.id === 'todo' ? 'in-progress' : 'done')}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Pindah ke selanjutnya"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chat View */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {projectMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-4 text-slate-200" />
                <p>Belum ada pesan. Mulai obrolan dengan tim Anda!</p>
              </div>
            ) : (
              projectMessages.map((msg, index) => {
                const isMe = msg.sender === 'Saya';
                const showHeader = index === 0 || projectMessages[index - 1].sender !== msg.sender || (msg.createdAt - projectMessages[index - 1].createdAt > 5 * 60 * 1000);
                
                return (
                  <div key={msg.id} className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
                    {showHeader && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-700">{msg.sender}</span>
                        <span className="text-[10px] text-slate-400">{format(msg.createdAt, 'HH:mm', { locale: id })}</span>
                      </div>
                    )}
                    <div className={clsx(
                      "px-4 py-2.5 rounded-2xl max-w-[80%] text-sm",
                      isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Files View */}
      {activeTab === 'files' && (
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">File Proyek</h2>
              <p className="text-sm text-slate-500">Bagikan dokumen dan aset dengan tim (Maks 2MB/file).</p>
            </div>
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Unggah File
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {projectFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <Paperclip className="w-12 h-12 mb-4 text-slate-200" />
                <p className="font-medium text-slate-600 mb-1">Belum ada file</p>
                <p className="text-sm">Klik tombol unggah untuk menambahkan file ke proyek ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {projectFiles.map(file => {
                  const isImage = file.type.startsWith('image/');
                  return (
                    <div key={file.id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all group relative bg-white">
                      <button 
                        onClick={() => {
                          if (confirm('Hapus file ini?')) deleteFile(projectId, file.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur text-slate-400 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="w-full h-32 bg-slate-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-slate-100 relative">
                        {isImage ? (
                          <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-10 h-10 text-slate-300" />
                        )}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a 
                            href={file.dataUrl} 
                            download={file.name}
                            className="bg-white text-slate-900 p-2 rounded-full hover:scale-110 transition-transform"
                            title="Unduh"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-semibold text-slate-800 truncate mb-1" title={file.name}>{file.name}</h4>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{format(file.createdAt, 'd MMM', { locale: id })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Edit Tugas</h2>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Tugas</label>
                <input 
                  type="text" 
                  value={editingTask.title}
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                <textarea 
                  value={editingTask.description || ''}
                  onChange={e => setEditingTask({...editingTask, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioritas</label>
                  <select 
                    value={editingTask.priority || 'medium'}
                    onChange={e => setEditingTask({...editingTask, priority: e.target.value as TaskPriority})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tenggat Waktu</label>
                  <input 
                    type="date"
                    value={editingTask.dueDate ? format(editingTask.dueDate, 'yyyy-MM-dd') : ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditingTask({...editingTask, dueDate: val ? new Date(val).getTime() : undefined});
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!editingTask.title.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
