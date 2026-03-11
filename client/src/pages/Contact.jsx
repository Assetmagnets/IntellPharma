import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import {
    Mail,
    Phone,
    MapPin,
    Building2,
    Send,
    Globe,
    MessageCircle,
    Clock,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    ExternalLink
} from 'lucide-react';
import '../styles/landing.css';
import '../styles/contact.css';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: 'general',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);

        // Simulate form submission (you can connect to a backend endpoint later)
        setTimeout(() => {
            setSending(false);
            setSubmitted(true);
        }, 1500);
    };

    return (
        <div className="contact-page">
            <SEO
                title="Contact Us - Get In Touch"
                description="Contact IntellPharma for support, sales inquiries, or partnership opportunities. We're here to help you manage your pharmacy better."
                keywords="contact intellpharma, pharmacy software support, medical shop billing help, intellpharma phone number, intellpharma email"
                canonicalUrl="/contact"
            />

            {/* Hero */}
            <section className="contact-hero">
                <div className="contact-hero-badge">
                    <MessageCircle size={14} /> We'd love to hear from you
                </div>
                <h1>
                    Get In <span className="gradient-text">Touch</span>
                </h1>
                <p>
                    Have a question, feedback, or need support? Reach out and we'll respond within 24 hours.
                </p>
            </section>

            {/* Main Grid */}
            <section className="contact-grid">
                {/* LEFT: Contact Info Cards */}
                <div className="contact-info-column">

                    {/* Organization Card */}
                    <div className="contact-info-card org-card">
                        <div className="contact-card-header">
                            <div className="contact-icon-wrap purple">
                                <Building2 size={22} />
                            </div>
                            <div>
                                <h3>Organization</h3>
                                <p>The team behind IntellPharma</p>
                            </div>
                        </div>
                        <div className="contact-detail">
                            <div className="org-name">ASSETMAGNETS</div>
                            <div className="org-product">Product: <strong>IntellPharma</strong> — Smart Pharmacy Management System</div>
                            <div className="org-tagline">"Empowering pharmacies with intelligent technology"</div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="contact-info-card">
                        <div className="contact-card-header">
                            <div className="contact-icon-wrap blue">
                                <Mail size={22} />
                            </div>
                            <div>
                                <h3>Email Us</h3>
                                <p>For support & general inquiries</p>
                            </div>
                        </div>
                        <div className="contact-detail">
                            <a href="mailto:support@intellpharma.in"> assetmagnets@gmail.com.</a>
                            <br />
                            <a href="mailto:contact@assetmagnets.com">info@assetmagnets.com</a>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="contact-info-card">
                        <div className="contact-card-header">
                            <div className="contact-icon-wrap green">
                                <Phone size={22} />
                            </div>
                            <div>
                                <h3>Call Us</h3>
                                <p>Mon–Sat, 9 AM – 7 PM IST</p>
                            </div>
                        </div>
                        <div className="contact-detail">
                            <a href="tel:+919876543210">+91 9777295707</a>
                            <br />
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>WhatsApp support available</span>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="contact-info-card">
                        <div className="contact-card-header">
                            <div className="contact-icon-wrap orange">
                                <MapPin size={22} />
                            </div>
                            <div>
                                <h3>Office Address</h3>
                                <p>Headquarters</p>
                            </div>
                        </div>
                        <div className="contact-detail">
                            
                            7th Floor, DLF Cybercity,Bhubaneswar<br />
                            PIN: 751024
                        </div>
                    </div>

                    {/* Working Hours */}
                    <div className="contact-info-card">
                        <div className="contact-card-header">
                            <div className="contact-icon-wrap blue">
                                <Clock size={22} />
                            </div>
                            <div>
                                <h3>Working Hours</h3>
                                <p>When we're available</p>
                            </div>
                        </div>
                        <div className="contact-detail">
                            <strong>Monday – Saturday:</strong> 9:00 AM – 7:00 PM IST<br />
                            <strong>Sunday:</strong> Closed<br />
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Email support available 24/7</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Contact Form */}
                <div className="contact-form-card">
                    {!submitted ? (
                        <>
                            <h2>Send us a Message</h2>
                            <p className="form-subtitle">Fill out the form and our team will get back to you shortly.</p>

                            <form className="contact-form" onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="contact-name">Full Name</label>
                                        <input
                                            id="contact-name"
                                            name="name"
                                            type="text"
                                            placeholder="Your name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="contact-email">Email Address</label>
                                        <input
                                            id="contact-email"
                                            name="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="contact-phone">Phone Number</label>
                                        <input
                                            id="contact-phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+91 12345 67890"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="contact-subject">Subject</label>
                                        <select
                                            id="contact-subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                        >
                                            <option value="general">General Inquiry</option>
                                            <option value="support">Technical Support</option>
                                            <option value="sales">Sales & Pricing</option>
                                            <option value="partnership">Partnership</option>
                                            <option value="feedback">Feedback</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="contact-message">Message</label>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        placeholder="Tell us how we can help you..."
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="contact-submit-btn"
                                    disabled={sending}
                                >
                                    {sending ? (
                                        <>Sending...</>
                                    ) : (
                                        <>
                                            <Send size={18} /> Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="form-success">
                            <div className="form-success-icon">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3>Message Sent!</h3>
                            <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                            <button
                                className="contact-submit-btn"
                                onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: 'general', message: '' }); }}
                            >
                                Send Another Message
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Social Links Strip */}
            <section className="contact-social-strip">
                <a
                    href="https://www.assetmagnets.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                >
                    <Globe size={18} />
                    assetmagnets.com
                    <ExternalLink size={14} />
                </a>
                <a
                    href="mailto:support@intellpharma.in"
                    className="social-link"
                >
                    <Mail size={18} />
                    Email Support
                </a>
                <a
                    href="tel:+919876543210"
                    className="social-link"
                >
                    <Phone size={18} />
                    Call Now
                </a>
            </section>
        </div>
    );
}
