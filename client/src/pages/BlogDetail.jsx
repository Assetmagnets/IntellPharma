import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { blogAPI } from '../services/api';
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
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="spinner spinner-lg"></div>
                <p>Loading blog post...</p>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
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
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
            <button
                className="btn btn-secondary"
                onClick={() => navigate('/blog')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}
            >
                <ArrowLeft size={16} />
                Back to All Posts
            </button>

            <article>
                {/* Featured Image */}
                {post.image && (
                    <div style={{
                        width: '100%',
                        height: '450px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        marginBottom: '3rem',
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
                <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    {/* Meta */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--dark-text-secondary)',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--dark-surface-2)',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            border: '1px solid var(--dark-border)'
                        }}>
                            <User size={14} />
                            {post.author?.name}
                        </span>
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--dark-surface-2)',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            border: '1px solid var(--dark-border)'
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
                            padding: '6px 16px',
                            borderRadius: '20px',
                            border: '1px solid var(--dark-border)'
                        }}>
                            <Clock size={14} />
                            {calculateReadTime(post.content)}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 style={{
                        color: 'var(--dark-text)',
                        fontSize: '3rem',
                        fontWeight: '800',
                        lineHeight: '1.2',
                        letterSpacing: '-0.02em',
                        maxWidth: '800px',
                        margin: '0 auto'
                    }}>
                        {post.title}
                    </h1>
                </header>

                {/* Post Content */}
                <div
                    className="glass-panel"
                    style={{
                        padding: '4rem',
                        lineHeight: '2',
                        fontSize: '1.125rem',
                        color: 'var(--dark-text)',
                        whiteSpace: 'pre-line',
                        marginBottom: '4rem',
                        background: 'var(--dark-surface)'
                    }}
                >
                    {post.content}
                </div>

            </article>
        </div>
    );
}
