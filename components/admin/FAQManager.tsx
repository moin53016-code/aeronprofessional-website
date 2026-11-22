'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Save, X, HelpCircle } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
}

export default function FAQManager({ initialFaqs }: { initialFaqs: FAQ[] }) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    displayOrder: 0,
    isActive: true,
  });

  const [editData, setEditData] = useState<Partial<FAQ>>({});

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFaq),
      });
      if (!res.ok) throw new Error('Failed to create FAQ');
      setShowAddForm(false);
      setNewFaq({ question: '', answer: '', displayOrder: 0, isActive: true });
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error('Failed to update FAQ');
      setEditingId(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      router.refresh();
    } catch {
      alert('Failed to update FAQ status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete FAQ');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete FAQ');
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
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition cursor-pointer"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? 'CANCEL' : 'ADD FAQ'}
        </button>
      </div>

      {/* Add FAQ Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add Frequently Asked Question</h3>
          <div className="space-y-4 mb-4">
            <div>
              <label className={labelClass}>QUESTION *</label>
              <input
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                required
                className={fieldClass}
                placeholder="What is the warranty period on AERON dryers?"
              />
            </div>
            <div>
              <label className={labelClass}>ANSWER *</label>
              <textarea
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                rows={3}
                required
                className={fieldClass}
                placeholder="AERON PROFESSIONAL products come with a 2-year manufacturer warranty..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>DISPLAY ORDER</label>
                <input
                  type="number"
                  value={newFaq.displayOrder}
                  onChange={(e) => setNewFaq({ ...newFaq, displayOrder: parseInt(e.target.value) || 0 })}
                  className={fieldClass}
                />
              </div>
              <div className="flex items-center mt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFaq.isActive}
                    onChange={(e) => setNewFaq({ ...newFaq, isActive: e.target.checked })}
                    className="accent-black w-4 h-4"
                  />
                  <span className="text-sm font-medium">Active (Visible on Site)</span>
                </label>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-5 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'SAVING...' : 'SAVE FAQ'}
          </button>
        </form>
      )}

      {/* FAQ Items */}
      <div className="space-y-3">
        {initialFaqs.length === 0 && (
          <div className="bg-white border border-gray-200 p-8 text-center text-gray-400">
            No FAQs found. Click &quot;Add FAQ&quot; above to create one.
          </div>
        )}
        {initialFaqs.map((faq) => (
          <div key={faq.id} className="bg-white border border-gray-200 p-5">
            {editingId === faq.id ? (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>QUESTION</label>
                  <input
                    defaultValue={faq.question}
                    onChange={(e) => setEditData((prev) => ({ ...prev, question: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>ANSWER</label>
                  <textarea
                    defaultValue={faq.answer}
                    onChange={(e) => setEditData((prev) => ({ ...prev, answer: e.target.value }))}
                    rows={3}
                    className={fieldClass}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-600">ORDER:</label>
                    <input
                      type="number"
                      defaultValue={faq.displayOrder}
                      onChange={(e) => setEditData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                      className="border border-gray-300 px-2 py-1 text-sm w-16"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(faq.id)}
                      disabled={loading}
                      className="flex items-center gap-1 bg-black text-white px-3 py-1.5 text-xs font-bold hover:bg-gray-800 cursor-pointer"
                    >
                      <Save size={13} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="border border-gray-300 px-3 py-1.5 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2">
                    <HelpCircle size={16} className="text-[#c6a77a] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{faq.question}</h4>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{faq.answer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(faq.id, faq.isActive)}
                      className={`text-xs font-bold px-2 py-1 rounded cursor-pointer ${
                        faq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {faq.isActive ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(faq.id);
                        setEditData({ question: faq.question, answer: faq.answer, displayOrder: faq.displayOrder });
                      }}
                      className="text-gray-500 hover:text-black p-1 cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 mt-2">Display order: {faq.displayOrder}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
