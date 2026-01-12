import { useState, useEffect } from 'react';
import { aiAPI } from '../services/api';
import '../styles/ai.css';

export default function AIPromptBox({ branchId }) {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        try {
            const res = await aiAPI.getSuggestions();
            setSuggestions(res.data || []);
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setLoading(true);
        setResponse(null);

        try {
            const res = await aiAPI.submitPrompt({
                prompt: prompt.trim(),
                branch_id: branchId
            });
            setResponse(res.data);
        } catch (error) {
            setResponse({
                response_text: error.response?.data?.error || 'Failed to process your request. Please try again.',
                error: true
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setPrompt(suggestion.prompt);
        setShowSuggestions(false);
    };

    return (
        <div className="ai-prompt-container">
            <form onSubmit={handleSubmit} className="prompt-form">
                <div className="prompt-input-wrapper">
                    <span className="prompt-icon">✨</span>
                    <input
                        type="text"
                        className="prompt-input glass-input"
                        placeholder="Ask me anything about your pharmacy... (e.g., 'Show today's sales', 'Low stock items')"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    <button
                        type="submit"
                        className="prompt-submit btn btn-primary"
                        disabled={loading || !prompt.trim()}
                    >
                        {loading ? <span className="spinner spinner-sm"></span> : '→'}
                    </button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown glass-card-dark">
                        <div className="suggestions-header">Suggested Prompts</div>
                        {suggestions.slice(0, 5).map((suggestion, index) => (
                            <button
                                key={index}
                                type="button"
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                <span className="suggestion-category">{suggestion.category}</span>
                                <span className="suggestion-text">{suggestion.prompt}</span>
                                {suggestion.description && (
                                    <span className="suggestion-desc">{suggestion.description}</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </form>

            {/* Response Display */}
            {response && (
                <div className={`ai-response glass-panel animate-slideUp ${response.error ? 'error' : ''}`}>
                    <div className="response-header">
                        <span className="response-icon">{response.error ? '⚠️' : '🤖'}</span>
                        <span className="response-title">{response.error ? 'Error' : 'AI Response'}</span>
                        {response.execution_time && (
                            <span className="response-time">{response.execution_time}ms</span>
                        )}
                    </div>

                    <div className="response-text">
                        {response.response_text}
                    </div>

                    {/* Structured Data Display */}
                    {response.structured_data && (
                        <div className="response-data">
                            {response.structured_data.type === 'sales_summary' && (
                                <div className="data-cards">
                                    <div className="data-card">
                                        <span className="data-label">Total Sales</span>
                                        <span className="data-value">₹{response.structured_data.totalAmount}</span>
                                    </div>
                                    <div className="data-card">
                                        <span className="data-label">Invoices</span>
                                        <span className="data-value">{response.structured_data.invoiceCount}</span>
                                    </div>
                                </div>
                            )}

                            {response.structured_data.type === 'low_stock_alert' && (
                                <div className="data-highlight warning">
                                    <span className="highlight-icon">📦</span>
                                    <span>{response.structured_data.count} products need restocking</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    {response.actionable_buttons && response.actionable_buttons.length > 0 && (
                        <div className="response-actions">
                            {response.actionable_buttons.map((btn, index) => (
                                <button
                                    key={index}
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                        if (btn.action === 'navigate') {
                                            window.location.href = btn.target;
                                        }
                                    }}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
