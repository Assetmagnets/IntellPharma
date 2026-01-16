import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    FileText,
    Calendar,
    User,
    ArrowRight,
    Image
} from 'lucide-react';
import '../styles/dashboard.css';

export default function Blog() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const response = await blogAPI.getPosts();
            setPosts(response.data);

            // Mark all posts as read when user visits the blog page
            await blogAPI.markAsRead();
        } catch (error) {
            console.error('Failed to load blog posts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main">
                    <Header title="Blog" icon={FileText} />
                    <div className="loading-container">
                        <div className="spinner spinner-lg"></div>
                        <p>Loading blog posts...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <Header title="Blog" icon={FileText} />

                {/* Blog Header */}
                <section className="dashboard-section">
                    <div className="section-header" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem' }}>
                            <FileText size={24} style={{ marginRight: '0.75rem' }} />
                            Latest Updates & News
                        </h2>
                        <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                            Stay informed with the latest news, updates, and tips from IntellPharma
                        </p>
                    </div>

                    {posts.length === 0 ? (
                        <div className="prompt-item glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
                            <FileText size={64} style={{ color: 'var(--dark-text-secondary)', marginBottom: '1.5rem', opacity: 0.5 }} />
                            <h3 style={{ color: 'var(--dark-text)', marginBottom: '0.5rem' }}>No blog posts yet</h3>
                            <p style={{ color: 'var(--dark-text-secondary)', fontSize: '0.9375rem' }}>
                                Check back later for updates and news
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {posts.map((post) => (
                                <article
                                    key={post.id}
                                    className="prompt-item glass-panel"
                                    style={{
                                        padding: 0,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                    onClick={() => navigate(`/blog/${post.id}`)}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {/* Featured Image */}
                                    <div style={{
                                        width: '100%',
                                        height: '200px',
                                        background: 'var(--dark-surface-2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        {post.image ? (
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--dark-text-secondary)',
                                                opacity: 0.5
                                            }}>
                                                <Image size={48} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        {/* Meta */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            marginBottom: '0.75rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--dark-text-secondary)'
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <User size={12} />
                                                {post.author?.name}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} />
                                                {new Date(post.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 style={{
                                            color: 'var(--dark-text)',
                                            fontSize: '1.125rem',
                                            fontWeight: '700',
                                            marginBottom: '0.75rem',
                                            lineHeight: '1.4'
                                        }}>
                                            {post.title}
                                        </h3>

                                        {/* Excerpt */}
                                        <p style={{
                                            color: 'var(--dark-text-secondary)',
                                            fontSize: '0.875rem',
                                            lineHeight: '1.6',
                                            flex: 1,
                                            marginBottom: '1rem',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {post.excerpt || post.content.substring(0, 150)}...
                                        </p>

                                        {/* Read More */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'var(--primary-500)',
                                            fontWeight: '600',
                                            fontSize: '0.875rem'
                                        }}>
                                            Read More
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
