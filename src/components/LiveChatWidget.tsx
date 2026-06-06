import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, User, Sparkles, Smile, MessageSquareQuote } from 'lucide-react';
import { ChatMessage } from '../types';

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [hasName, setHasName] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [hasUnread, setHasUnread] = useState(false);

  const pollIntervalRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load or initialize session on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('yummy_chat_session_id');
    const storedName = localStorage.getItem('yummy_chat_customer_name');

    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = 'sess-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
      localStorage.setItem('yummy_chat_session_id', newSessionId);
      setSessionId(newSessionId);
    }

    if (storedName) {
      setName(storedName);
      setNameInput(storedName);
      setHasName(true);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Fetch / Poll current messages
  const fetchMessages = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/chats/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to poll chat messages', err);
    }
  };

  // Poll for status read / unread indicator
  const checkUnreadStatus = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const chats = await res.json();
        const myChat = chats.find((c: any) => c.id === sessionId);
        if (myChat) {
          setHasUnread(myChat.isUnreadForUser);
        }
      }
    } catch (err) {
      console.error('Error fetching chat session status', err);
    }
  };

  // Setup active polling when chat is open OR background status check when closed
  useEffect(() => {
    if (!sessionId) return;

    if (isOpen) {
      // Clear background checks, start rapid updates
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      fetchMessages();

      // Read status
      fetch(`/api/chats/${sessionId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' })
      }).then(() => setHasUnread(false)).catch(err => {});

      pollIntervalRef.current = setInterval(() => {
        fetchMessages();
      }, 3500);
    } else {
      // Closed background status checks (unread badge checking)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      checkUnreadStatus();
      pollIntervalRef.current = setInterval(() => {
        checkUnreadStatus();
      }, 10000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [sessionId, isOpen]);

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const trimmedName = nameInput.trim();
    setName(trimmedName);
    localStorage.setItem('yummy_chat_customer_name', trimmedName);
    setHasName(true);

    // Send introductory automatic bot message or just notify
    sendMessage("Hello! I am looking forward to browsing beauty and cosmetic items. 🌸");
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !sessionId) return;

    try {
      const res = await fetch('/api/chats/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          customerName: name || 'Value Customer',
          sender: 'user',
          text: textToSend
        })
      });

      if (res.ok) {
        const updatedChat = await res.json();
        setMessages(updatedChat.messages || []);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  return (
    <div id="live-chat-bubble-container" className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-45 font-sans flex flex-col items-end gap-3">
      
      {/* DUAL FLOATING HUB: WHATSAPP + LIVE SUPPORT CHAT */}
      {!isOpen && (
        <>
          {/* WhatsApp circular bubble contact */}
          <a
            href="https://wa.me/96176477025?text=Hello%20Yummy%20Products!%20%F0%9F%8C%B8%20I%20am%20browsing%20your%20premium%20skincare%20and%20cosmetics%20store%20and%20would%20love%20some%20help."
            target="_blank"
            rel="noreferrer"
            className="relative group flex items-center justify-center bg-[#25D366] hover:bg-[#20ba5a] text-white w-13 h-13 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
            aria-label="Chat on WhatsApp"
          >
            <svg className="w-6.5 h-6.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.414 9.863-9.848a9.713 9.713 0 0 0-2.846-6.953 9.717 9.717 0 0 0-6.974-2.859c-5.44 0-9.866 4.417-9.869 9.851-.001 1.77.464 3.497 1.347 5.011l-.986 3.6 3.69-.968zm11.536-6.494c-.21-.106-1.248-.617-1.442-.687-.193-.07-.333-.106-.473.106-.14.212-.544.686-.667.829-.123.142-.246.16-.456.054-.21-.106-.889-.328-1.693-1.047-.625-.558-1.047-1.248-1.17-1.459-.123-.211-.013-.326.092-.431.094-.095.21-.247.316-.371.105-.124.14-.212.21-.353.07-.142.035-.266-.017-.372-.053-.106-.473-1.14-.649-1.563-.171-.416-.36-.353-.49-.356-.127-.003-.272-.004-.417-.004s-.378.054-.577.272c-.2.217-.76.743-.76 1.812s.778 2.097.887 2.244c.11.147 1.53 2.336 3.706 3.277.517.223.921.357 1.237.458.52.165.993.142 1.367.086.417-.062 1.248-.51 1.423-1.002.175-.493.175-.915.123-1.002-.053-.088-.193-.14-.403-.246z"/>
            </svg>
            <span className="absolute right-15 bg-[#25D366] text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-md scale-0 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap">
              WhatsApp Support / واتساب 💬
            </span>
          </a>

          {/* Bespoke Live Chat bubble contact */}
          <button
            id="btn-floating-chat-trigger"
            onClick={() => setIsOpen(true)}
            className="relative group flex items-center justify-center bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white w-13 h-13 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
            aria-label="Open support chat"
          >
            <div className="relative">
              <MessageCircle className="h-6.5 w-6.5 animate-pulse" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-605 border-2 border-white rounded-full animate-bounce" style={{ backgroundColor: '#ff0055' }} />
              )}
            </div>
            
            <span className="absolute right-15 bg-pink-600 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-md scale-0 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap font-sans">
              Live Chat Support / دردشة مباشرة 🌸
            </span>

            {hasUnread && (
              <span className="absolute -top-10 right-0 bg-rose-600 text-[10px] text-white px-2.5 py-1 rounded-lg font-extrabold uppercase shadow-md animate-bounce pointer-events-none whitespace-nowrap">
                New message!
              </span>
            )}
          </button>
        </>
      )}

      {/* Actual Live Chat Window card */}
      {isOpen && (
        <div
          id="chat-window-frame"
          className="bg-white w-[90vw] max-w-[360px] h-[500px] sm:h-[550px] rounded-2xl shadow-2xl border border-pink-100 flex flex-col justify-between overflow-hidden animate-slide-in-right transform origin-bottom-right"
        >
          {/* Header Panel */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <span className="text-2xl">🌸</span>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 border border-white rounded-full" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-wide">Yummy Support Live</h4>
                <p className="text-[10px] opacity-90 font-medium">Bilingual Skincare Assistance</p>
              </div>
            </div>
            
            <button
              id="btn-chat-window-close"
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content Panel */}
          <div className="flex-1 bg-slate-50/50 p-4 overflow-y-auto flex flex-col gap-3">
            {!hasName ? (
              // STEP 1: WELCOME SCREEN & NAME PROMPT
              <div className="flex-1 flex flex-col justify-center items-center text-center p-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-4 border border-pink-200">
                  <Sparkles className="h-8 w-8 text-pink-500 animate-pulse" />
                </div>
                <h5 className="font-serif font-bold text-gray-900 text-base mb-1.5">Welcome to Yummy Products!</h5>
                <p className="text-xs text-gray-500 max-w-[240px] mb-5 leading-relaxed">
                  Enter your name to connect with our beauty counselors in Lebanon.
                </p>

                <form onSubmit={handleStartChat} className="w-full space-y-3.5">
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-pink-400" />
                    <input
                      type="text"
                      required
                      placeholder="Your name / إسمك الكريم"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-white border border-pink-100 rounded-xl outline-hidden focus:border-pink-500 text-gray-800 shadow-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-sm shadow-pink-200"
                  >
                    Start Chat / بدء المحادثة
                  </button>
                </form>
              </div>
            ) : (
              // STEP 2: CONVERSATION LIST
              <>
                {/* Greeting banner node */}
                <div className="bg-pink-50/60 border border-pink-100/40 rounded-xl p-3 text-[11px] text-pink-850 flex items-start gap-2 leading-relaxed">
                  <Smile className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Hello, {name}!</span>
                    Ask us anything about oils, creams, lipstick, or your current order. (We support Both Arabic & English!)
                  </div>
                </div>

                {/* Actual messages loop */}
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center opacity-70 py-12">
                    <p className="text-xs text-gray-400 italic">No messages yet. Write something to begin!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    const isAr = /[\u0600-\u06FF]/.test(msg.text);
                    return (
                      <div
                        key={msg.id}
                        dir={isAr ? 'rtl' : 'ltr'}
                        className={`flex flex-col max-w-[85%] ${
                          isAdmin ? 'self-start items-start' : 'self-end items-end'
                        }`}
                      >
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs whitespace-pre-line ${
                            isAdmin
                              ? 'bg-white text-gray-800 rounded-tl-none border border-pink-100/70'
                              : 'bg-pink-600 text-white rounded-tr-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 font-mono px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Msg Input Form footer (Only if name entered!) */}
          {hasName && (
            <form onSubmit={handleSendMessage} className="border-t border-pink-100 p-3 bg-white flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 text-xs px-3.5 py-2.5 border border-pink-100 rounded-xl outline-hidden focus:border-pink-400 text-gray-805"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl transition-all shadow-sm"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}

        </div>
      )}

    </div>
  );
}
