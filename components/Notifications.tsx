'use client';
import { useAppStore } from '@/lib/store';
import { Bell, Check, Trash2, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx } from 'clsx';

export function Notifications() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications } = useAppStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50';
      case 'warning': return 'bg-amber-50';
      default: return 'bg-indigo-50';
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Bell className="w-8 h-8 text-indigo-600" />
          Notifikasi
        </h1>
        <div className="flex gap-3">
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllNotificationsAsRead}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Check className="w-4 h-4" />
              Tandai Semua Dibaca
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={() => {
                if (confirm('Hapus semua notifikasi?')) clearNotifications();
              }}
              className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Bersihkan
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">Belum ada notifikasi</h3>
          <p className="text-slate-500">Anda akan melihat pembaruan proyek dan tugas di sini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className={clsx(
                "p-4 rounded-xl border transition-all flex gap-4 items-start",
                notif.read ? "bg-white border-slate-200" : "bg-indigo-50/30 border-indigo-100 shadow-sm"
              )}
            >
              <div className={clsx("p-2 rounded-lg shrink-0", getBg(notif.type))}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={clsx("font-semibold", notif.read ? "text-slate-700" : "text-slate-900")}>
                    {notif.title}
                  </h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                    {format(notif.createdAt, 'd MMM HH:mm', { locale: id })}
                  </span>
                </div>
                <p className={clsx("text-sm", notif.read ? "text-slate-500" : "text-slate-700")}>
                  {notif.message}
                </p>
              </div>
              {!notif.read && (
                <button 
                  onClick={() => markNotificationAsRead(notif.id)}
                  className="shrink-0 p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                  title="Tandai dibaca"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
