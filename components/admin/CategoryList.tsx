'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  label: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isVisible: boolean;
  isPublished: boolean;
}

export default function CategoryList({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCat, setNewCat] = useState({
    name: '',
    label: '',
    slug: '',
    description: '',
    imageUrl: '',
    displayOrder: 0,
  });
  const [editData, setEditData] = useState<Partial<Category>>({});

  const autoSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCat,
          label: newCat.label || newCat.name,
          slug: newCat.slug || autoSlug(newCat.name),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add category');
      }
      setNewCat({ name: '', label: '', slug: '', description: '', imageUrl: '', displayOrder: 0 });
      setShowAddForm(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error('Failed to update category');
      setEditingId(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !isVisible }),
      });
      if (!res.ok) throw new Error('Failed to update');
      router.refresh();
    } catch {
      alert('Failed to update visibility');
    }
  };

  
const handleDelete = async (id: string) => {
  const category = initialCategories.find(
    (cat) => cat.id === id
  );

  if (!category || loading) return;

  const confirmed = window.confirm(
    `WARNING: PERMANENT DELETE\n\n` +
    `Category: ${category.name}\n\n` +
    `Deleting this category will also permanently delete ALL products assigned to it.\n\n` +
    `This includes products assigned to multiple categories.\n\n` +
    `This action cannot be undone.\n\n` +
    `Are you sure you want to continue?`
  );

  if (!confirmed) return;

  setLoading(true);

  try {
    const res = await fetch(
      `/api/admin/categories/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(
        data.error || 'Failed to delete category'
      );
    }

    alert(
      `Category deleted successfully!\n\n` +
      `Category: ${category.name}\n` +
      `Products deleted: ${data.deletedProductCount}`
    );

    router.refresh();
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Failed to delete category';

    alert(message);
  } finally {
    setLoading(false);
  }
};


  const fieldClass = "border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-black w-full";

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition cursor-pointer"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? 'CANCEL' : 'ADD CATEGORY'}
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold tracking-wider text-gray-600 mb-1 block">NAME *</label>
              <input
                value={newCat.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewCat((prev) => ({
                    ...prev,
                    name: val,
                    label: prev.label || val,
                    slug: prev.slug || autoSlug(val),
                  }));
                }}
                required
                className={fieldClass}
                placeholder="Hair Dryers"
              />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider text-gray-600 mb-1 block">DISPLAY LABEL</label>
              <input
                value={newCat.label}
                onChange={(e) => setNewCat({ ...newCat, label: e.target.value })}
                className={fieldClass}
                placeholder="Hair Dryers"
              />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider text-gray-600 mb-1 block">SLUG</label>
              <input
                value={newCat.slug}
                onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                className={fieldClass}
                placeholder="hair-dryers"
              />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider text-gray-600 mb-1 block">DISPLAY ORDER</label>
              <input
                type="number"
                value={newCat.displayOrder}
                onChange={(e) => setNewCat({ ...newCat, displayOrder: parseInt(e.target.value) || 0 })}
                className={fieldClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold tracking-wider text-gray-600 mb-1 block">DESCRIPTION</label>
              <input
                value={newCat.description}
                onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                className={fieldClass}
                placeholder="Category description"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold tracking-wider text-gray-600 mb-1 block">IMAGE URL</label>
              <input
                value={newCat.imageUrl}
                onChange={(e) => setNewCat({ ...newCat, imageUrl: e.target.value })}
                className={fieldClass}
                placeholder="https://..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-5 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'SAVING...' : 'CREATE CATEGORY'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500">CATEGORY</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500 hidden md:table-cell">LABEL</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500 hidden sm:table-cell">ORDER</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500">VISIBLE</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialCategories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No categories found. Click &quot;Add Category&quot; above to create one.
                </td>
              </tr>
            )}
            {initialCategories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editingId === cat.id ? (
                    <input
                      defaultValue={cat.name}
                      onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                      className={fieldClass}
                    />
                  ) : (
                    <div>
                      <span className="font-medium text-gray-900">{cat.name}</span>
                      <span className="text-xs text-gray-400 block">{cat.slug}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {editingId === cat.id ? (
                    <input
                      defaultValue={cat.label}
                      onChange={(e) => setEditData((prev) => ({ ...prev, label: e.target.value }))}
                      className={fieldClass}
                    />
                  ) : (
                    cat.label
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {editingId === cat.id ? (
                    <input
                      type="number"
                      defaultValue={cat.displayOrder}
                      onChange={(e) => setEditData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                      className="border border-gray-300 px-2 py-1 text-sm w-16"
                    />
                  ) : (
                    cat.displayOrder
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleVisibility(cat.id, cat.isVisible)}
                    className={`text-xs font-bold px-2 py-1 rounded cursor-pointer ${
                      cat.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {cat.isVisible ? '✓ Visible' : '— Hidden'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editingId === cat.id ? (
                      <>
                        <button
                          onClick={() => handleEdit(cat.id)}
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
                            setEditingId(cat.id);
                            setEditData({ name: cat.name, label: cat.label, displayOrder: cat.displayOrder });
                          }}
                          className="text-gray-500 hover:text-black p-1 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
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
