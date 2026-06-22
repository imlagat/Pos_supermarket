import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Maximize2, Minimize2, Paperclip, Mic, ArrowUp, MoreHorizontal } from 'lucide-react';
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
    const [showMenu, setShowMenu] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const messagesEndRef = useRef(null);
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error("Your browser doesn't support speech recognition.");
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            toast.success("Listening...", { id: 'mic', duration: 3000 });
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput((prev) => prev ? prev + ' ' + transcript : transcript);
        };

        recognition.onerror = (event) => {
            console.error(event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachedFile(file);
            toast.success(`Attached ${file.name}`);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            // For now, if a file is attached, we simulate or notify as backend doesn't handle multipart yet
            const payload = { messages: newMessages };
            if (attachedFile) {
                // If you had an endpoint supporting formData, you would append here
                setAttachedFile(null); // clear after sending
            }
            
            const res = await api.post('/chat', payload);
            
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
                    <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-2">
                            <Bot size={24} className="text-orange-500" />
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Supermarket AI</h3>
                                <p className="text-xs opacity-90 text-gray-300">Powered by Google Gemini</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative" ref={menuRef}>
                                <button 
                                    onClick={() => setShowMenu(!showMenu)} 
                                    className="hover:bg-white/20 p-1.5 rounded-lg transition"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 rounded-xl shadow-xl border border-slate-700 overflow-hidden z-50 py-1">
                                        <button 
                                            onClick={() => { setIsExpanded(!isExpanded); setShowMenu(false); }} 
                                            className="w-full px-4 py-3 hover:bg-slate-800 transition text-sm font-medium flex items-center gap-3 text-white text-left"
                                        >
                                            {isExpanded ? (
                                                <><Minimize2 size={16} className="text-blue-400" /> Collapse window</>
                                            ) : (
                                                <><Maximize2 size={16} className="text-blue-400" /> Expand window</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
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
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf,.doc,.docx,.txt"
                                    />
                                    <button 
                                        type="button" 
                                        title="Attach file" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`p-1.5 rounded-lg transition ${attachedFile ? 'text-orange-600 bg-orange-50' : 'hover:bg-gray-200 hover:text-gray-700'}`}
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                    <button 
                                        type="button" 
                                        title="Voice message" 
                                        onClick={startListening}
                                        className={`p-1.5 rounded-lg transition ${isListening ? 'text-red-600 bg-red-50 animate-pulse' : 'hover:bg-gray-200 hover:text-gray-700'}`}
                                    >
                                        <Mic size={18} />
                                    </button>
                                    {attachedFile && (
                                        <span className="text-[10px] text-orange-600 font-medium ml-1 truncate max-w-[100px]">
                                            {attachedFile.name}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="w-8 h-8 flex items-center justify-center bg-orange-600 text-white rounded-full hover:bg-orange-700 disabled:opacity-50 transition shadow-sm"
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
