"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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
};

const PLATFORMS = [
  { name: "Facebook", icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
  { name: "Instagram", icon: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 6.5h11A3 3 0 0120.5 9.5v11a3 3 0 01-3 3h-11A3 3 0 013.5 20.5v-11A3 3 0 016.5 6.5z" },
  { name: "YouTube", icon: "M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33zM9.75 15.02l5.75-3.27-5.75-3.27v6.54z" },
  { name: "TikTok", icon: "M21 8.5A6 6 0 0115 2.5h-3v14a3 3 0 11-4-2.83V10.5a6 6 0 106 6V8.5z" },
  { name: "Telegram", icon: "M21.198 2.433a2.242 2.242 0 00-1.022.215l-17.5 7.5a2.25 2.25 0 00.126 4.183l4.5 1.455 1.5 4.5a2.25 2.25 0 004.148.17l2.5-3.5 4.5 3.5a2.25 2.25 0 003.585-1.583l3.5-14.5a2.25 2.25 0 00-2.837-2.94zM16 11L9 16.5V14l10.5-8L16 11z" },
  { name: "Twitter", icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" }
];

export default function NewOrderPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("Facebook");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);

  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [loadingServices, setLoadingServices] = useState<boolean>(false);

  const [link, setLink] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">("");
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedService = services.find(s => s.id === selectedServiceId) || null;
  
  const charge = selectedService && quantity && Number(quantity) > 0
    ? ((Number(quantity) / 1000) * selectedService.rate).toFixed(4) 
    : "0.0000";

  useEffect(() => {
    let isMounted = true;
    
    async function fetchCategories() {
      setLoadingCategories(true);
      if (isMounted) {
        setSelectedCategoryId(null);
        setServices([]);
        setSelectedServiceId(null);
      }
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("platform", selectedPlatform)
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error.message);
      } else if (isMounted) {
        const fetchedCategories = data as Category[];
        setCategories(fetchedCategories);
        
        if (fetchedCategories.length > 0) {
          setSelectedCategoryId(fetchedCategories[0].id);
        }
      }
      if (isMounted) setLoadingCategories(false);
    }

    fetchCategories();
    return () => { isMounted = false; };
  }, [selectedPlatform]);

  useEffect(() => {
    let isMounted = true;

    async function fetchServices() {
      if (!selectedCategoryId) {
        if (isMounted) {
          setServices([]);
          setSelectedServiceId(null);
        }
        return;
      }

      setLoadingServices(true);
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("category_id", Number(selectedCategoryId))
        .eq("status", true)
        .order("rate");

      if (error) {
        console.error("Error fetching services:", error.message);
      } else if (isMounted) {
        const fetchedServices = data as Service[];
        setServices(fetchedServices);
        
        if (fetchedServices.length > 0) {
          setSelectedServiceId(fetchedServices[0].id);
        } else {
          setSelectedServiceId(null);
        }
      }
      if (isMounted) setLoadingServices(false);
    }

    fetchServices();
    return () => { isMounted = false; };
  }, [selectedCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedService) return setError("Please select a valid service.");
    if (!link.trim()) return setError("Please provide a valid link.");
    
    const qty = Number(quantity);
    if (!qty || qty < selectedService.min_order || qty > selectedService.max_order) {
      return setError(`Quantity must be between ${selectedService.min_order.toLocaleString()} and ${selectedService.max_order.toLocaleString()}.`);
    }

    setSubmitting(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("Authentication error. Please log in to place an order.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Could not verify your account balance.");
      }

      const currentBalance = Number(profile.balance);
      const orderCharge = Number(charge);

      if (currentBalance < orderCharge) {
        throw new Error("Insufficient balance. Please add funds.");
      }

      const { error: insertError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          service_id: selectedService.id,
          link: link.trim(),
          quantity: Number(qty),
          charge: orderCharge,
          status: "Pending"
        });

      if (insertError) throw new Error(insertError.message);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: currentBalance - orderCharge })
        .eq("id", user.id);

      if (updateError) {
        console.error("Order placed but balance update failed:", updateError.message);
      }

      setSuccess("Order submitted successfully.");
      setLink("");
      setQuantity("");
    } catch (err: any) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">New Order</h1>
        <p className="text-zinc-400 mt-1">Select a platform and place your campaign instantly.</p>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
        {PLATFORMS.map((platform) => {
          const isActive = selectedPlatform === platform.name;
          return (
            <button
              key={platform.name}
              onClick={() => setSelectedPlatform(platform.name)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all duration-200 whitespace-nowrap border ${
                isActive 
                  ? "bg-orange-500/10 text-orange-500 border-orange-500 shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]" 
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d={platform.icon} />
              </svg>
              {platform.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 md:p-8">
            
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Category</label>
                <div className="relative">
                  <select 
                    value={selectedCategoryId || ""}
                    onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                    disabled={loadingCategories || categories.length === 0}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none disabled:opacity-50 transition-all"
                  >
                    {loadingCategories ? (
                      <option value="">Loading categories...</option>
                    ) : categories.length === 0 ? (
                      <option value="">No categories found</option>
                    ) : (
                      categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Service</label>
                <div className="relative">
                  <select 
                    value={selectedServiceId || ""}
                    onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                    disabled={loadingServices || services.length === 0}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none disabled:opacity-50 transition-all text-sm"
                  >
                    {loadingServices ? (
                      <option value="">Loading services...</option>
                    ) : services.length === 0 ? (
                      <option value="">No services found</option>
                    ) : (
                      services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.service_id} - {s.service_name} - ${Number(s.rate).toFixed(3)} per 1000
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Link</label>
                <input 
                  type="text" 
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g. facebook.com/username" 
                  required
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">
                    Quantity 
                    {selectedService && (
                      <span className="text-zinc-500 font-normal ml-2 text-xs">
                        (Min: {selectedService.min_order} / Max: {selectedService.max_order})
                      </span>
                    )}
                  </label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={selectedService ? String(selectedService.min_order) : "1000"} 
                    required
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Charge ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-orange-500 font-bold">$</span>
                    </div>
                    <input 
                      type="text" 
                      readOnly 
                      value={charge}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl pl-8 pr-4 py-3.5 text-orange-500 font-bold focus:outline-none cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting || !selectedService}
                className="w-full py-4 mt-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white font-black text-lg rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_-5px_rgba(249,115,22,0.6)] flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Order"
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-orange-500/20 rounded-3xl p-6 sticky top-24 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] pointer-events-none group-hover:bg-orange-500/10 transition-all"></div>
            
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Service Details
            </h3>

            {selectedService ? (
              <div className="space-y-4 text-sm relative z-10">
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <span className="text-zinc-400 font-medium">Service ID</span>
                  <span className="font-bold text-orange-500">#{selectedService.service_id}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <span className="text-zinc-400 font-medium">Rate per 1000</span>
                  <span className="font-bold text-orange-500">${Number(selectedService.rate).toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <span className="text-zinc-400 font-medium">Min Order</span>
                  <span className="font-semibold text-zinc-100">{selectedService.min_order.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <span className="text-zinc-400 font-medium">Max Order</span>
                  <span className="font-semibold text-zinc-100">{selectedService.max_order.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <span className="text-zinc-400 font-medium">Speed</span>
                  <span className="font-semibold text-zinc-100">{selectedService.speed || "Not specified"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <span className="text-zinc-400 font-medium">Quality</span>
                  <span className="font-semibold text-zinc-100">{selectedService.quality || "Standard"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <span className="text-zinc-400 font-medium">Refill</span>
                  <span className="font-semibold text-zinc-100">{selectedService.refill || "No Refill"}</span>
                </div>
                
                <div className="pt-4 mt-4 border-t border-zinc-800/80">
                  <span className="block text-zinc-400 font-semibold mb-2 uppercase tracking-wider text-xs">Description</span>
                  <div className="text-zinc-300 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap">
                    {selectedService.description || "No specific description provided for this service."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-sm text-center py-12">
                Select a service from the dropdown to view its detailed specifications and requirements here.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}