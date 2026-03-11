import React from 'react';
import SEO from '../components/SEO';

export default function Privacy() {
    return (
        <div style={{ 
            color: 'var(--text-primary)', 
            padding: '6rem 6% 8rem', 
            maxWidth: '800px', 
            margin: '0 auto' 
        }}>
            <SEO
                title="Privacy Policy"
                description="Privacy Policy for IntellPharma. Learn how we protect and manage your business data."
            />

            <h1 style={{ 
                fontSize: '3.5rem', 
                fontWeight: '800', 
                marginBottom: '2rem', 
                letterSpacing: '-0.03em' 
            }}>
                Privacy Policy
            </h1>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
                Last Updated: February 20, 2026
            </p>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.25rem' }}>
                    1. Introduction
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    At <strong>IntellPharma</strong> (a product of ASSETMAGNETS), we take your privacy 
                    and data security seriously. This Privacy Policy explains how we collect, use, 
                    and safeguard your information when you use our pharmacy management system.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.25rem' }}>
                    2. Data Collection
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    We collect information necessary to provide our pharmacy management services, including:
                </p>
                <ul style={{ 
                    color: 'var(--text-secondary)', 
                    lineHeight: '1.8', 
                    paddingLeft: '1.5rem' 
                }}>
                    <li>Account information (Name, Email, Phone)</li>
                    <li>Pharmacy details (Name, GST, Address)</li>
                    <li>Inventory and Billing data (Stored securely for your operations)</li>
                    <li>Usage data to improve our platform performance</li>
                </ul>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.25rem' }}>
                    3. How We Use Your Data
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    Your data is used strictly for the operation of your account and the improvement 
                    of IntellPharma services. We do NOT sell your data to third-party advertisers or 
                    health organizations.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.25rem' }}>
                    4. Data Security
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    We use industry-standard encryption (AES-256) to protect your data both at rest 
                    and in transit. Our servers are hosted on secure cloud infrastructure with 
                    regular backups and security audits.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.25rem' }}>
                    5. Your Rights
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    You own your data. You can export your inventory, billing, and customer records 
                    at any time from the Reports section. If you choose to delete your account, all 
                    your data will be permanently removed from our active servers.
                </p>
            </section>

            <div style={{ 
                marginTop: '4rem', 
                padding: '2.5rem', 
                background: 'var(--glass-bg)', 
                borderRadius: '24px', 
                border: '1px solid var(--glass-border)', 
                boxShadow: 'var(--shadow-md)' 
            }}>
                <p style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.95rem', 
                    textAlign: 'center' 
                }}>
                    If you have any questions about this policy, please contact us at <br />
                    <strong style={{ 
                        color: 'var(--primary-500)', 
                        display: 'block', 
                        marginTop: '0.5rem' 
                    }}>
                        support@intellpharma.in
                    </strong>
                </p>
            </div>

        </div>
    );
}