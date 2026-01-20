import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import Header from '../../components/Header';
import {
    FileText,
    Plus,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Image,
    X,
    Save,
    RefreshCw,
    Calendar,
    User
} from 'lucide-react';
import '../../styles/dashboard.css';

export default function BlogManagement() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        image: '',
        isPublished: true
    });
    const [imagePreview, setImagePreview] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const response = await superAdminAPI.getAllBlogPosts();
            setPosts(response.data);
        } catch (error) {
            console.error('Failed to load blog posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                setFormData(prev => ({ ...prev, image: base64 }));
                setImagePreview(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            alert('Title and content are required');
            return;
        }

        setSaving(true);
        try {
            if (editingPost) {
                await superAdminAPI.updateBlogPost(editingPost.id, formData);
            } else {
                await superAdminAPI.createBlogPost(formData);
            }
            setShowModal(false);
            resetForm();
            loadPosts();
        } catch (error) {
            console.error('Failed to save blog post:', error);
            alert('Failed to save blog post');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (post) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt || '',
            image: post.image || '',
            isPublished: post.isPublished
        });
        setImagePreview(post.image || '');
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this blog post?')) return;

        try {
            await superAdminAPI.deleteBlogPost(id);
            loadPosts();
        } catch (error) {
            console.error('Failed to delete blog post:', error);
            alert('Failed to delete blog post');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            excerpt: '',
            image: '',
            isPublished: true
        });
        setImagePreview('');
        setEditingPost(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    if (loading) {
        return (
            <>
                <Header title="Blog Management" icon={FileText} />
                <div className="loading-container">
                    <div className="spinner spinner-lg"></div>
                    <p>Loading blog posts...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Blog Management" icon={FileText}>
                <button
                    className="btn btn-secondary"
                    onClick={loadPosts}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
                <button
                    className="btn btn-primary"
                    onClick={openCreateModal}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={16} />
                    New Post
                </button>
            </Header>

            {/* Stats Summary */}
            <div className="stats-grid three-cols" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon gradient-primary">
                        <FileText size={24} />
                    </div>
                    <div className="stat-value">{posts.length}</div>
                    <div className="stat-label">Total Posts</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                        <Eye size={24} />
                    </div>
                    <div className="stat-value">{posts.filter(p => p.isPublished).length}</div>
                    <div className="stat-label">Published</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <EyeOff size={24} />
                    </div>
                    <div className="stat-value">{posts.filter(p => !p.isPublished).length}</div>
                    <div className="stat-label">Drafts</div>
                </div>
            </div>

            {/* Blog Posts List */}
            <section className="dashboard-section">
                <div className="section-header">
                    <h2>
                        <FileText size={20} style={{ marginRight: '0.5rem' }} />
                        All Blog Posts
                    </h2>
                    <p>{posts.length} posts</p>
                </div>

                {posts.length === 0 ? (
                    <div className="prompt-item glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                        <FileText size={56} style={{ color: 'var(--dark-text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
                        <p style={{ color: 'var(--dark-text-secondary)', fontSize: '1rem' }}>No blog posts yet</p>
                        <p style={{ color: 'var(--dark-text-secondary)', fontSize: '0.875rem', opacity: 0.7 }}>Click "New Post" to create your first blog post</p>
                    </div>
                ) : (
                    <div className="recent-prompts">
                        {posts.map((post) => (
                            <div key={post.id} className="prompt-item glass-panel blog-post-item">
                                {/* Image Thumbnail */}
                                <div className="blog-post-image">
                                    {post.image ? (
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Image size={24} style={{ color: 'var(--dark-text-secondary)', opacity: 0.5 }} />
                                    )}
                                </div>

                                {/* Post Info */}
                                <div className="blog-post-content">
                                    <strong style={{
                                        display: 'block',
                                        color: 'var(--dark-text)',
                                        fontSize: '1rem',
                                        marginBottom: '6px'
                                    }}>
                                        {post.title}
                                    </strong>
                                    <p style={{
                                        fontSize: '0.8125rem',
                                        color: 'var(--dark-text-secondary)',
                                        margin: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        marginBottom: '6px'
                                    }}>
                                        {post.excerpt || post.content.substring(0, 100)}...
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--dark-text-secondary)'
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <User size={12} />
                                            {post.author?.name}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} />
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div>
                                    {post.isPublished ? (
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            background: 'rgba(34, 197, 94, 0.15)',
                                            color: 'var(--success)',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            border: '1px solid rgba(34, 197, 94, 0.3)'
                                        }}>
                                            <Eye size={14} />
                                            Published
                                        </span>
                                    ) : (
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            background: 'rgba(245, 158, 11, 0.15)',
                                            color: 'var(--warning)',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            border: '1px solid rgba(245, 158, 11, 0.3)'
                                        }}>
                                            <EyeOff size={14} />
                                            Draft
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="blog-post-actions">
                                    <button
                                        onClick={() => handleEdit(post)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: 'var(--primary-500)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.8125rem',
                                            fontWeight: '600',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Edit2 size={14} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: 'var(--error)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.8125rem',
                                            fontWeight: '600',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '2rem'
                }}>
                    <div style={{
                        background: 'var(--dark-surface)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '700px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        border: '1px solid var(--dark-border)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--dark-border)'
                        }}>
                            <h2 style={{
                                margin: 0,
                                color: 'var(--dark-text)',
                                fontSize: '1.25rem',
                                fontWeight: '700'
                            }}>
                                {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--dark-text-secondary)',
                                    cursor: 'pointer',
                                    padding: '0.5rem'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                            {/* Title */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: 'var(--dark-text)',
                                    fontWeight: '600',
                                    fontSize: '0.875rem'
                                }}>
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'var(--dark-surface-2)',
                                        border: '1px solid var(--dark-border)',
                                        borderRadius: '10px',
                                        color: 'var(--dark-text)',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                    placeholder="Enter blog post title"
                                    required
                                />
                            </div>

                            {/* Image Upload */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: 'var(--dark-text)',
                                    fontWeight: '600',
                                    fontSize: '0.875rem'
                                }}>
                                    Featured Image
                                </label>
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-start'
                                }}>
                                    <div style={{
                                        width: '150px',
                                        height: '100px',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        background: 'var(--dark-surface-2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid var(--dark-border)',
                                        flexShrink: 0
                                    }}>
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <Image size={32} style={{ color: 'var(--dark-text-secondary)', opacity: 0.5 }} />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            id="imageUpload"
                                            style={{ display: 'none' }}
                                        />
                                        <label
                                            htmlFor="imageUpload"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1rem',
                                                background: 'var(--dark-surface-2)',
                                                border: '1px solid var(--dark-border)',
                                                borderRadius: '10px',
                                                color: 'var(--dark-text)',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: '500'
                                            }}
                                        >
                                            <Image size={16} />
                                            Choose Image
                                        </label>
                                        <p style={{
                                            marginTop: '0.5rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--dark-text-secondary)'
                                        }}>
                                            Max size: 5MB. Supported formats: JPG, PNG, GIF
                                        </p>
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, image: '' }));
                                                    setImagePreview('');
                                                }}
                                                style={{
                                                    marginTop: '0.5rem',
                                                    padding: '0.5rem 0.75rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: 'var(--error)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Remove Image
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Excerpt */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: 'var(--dark-text)',
                                    fontWeight: '600',
                                    fontSize: '0.875rem'
                                }}>
                                    Excerpt (Short Description)
                                </label>
                                <input
                                    type="text"
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'var(--dark-surface-2)',
                                        border: '1px solid var(--dark-border)',
                                        borderRadius: '10px',
                                        color: 'var(--dark-text)',
                                        fontSize: '0.875rem',
                                        outline: 'none'
                                    }}
                                    placeholder="Brief summary for the blog listing (optional)"
                                />
                            </div>

                            {/* Content */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: 'var(--dark-text)',
                                    fontWeight: '600',
                                    fontSize: '0.875rem'
                                }}>
                                    Content *
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        minHeight: '200px',
                                        padding: '0.75rem 1rem',
                                        background: 'var(--dark-surface-2)',
                                        border: '1px solid var(--dark-border)',
                                        borderRadius: '10px',
                                        color: 'var(--dark-text)',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.6'
                                    }}
                                    placeholder="Write your blog post content here..."
                                    required
                                />
                                <p style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--dark-text-secondary)'
                                }}>
                                    💡 Tip: Press Enter twice (leave a blank line) between paragraphs for proper separation
                                </p>
                            </div>

                            {/* Publish Toggle */}
                            <div style={{
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <label className="toggle-switch" style={{ marginRight: '0' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isPublished}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                                <span style={{
                                    color: 'var(--dark-text)',
                                    fontWeight: '500'
                                }}>
                                    {formData.isPublished ? 'Published (visible to users)' : 'Draft (not visible to users)'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {saving ? (
                                        <>
                                            <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {editingPost ? 'Update Post' : 'Create Post'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
