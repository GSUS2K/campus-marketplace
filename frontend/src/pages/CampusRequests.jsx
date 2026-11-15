import React, { useEffect, useState } from 'react';
import { Handshake, Plus, RefreshCw, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageIntro, StatusPill } from '../components/Ui';
import { requestJson } from '../lib/api';

const demoRequests = [
  { _id: 'request-1', title: 'Looking for a used Scientific Calculator', description: 'Need a working Casio calculator for first semester exams. A cover is a plus.', category: 'Electronics', budget: 1100, campusLocation: 'BH1', requester: { name: 'Harsh Verma', trustScore: 82 }, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { _id: 'request-2', title: 'DBMS and OS reference books', description: 'Looking for clean second-hand books or reliable printed notes for placement prep.', category: 'Books', budget: 700, campusLocation: 'GH3', requester: { name: 'Nisha Jain', trustScore: 89 }, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { _id: 'request-3', title: 'Monitor for coding setup', description: 'Searching for a 22-24 inch monitor with HDMI. Pickup near Day Scholar parking works.', category: 'Electronics', budget: 6500, campusLocation: 'Day Scholar', requester: { name: 'Rohan Arora', trustScore: 76 }, createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() }
];

const blank = { title: '', description: '', category: 'Books', budget: '', campusLocation: '' };

export default function CampusRequests() {
  const demo = new URLSearchParams(window.location.search).get('demo') === '1';
  const token = localStorage.getItem('trms_token');
  const user = JSON.parse(localStorage.getItem('trms_user') || '{}');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...blank, campusLocation: user.campusLocation || '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    if (demo && !token) { setRequests(demoRequests); setLoading(false); return; }
    const { response, data } = await requestJson('/api/requests');
    if (!response.ok) toast.error(data.msg || 'Could not load campus requests.'); else setRequests(data);
    setLoading(false);
  };

  // Requests are loaded once and can be refreshed explicitly after a new post.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!token && !demo) { toast.error('Sign in to post a campus request.'); return; }
    setSubmitting(true);
    if (demo && !token) {
      setRequests((current) => [{ ...form, _id: `request-${Date.now()}`, budget: Number(form.budget), requester: { name: 'You', trustScore: 84 }, createdAt: new Date().toISOString() }, ...current]);
      setForm({ ...blank, campusLocation: user.campusLocation || '' }); setShowForm(false); setSubmitting(false); toast.success('Preview request posted.'); return;
    }
    const { response, data } = await requestJson('/api/requests', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSubmitting(false);
    if (!response.ok) { toast.error(data.msg || 'Could not post request.'); return; }
    setRequests((current) => [data, ...current]); setForm({ ...blank, campusLocation: user.campusLocation || '' }); setShowForm(false); toast.success('Campus request posted.');
  };

  const visible = requests.filter((item) => `${item.title} ${item.description} ${item.category} ${item.campusLocation}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="page-shell"><PageIntro eyebrow="Campus Need Board" title="Ask before you search." description="Post what you need so nearby students can respond with a listing, an offer, or a safer handover plan." action={<div className="flex gap-2"><button onClick={load} className="button-secondary"><RefreshCw size={14} /> Refresh</button><button onClick={() => setShowForm(true)} className="button-primary"><Plus size={14} /> Post a need</button></div>} />{showForm && <form onSubmit={submit} className="glass-panel mb-8 grid gap-4 rounded-3xl p-5 sm:grid-cols-2 sm:p-6"><div className="flex items-center justify-between sm:col-span-2"><div><p className="eyebrow">New campus request</p><p className="mt-1 text-sm text-theme/55">Keep the details useful and do not add personal contact information.</p></div><button type="button" aria-label="Close form" onClick={() => setShowForm(false)} className="rounded-xl p-2 hover:bg-theme/8"><X size={16} /></button></div><input required maxLength={100} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What are you looking for?" className="glass-control rounded-xl px-4 py-3 text-sm outline-none sm:col-span-2" /><textarea required maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Condition, deadline, and useful details" rows="3" className="glass-control rounded-xl px-4 py-3 text-sm outline-none sm:col-span-2" /><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="glass-control rounded-xl px-4 py-3 text-sm outline-none"><option>Books</option><option>Electronics</option><option>Apparel</option><option>Miscellaneous</option></select><input required type="number" min="0" max="100000" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} placeholder="Maximum budget (Rs.)" className="glass-control rounded-xl px-4 py-3 text-sm outline-none" /><input required value={form.campusLocation} onChange={(event) => setForm({ ...form, campusLocation: event.target.value })} placeholder="Preferred campus location" className="glass-control rounded-xl px-4 py-3 text-sm outline-none sm:col-span-2" /><button disabled={submitting} className="button-primary justify-center sm:col-span-2">{submitting ? 'Posting...' : 'Post campus request'}</button></form>}<div className="mb-5 glass-control flex items-center gap-2 rounded-2xl px-4 py-3"><Search size={16} className="text-theme/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requests" className="w-full bg-transparent text-sm outline-none placeholder:text-theme/40" /></div>{loading ? <div className="glass-panel rounded-3xl p-14 text-center text-sm text-theme/50">Loading campus requests...</div> : visible.length === 0 ? <div className="glass-panel rounded-3xl p-14 text-center"><Handshake className="mx-auto mb-3 text-theme/30" /><p className="font-semibold">No requests match that search</p><p className="mt-1 text-sm text-theme/50">Try a different search or post the first request.</p></div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visible.map((item) => <article key={item._id} className="glass-panel flex min-h-64 flex-col rounded-3xl p-5"><div className="flex items-start justify-between gap-3"><StatusPill tone="good">Looking for</StatusPill><span className="text-xs text-theme/45">Rs. {Number(item.budget).toLocaleString()}</span></div><h2 className="mt-5 text-xl font-semibold normal-case tracking-[-0.04em]">{item.title}</h2><p className="mt-3 text-sm leading-relaxed text-theme/60">{item.description}</p><div className="mt-auto border-t border-theme/10 pt-4 text-xs text-theme/50"><p>{item.category} · {item.campusLocation}</p><p className="mt-1">Posted by {item.requester?.name || 'Campus member'} · Trust {item.requester?.trustScore ?? 50}/100</p></div></article>)}</div>}</section>;
}
