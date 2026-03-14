'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: number;
  createdAt: number;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  createdAt: number;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedBy: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  messages: Message[];
  files: FileItem[];
  createdAt: number;
}

interface AppState {
  projects: Project[];
  notifications: Notification[];
  addProject: (name: string, description: string) => void;
  deleteProject: (id: string) => void;
  addTask: (projectId: string, title: string, description?: string, status?: TaskStatus, priority?: TaskPriority, dueDate?: number) => void;
  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => void;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  addMessage: (projectId: string, text: string) => void;
  addFile: (projectId: string, file: Omit<FileItem, 'id' | 'createdAt' | 'uploadedBy'>) => void;
  deleteFile: (projectId: string, fileId: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedProjects = localStorage.getItem('project-manager-data');
    const savedNotifs = localStorage.getItem('project-manager-notifications');
    if (savedProjects) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProjects(JSON.parse(savedProjects));
      } catch (e) {
        console.error('Failed to parse projects', e);
      }
    }
    if (savedNotifs) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNotifications(JSON.parse(savedNotifs));
      } catch (e) {
        console.error('Failed to parse notifications', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('project-manager-data', JSON.stringify(projects));
      localStorage.setItem('project-manager-notifications', JSON.stringify(notifications));
    }
  }, [projects, notifications, isLoaded]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setNotifications(prev => [{
      id: uuidv4(),
      title,
      message,
      type,
      read: false,
      createdAt: Date.now()
    }, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addProject = (name: string, description: string) => {
    setProjects(prev => [...prev, {
      id: uuidv4(),
      name,
      description,
      tasks: [],
      messages: [],
      files: [],
      createdAt: Date.now()
    }]);
    addNotification('Proyek Baru', `Proyek "${name}" berhasil dibuat.`, 'success');
  };

  const deleteProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (project) {
      addNotification('Proyek Dihapus', `Proyek "${project.name}" telah dihapus.`, 'warning');
    }
  };

  const addTask = (projectId: string, title: string, description?: string, status: TaskStatus = 'todo', priority: TaskPriority = 'medium', dueDate?: number) => {
    const project = projects.find(p => p.id === projectId);
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: [...(p.tasks || []), {
            id: uuidv4(),
            title,
            description,
            status,
            priority,
            dueDate,
            createdAt: Date.now()
          }]
        };
      }
      return p;
    }));
    if (project) {
      addNotification('Tugas Baru', `Tugas "${title}" ditambahkan ke proyek ${project.name}.`, 'info');
    }
  };

  const updateTaskStatus = (projectId: string, taskId: string, status: TaskStatus) => {
    let taskName = '';
    let projectName = '';
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        projectName = p.name;
        return {
          ...p,
          tasks: (p.tasks || []).map(t => {
            if (t.id === taskId) {
              taskName = t.title;
              return { ...t, status };
            }
            return t;
          })
        };
      }
      return p;
    }));
    
    // Use setTimeout to allow state to update first, though it's synchronous here, 
    // we already captured taskName and projectName
    if (taskName && status === 'done') {
      addNotification('Tugas Selesai', `Tugas "${taskName}" di proyek ${projectName} telah selesai!`, 'success');
    }
  };

  const updateTask = (projectId: string, taskId: string, updates: Partial<Task>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, ...updates } : t)
        };
      }
      return p;
    }));
  };

  const deleteTask = (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: (p.tasks || []).filter(t => t.id !== taskId)
        };
      }
      return p;
    }));
  };

  const addMessage = (projectId: string, text: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          messages: [...(p.messages || []), {
            id: uuidv4(),
            text,
            sender: 'Saya',
            createdAt: Date.now()
          }]
        };
      }
      return p;
    }));
  };

  const addFile = (projectId: string, file: Omit<FileItem, 'id' | 'createdAt' | 'uploadedBy'>) => {
    const project = projects.find(p => p.id === projectId);
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          files: [...(p.files || []), {
            ...file,
            id: uuidv4(),
            uploadedBy: 'Saya',
            createdAt: Date.now()
          }]
        };
      }
      return p;
    }));
    if (project) {
      addNotification('File Diunggah', `File "${file.name}" diunggah ke proyek ${project.name}.`, 'info');
    }
  };

  const deleteFile = (projectId: string, fileId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          files: (p.files || []).filter(f => f.id !== fileId)
        };
      }
      return p;
    }));
  };

  return (
    <AppContext.Provider value={{ 
      projects, notifications, addProject, deleteProject, 
      addTask, updateTaskStatus, updateTask, deleteTask,
      addMessage, addFile, deleteFile,
      markNotificationAsRead, markAllNotificationsAsRead, clearNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
