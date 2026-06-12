"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Ticket = {
  id: number;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

type Reply = {
  id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
};

export default function SupportPage() {
  const supabase = createClient();
  
  const [view, setView] = useState<"list" | "create" | "thread">("list");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data as Ticket[]);
    }
    setLoading(false);
  }

  async function handleViewTicket(ticket: Ticket) {
    setActiveTicket(ticket);
    setView("thread");
    setLoading(true);
    
    const { data, error } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setReplies(data as Reply[]);
    }
    setLoading(false);
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("tickets").insert({
      user_id: user.id,
      subject,
      message,
      status: "Pending"
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSubject("");
      setMessage("");
      setView("list");
      fetchTickets();
    }
    setIsSubmitting(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim()) return;
    
    setIsSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("ticket_replies").insert({
      ticket_id: activeTicket.id,
      user_id: user.id,
      message: replyMessage,
      is_admin: false
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      // Also update ticket status back to Pending if it was answered
      if (activeTicket.status === 'Answered') {
        await supabase.from("tickets").update({ status: 'Pending' }).eq("id", activeTicket.id);
        setActiveTicket({ ...activeTicket, status: 'Pending' });
      }
      setReplyMessage("");
      handleViewTicket(activeTicket);
    }
    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Answered": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Closed": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Support Tickets</h1>
          <p className="text-zinc-400 mt-1">Need help? We're here for you.</p>
        </div>
        {view === "list" && (
          <button 
            onClick={() => setView("create")}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]"
          >
            + New Ticket
          </button>
        )}
      </div>

      {error && <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium">{error}</div>}

      {/* CREATE TICKET VIEW */}
      {view === "create" && (
        <div className="max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Create a Ticket</h2>
            <button onClick={() => setView("list")} className="text-sm text-zinc-400 hover:text-white">Cancel</button>
          </div>
          <form onSubmit={handleCreateTicket} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Subject</label>
              <select 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="" disabled>Select a subject</option>
                <option value="Order Issue">Order Issue</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="Service Request">Service Request</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Message</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="Please describe your issue in detail..."
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-orange-500 focus:outline-none resize-none"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
            >
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>
      )}

      {/* LIST TICKETS VIEW */}
      {view === "list" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-5 border-b border-zinc-800/50">Ticket ID</th>
                  <th className="px-6 py-5 border-b border-zinc-800/50">Subject</th>
                  <th className="px-6 py-5 border-b border-zinc-800/50">Date</th>
                  <th className="px-6 py-5 border-b border-zinc-800/50">Status</th>
                  <th className="px-6 py-5 border-b border-zinc-800/50 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Loading tickets...</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No tickets found.</td></tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-zinc-400">#{ticket.id}</td>
                      <td className="px-6 py-4 font-bold text-white">{ticket.subject}</td>
                      <td className="px-6 py-4 text-zinc-400">{new Date(ticket.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusBadge(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleViewTicket(ticket)}
                          className="text-sm font-medium text-orange-500 hover:text-orange-400"
                        >
                          View Thread
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* THREAD VIEW */}
      {view === "thread" && activeTicket && (
        <div className="max-w-3xl space-y-6">
          <button onClick={() => setView("list")} className="text-sm text-zinc-400 hover:text-white flex items-center gap-2">
            &larr; Back to Tickets
          </button>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-zinc-800">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{activeTicket.subject}</h2>
                <span className="text-sm text-zinc-500 font-mono">Ticket #{activeTicket.id} • {new Date(activeTicket.created_at).toLocaleString()}</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusBadge(activeTicket.status)}`}>
                {activeTicket.status}
              </span>
            </div>

            {/* Original Message */}
            <div className="mb-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold shrink-0">YOU</div>
                <div className="bg-zinc-800/50 rounded-2xl p-5 text-zinc-300 text-sm leading-relaxed border border-zinc-700/50 w-full">
                  {activeTicket.message}
                </div>
              </div>
            </div>

            {/* Replies */}
            {loading ? (
              <div className="text-center text-zinc-500 text-sm py-4">Loading replies...</div>
            ) : (
              <div className="space-y-6 mb-8">
                {replies.map(reply => (
                  <div key={reply.id} className={`flex gap-4 ${reply.is_admin ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${reply.is_admin ? 'bg-purple-500/20 text-purple-500' : 'bg-orange-500/20 text-orange-500'}`}>
                      {reply.is_admin ? 'AD' : 'YOU'}
                    </div>
                    <div className={`rounded-2xl p-5 text-sm leading-relaxed border w-full ${reply.is_admin ? 'bg-purple-500/10 border-purple-500/20 text-purple-100' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'}`}>
                      <div className="text-xs opacity-50 mb-2">{new Date(reply.created_at).toLocaleString()}</div>
                      {reply.message}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            {activeTicket.status !== 'Closed' ? (
              <form onSubmit={handleReply} className="mt-8 border-t border-zinc-800 pt-6">
                <textarea 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Type your reply here..."
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-orange-500 focus:outline-none resize-none mb-4"
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-zinc-100 text-black hover:bg-white disabled:opacity-50 font-bold rounded-xl transition-all"
                >
                  {isSubmitting ? "Sending..." : "Send Reply"}
                </button>
              </form>
            ) : (
              <div className="mt-8 border-t border-zinc-800 pt-6 text-center text-zinc-500 text-sm">
                This ticket is closed. If you need further assistance, please open a new ticket.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}