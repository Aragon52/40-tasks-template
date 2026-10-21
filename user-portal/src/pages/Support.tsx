import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

export default function Support() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let sub = null;

    const initChat = async () => {
      const userSessionStr = localStorage.getItem('cb_user_session');
      if (!userSessionStr) return;
      const userSession = JSON.parse(userSessionStr);
      
      // Find or create session
      let { data: sessions } = await supabase
        .from('cb_support_sessions')
        .select('*')
        .eq('user_id', userSession.id);
        
      let activeSessionId;
      if (!sessions || sessions.length === 0) {
        const { data: newSession } = await supabase
          .from('cb_support_sessions')
          .insert([{ user_id: userSession.id, user_username: userSession.username }])
          .select();
        activeSessionId = newSession[0].id;
      } else {
        activeSessionId = sessions[0].id;
      }
      
      setSessionId(activeSessionId);
      
      // Fetch messages
      const { data: msgs } = await supabase
        .from('cb_support_messages')
        .select('*')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true });
        
      if (msgs) setMessages(msgs);

      // Subscribe to new messages
      sub = supabase
        .channel(`support_${activeSessionId}_${Date.now()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cb_support_messages', filter: `session_id=eq.${activeSessionId}` }, payload => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();
    };

    initChat();

    return () => { 
      if (sub) supabase.removeChannel(sub); 
    };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !sessionId) return;

    const text = inputText;
    setInputText('');

    const newMsg = {
      session_id: sessionId,
      sender: 'user',
      content: text
    };

    await supabase.from('cb_support_messages').insert([newMsg]);
    await supabase.from('cb_support_sessions').update({ 
      last_message_at: new Date().toISOString(),
      unread_admin_count: 1
    }).eq('id', sessionId);
  };

  const handleImageUpload = async (event) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !sessionId) {
        return;
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${sessionId}-${Date.now()}.${fileExt}`;
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

      // Insert message with image
      const newMsg = {
        session_id: sessionId,
        sender: 'user',
        content: '',
        image_url: imageUrl
      };

      await supabase.from('cb_support_messages').insert([newMsg]);
      await supabase.from('cb_support_sessions').update({ 
        last_message_at: new Date().toISOString(),
        unread_admin_count: 1
      }).eq('id', sessionId);

    } catch (error) {
      toast.error('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-slate-50 dark:bg-slate-900 relative pb-20 rounded-xl overflow-hidden shadow-2xs">
      {/* Chat Subheader */}
      <div className="h-12 px-3.5 bg-white dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 rounded-t-xl mb-1">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              CS
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Live Customer Support</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Online • Instant Response Agent</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/home')} 
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Back to Home"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 pb-32">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 shadow-2xs">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">How can we help you today?</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Send a message below to connect with our official 24/7 Walmart Support Team.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={
                    isUser 
                      ? "bg-blue-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs max-w-[82%] ml-auto shadow-2xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-xs px-3.5 py-2 text-xs max-w-[82%] mr-auto shadow-2xs"
                  }
                >
                  {msg.image_url && (
                    <img 
                      src={msg.image_url} 
                      alt="Attachment" 
                      className="max-w-full rounded-lg mb-2 object-cover" 
                    />
                  )}
                  {msg.content && <div>{msg.content}</div>}
                </div>

                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block px-1 font-mono">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isUser && (
                    <span className="ml-1 text-blue-500 font-medium">
                      {msg.is_read ? '• Read' : '• Delivered'}
                    </span>
                  )}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Docked Modern Input Bar */}
      <div className="fixed bottom-14 inset-x-0 mx-auto w-full max-w-md bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 py-2 z-40 shadow-lg">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }} 
          className="flex items-center gap-2"
        >
          <button 
            type="button" 
            onClick={() => !uploading && fileInputRef.current?.click()} 
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            title="Attach image"
          >
            {uploading ? (
              <span className="text-xs font-bold animate-pulse text-blue-500">...</span>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
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
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            id="txt-support-message"
          />

          <button
            type="submit"
            id="btn-send-message"
            className="h-8 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
