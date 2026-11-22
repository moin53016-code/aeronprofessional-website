'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';

interface Banner {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  buttonLabel: string | null;
  buttonTarget: string | null;
  displayOrder: number;
  isActive: boolean;
}

export default function BannerList({ initialBanners }: { initialBanners: Banner[] }) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    eyebrow: '',
    title: '',
    description: '',
    imageUrl: '',
    mobileImageUrl: '',
    buttonLabel: 'SHOP NOW',
    buttonTarget: 'Shop All',
    displayOrder: 0,
    isActive: true,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.imageUrl.trim()) {
      alert('Title and Image URL are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create banner');
      setShowAddForm(false);
      setFormData({
        eyebrow: '',
        title: '',
        description: '',
        imageUrl: '',
        mobileImageUrl: '',
        buttonLabel: 'SHOP NOW',
        buttonTarget: 'Shop All',
        displayOrder: 0,
        isActive: true,
      });
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create banner');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/banners/${editingBanner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBanner),
      });
      if (!res.ok) throw new Error('Failed to update banner');
      setEditingBanner(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update banner');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      router.refresh();
    } catch {
      alert('Failed to update banner status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete banner');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete banner');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black";
  const labelClass = "block text-xs font-bold tracking-wider text-gray-600 mb-1";

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingBanner(null);
          }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition cursor-pointer"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? 'CANCEL' : 'ADD BANNER'}
        </button>
      </div>

      {/* Add Banner Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add Homepage Banner Slide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>EYEBROW (TOP SUBTITLE) *</label>
              <input
                value={formData.eyebrow}
                onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
                required
                className={fieldClass}
                placeholder="PROFESSIONAL SALON GRADE"
              />
            </div>
            <div>
              <label className={labelClass}>TITLE *</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className={fieldClass}
                placeholder="HIGH-SPEED HAIR DRYER"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>DESCRIPTION *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                required
                className={fieldClass}
                placeholder="110,000 RPM brushless motor with ionic technology"
              />
            </div>
            <div>
              <label className={labelClass}>IMAGE URL (DESKTOP) *</label>
              <input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                required
                className={fieldClass}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className={labelClass}>IMAGE URL (MOBILE)</label>
              <input
                value={formData.mobileImageUrl}
                onChange={(e) => setFormData({ ...formData, mobileImageUrl: e.target.value })}
                className={fieldClass}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className={labelClass}>BUTTON LABEL</label>
              <input
                value={formData.buttonLabel}
                onChange={(e) => setFormData({ ...formData, buttonLabel: e.target.value })}
                className={fieldClass}
                placeholder="SHOP NOW"
              />
            </div>
            <div>
              <label className={labelClass}>BUTTON TARGET / URL</label>
              <input
                value={formData.buttonTarget}
                onChange={(e) => setFormData({ ...formData, buttonTarget: e.target.value })}
                className={fieldClass}
                placeholder="/shop or Shop All"
              />
            </div>
            <div>
              <label className={labelClass}>DISPLAY ORDER</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className={fieldClass}
              />
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="accent-black w-4 h-4"
                />
                <span className="text-sm font-medium">Active (Visible on Homepage)</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-5 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'SAVING...' : 'SAVE BANNER'}
          </button>
        </form>
      )}

      {/* Edit Banner Modal / Inline Form */}
      {editingBanner && (
        <form onSubmit={handleUpdate} className="bg-white border-2 border-[#c6a77a] p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Edit Banner: {editingBanner.title}</h3>
            <button
              type="button"
              onClick={() => setEditingBanner(null)}
              className="text-gray-400 hover:text-black cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>EYEBROW</label>
              <input
                value={editingBanner.eyebrow}
                onChange={(e) => setEditingBanner({ ...editingBanner, eyebrow: e.target.value })}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>TITLE</label>
              <input
                value={editingBanner.title}
                onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                required
                className={fieldClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>DESCRIPTION</label>
              <textarea
                value={editingBanner.description}
                onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                rows={2}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>IMAGE URL</label>
              <input
                value={editingBanner.imageUrl}
                onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>BUTTON LABEL</label>
              <input
                value={editingBanner.buttonLabel ?? ''}
                onChange={(e) => setEditingBanner({ ...editingBanner, buttonLabel: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>BUTTON TARGET</label>
              <input
                value={editingBanner.buttonTarget ?? ''}
                onChange={(e) => setEditingBanner({ ...editingBanner, buttonTarget: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>DISPLAY ORDER</label>
              <input
                type="number"
                value={editingBanner.displayOrder}
                onChange={(e) => setEditingBanner({ ...editingBanner, displayOrder: parseInt(e.target.value) || 0 })}
                className={fieldClass}
              />
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingBanner.isActive}
                  onChange={(e) => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                  className="accent-black w-4 h-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-5 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'SAVING...' : 'UPDATE BANNER'}
            </button>
            <button
              type="button"
              onClick={() => setEditingBanner(null)}
              className="border border-gray-300 px-4 py-2 text-xs font-bold tracking-wider hover:bg-gray-50 transition cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* Banner Cards Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {initialBanners.length === 0 && (
          <div className="col-span-2 bg-white border border-gray-200 p-8 text-center text-gray-400">
            No banners found. Add a banner above.
          </div>
        )}
        {initialBanners.map((banner) => (
          <div key={banner.id} className="bg-white border border-gray-200 overflow-hidden flex flex-col">
            <div className="h-44 bg-gray-100 relative overflow-hidden">
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow ${
                  banner.isActive ? 'bg-green-600 text-white' : 'bg-gray-700 text-white'
                }`}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  Order: {banner.displayOrder}
                </span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="text-[10px] tracking-wider font-bold text-[#c6a77a] uppercase">{banner.eyebrow}</div>
              <h4 className="text-base font-bold text-gray-900 mt-1">{banner.title}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{banner.description}</p>
              {banner.buttonLabel && (
                <div className="text-xs text-gray-400 mt-2">
                  Button: <span className="text-gray-700 font-medium">{banner.buttonLabel}</span> → {banner.buttonTarget}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-100 mt-4 pt-3">
                <button
                  onClick={() => handleToggleActive(banner.id, banner.isActive)}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-black cursor-pointer"
                >
                  {banner.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                  {banner.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingBanner(banner);
                      setShowAddForm(false);
                    }}
                    className="text-gray-600 hover:text-black p-1 cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
