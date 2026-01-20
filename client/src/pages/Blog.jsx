import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, ChevronRight } from 'lucide-react';
import { blogAPI } from '../services/api';
import '../styles/landing.css';

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await blogAPI.getPosts();
            setPosts(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to load blog posts');
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    return (
        <div className="blog-page">
            <style>
                {`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    .blog-card:hover { transform: translateY(-8px); }
                    .blog-card:hover .blog-image { transform: scale(1.05) !important; }
                    .blog-card:hover .read-more-btn { color: #60a5fa !important; border-bottom-color: #60a5fa !important; }
                `}
            </style>

            {/* Header / Hero */}
            <section style={{ padding: '3rem 6% 4rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '800', marginBottom: '1.5rem', color: '#f8fafc', letterSpacing: '-0.02em' }}>
                    Latest <span className="gradient-text">Updates & Insights</span>
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                    Expert advice, industry news, and tips to help you manage and grow your pharmacy business efficiently.
                </p>
            </section>

            <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 6% 6rem' }}>
                {filteredPosts.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2.5rem' }}>
                        {filteredPosts.map(post => (
                            <Link to={`/blog/${post.id}`} key={post.id} style={{ textDecoration: 'none' }}>
                                <div className="blog-card" style={{
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            backdropFilter: 'blur(4px)',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '100px',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            zIndex: 5
                                        }}>
                                            5 min read
                                        </div>
                                        <img
                                            src={post.image || "/images/dashboard-preview.png"}
                                            alt={post.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.6s ease'
                                            }}
                                            className="blog-image"
                                        />
                                    </div>
                                    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} /> {formatDate(post.createdAt)}</span>
                                        </div>
                                        <h3 style={{
                                            fontSize: '1.4rem',
                                            fontWeight: '700',
                                            marginBottom: '0.75rem',
                                            color: '#f8fafc',
                                            lineHeight: '1.3',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>{post.title}</h3>
                                        <p style={{
                                            fontSize: '1rem',
                                            color: '#94a3b8',
                                            marginBottom: '1.5rem',
                                            lineHeight: '1.6',
                                            flex: 1,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {post.excerpt}
                                        </p>
                                        <span className="read-more-btn" style={{
                                            color: 'var(--primary-400)',
                                            fontWeight: '600',
                                            fontSize: '0.95rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            marginTop: 'auto'
                                        }}>
                                            Read More <ChevronRight size={16} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '6rem 2rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, rgba(0,102,230,0.1), rgba(0,230,172,0.1))',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 2rem'
                        }}>
                            <Calendar size={36} color="#4da6ff" />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '1rem' }}>
                            No Articles Yet
                        </h3>
                        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                            We're working on bringing you valuable insights and updates. Check back soon for the latest pharmacy industry news and tips.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Blog;
