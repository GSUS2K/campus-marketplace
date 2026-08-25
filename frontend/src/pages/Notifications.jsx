import React, { useEffect, useState } from 'react';
import { Bell, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { PageIntro, StatusPill } from '../components/Ui';
import { requestJson } from '../lib/api';

const demoNotifications = [
  { _id: 'demo-notification-1', type: 'safety', title: 'Campus handovers are protected', body: 'Use the shared pickup code and meet in a visible campus location.', createdAt: new Date().toISOString(), link: '/orders' },
  { _id: 'demo-notification-2', type: 'moderation', title: 'Seller access is reviewed by people', body: 'Listings stay hidden until a moderator verifies the seller and item.', createdAt: new Date().toISOString(), link: '/admin?demo=1' }
];

export default function Notifications() {
  const demo = new URLSearchParams(window.location.search).get('demo') === '1';
  const token = localStorage.getItem('trms_token');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    if (demo && !token) { setNotifications(demoNotifications); setLoading(false); return; }
    setLoading(true);
    const { response, data } = await requestJson('/api/notifications/mine', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) toast.error(data.msg || 'Could not load notifications.'); else setNotifications(data.notifications || []);
    setLoading(false);
  };
  // Load once when the inbox opens; the refresh action handles subsequent reads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);
  const markRead = async (notification) => {
    if (notification.readAt || (demo && !token)) return;
    const { response, data } = await requestJson(`/api/notifications/${notification._id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) toast.error(data.msg || 'Could not mark notification read.'); else setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item));
  };
  return <section className="page-shell"><PageIntro eyebrow="Inbox" title="Stay in the loop." description="Order updates, safety decisions, and moderation messages in one place." action={<button onClick={load} className="button-secondary"><RefreshCw size={14} /> Refresh</button>} /><div className="mb-5 flex items-center gap-2"><StatusPill tone="good">{notifications.filter((item) => !item.readAt).length} unread</StatusPill><span className="text-sm text-theme/45">Only your campus workspace can see these updates.</span></div>{loading ? <div className="glass-panel rounded-3xl p-12 text-center text-sm text-theme/50">Loading inbox...</div> : notifications.length === 0 ? <div className="glass-panel rounded-3xl p-16 text-center"><Bell className="mx-auto mb-3 text-theme/30" /><p className="font-semibold">You are all caught up</p><p className="mt-1 text-sm text-theme/50">New order and safety updates will appear here.</p></div> : <div className="grid gap-3">{notifications.map((notification) => <article key={notification._id} onClick={() => markRead(notification)} className={`glass-panel flex gap-4 rounded-2xl p-5 transition ${notification.readAt ? 'opacity-65' : 'ring-1 ring-accent/20'}`}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"><Bell size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{notification.title}</p>{!notification.readAt && <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">New</span>}</div><p className="mt-1 text-sm leading-relaxed text-theme/60">{notification.body}</p><p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-theme/40">{notification.type} · {new Date(notification.createdAt).toLocaleString()}</p>{notification.link && <Link to={notification.link} onClick={(event) => event.stopPropagation()} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline">Open workspace <Check size={13} /></Link>}</div></article>)}</div>}</section>;
}
