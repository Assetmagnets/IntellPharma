import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../services/api';
import {
    MessageSquare,
    X,
    Send,
    Bot,
    Sparkles,
    FileText,
    Check,
    Loader2,
    Zap,
    TrendingUp,
    AlertTriangle,
    Search,
    ChevronDown,
    ArrowRight,
    Lock
} from 'lucide-react';
import '../styles/ai.css';

export default function AIAssistant({ isLocked }) {
    const { user, currentBranch } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState('chat'); // 'chat' or 'command'
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Chat State
    const [messages, setMessages] = useState([
        {
            type: 'ai',
            text: `Hello ${user.name}! I'm your PharmaStock AI assistant. How can I help you today?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const messagesEndRef = useRef(null);

    // Command State
    const [commandText, setCommandText] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [processingCommand, setProcessingCommand] = useState(false);

    // Suggested Prompts
    const suggestions = [
        { text: "What are my top selling products?", category: "Analytics", desc: "Sales analysis" },
        { text: "Show me items running low on stock", category: "Inventory", desc: "Stock alerts" },
        { text: "What is my total revenue today?", category: "Finance", desc: "Daily sales" },
        { text: "List products expiring this month", category: "Inventory", desc: "Expiry check" }
    ];

    useEffect(() => {
        if (!isLocked) {
            scrollToBottom();
        }
    }, [messages, isOpen, isLocked]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleOpen = () => {
        if (isLocked) {
            setShowUpgradeModal(true);
        } else {
            setIsOpen(true);
        }
    };

    // ... (rest of methods: handleSendMessage, handleSuggestionClick, handleParseBill, handleConfirmStock)

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { type: 'user', text: userMsg, timestamp: new Date() }]);
        setInput('');
        setShowSuggestions(false);
        setIsTyping(true);

        try {
            const res = await aiAPI.submitPrompt({
                prompt: userMsg,
                branchId: currentBranch?.id,
                context: {
                    userRole: user.role,
                    currentBranch: currentBranch?.name
                }
            });

            setMessages(prev => [...prev, {
                type: 'ai',
                text: res.data.response_text,
                timestamp: new Date(),
                telemetry: res.data.execution_time
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                type: 'ai',
                text: 'I encountered an error connecting to the AI service. Please try again.',
                isError: true,
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSuggestionClick = (text) => {
        setInput(text);
        setShowSuggestions(false);
    };

    const handleParseBill = async () => {
        if (!commandText.trim()) return;
        setProcessingCommand(true);

        try {
            const res = await aiAPI.parseBill({ text: commandText });
            setParsedData(res.data.products);
        } catch (error) {
            setMessages(prev => [...prev, {
                type: 'ai',
                text: 'Failed to parse the bill text. Please make sure it contains product names and quantities.',
                isError: true,
                timestamp: new Date()
            }]);
        } finally {
            setProcessingCommand(false);
        }
    };

    const handleConfirmStock = () => {
        setProcessingCommand(true);
        // Simulate API call
        setTimeout(() => {
            setParsedData(null);
            setCommandText('');
            setProcessingCommand(false);
            setMode('chat');
            setMessages(prev => [...prev, {
                type: 'ai',
                text: `✅ Successfully processed bill! Added ${parsedData.length} items to inventory.`,
                timestamp: new Date()
            }]);
            setIsOpen(true);
        }, 1500);
    };

    if (!user) return null;

    return (
        <>
            {/* FAB Toggle */}
            {!isOpen && (
                <div className="ai-fab-container">
                    <div className="ai-label">
                        {isLocked ? 'Expert AI' : 'Ask AI'}
                    </div>
                    <button
                        className={`ai-fab ${isLocked ? 'locked' : ''}`}
                        onClick={handleOpen}
                        title={isLocked ? "Unlock AI Features" : "Open Chat"}
                    >
                        {isLocked ? <Lock size={24} /> : <Bot size={28} />}
                    </button>
                </div>
            )}

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
                    <div className="modal upgrade-modal" onClick={e => e.stopPropagation()}>
                        <div className="text-center p-4">
                            <div className="w-16 h-16 bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles size={32} className="text-primary-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Unlock AI Insights</h2>
                            <p className="text-secondary mb-6">
                                Upgrade to a Pro or Premium plan to get:
                            </p>
                            <ul className="text-left space-y-3 mb-8 bg-dark-surface p-4 rounded-xl border border-dark-border">
                                <li className="flex items-center gap-2">
                                    <Check size={18} className="text-success" />
                                    <span>AI-powered business analytics</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check size={18} className="text-success" />
                                    <span>Automated Bill Parsing</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check size={18} className="text-success" />
                                    <span>Inventory forecasting</span>
                                </li>
                            </ul>
                            <div className="flex gap-3">
                                <button
                                    className="btn btn-secondary flex-1"
                                    onClick={() => setShowUpgradeModal(false)}
                                >
                                    Maybe later
                                </button>
                                <button
                                    className="btn btn-primary flex-1"
                                    onClick={() => {
                                        navigate('/subscription');
                                        setShowUpgradeModal(false);
                                    }}
                                >
                                    View Plans
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup Window */}
            {isOpen && !isLocked && (
                <div className="ai-popup">
                    {/* Header */}
                    <div className="ai-header">
                        <div className="flex items-center gap-2">
                            <div>
                                <h3>Ask AI</h3>
                                <div className="flex items-center gap-1 text-xs text-secondary">
                                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                                    Gemini Pro Active
                                </div>
                            </div>
                        </div>
                        <button
                            className="p-2 text-secondary hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            style={{ marginLeft: 'auto' }}
                            onClick={() => setIsOpen(false)}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="ai-tabs">
                        <button
                            className={`ai-tab ${mode === 'chat' ? 'active' : ''}`}
                            onClick={() => setMode('chat')}
                        >
                            <MessageSquare size={16} /> Chat
                        </button>
                        <button
                            className={`ai-tab ${mode === 'command' ? 'active' : ''}`}
                            onClick={() => setMode('command')}
                        >
                            <FileText size={16} /> Bill Parser
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="ai-content">
                        {mode === 'chat' ? (
                            <>
                                <div className="chat-messages">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={msg.type === 'user' ? 'user-message' : 'ai-response'}>
                                            {msg.type === 'ai' && (
                                                <div className="response-header">
                                                    <Bot size={16} className="response-icon" />
                                                    <span className="response-title">AI Assistant</span>
                                                    <span className="response-time">
                                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="response-text">
                                                {msg.text.split('\n').map((line, i) => (
                                                    <p key={i} className="mb-1">{line}</p>
                                                ))}
                                            </div>

                                            {msg.telemetry && (
                                                <div className="text-xs text-secondary mt-1 text-right">
                                                    Generated in {msg.telemetry}ms
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {isTyping && (
                                        <div className="typing-indicator">
                                            <div className="typing-dot"></div>
                                            <div className="typing-dot"></div>
                                            <div className="typing-dot"></div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="ai-prompt-container">
                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && (
                                        <div className="suggestions-dropdown">
                                            <div className="suggestions-header">Suggested Prompts</div>
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    className="suggestion-item"
                                                    onClick={() => handleSuggestionClick(s.text)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="suggestion-category">{s.category}</span>
                                                        <span className="suggestion-text">{s.text}</span>
                                                    </div>
                                                    <span className="suggestion-desc">{s.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <form onSubmit={handleSendMessage} className="prompt-form">
                                        <div className="prompt-input-wrapper">
                                            <button
                                                type="button"
                                                className="btn-icon text-secondary"
                                                onClick={() => setShowSuggestions(!showSuggestions)}
                                                title="Show Suggestions"
                                            >
                                                <Sparkles size={18} />
                                            </button>

                                            <input
                                                type="text"
                                                className="prompt-input"
                                                placeholder="Ask anything..."
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onFocus={() => setShowSuggestions(true)}
                                            />

                                            <button
                                                type="submit"
                                                className="prompt-submit"
                                                disabled={!input.trim() || isTyping}
                                            >
                                                {isTyping ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="command-area flex flex-col h-full">
                                <div className="flex-1">
                                    <div className="bg-dark-surface p-4 rounded-xl border border-dark-border mb-4">
                                        <h4 className="flex items-center gap-2 mb-2 text-primary-400">
                                            <FileText size={18} />
                                            Bill Parsing
                                        </h4>
                                        <p className="text-secondary text-sm">
                                            Paste clean text from a bill or invoice using <strong>Ctrl+V</strong>.
                                            The AI will identify product names, quantities, and prices automatically.
                                        </p>
                                    </div>

                                    {!parsedData ? (
                                        <textarea
                                            className="w-full h-40 bg-dark-surface border border-dark-border rounded-xl p-4 text-white focus:ring-2 ring-primary-500 focus:outline-none transition-all placeholder:text-secondary"
                                            placeholder="Paste bill text here...&#10;Example: Bought 50 strips of Crocin for 500rs, and 20 bottles of Cough Syrup..."
                                            value={commandText}
                                            onChange={(e) => setCommandText(e.target.value)}
                                        />
                                    ) : (
                                        <div className="parsed-results animate-slideUp">
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="text-success flex items-center gap-2">
                                                    <Check size={16} /> Extracted Data
                                                </h5>
                                                <button
                                                    className="text-xs text-error hover:underline"
                                                    onClick={() => setParsedData(null)}
                                                >
                                                    Clear Results
                                                </button>
                                            </div>

                                            <div className="bg-dark-surface rounded-xl overflow-hidden border border-dark-border">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-dark-surface-2 text-secondary uppercase text-xs">
                                                        <tr>
                                                            <th className="p-3">Product</th>
                                                            <th className="p-3">Qty</th>
                                                            <th className="p-3 text-right">Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-dark-border">
                                                        {parsedData.map((item, idx) => (
                                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                                <td className="p-3 font-medium text-white">{item.name}</td>
                                                                <td className="p-3 text-secondary">{item.quantity} {item.unit}</td>
                                                                <td className="p-3 text-right text-primary-400 font-mono">
                                                                    {item.price ? `₹${item.price}` : '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-dark-border">
                                    {!parsedData ? (
                                        <button
                                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-transform active:scale-95"
                                            onClick={handleParseBill}
                                            disabled={!commandText.trim() || processingCommand}
                                        >
                                            {processingCommand ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={20} /> Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap size={20} /> Extract Data
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            className="w-full py-3 bg-success hover:bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-transform active:scale-95"
                                            onClick={handleConfirmStock}
                                            disabled={processingCommand}
                                        >
                                            {processingCommand ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                            Confirm & Update Inventory
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
