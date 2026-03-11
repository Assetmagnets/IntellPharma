import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Globe, Heart } from 'lucide-react';

export default function PublicFooter() {
    return (
        <footer className="landing-footer" style={{
            background: 'rgba(2, 6, 23, 0.8)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '4rem 6% 2rem',
            marginTop: 'auto'
        }}>
            <div className="footer-content" style={{
                maxWidth: '1440px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '3rem',
                marginBottom: '3rem'
            }}>
                {/* Brand Section */}
                <div className="footer-section brand" style={{ gridColumn: 'span 2' }}>
                    <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <img src="/logo.png" alt="IntellPharma" style={{ width: '32px', height: '32px' }} />
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.02em' }}>IntellPharma</span>
                    </div>
                    <p style={{ color: "#94a3b8", lineHeight: '1.6', fontSize: '0.95rem', maxWidth: '300px' }}>
                        The most advanced AI-powered pharmacy management system designed to empower independent pharmacies across India.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="footer-section">
                    <h4 style={{ color: '#f8fafc', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '700' }}>Product</h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <li><Link to="/about" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Features</Link></li>
                        <li><Link to="/pricing" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Pricing</Link></li>
                        <li><Link to="/blog" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Blog</Link></li>
                        <li><Link to="/auth" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Get Started</Link></li>
                    </ul>
                </div>

                {/* Support / Company */}
                <div className="footer-section">
                    <h4 style={{ color: '#f8fafc', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '700' }}>Support</h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <li><Link to="/contact" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Contact Us</Link></li>
                        <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Help Center</a></li>
                        <li><Link to="/privacy" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</Link></li>
                        <li><Link to="/terms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Terms of Service</Link></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div className="footer-section">
                    <h4 style={{ color: '#f8fafc', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '700' }}>Contact</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <Mail size={16} color="var(--primary-400)" />
                            <span>info@assetmagnets.com</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <Phone size={16} color="var(--primary-400)" />
                            <span>+91 9777295707
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <Globe size={16} color="var(--primary-400)" />
                            <span>7th Floor, DLF Cybercity,
Bhubaneswar</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{
                maxWidth: '1440px',
                margin: '0 auto',
                paddingTop: '2rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center'
            }}>
                <p style={{ color: "#64748b", fontSize: '0.85rem' }}>
                    © {new Date().getFullYear()} IntellPharma by{" "}
                    <a
                        href="https://www.assetmagnets.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: "var(--primary-400)",
                            textDecoration: "none",
                            fontWeight: "600",
                        }}
                    >
                        ASSETMAGNETS
                    </a>
                    . All rights reserved.
                </p>
                <p style={{ color: "#64748b", fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Made with <Heart size={14} fill="#ef4444" color="#ef4444" /> in India
                </p>
            </div>
        </footer>
    );
}
