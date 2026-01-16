import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { blogAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    FileText,
    Calendar,
    User,
    ArrowLeft,
    Clock
} from 'lucide-react';
import '../styles/dashboard.css';

export default function BlogDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPost();
    }, [id]);

    const loadPost = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await blogAPI.getPost(id);
            setPost(response.data);
        } catch (error) {
            console.error('Failed to load blog post:', error);
            setError('Blog post not found');
        } finally {
            setLoading(false);
        }
    };

    const calculateReadTime = (content) => {
        const wordsPerMinute = 200;
        const words = content.split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return `${minutes} min read`;
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main">
                    <Header title="Blog Post" icon={FileText} />
                    <div className="loading-container">
                        <div className="spinner spinner-lg"></div>
                        <p>Loading blog post...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main">
                    <Header title="Blog Post" icon={FileText} />
                    <div className="prompt-item glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
                        <FileText size={64} style={{ color: 'var(--dark-text-secondary)', marginBottom: '1.5rem', opacity: 0.5 }} />
                        <h3 style={{ color: 'var(--dark-text)', marginBottom: '0.5rem' }}>Post Not Found</h3>
                        <p style={{ color: 'var(--dark-text-secondary)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                            {error || 'This blog post does not exist or has been removed.'}
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/blog')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <ArrowLeft size={16} />
                            Back to Blog
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <Header title="Blog Post" icon={FileText}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/blog')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <ArrowLeft size={16} />
                        Back to Blog
                    </button>
                </Header>

                <article className="dashboard-section">
                    {/* Featured Image */}
                    {post.image && (
                        <div style={{
                            width: '100%',
                            height: '400px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            marginBottom: '2rem',
                            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)'
                        }}>
                            <img
                                src={post.image}
                                alt={post.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                    )}

                    {/* Post Header */}
                    <header style={{ marginBottom: '2rem' }}>
                        {/* Meta */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                            color: 'var(--dark-text-secondary)',
                            flexWrap: 'wrap'
                        }}>
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'var(--dark-surface-2)',
                                padding: '6px 12px',
                                borderRadius: '20px'
                            }}>
                                <User size={14} />
                                {post.author?.name}
                            </span>
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'var(--dark-surface-2)',
                                padding: '6px 12px',
                                borderRadius: '20px'
                            }}>
                                <Calendar size={14} />
                                {new Date(post.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'var(--dark-surface-2)',
                                padding: '6px 12px',
                                borderRadius: '20px'
                            }}>
                                <Clock size={14} />
                                {calculateReadTime(post.content)}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 style={{
                            color: 'var(--dark-text)',
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            lineHeight: '1.3',
                            letterSpacing: '-0.02em'
                        }}>
                            {post.title}
                        </h1>
                    </header>

                    {/* Post Content */}
                    <div
                        className="prompt-item glass-panel"
                        style={{
                            padding: '2.5rem',
                            lineHeight: '1.9',
                            fontSize: '1.0625rem',
                            color: 'var(--dark-text)',
                            whiteSpace: 'pre-line'
                        }}
                    >
                        {post.content}
                    </div>

                    {/* Footer */}
                    <div style={{
                        marginTop: '2rem',
                        paddingTop: '2rem',
                        borderTop: '1px solid var(--dark-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/blog')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <ArrowLeft size={16} />
                            Back to All Posts
                        </button>

                        <p style={{
                            color: 'var(--dark-text-secondary)',
                            fontSize: '0.875rem'
                        }}>
                            Posted by <strong style={{ color: 'var(--dark-text)' }}>{post.author?.name}</strong> on {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </article>
            </main>
        </div>
    );
}
