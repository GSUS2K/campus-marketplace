import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Books', 'Electronics', 'Apparel', 'Miscellaneous'];
const HOSTEL_GROUPS = {
  'Boys Hostels': ['BH1', 'BH2', 'BH3', 'BH4', 'BH5', 'BH6', 'BH7', 'BH8', 'BH9', 'BH10'],
  'Other': ['Boys Studio', 'Day Scholar', 'Staff Residence'],
  'Girls Hostels': ['GH1', 'GH2', 'GH3', 'GH4', 'GH5', 'GH6'],
};
const ALL_HOSTELS = Object.values(HOSTEL_GROUPS).flat();

const CreatePost = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [formData, setFormData] = useState({
    title: '', description: '', price: '',
    category: 'Books', condition: 'like_new', campusLocation: 'BH1'
  });

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = e => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async e => {
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
      Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
      images.forEach(img => payload.append('images', img));

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`, {
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
    <div className="w-full bg-transparent text-theme min-h-screen pt-32 pb-32 px-8 sm:px-14 animate-fade-in transition-colors duration-300 relative z-10">
      <div className="max-w-3xl mx-auto bg-bg/95 backdrop-blur-xl border border-theme/10 rounded-[3rem] p-10 lg:p-16 shadow-2xl">

        <header className="mb-16 text-center">
          <p className="text-[9px] tracking-[0.5em] uppercase text-theme/30 mb-4">Consignment Application</p>
          <h1 className="text-5xl font-serif font-light text-theme">
            Add to <em className="not-italic italic opacity-60">Archive</em>.
          </h1>
        </header>

        {errorMsg && (
          <div className="mb-10 p-4 border border-shu_light/30 dark:border-shu_dark/30 text-center">
            <p className="text-[9px] tracking-[0.3em] uppercase text-shu_light dark:text-shu_dark">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-14">

          {/* Title */}
          <div className="relative group">
            <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Designation</label>
            <input
              type="text" name="title" required onChange={handleChange} value={formData.title}
              placeholder="Vintage Sony Walkman"
              className="w-full bg-transparent border-b border-theme/40 focus:border-theme outline-none py-3 text-2xl font-serif text-theme placeholder:text-theme/40 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Provenance / Details</label>
            <textarea
              name="description" required rows="3" onChange={handleChange} value={formData.description}
              placeholder="Describe the item's history, specifications, and any flaws..."
              className="w-full bg-transparent border-b border-theme/40 focus:border-theme outline-none py-3 text-sm font-sans font-light text-theme placeholder:text-theme/40 resize-none leading-relaxed transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-10">
            {/* Price */}
            <div>
              <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Valuation (₹)</label>
              <input
                type="number" name="price" required min="0" onChange={handleChange} value={formData.price}
                placeholder="4500"
                className="w-full bg-transparent border-b border-theme/40 focus:border-theme outline-none py-3 text-2xl font-serif text-theme placeholder:text-theme/40 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Category</label>
              <select
                name="category" onChange={handleChange} value={formData.category}
                className="w-full bg-transparent border-b border-theme/40 focus:border-theme outline-none py-3 text-[9px] tracking-[0.2em] uppercase text-theme cursor-pointer appearance-none transition-colors"
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-cream dark:bg-void">{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {/* Condition */}
            <div>
              <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Condition</label>
              <select 
                name="condition" onChange={handleChange} value={formData.condition}
                className="w-full bg-transparent border-b border-theme/40 py-4 text-xs tracking-widest uppercase focus:outline-none focus:border-theme transition-colors cursor-pointer appearance-none text-theme">
                <option value="new" className="bg-cream dark:bg-void">Brand New</option>
                <option value="like_new" className="bg-cream dark:bg-void">Like New</option>
                <option value="good" className="bg-cream dark:bg-void">Good</option>
                <option value="fair" className="bg-cream dark:bg-void">Fair (Visible Wear)</option>
                <option value="poor" className="bg-cream dark:bg-void">Heavy Wear</option>
                <option value="needs_repair" className="bg-cream dark:bg-void">Needs Repair (For Parts)</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">Your Location</label>
              <select
                name="campusLocation" onChange={handleChange} value={formData.campusLocation}
                className="w-full bg-transparent border-b border-theme/40 focus:border-theme outline-none py-3 text-[9px] tracking-[0.2em] uppercase text-theme cursor-pointer appearance-none transition-colors"
              >
                {ALL_HOSTELS.map(h => <option key={h} value={h} className="bg-bg text-theme">{h}</option>)}
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block mb-3 text-[8px] tracking-[0.4em] uppercase text-theme/30">
              Editorial Images <span className="text-shu_light dark:text-shu_dark">Min 3 Required</span>
            </label>
            <label className="border-[2px] border-dashed border-theme/20 flex flex-col items-center justify-center cursor-pointer hover:bg-theme/5 transition-colors group py-16">
              <div className="text-center">
                <p className="text-2xl font-serif text-theme/20 mb-2">+</p>
                <p className="text-[8px] uppercase tracking-widest text-theme/40 group-hover:text-theme transition-colors">
                  {images.length > 0 ? `${images.length} file(s) selected` : 'Add Visual'}
                </p>
              </div>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {previews.map((src, i) => (
                  <div key={i} className="shrink-0 w-20 h-20 bg-theme/5 border border-theme/10 overflow-hidden">
                    <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-8 text-center">
            <button
              type="submit" disabled={isSubmitting}
              className="px-16 py-5 bg-theme text-bg text-[9px] tracking-[0.4em] uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {isSubmitting ? 'Authenticating…' : 'Submit to Archive'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreatePost;
