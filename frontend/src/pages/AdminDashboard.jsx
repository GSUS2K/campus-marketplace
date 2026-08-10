import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEMO_PENDING_PRODUCTS } from '../data/demoContent';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AdminDashboard = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('trms_user') || '{}');

  useEffect(() => {
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchPending();
  }, [navigate, user.role]);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('trms_token');
      const res = await fetch(`${API_BASE}/api/products/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error('Administrative clearance required.');
        throw new Error('Failed to fetch pending queue.');
      }
      setPendingProducts(await res.json());
    } catch (err) {
      setErrorMsg(err.message);
      setPendingProducts(DEMO_PENDING_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (productId) => {
    try {
      const token = localStorage.getItem('trms_token');
      const res = await fetch(`${API_BASE}/api/products/admin/verify/${productId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Verification failed.');
      setPendingProducts((prev) => prev.filter((p) => p._id !== productId));
      setSuccessMsg('Artifact authenticated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFlag = async (productId) => {
    try {
      const token = localStorage.getItem('trms_token');
      const res = await fetch(`${API_BASE}/api/products/admin/flag/${productId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Flagging failed.');
      setPendingProducts((prev) => prev.filter((p) => p._id !== productId));
      setSuccessMsg('Artifact flagged and removed from queue.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full min-h-screen pt-16 pb-24 px-4 sm:px-8 text-theme">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-12 border-b border-theme/20 pb-10">
          <p className="text-[9px] tracking-[0.5em] uppercase text-theme/30 mb-4">Middleman Protocol</p>
          <h1 className="text-4xl sm:text-5xl font-serif font-light">
            Governance <em className="not-italic italic opacity-50">Dashboard</em>.
          </h1>
          <p className="mt-4 text-[9px] tracking-widest uppercase text-theme/50">
            Review and authenticate pending artifacts before they hit the main feed.
          </p>
        </header>

        {successMsg && (
          <div className="mb-8 p-4 border border-theme/20 text-center bg-theme/5 rounded-2xl">
            <p className="text-[10px] tracking-[0.2em] uppercase text-theme/80">{successMsg}</p>
          </div>
        )}

        {errorMsg ? (
          <div className="p-8 border border-theme/20 text-center rounded-[2rem]">
            <p className="text-[10px] tracking-[0.2em] uppercase text-theme/70">{errorMsg}</p>
          </div>
        ) : isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-theme/30 animate-pulse">Accessing Secure Queue...</p>
          </div>
        ) : pendingProducts.length === 0 ? (
          <div className="h-48 flex items-center justify-center border border-dashed border-theme/20 rounded-[2rem]">
            <p className="text-[9px] tracking-widest uppercase text-theme/30">Queue is empty. All artifacts authenticated.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {pendingProducts.map((product) => (
              <div key={product._id} className="grid grid-cols-1 lg:grid-cols-[280px_1fr_160px] gap-6 items-start border-b border-theme/20 pb-10">
                <div className="grid grid-cols-3 gap-2 overflow-x-auto">
                  {product.images.map((img, idx) => (
                    <div key={idx} className="aspect-[3/4] bg-theme/10 overflow-hidden rounded-2xl">
                      <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-2xl font-serif mb-2">{product.title}</h3>
                  <p className="text-sm font-light text-theme/70 leading-relaxed mb-6">{product.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[9px] tracking-[0.2em] uppercase">
                    {[
                      ['Valuation', `Rs. ${Number(product.price || 0).toLocaleString()}`],
                      ['Category', product.category],
                      ['Condition', product.condition],
                      ['Origin', product.campusLocation],
                      ['Seller', product.seller?.name],
                      ['Risk', product.riskLevel]
                    ].map(([k, v]) => (
                      <div key={k}>
                        <span className="block text-theme/30 mb-1">{k}</span>
                        <span className={product.riskLevel === 'high' && k === 'Risk' ? 'text-theme font-semibold' : ''}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full flex flex-row lg:flex-col gap-3 shrink-0">
                  <button
                    onClick={() => handleVerify(product._id)}
                    className="flex-1 py-4 bg-theme text-bg text-[9px] tracking-[0.3em] uppercase hover:opacity-80 transition-opacity rounded-full"
                  >
                    Authenticate
                  </button>
                  <button
                    onClick={() => handleFlag(product._id)}
                    className="flex-1 py-4 border border-theme/30 text-[9px] tracking-[0.3em] uppercase hover:bg-theme/5 transition-colors rounded-full"
                  >
                    Flag
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
