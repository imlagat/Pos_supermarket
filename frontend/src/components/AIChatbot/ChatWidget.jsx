import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Maximize2, Minimize2, Paperclip, Smile, Mic, ArrowUp } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../stores/authStore';

export default function ChatWidget() {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (user?.id) {
            try {
                const saved = localStorage.getItem(`ai_chats_${user.id}`);
                const parsed = saved ? JSON.parse(saved) : null;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                } else {
                    setMessages([{ role: 'assistant', content: `Hello ${user.name || 'there'}! I am your AI assistant. How can I help you with your tasks today?` }]);
                }
            } catch (e) {
                setMessages([{ role: 'assistant', content: `Hello ${user.name || 'there'}! I am your AI assistant. How can I help you with your tasks today?` }]);
            }
        } else {
            setMessages([]);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id && messages.length > 0) {
            localStorage.setItem(`ai_chats_${user.id}`, JSON.stringify(messages));
        }
    }, [messages, user?.id]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newMessages = [...messages, { role: 'user', content: input.trim() }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post('/chat', { messages: newMessages });
            
            if (res.data.error) {
                toast.error(res.data.error);
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${res.data.error}` }]);
            } else if (res.data.message) {
                setMessages(prev => [...prev, res.data.message]);
            }
        } catch (err) {
            console.error("Chat error:", err);
            const errorMsg = err.response?.data?.error || 'Failed to connect to AI server.';
            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Chat Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => {
                        if (user?.tenant?.tier === 'bronze' || (user?.tenant && !user.tenant.is_active)) return;
                        setIsOpen(true);
                    }}
                    className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all z-50 flex items-center justify-center
                        ${(user?.tenant?.tier === 'bronze' || (user?.tenant && !user.tenant.is_active))
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50' 
                            : 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-110'
                        }`}
                    title={
                        (user?.tenant && !user.tenant.is_active) ? "Account Suspended" :
                        user?.tenant?.tier === 'bronze' ? "AI Assistant (Upgrade to unlock)" : "Open AI Assistant"
                    }
                    disabled={user?.tenant?.tier === 'bronze' || (user?.tenant && !user.tenant.is_active)}
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed bottom-6 right-6 ${isExpanded ? 'w-full md:w-[600px] h-[80vh] max-h-[800px]' : 'w-96 h-[550px]'} bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden transform transition-all duration-300 origin-bottom-right`}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-600 to-orange-600 p-4 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-2">
                            <Bot size={24} />
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Supermarket AI</h3>
                                <p className="text-xs opacity-90">Powered by Google Gemini</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)} 
                                className="hover:bg-white/20 px-2 py-1.5 rounded-lg transition text-xs font-medium flex items-center gap-1.5 bg-white/10"
                            >
                                {isExpanded ? (
                                    <><Minimize2 size={14} /> Collapse window</>
                                ) : (
                                    <><Maximize2 size={14} /> Expand window</>
                                )}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition ml-1">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, idx) => {
                            if (msg.role === 'system' || msg.role === 'tool') return null; // Hide system and tool messages
                            if (!msg.content && msg.tool_calls) {
                                return (
                                    <div key={idx} className="flex gap-2 text-sm text-gray-500 italic">
                                        <Loader2 size={16} className="animate-spin" /> Fetching database records...
                                    </div>
                                );
                            }
                            
                            const isUser = msg.role === 'user';
                            return (
                                <div key={idx} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-orange-100 text-orange-800' : 'bg-gray-200 text-gray-700'}`}>
                                        {isUser ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isUser ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 shadow-sm rounded-tl-none text-gray-800'}`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0">
                                    <Bot size={16} />
                                </div>
                                <div className="p-3 bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none">
                                    <Loader2 size={16} className="animate-spin text-gray-400" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 shrink-0">
                        <div className="relative bg-gray-50 rounded-xl flex flex-col pt-1.5 pb-1.5 px-2 focus-within:ring-1 focus-within:ring-orange-300 focus-within:bg-white border border-gray-200 transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message..."
                                className="w-full bg-transparent border-none focus:ring-0 text-sm mb-1 px-2 py-2 text-gray-800 placeholder-gray-400 outline-none"
                                disabled={isLoading}
                            />
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-1 text-gray-500">
                                    <button type="button" title="Attach file" className="p-1.5 hover:bg-gray-200 hover:text-gray-700 rounded-lg transition"><Paperclip size={18} /></button>
                                    <button type="button" title="Emoji" className="p-1.5 hover:bg-gray-200 hover:text-gray-700 rounded-lg transition"><Smile size={18} /></button>
                                    <button type="button" title="GIF" className="p-1.5 hover:bg-gray-200 hover:text-gray-700 rounded-lg transition">
                                        <div className="text-[9px] font-extrabold border-2 border-current rounded px-1 py-0.5 leading-none flex items-center justify-center">GIF</div>
                                    </button>
                                    <button type="button" title="Voice message" className="p-1.5 hover:bg-gray-200 hover:text-gray-700 rounded-lg transition"><Mic size={18} /></button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded-full hover:bg-black disabled:opacity-50 transition shadow-sm"
                                >
                                    <ArrowUp size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
