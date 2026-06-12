"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { email: string };

type Ticket = {
  id: number;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  profiles: Profile | null;
};

type Reply = {
  id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
};

export default function AdminTicketsPage() {
  const supabase = createClient();
  
  const [view, setView] = useState<"list" | "thread">("list");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    fetchTickets();
  }, [supabase]);

  async function fetchTickets() {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("tickets")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching tickets:", fetchError);
      setError("Failed to load tickets.");
    } else if (data) {
      setTickets(data as unknown as Ticket[]);
    }
    setLoading(false);
  }

  async function handleViewTicket(ticket: Ticket) {
    setActiveTicket(ticket);
    setView("thread");
    setLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error fetching replies:", fetchError);
      setError("Failed to load ticket replies.");
    } else if (data) {
      setReplies(data as Reply[]);
    }
    setLoading(false);
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error: insertError } = await supabase.from("ticket_replies").insert({
        ticket_id: activeTicket.id,
        user_id: user.id,
        message: replyMessage,
        is_admin: true
      });

      if (insertError) {
        console.error("Error inserting reply:", insertError);
        setError("Failed to send reply.");
      } else {
        await supabase.from("tickets").update({ status: 'Answered' }).eq("id", activeTicket.id);
        setActiveTicket({ ...activeTicket, status: 'Answered' });
        setReplyMessage("");
        handleViewTicket(activeTicket); // Refresh replies
      }
    }
    setIsSubmitting(false);
  };

  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    setIsSubmitting(true);
    const { error: closeError } = await supabase.from("tickets").update({ status: 'Closed' }).eq("id", activeTicket.id);
    
    if (closeError) {
      console.error("Error closing ticket:", closeError);
      setError("Failed to close ticket.");
    } else {
      setActiveTicket({ ...activeTicket, status: 'Closed' });
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
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Support Tickets</h1>
        <p className="text-zinc-400 mt-1">Review and respond to customer support inquiries.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-5 border-b border-zinc-800/50">Ticket ID</th>
                  <th className="px-6 py-5 border-b border-zinc-800/50">User Email</th>
                  <th className="px-6 py-5 border-b border-zinc-800/50 min-w-[200px]">Subject</th>
                  <th className="px-6 py-5 border-b border-zinc-800/50">Date</th>
                  <th className="px-6 py-5 border-b border-zinc-800/50">Status</th>
                  <th className="px-6 py-5 border-b border-zinc-800/50 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">Loading tickets...</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No tickets found.</td></tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-zinc-800/30 transition-colors cursor-pointer" onClick={() => handleViewTicket(ticket)}>
                      <td className="px-6 py-4 font-mono text-zinc-400">#{ticket.id}</td>
                      <td className="px-6 py-4 text-white font-medium text-xs">{ticket.profiles?.email || "Unknown"}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{ticket.subject}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-xs">{ticket.message}</div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-xs">{new Date(ticket.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusBadge(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm font-bold text-orange-500 hover:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg transition-colors">
                          Open Thread
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
        <div className="max-w-4xl space-y-6">
          <button 
            onClick={() => { setView("list"); fetchTickets(); }} 
            className="text-sm font-bold text-zinc-400 hover:text-white flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 transition-colors"
          >
            &larr; Back to Ticket List
          </button>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-zinc-800">
              <div>
                <h2 className="text-2xl font-black text-white mb-2">{activeTicket.subject}</h2>
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <span className="bg-zinc-800 px-2 py-1 rounded-md text-white font-medium">{activeTicket.profiles?.email}</span>
                  <span>•</span>
                  <span className="font-mono">Ticket #{activeTicket.id}</span>
                  <span>•</span>
                  <span>{new Date(activeTicket.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusBadge(activeTicket.status)}`}>
                  {activeTicket.status}
                </span>
                {activeTicket.status !== 'Closed' && (
                  <button 
                    onClick={handleCloseTicket}
                    disabled={isSubmitting}
                    className="text-xs text-red-400 hover:text-white font-bold border border-red-500/20 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    Close Ticket
                  </button>
                )}
              </div>
            </div>

            {/* Original Message */}
            <div className="mb-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-black shrink-0 text-sm border border-zinc-700">USR</div>
                <div className="bg-zinc-950 rounded-2xl rounded-tl-none p-5 text-zinc-300 text-sm leading-relaxed border border-zinc-800/80 w-full shadow-inner">
                  {activeTicket.message}
                </div>
              </div>
            </div>

            {/* Replies */}
            {loading ? (
              <div className="text-center text-zinc-500 text-sm py-4">Loading conversation...</div>
            ) : (
              <div className="space-y-6 mb-8">
                {replies.map(reply => (
                  <div key={reply.id} className={`flex gap-4 ${reply.is_admin ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black shrink-0 text-sm border ${
                      reply.is_admin ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {reply.is_admin ? 'ADM' : 'USR'}
                    </div>
                    <div className={`rounded-2xl p-5 text-sm leading-relaxed border w-full shadow-md ${
                      reply.is_admin 
                        ? 'bg-orange-500/5 border-orange-500/20 text-orange-50 rounded-tr-none' 
                        : 'bg-zinc-950 border-zinc-800/80 text-zinc-300 rounded-tl-none shadow-inner'
                    }`}>
                      <div className="text-xs opacity-50 mb-3 font-medium">
                        {new Date(reply.created_at).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap">{reply.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            {activeTicket.status !== 'Closed' ? (
              <form onSubmit={handleReply} className="mt-8 pt-6 border-t border-zinc-800">
                <label className="block text-sm font-semibold text-zinc-300 mb-3">Admin Reply</label>
                <textarea 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Type your official response to the user..."
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-orange-500 focus:outline-none resize-none mb-4"
                />
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
                  >
                    {isSubmitting ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
                <div className="inline-block bg-zinc-950 border border-zinc-800 px-6 py-3 rounded-xl text-zinc-500 text-sm font-medium">
                  This ticket has been permanently closed.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}