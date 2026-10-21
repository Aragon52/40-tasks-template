import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { Search, Send, Image as ImageIcon, MessageSquare } from 'lucide-react';

export default function SupportChat() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cb_admin_session');
    if (saved) {
      setSession(JSON.parse(saved));
    }

    fetchSessions();
    fetchUsers();

    const sub = supabase
      .channel('public:cb_support_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cb_support_sessions' }, () => {
        fetchSessions();
      })
      .subscribe();

    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchSessions();
      fetchUsers();
    }, 12000);

    return () => { 
      supabase.removeChannel(sub); 
      clearInterval(interval);
    };
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('cb_support_sessions')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSessions(data);
      setActiveSession((prev: any) => prev || (data.length > 0 ? data[0] : null));
    } else if (error) {
      console.error("Error fetching support sessions:", error);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('cb_users')
      .select('id, username, online, member_of_admin_id, referred_by_staff_id');
    
    if (!error && data) {
      setUsers(data);
    }
  };

  const getFilteredSessions = () => {
    if (!sessions || sessions.length === 0) return [];
    
    const role = String(session?.role || '').toLowerCase();
    let result = sessions;

    if (role && role !== 'owner' && role !== 'superadmin' && role !== 'master') {
      result = result.filter(s => {
        const user = users.find(u => 
          (u.username && s.user_username && u.username.toLowerCase() === s.user_username.toLowerCase()) || 
          (u.id && s.user_id && u.id === s.user_id)
        );
        if (!user) return true;
        if (role === 'admin') {
          if (!user.member_of_admin_id) return true;
          return String(user.member_of_admin_id) === String(session?.accountId);
        } else if (role === 'staff') {
          if (!user.referred_by_staff_id) return true;
          return String(user.referred_by_staff_id) === String(session?.accountId);
        }
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => String(s.user_username || '').toLowerCase().includes(q));
    }

    return result;
  };

  const getUserStatus = (username: string) => {
    const user = users.find(u => u.username?.toLowerCase() === username?.toLowerCase());
    return user?.online || 'Offline';
  };

  useEffect(() => {
    if (!activeSession) return;

    fetchMessages(activeSession.id);
    supabase.from('cb_support_sessions').update({ unread_admin_count: 0 }).eq('id', activeSession.id).then();

    const sub = supabase
      .channel(`support_admin_${activeSession.id}_${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cb_support_messages', filter: `session_id=eq.${activeSession.id}` }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [activeSession]);

  const fetchMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('cb_support_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (!error && data) setMessages(data);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeSession) return;

    const text = inputMsg;
    setInputMsg('');

    const newMsg = {
      session_id: activeSession.id,
      sender: 'admin',
      content: text
    };

    const { error } = await supabase.from('cb_support_messages').insert([newMsg]);
    if (error) {
      toast.error("Failed to send message: " + error.message);
      return;
    }

    await supabase.from('cb_support_sessions').update({
      last_message_at: new Date().toISOString()
    }).eq('id', activeSession.id);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !activeSession) {
        return;
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${activeSession.id}-admin-${Date.now()}.${fileExt}`;
      const filePath = `chat/${fileName}`;

      setUploading(true);

      const { error: uploadError } = await supabase.storage
        .from('cb_storage')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('cb_storage')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      const newMsg = {
        session_id: activeSession.id,
        sender: 'admin',
        content: '',
        image_url: imageUrl
      };

      await supabase.from('cb_support_messages').insert([newMsg]);
      await supabase.from('cb_support_sessions').update({
        last_message_at: new Date().toISOString()
      }).eq('id', activeSession.id);

    } catch (error: any) {
      toast.error('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredSessions = getFilteredSessions();

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden font-sans border-t border-slate-200">
      {/* ── Left Column: Inbox Session List Sidebar ── */}
      <div className="w-80 md:w-96 flex flex-col border-r border-slate-200 bg-white shrink-0">
        {/* Fixed Sidebar Header */}
        <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Support Sessions
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {filteredSessions.length} Total
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search username..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Scrollable Session List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No support conversations found.</p>
            </div>
          ) : (
            filteredSessions.map((s) => {
              const userStatus = getUserStatus(s.user_username);
              const isOnline = userStatus === 'Online';
              const isActive = activeSession?.id === s.id;
              const initials = (s.user_username || 'U').substring(0, 2).toUpperCase();

              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-3 relative ${
                    isActive ? 'bg-blue-50/60 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                        {initials}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {s.user_username || 'Anonymous'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {s.last_message ? s.last_message : 'Tap to open chat'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {s.last_message_at
                        ? new Date(s.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                    {s.unread_admin_count > 0 && (
                      <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {s.unread_admin_count}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Column: Active Chat Window ── */}
      <div className="flex-1 flex flex-col bg-white min-w-0 relative">
        {activeSession ? (
          <>
            {/* Active Chat Header */}
            <div className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {(activeSession.user_username || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      getUserStatus(activeSession.user_username) === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{activeSession.user_username}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        getUserStatus(activeSession.user_username) === 'Online' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-xs text-slate-500 font-medium">
                      {getUserStatus(activeSession.user_username)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No messages yet. Send a response below.
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={
                          isAdmin
                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm max-w-[70%] ml-auto shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-xs px-4 py-2.5 text-sm max-w-[70%] mr-auto shadow-2xs'
                        }
                      >
                        {m.image_url && (
                          <img
                            src={m.image_url}
                            alt="Attachment"
                            className="max-w-full rounded-lg mb-2 object-cover max-h-60"
                          />
                        )}
                        {m.content && <div>{m.content}</div>}
                      </div>

                      <span className="text-[10px] text-slate-400 mt-1 block px-1 font-mono">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Docked Desktop Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors rounded-xl shrink-0 cursor-pointer"
                  title="Attach image"
                >
                  {uploading ? (
                    <span className="text-xs font-bold animate-pulse">...</span>
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />

                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                  type="submit"
                  className="h-10 px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State when no conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Select a conversation</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
              Choose a support session from the list on the left to start live customer support chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
