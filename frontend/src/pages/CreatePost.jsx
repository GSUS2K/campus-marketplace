import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageIntro } from '../components/Ui';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CATEGORIES = ['Books', 'Electronics', 'Apparel', 'Miscellaneous'];
const HOSTEL_GROUPS = {
  'Boys Hostels': ['BH1', 'BH2', 'BH3', 'BH4', 'BH5', 'BH6', 'BH7', 'BH8', 'BH9', 'BH10'],
  Other: ['Boys Studio', 'Day Scholar', 'Staff Residence'],
  'Girls Hostels': ['GH1', 'GH2', 'GH3', 'GH4', 'GH5', 'GH6']
};
const ALL_HOSTELS = Object.values(HOSTEL_GROUPS).flat();

const CreatePost = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Books',
    condition: 'like_new',
    campusLocation: 'BH1'
  });

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [previews]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setImages(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    if (images.length < 3) {
      setErrorMsg('A minimum of 3 physical images is required per listing.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('trms_token');
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      images.forEach((img) => payload.append('images', img));

      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to consign item');
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen pt-32 pb-24 px-4 sm:px-8 text-theme">
      <div className="glass-panel mx-auto max-w-4xl rounded-[2rem] p-6 sm:p-10 lg:p-14">
        <PageIntro eyebrow="Seller workspace" title="Create a listing" description="Give your item a clear story, a fair price, and enough detail for a confident campus pickup." />

        {errorMsg && (
          <div className="mb-8 p-4 border border-theme/15 rounded-2xl text-center bg-theme/5">
            <p className="text-[10px] tracking-[0.3em] uppercase text-theme/80">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Designation</label>
            <input
              type="text"
              name="title"
              required
              onChange={handleChange}
              value={formData.title}
              placeholder="Vintage Sony Walkman"
              className="w-full bg-transparent border-b border-theme/30 focus:border-theme outline-none py-3 text-2xl font-serif text-theme placeholder:text-theme/40 transition-colors"
            />
          </div>

          <div>
            <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Provenance / Details</label>
            <textarea
              name="description"
              required
              rows="4"
              onChange={handleChange}
              value={formData.description}
              placeholder="Describe the item's history, condition, and any flaws..."
              className="w-full bg-transparent border-b border-theme/30 focus:border-theme outline-none py-3 text-sm font-sans font-light text-theme placeholder:text-theme/40 resize-none leading-relaxed transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Valuation (₹)</label>
              <input
                type="number"
                name="price"
                required
                min="0"
                onChange={handleChange}
                value={formData.price}
                placeholder="4500"
                className="w-full bg-transparent border-b border-theme/30 focus:border-theme outline-none py-3 text-2xl font-serif text-theme placeholder:text-theme/40 transition-colors"
              />
            </div>

            <div>
              <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Category</label>
              <select
                name="category"
                onChange={handleChange}
                value={formData.category}
                className="w-full bg-transparent border-b border-theme/30 focus:border-theme outline-none py-3 text-[9px] tracking-[0.2em] uppercase text-theme cursor-pointer appearance-none transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-bg text-theme">{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Condition</label>
              <select
                name="condition"
                onChange={handleChange}
                value={formData.condition}
                className="w-full bg-transparent border-b border-theme/30 py-4 text-xs tracking-widest uppercase focus:outline-none focus:border-theme transition-colors cursor-pointer appearance-none text-theme"
              >
                <option value="new" className="bg-bg text-theme">Brand New</option>
                <option value="like_new" className="bg-bg text-theme">Like New</option>
                <option value="good" className="bg-bg text-theme">Good</option>
                <option value="fair" className="bg-bg text-theme">Fair</option>
                <option value="poor" className="bg-bg text-theme">Heavy Wear</option>
                <option value="needs_repair" className="bg-bg text-theme">Needs Repair</option>
              </select>
            </div>

            <div>
              <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Your Location</label>
              <select
                name="campusLocation"
                onChange={handleChange}
                value={formData.campusLocation}
                className="w-full bg-transparent border-b border-theme/30 focus:border-theme outline-none py-3 text-[9px] tracking-[0.2em] uppercase text-theme cursor-pointer appearance-none transition-colors"
              >
                {ALL_HOSTELS.map((h) => (
                  <option key={h} value={h} className="bg-bg text-theme">{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">
              Editorial Images <span className="text-theme/50">Min 3 Required</span>
            </label>
            <label className="glass-control flex cursor-pointer flex-col items-center justify-center rounded-2xl border-dashed py-16 transition-colors group hover:bg-theme/8">
              <div className="text-center">
                <p className="text-2xl font-serif text-theme/20 mb-2">+</p>
                <p className="text-[8px] uppercase tracking-widest text-theme/40 group-hover:text-theme transition-colors">
                  {images.length > 0 ? `${images.length} file(s) selected` : 'Add Visual'}
                </p>
              </div>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="aspect-square bg-theme/5 border border-theme/10 overflow-hidden rounded-2xl">
                    <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-16 py-5 bg-theme text-bg text-[9px] tracking-[0.4em] uppercase hover:opacity-80 transition-opacity disabled:opacity-40 rounded-full"
            >
              {isSubmitting ? 'Submitting...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
