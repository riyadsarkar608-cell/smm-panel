"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: number;
  name: string;
  platform: string;
};

type Service = {
  id: number;
  service_id: number;
  service_name: string;
  platform: string;
  category_id: number;
  rate: number;
  min_order: number;
  max_order: number;
  speed: string | null;
  quality: string | null;
  refill: string | null;
  description: string | null;
  status: boolean;
  categories?: { name: string };
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Service>>({
    service_id: 0,
    service_name: "",
    platform: "Facebook",
    category_id: 0,
    rate: 0,
    min_order: 10,
    max_order: 10000,
    speed: "",
    quality: "",
    refill: "",
    description: "",
    status: true
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [supabase]);

  async function fetchData() {
    setLoading(true);
    const [servRes, catRes] = await Promise.all([
      supabase.from("services").select("*, categories(name)").order("id", { ascending: false }),
      supabase.from("categories").select("*").order("name", { ascending: true })
    ]);

    if (!servRes.error) setServices(servRes.data as Service[]);
    if (!catRes.error) setCategories(catRes.data as Category[]);
    setLoading(false);
  }

  function openModal(service?: Service) {
    if (service) {
      setEditingId(service.id);
      setFormData(service);
    } else {
      setEditingId(null);
      setFormData({
        service_id: 0,
        service_name: "",
        platform: categories.length > 0 ? categories[0].platform : "Facebook",
        category_id: categories.length > 0 ? categories[0].id : 0,
        rate: 0.00,
        min_order: 10,
        max_order: 10000,
        speed: "Instant",
        quality: "High",
        refill: "No Refill",
        description: "",
        status: true
      });
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === "category_id") {
      const selectedCat = categories.find(c => c.id === Number(value));
      setFormData(prev => ({
        ...prev,
        category_id: Number(value),
        platform: selectedCat ? selectedCat.platform : prev.platform
      }));
    } else if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === "number" || name === "rate") {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      service_id: formData.service_id,
      service_name: formData.service_name,
      platform: formData.platform,
      category_id: formData.category_id,
      rate: formData.rate,
      min_order: formData.min_order,
      max_order: formData.max_order,
      speed: formData.speed,
      quality: formData.quality,
      refill: formData.refill,
      description: formData.description,
      status: formData.status
    };

    if (editingId) {
      await supabase.from("services").update(payload).eq("id", editingId);
    } else {
      await supabase.from("services").insert(payload);
    }

    setIsSubmitting(false);
    closeModal();
    fetchData();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    await supabase.from("services").delete().eq("id", id);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Manage Services</h1>
          <p className="text-zinc-400 mt-1">Create and configure platform services.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20"
        >
          + Add Service
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-5 border-b border-zinc-800/50">Provider ID</th>
                <th className="px-6 py-5 border-b border-zinc-800/50 min-w-[250px]">Service</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Category</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Rate / 1k</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Min/Max</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Status</th>
                <th className="px-6 py-5 border-b border-zinc-800/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-500">Loading services...</td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-500">No services found.</td></tr>
              ) : (
                services.map((svc) => (
                  <tr key={svc.id} className={`hover:bg-zinc-800/30 transition-colors ${!svc.status ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 font-mono text-zinc-400">#{svc.service_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white truncate max-w-xs">{svc.service_name}</div>
                      <div className="text-xs text-zinc-500">{svc.platform}</div>
                    </td>
                    <td className="px-6 py-4 text-white text-xs truncate max-w-[150px]">{svc.categories?.name}</td>
                    <td className="px-6 py-4 font-bold text-orange-500">${Number(svc.rate).toFixed(4)}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{svc.min_order} / {svc.max_order}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md border ${svc.status ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {svc.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => openModal(svc)} className="text-blue-400 hover:text-blue-300 font-medium">Edit</button>
                      <button onClick={() => handleDelete(svc.id)} className="text-red-500 hover:text-red-400 font-medium">Del</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl my-8">
            <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 rounded-t-3xl z-10">
              <h3 className="text-xl font-bold text-white">{editingId ? "Edit Service" : "Add Service"}</h3>
              <button type="button" onClick={closeModal} className="text-zinc-500 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Service ID (Provider ID)</label>
                  <input type="number" name="service_id" value={formData.service_id} onChange={handleChange} required className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Category</label>
                  <select name="category_id" value={formData.category_id} onChange={handleChange} required className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.platform} - {c.name}</option>)}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Service Name</label>
                  <input type="text" name="service_name" value={formData.service_name} onChange={handleChange} required className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Rate per 1000 ($)</label>
                  <input type="number" step="0.0001" name="rate" value={formData.rate} onChange={handleChange} required className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Min Order</label>
                    <input type="number" name="min_order" value={formData.min_order} onChange={handleChange} required className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Max Order</label>
                    <input type="number" name="max_order" value={formData.max_order} onChange={handleChange} required className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Speed</label>
                  <input type="text" name="speed" value={formData.speed || ""} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Quality</label>
                  <input type="text" name="quality" value={formData.quality || ""} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Refill Guarantee</label>
                  <input type="text" name="refill" value={formData.refill || ""} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="flex items-center mt-8">
                  <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} id="statusCheck" className="w-5 h-5 accent-orange-500" />
                  <label htmlFor="statusCheck" className="ml-2 text-sm font-bold text-white">Service is Active</label>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Description / Instructions</label>
                  <textarea name="description" value={formData.description || ""} onChange={handleChange} rows={4} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 resize-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-zinc-400 hover:text-white font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-50 shadow-lg shadow-orange-500/20">
                  {isSubmitting ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}