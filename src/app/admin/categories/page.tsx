"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: number;
  name: string;
  platform: string;
};

const PLATFORMS = ["Facebook", "Instagram", "YouTube", "TikTok", "Telegram", "Twitter", "Other"];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
  }, [supabase]);

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("id", { ascending: true });
      
    if (!error && data) {
      setCategories(data as Category[]);
    }
    setLoading(false);
  }

  function openModal(category?: Category) {
    if (category) {
      setEditingId(category.id);
      setName(category.name);
      setPlatform(category.platform);
    } else {
      setEditingId(null);
      setName("");
      setPlatform(PLATFORMS[0]);
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingId) {
      await supabase.from("categories").update({ name, platform }).eq("id", editingId);
    } else {
      await supabase.from("categories").insert({ name, platform });
    }

    setIsSubmitting(false);
    closeModal();
    fetchCategories();
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this category? All associated services might be affected.")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Manage Categories</h1>
          <p className="text-zinc-400 mt-1">Create and manage service categories.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20"
        >
          + Add Category
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-5 border-b border-zinc-800/50 w-24">ID</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Platform</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Category Name</th>
                <th className="px-6 py-5 border-b border-zinc-800/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">Loading categories...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">No categories found.</td></tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-400">{cat.id}</td>
                    <td className="px-6 py-4 font-bold text-white">{cat.platform}</td>
                    <td className="px-6 py-4 text-white">{cat.name}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => openModal(cat)} className="text-blue-400 hover:text-blue-300 font-medium">Edit</button>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-400 font-medium">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingId ? "Edit Category" : "Add Category"}</h3>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Platform</label>
                <select 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                >
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Category Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-zinc-400 hover:text-white font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}