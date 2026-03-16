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
    Lock,
    Upload,
    Image,
    File,
    Trash2,
    Edit3,
    Package,
    PlusCircle,
    RefreshCw
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
            text: `Hello ${user.name}! I'm your IntellPharma AI assistant. How can I help you today?`,
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
    const [inputMode, setInputMode] = useState('file'); // 'file' or 'text'
    const [uploadedFile, setUploadedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [confirmResult, setConfirmResult] = useState(null);
    const fileInputRef = useRef(null);

    // Suggested Prompts - fetched from API
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    useEffect(() => {
        if (!isLocked) {
            scrollToBottom();
        }
    }, [messages, isOpen, isLocked]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch smart suggestions when chat opens
    const fetchSuggestions = async () => {
        if (loadingSuggestions || suggestions.length > 0) return;
        setLoadingSuggestions(true);
        try {
            const res = await aiAPI.getSuggestions({ branchId: currentBranch?.id });
            const formattedSuggestions = (res.data || []).map(s => ({
                text: s.prompt,
                category: s.category,
                desc: s.description,
                priority: s.priority || 'medium'
            }));
            setSuggestions(formattedSuggestions);
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
            setSuggestions([
                { text: "What are my top selling products?", category: "Analytics", desc: "Sales analysis", priority: 'medium' },
                { text: "Show me items running low on stock", category: "Inventory", desc: "Stock alerts", priority: 'medium' },
                { text: "What is my total revenue today?", category: "Finance", desc: "Daily sales", priority: 'medium' }
            ]);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleOpen = () => {
        if (isLocked) {
            setShowUpgradeModal(true);
        } else {
            setIsOpen(true);
            fetchSuggestions();
        }
    };

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

    // ========= FILE UPLOAD HANDLERS =========

    const handleFileSelect = (file) => {
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload an image (JPG, PNG, WebP) or PDF file.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB.');
            return;
        }

        setUploadedFile(file);

        // Create preview
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null); // No preview for PDFs
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ========= BILL PARSING =========

    const handleParseBill = async () => {
        if (inputMode === 'file' && !uploadedFile) return;
        if (inputMode === 'text' && !commandText.trim()) return;
        setProcessingCommand(true);

        try {
            let res;
            if (inputMode === 'file') {
                // Convert file to base64
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const dataUrl = reader.result;
                        const base64Data = dataUrl.split(',')[1];
                        resolve(base64Data);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(uploadedFile);
                });

                res = await aiAPI.parseBillFile({
                    fileData: base64,
                    mimeType: uploadedFile.type,
                    branchId: currentBranch?.id
                });
            } else {
                res = await aiAPI.parseBill({ text: commandText });
            }

            setParsedData(res.data.products);
        } catch (error) {
            console.error('Parse error:', error);
            const errMsg = error.response?.data?.error || 'Failed to parse the bill. Please try again.';
            alert(errMsg);
        } finally {
            setProcessingCommand(false);
        }
    };

    // Editable parsed data handlers
    const handleEditField = (index, field, value) => {
        setParsedData(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    // Atomic handler for Qty/Pack edits — updates all three fields in one state update
    // This prevents the race condition where sequential handleEditField calls use stale state
    const handleQtyPackEdit = (index, field, value) => {
        setParsedData(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const updated = { ...item, [field]: value };
            const newBase = field === 'baseQty' ? value : (updated.baseQty || 0);
            const newPack = field === 'packSize' ? value : (updated.packSize || 1);
            updated.quantity = newBase * newPack;
            return updated;
        }));
    };

    const handleRemoveItem = (index) => {
        setParsedData(prev => prev.filter((_, i) => i !== index));
    };

    // ========= CONFIRM & UPDATE INVENTORY =========

    const handleConfirmStock = async () => {
        if (!parsedData || parsedData.length === 0) return;
        setProcessingCommand(true);

        try {
            const res = await aiAPI.confirmBill({
                products: parsedData,
                branchId: currentBranch?.id
            });

            setConfirmResult(res.data);
            setParsedData(null);
            setCommandText('');
            setUploadedFile(null);
            setFilePreview(null);
        } catch (error) {
            console.error('Confirm error:', error);
            alert('Failed to update inventory. Please try again.');
        } finally {
            setProcessingCommand(false);
        }
    };

    const handleResetBillParser = () => {
        setParsedData(null);
        setConfirmResult(null);
        setCommandText('');
        setUploadedFile(null);
        setFilePreview(null);
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
                                            <div className="suggestions-header">
                                                Smart Suggestions
                                                {loadingSuggestions && <Loader2 size={14} className="animate-spin ml-2" />}
                                            </div>
                                            {suggestions.slice(0, 6).map((s, i) => (
                                                <button
                                                    key={i}
                                                    className={`suggestion-item ${s.priority === 'high' ? 'priority-high' : ''}`}
                                                    onClick={() => handleSuggestionClick(s.text)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {s.priority === 'high' && (
                                                            <AlertTriangle size={14} className="text-warning" />
                                                        )}
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
                            /* ========= BILL PARSER TAB ========= */
                            <div className="command-area flex flex-col h-full">
                                <div className="flex-1 bill-parser-scroll">

                                    {/* Success Result Screen */}
                                    {confirmResult ? (
                                        <div className="bill-confirm-result animate-slideUp">
                                            <div className="bill-success-icon">
                                                <Check size={32} />
                                            </div>
                                            <h4 className="bill-success-title">Inventory Updated!</h4>
                                            <p className="bill-success-message">{confirmResult.message}</p>

                                            {confirmResult.updated.length > 0 && (
                                                <div className="bill-result-section">
                                                    <h5 className="bill-result-label">
                                                        <RefreshCw size={14} /> Stock Updated
                                                    </h5>
                                                    {confirmResult.updated.map((item, i) => (
                                                        <div key={i} className="bill-result-item">
                                                            <span>{item.name}</span>
                                                            <span className="bill-result-badge updated">+{item.quantityAdded} → {item.newTotal}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {confirmResult.created.length > 0 && (
                                                <div className="bill-result-section">
                                                    <h5 className="bill-result-label">
                                                        <PlusCircle size={14} /> New Products Created
                                                    </h5>
                                                    {confirmResult.created.map((item, i) => (
                                                        <div key={i} className="bill-result-item">
                                                            <span>{item.name}</span>
                                                            <span className="bill-result-badge created">Qty: {item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {confirmResult.errors.length > 0 && (
                                                <div className="bill-result-section">
                                                    <h5 className="bill-result-label text-error">
                                                        <AlertTriangle size={14} /> Errors
                                                    </h5>
                                                    {confirmResult.errors.map((item, i) => (
                                                        <div key={i} className="bill-result-item">
                                                            <span>{item.name}</span>
                                                            <span className="text-error text-xs">{item.error}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                className="bill-new-scan-btn"
                                                onClick={handleResetBillParser}
                                            >
                                                <Upload size={16} /> Parse Another Bill
                                            </button>
                                        </div>
                                    ) : !parsedData ? (
                                        /* Input Screen — File Upload or Text Paste */
                                        <>
                                            <div className="bill-header-card">
                                                <h4 className="flex items-center gap-2 mb-2 text-primary-400">
                                                    <FileText size={18} />
                                                    Bill Parsing
                                                </h4>
                                                <p className="text-secondary text-sm">
                                                    Upload a bill photo/PDF or paste text. AI will extract product data and update your inventory.
                                                </p>
                                            </div>

                                            {/* Input Mode Toggle */}
                                            <div className="bill-input-toggle">
                                                <button
                                                    className={`bill-toggle-btn ${inputMode === 'file' ? 'active' : ''}`}
                                                    onClick={() => setInputMode('file')}
                                                >
                                                    <Upload size={14} /> Upload File
                                                </button>
                                                <button
                                                    className={`bill-toggle-btn ${inputMode === 'text' ? 'active' : ''}`}
                                                    onClick={() => setInputMode('text')}
                                                >
                                                    <FileText size={14} /> Paste Text
                                                </button>
                                            </div>

                                            {inputMode === 'file' ? (
                                                /* File Upload Zone */
                                                !uploadedFile ? (
                                                    <div
                                                        className={`bill-dropzone ${isDragging ? 'dragging' : ''}`}
                                                        onDragOver={handleDragOver}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={handleDrop}
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept="image/jpeg,image/png,image/webp,application/pdf"
                                                            style={{ display: 'none' }}
                                                            onChange={(e) => handleFileSelect(e.target.files[0])}
                                                        />
                                                        <div className="bill-dropzone-icon">
                                                            <Upload size={28} />
                                                        </div>
                                                        <p className="bill-dropzone-title">
                                                            Drag & drop your bill here
                                                        </p>
                                                        <p className="bill-dropzone-subtitle">
                                                            or click to browse • JPG, PNG, PDF (max 10MB)
                                                        </p>
                                                    </div>
                                                ) : (
                                                    /* File Preview */
                                                    <div className="bill-file-preview">
                                                        {filePreview ? (
                                                            <img src={filePreview} alt="Bill preview" className="bill-preview-image" />
                                                        ) : (
                                                            <div className="bill-pdf-badge">
                                                                <File size={24} />
                                                                <span>PDF</span>
                                                            </div>
                                                        )}
                                                        <div className="bill-file-info">
                                                            <span className="bill-file-name">{uploadedFile.name}</span>
                                                            <span className="bill-file-size">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                                                        </div>
                                                        <button className="bill-remove-file" onClick={handleRemoveFile}>
                                                            <Trash2 size={14} /> Remove
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                /* Text Paste Area */
                                                <textarea
                                                    className="bill-text-area"
                                                    placeholder="Paste bill text here...&#10;Example: Bought 50 strips of Crocin for 500rs, and 20 bottles of Cough Syrup..."
                                                    value={commandText}
                                                    onChange={(e) => setCommandText(e.target.value)}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        /* Parsed Results — Editable Table */
                                        <div className="parsed-results animate-slideUp">
                                            <div className="flex items-center justify-between mb-3">
                                                <h5 className="text-success flex items-center gap-2">
                                                    <Check size={16} /> Extracted {parsedData.length} Items
                                                </h5>
                                                <button
                                                    className="bill-clear-btn"
                                                    onClick={() => { setParsedData(null); handleRemoveFile(); }}
                                                >
                                                    Clear
                                                </button>
                                            </div>

                                            <p className="text-xs text-secondary mb-3">
                                                <Edit3 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Click any field to edit before confirming.
                                            </p>

                                            {parsedData.some(p => !p.mrp || !p.batchNumber || !p.expiryDate) && (
                                                <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2 text-sm text-warning-400">
                                                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                                    <p>
                                                        <strong>Missing Data Detected:</strong> The AI couldn't confidently extract MRP, Batch, or Expiry for some items due to image quality or bill format. Please verify and update before confirming.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="bill-parsed-table-wrap">
                                                <table className="bill-parsed-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Product</th>
                                                            <th style={{ width: '180px' }}>Qty × Pack = Total</th>
                                                            <th style={{ width: '90px' }}>Buy ₹</th>
                                                            <th style={{ width: '90px' }}>MRP ₹</th>
                                                            <th style={{ width: '120px' }}>Batch</th>
                                                            <th style={{ width: '130px' }}>Expiry</th>
                                                            <th style={{ width: '35px' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {parsedData.map((item, idx) => {
                                                            const isQtyZero = item.quantity === 0 || !item.quantity;
                                                            const isMrpLowerThanBuy = item.mrp && item.price && item.mrp < item.price;
                                                            
                                                            return (
                                                                <tr key={idx} className={isQtyZero ? 'bg-danger/5' : isMrpLowerThanBuy ? 'bg-warning/5' : ''}>
                                                                    <td>
                                                                        <input
                                                                            className="bill-edit-input"
                                                                            value={item.name || ''}
                                                                            onChange={(e) => handleEditField(idx, 'name', e.target.value)}
                                                                        />
                                                                        {item.manufacturer && (
                                                                            <span className="bill-manufacturer">{item.manufacturer}</span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <div className="flex items-center gap-1 justify-center">
                                                                            <input
                                                                                className="bill-edit-input bill-edit-num text-center px-1"
                                                                                style={{ width: '2.5rem', ...(isQtyZero ? { borderColor: 'var(--danger, #ef4444)', background: 'rgba(239, 68, 68, 0.05)' } : {}) }}
                                                                                type="number"
                                                                                value={item.baseQty !== undefined ? item.baseQty : ''}
                                                                                onChange={(e) => {
                                                                                    const newBase = parseInt(e.target.value) || 0;
                                                                                    handleQtyPackEdit(idx, 'baseQty', newBase);
                                                                                }}
                                                                                placeholder="Qty"
                                                                                title="Base Quantity"
                                                                            />
                                                                            <span className="text-secondary text-xs">×</span>
                                                                            <input
                                                                                className="bill-edit-input bill-edit-num text-center px-1"
                                                                                style={{ width: '2.5rem' }}
                                                                                type="number"
                                                                                value={item.packSize !== undefined ? item.packSize : ''}
                                                                                onChange={(e) => {
                                                                                    const newPack = parseInt(e.target.value) || 1;
                                                                                    handleQtyPackEdit(idx, 'packSize', newPack);
                                                                                }}
                                                                                placeholder="Pack"
                                                                                title="Pack Multiplier"
                                                                            />
                                                                            <span className="text-secondary text-xs">=</span>
                                                                            <span
                                                                                className="bill-edit-input bill-edit-num text-center px-1 font-semibold"
                                                                                style={{
                                                                                    width: '3.5rem',
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    background: 'rgba(255,255,255,0.03)',
                                                                                    cursor: 'default',
                                                                                    ...(isQtyZero ? { borderColor: 'var(--danger, #ef4444)', background: 'rgba(239, 68, 68, 0.05)' } : {})
                                                                                }}
                                                                                title="Total Quantity (auto-calculated)"
                                                                            >
                                                                                {item.quantity || 0}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            className="bill-edit-input bill-edit-num"
                                                                            type="number"
                                                                            value={item.price || ''}
                                                                            onChange={(e) => handleEditField(idx, 'price', parseFloat(e.target.value) || null)}
                                                                            placeholder="-"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            className="bill-edit-input bill-edit-num"
                                                                            type="number"
                                                                            value={item.mrp || ''}
                                                                            onChange={(e) => handleEditField(idx, 'mrp', parseFloat(e.target.value) || null)}
                                                                            placeholder="-"
                                                                            style={
                                                                                !item.mrp ? { borderColor: 'var(--warning, #f59e0b)', background: 'rgba(245, 158, 11, 0.05)' } 
                                                                                : isMrpLowerThanBuy ? { borderColor: 'var(--warning, #f59e0b)', background: 'rgba(245, 158, 11, 0.05)' } 
                                                                                : {}
                                                                            }
                                                                            title={isMrpLowerThanBuy ? 'Warning: MRP is lower than Buy Price' : ''}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            className="bill-edit-input text-xs"
                                                                            value={item.batchNumber || ''}
                                                                            onChange={(e) => handleEditField(idx, 'batchNumber', e.target.value)}
                                                                            placeholder="-"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            className="bill-edit-input text-xs"
                                                                            type="month"
                                                                            value={item.expiryDate ? item.expiryDate.substring(0, 7) : ''}
                                                                            onChange={(e) => handleEditField(idx, 'expiryDate', e.target.value ? `${e.target.value}-01` : null)}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <button
                                                                            className="bill-remove-row"
                                                                            onClick={() => handleRemoveItem(idx)}
                                                                            title="Remove"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Action Bar */}
                                {!confirmResult && (
                                    <div className="bill-action-bar">
                                        {!parsedData ? (
                                            <button
                                                className="bill-action-btn extract"
                                                onClick={handleParseBill}
                                                disabled={
                                                    (inputMode === 'file' && !uploadedFile) ||
                                                    (inputMode === 'text' && !commandText.trim()) ||
                                                    processingCommand
                                                }
                                            >
                                                {processingCommand ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={20} />
                                                        <span>Analyzing{inputMode === 'file' ? ' Image' : ''}...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap size={20} />
                                                        <span>Extract Data</span>
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                className="bill-action-btn confirm"
                                                onClick={handleConfirmStock}
                                                disabled={processingCommand || parsedData.length === 0}
                                            >
                                                {processingCommand ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={20} />
                                                        <span>Updating Inventory...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Package size={20} />
                                                        <span>Confirm & Update Inventory ({parsedData.length})</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
