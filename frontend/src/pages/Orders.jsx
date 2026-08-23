import React, { useEffect, useState } from 'react';
import { Check, ClipboardList, PackageCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageIntro, StatusPill } from '../components/Ui';
import { requestJson } from '../lib/api';

const demoOrders = [{ _id: 'demo-1', status: 'confirmed', total: 1850, pickupLocation: 'Main Gate', createdAt: new Date().toISOString(), items: [{ title: 'Study Books Bundle', price: 1850, quantity: 1 }] }];

function OrderCard({ order, sellerMode, onStatus }) {
  return <article className="glass-panel rounded-3xl p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-theme/45">Order #{String(order._id).slice(-8).toUpperCase()}</p><h2 className="mt-2 text-lg font-semibold">{order.items?.length || 0} listing{order.items?.length === 1 ? '' : 's'}</h2><p className="mt-1 text-sm text-theme/50">{new Date(order.createdAt).toLocaleDateString()} · {order.pickupLocation || 'Main Gate'}</p></div><StatusPill tone={order.status === 'cancelled' ? 'danger' : order.status === 'completed' ? 'good' : order.status === 'placed' ? 'neutral' : 'warn'}>{order.status}</StatusPill></div><div className="mt-5 space-y-3">{order.items?.map((item, index) => <div key={`${item.title}-${index}`} className="flex items-center justify-between gap-3 border-t border-theme/10 pt-3 text-sm"><span className="min-w-0 truncate">{item.title} <span className="text-theme/40">× {item.quantity || 1}</span></span><strong>Rs. {Number(item.price || 0).toLocaleString()}</strong></div>)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-theme/10 pt-4"><div><span className="text-sm text-theme/50">Total</span><p className="text-xl font-semibold">Rs. {Number(order.total || 0).toLocaleString()}</p></div>{sellerMode && !['completed', 'cancelled'].includes(order.status) && <div className="flex gap-2">{order.status === 'placed' && <button onClick={() => onStatus(order._id, 'confirmed')} className="button-secondary"><Check size={14} /> Confirm</button>}{order.status === 'confirmed' && <button onClick={() => onStatus(order._id, 'ready')} className="button-secondary"><PackageCheck size={14} /> Ready</button>}{order.status === 'ready' && <button onClick={() => onStatus(order._id, 'completed')} className="button-primary"><Check size={14} /> Complete</button>}</div>}</div></article>;
}

export default function Orders() {
  const user = JSON.parse(localStorage.getItem('trms_user') || 'null');
  const token = localStorage.getItem('trms_token');
  const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';
  const sellerMode = user?.role === 'seller' || user?.role === 'admin';
  const [tab, setTab] = useState('purchases');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { if (isDemo && !token) { setOrders(JSON.parse(localStorage.getItem('demo_orders') || 'null') || demoOrders); setLoading(false); return; } setLoading(true); const endpoint = tab === 'sales' ? '/api/orders/sales' : '/api/orders/mine'; const { response, data } = await requestJson(endpoint, { headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) toast.error(data.msg || 'Could not load orders.'); else setOrders(data); setLoading(false); };
  // Refresh when the buyer/seller tab changes without making the request function part of render state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [tab]);
  const updateStatus = async (id, status) => { if (isDemo && !token) { setOrders((current) => current.map((order) => order._id === id ? { ...order, status } : order)); toast.success(`Demo order marked ${status}.`); return; } const { response, data } = await requestJson(`/api/orders/${id}/status`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); if (!response.ok) toast.error(data.msg || 'Could not update order.'); else { toast.success('Order updated.'); load(); } };
  return <section className="page-shell"><PageIntro eyebrow="Orders" title="Keep every handover clear." description="Purchases, pickup details, and seller fulfillment in one calm workspace." action={<button onClick={load} className="button-secondary"><RefreshCw size={14} /> Refresh</button>} /><div className="mb-6 flex gap-2 border-b border-theme/10 pb-3">{['purchases', ...(sellerMode ? ['sales'] : [])].map((value) => <button key={value} onClick={() => setTab(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${tab === value ? 'bg-theme text-bg' : 'text-theme/50 hover:bg-theme/8'}`}>{value}</button>)}</div>{loading ? <div className="glass-panel rounded-3xl p-12 text-center text-sm text-theme/50">Loading orders...</div> : orders.length === 0 ? <div className="glass-panel rounded-3xl p-12 text-center"><ClipboardList className="mx-auto mb-3 text-theme/30" /><p className="font-semibold">No {tab} yet</p><p className="mt-1 text-sm text-theme/50">Your next marketplace handover will appear here.</p></div> : <div className="grid gap-4">{orders.map((order) => <OrderCard key={order._id} order={order} sellerMode={tab === 'sales'} onStatus={updateStatus} />)}</div>}</section>;
}
