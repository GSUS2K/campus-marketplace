import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('trms_user') || '{}');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const token = localStorage.getItem('trms_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setMyListings(await res.json());
      } catch (err) {
        console.error('Failed to fetch listings', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handleRemoveListing = async (productId) => {
    if (!window.confirm('Permanently remove this artifact from the Archive?')) return;
    try {
      const token = localStorage.getItem('trms_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMyListings(prev => prev.filter(p => p._id !== productId));
      } else {
        alert('Failed to remove artifact.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('trms_token');
    localStorage.removeItem('trms_user');
    navigate('/login');
  };

  return (
    <div className="w-full bg-transparent text-theme min-h-screen pt-16 pb-32 px-8 sm:px-14 animate-fade-in transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-end border-b border-theme pb-14 mb-14">
          <div>
            <p className="text-[9px] tracking-[0.5em] uppercase text-theme/30 mb-4">Curator Journal</p>
            <h1 className="text-5xl md:text-6xl font-serif font-light text-theme">{user.name}</h1>
            <p className="mt-3 text-[9px] tracking-widest uppercase text-theme/50">
              {user.email} · {user.campusLocation}
            </p>
          </div>

          <div className="mt-8 md:mt-0 text-right space-y-4">
            <div>
              <span className="text-[9px] tracking-[0.3em] uppercase text-theme/30 block mb-1.5">Identity Status</span>
              {user.isTrustedSeller ? (
                <span className="text-[9px] tracking-[0.25em] uppercase bg-theme text-bg px-3 py-1.5 inline-block">Tier 1 Elite</span>
              ) : user.status === 'verified' ? (
                <span className="text-[9px] tracking-[0.25em] uppercase border border-theme/20 text-theme px-3 py-1.5 inline-block">Verified Academic</span>
              ) : (
                <span className="text-[9px] tracking-[0.25em] uppercase text-theme border border-theme/20 px-3 py-1.5 inline-block">Unverified</span>
              )}
            </div>
            <div>
              <span className="text-[9px] tracking-[0.3em] uppercase text-theme/30 block mb-1">Trust Score</span>
              <span className="text-3xl font-serif text-theme">{user.trustScore ?? 0}<span className="text-base opacity-40">/100</span></span>
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-14">
          <Link to="/post" className="px-6 py-3 bg-theme text-bg text-[9px] tracking-[0.3em] uppercase hover:opacity-80 transition-opacity">
            + Consign Item
          </Link>
        </div>

        {/* Listings */}
        <div>
          <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-10">Your Active Archive ({myListings.length})</p>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-[10px] tracking-[0.4em] uppercase text-theme/30 animate-pulse">Loading Journal…</p>
            </div>
          ) : myListings.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center border border-dashed border-theme gap-4">
              <p className="text-[9px] tracking-widest uppercase text-theme/30">No active consignments.</p>
              <Link to="/post" className="text-[9px] tracking-widest uppercase text-theme underline underline-offset-4">Consign your first item →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-14">
              {myListings.map(product => (
                <div key={product._id} className="group flex flex-col">
                  <Link to={`/product/${product._id}`}>
                    <div className="relative aspect-[3/4] w-full bg-theme/5 overflow-hidden mb-3">
                      {product.images?.length > 0 ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400?text=No+Image' }} />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8px] tracking-widest uppercase text-theme/20">No Image</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-serif text-theme truncate pr-2">{product.title}</h3>
                    <span className="text-xs text-theme shrink-0">₹{product.price}</span>
                  </div>

                  <div className="flex justify-between items-center mt-1 mb-3">
                    <p className="text-[8px] tracking-[0.2em] uppercase text-theme/40">{product.status}</p>
                    {product.isVerifiedProduct ? (
                      <span className="text-[7px] tracking-[0.2em] uppercase text-theme/60">Authenticated</span>
                    ) : (
                      <span className="text-[7px] tracking-[0.2em] uppercase text-shu_light dark:text-shu_dark">Pending</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveListing(product._id)}
                    className="text-[8px] tracking-[0.3em] uppercase text-shu_light dark:text-shu_dark hover:opacity-60 transition-opacity pt-2 border-t border-theme text-right"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="mt-28 text-center border-t border-theme pt-14">
          <button onClick={handleLogout} className="text-[9px] tracking-[0.4em] uppercase text-shu_light dark:text-shu_dark hover:opacity-60 transition-opacity">
            Sever Connection & Logout
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
