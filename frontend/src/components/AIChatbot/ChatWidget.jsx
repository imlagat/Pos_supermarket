import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../stores/authStore';

export default function ChatWidget() {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
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
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 p-4 bg-orange-600 text-white rounded-full shadow-2xl hover:bg-orange-700 transition-all z-50 flex items-center justify-center hover:scale-110"
                    title="Open AI Assistant"
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden transform transition-all">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-600 to-orange-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <Bot size={24} />
                            <div>
                                <h3 className="font-bold">Supermarket AI</h3>
                                <p className="text-xs opacity-90">Powered by Anthropic Claude</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition">
                            <X size={20} />
                        </button>
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
                    <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me about stock, sales..."
                                className="w-full pl-4 pr-12 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-orange-600 focus:ring-2 focus:ring-orange-200 transition-all text-sm"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
