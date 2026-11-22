'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, Save, X, Tag } from 'lucide-react';

interface DiscountCampaign {
  id: string;
  name: string;
  description: string | null;
  discountLabel: string | null;
  isActive: boolean;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  createdAt: Date | string;
}

export default function DiscountList({ initialCampaigns }: { initialCampaigns: DiscountCampaign[] }) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    discountLabel: '',
    isActive: true,
  });

  const [editData, setEditData] = useState<Partial<DiscountCampaign>>({});

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });
      if (!res.ok) throw new Error('Failed to create campaign');
      setShowAddForm(false);
      setNewCampaign({ name: '', description: '', discountLabel: '', isActive: true });
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error('Failed to update campaign');
      setEditingId(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle active status');
      router.refresh();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete campaign');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "w-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:border-black";
  const labelClass = "block text-xs font-bold tracking-wider text-gray-600 mb-1";

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition cursor-pointer"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? 'CANCEL' : 'ADD DISCOUNT CAMPAIGN'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Create Promotional Campaign</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>CAMPAIGN NAME *</label>
              <input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                required
                className={fieldClass}
                placeholder="Festival Sale 2026"
              />
            </div>
            <div>
              <label className={labelClass}>DISCOUNT BADGE / LABEL</label>
              <input
                value={newCampaign.discountLabel}
                onChange={(e) => setNewCampaign({ ...newCampaign, discountLabel: e.target.value })}
                className={fieldClass}
                placeholder="UP TO 20% OFF"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>DESCRIPTION</label>
              <textarea
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                rows={2}
                className={fieldClass}
                placeholder="Promotional campaign details and terms..."
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCampaign.isActive}
                  onChange={(e) => setNewCampaign({ ...newCampaign, isActive: e.target.checked })}
                  className="accent-black w-4 h-4"
                />
                <span className="text-sm font-medium">Activate Immediately</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-5 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'SAVING...' : 'CREATE CAMPAIGN'}
          </button>
        </form>
      )}

      {/* Campaign List */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500">CAMPAIGN</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500 hidden md:table-cell">LABEL</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500 hidden sm:table-cell">CREATED</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500">STATUS</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialCampaigns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No promotional campaigns created yet.
                </td>
              </tr>
            )}
            {initialCampaigns.map((camp) => (
              <tr key={camp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editingId === camp.id ? (
                    <input
                      defaultValue={camp.name}
                      onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                      className={fieldClass}
                    />
                  ) : (
                    <div>
                      <div className="font-semibold text-gray-900">{camp.name}</div>
                      {camp.description && <div className="text-xs text-gray-400">{camp.description}</div>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {editingId === camp.id ? (
                    <input
                      defaultValue={camp.discountLabel ?? ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, discountLabel: e.target.value }))}
                      className={fieldClass}
                    />
                  ) : (
                    camp.discountLabel ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-[#f6f4ef] text-[#977447] border border-[#e5d8c8] rounded">
                        <Tag size={11} /> {camp.discountLabel}
                      </span>
                    ) : '—'
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                  {new Date(camp.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(camp.id, camp.isActive)}
                    className={`text-xs font-bold px-2 py-1 rounded cursor-pointer ${
                      camp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {camp.isActive ? '✓ Active' : '— Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editingId === camp.id ? (
                      <>
                        <button
                          onClick={() => handleEdit(camp.id)}
                          disabled={loading}
                          className="text-green-700 hover:text-green-900 p-1 cursor-pointer"
                          title="Save"
                        >
                          <Save size={15} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                          title="Cancel"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(camp.id);
                            setEditData({ name: camp.name, discountLabel: camp.discountLabel, description: camp.description });
                          }}
                          className="text-gray-500 hover:text-black p-1 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(camp.id)}
                          className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
