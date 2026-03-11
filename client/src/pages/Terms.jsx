import React from 'react';
import SEO from '../components/SEO';

export default function Terms() {
    return (
        <div style={{ color: 'var(--text-primary)', padding: '6rem 6% 8rem', maxWidth: '800px', margin: '0 auto' }}>
            <SEO
                title="Terms of Service"
                description="Terms and Conditions for using IntellPharma pharmacy management system."
            />

            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '2rem', letterSpacing: '-0.03em' }}>Terms of Service</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Last Updated: February 20, 2026</p>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>1. Acceptance of Terms</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                    By accessing or using <strong>IntellPharma</strong>, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>2. Use of Service</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1rem' }}>
                    IntellPharma is a software application designed for pharmacy management. You are responsible for:
                </p>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>The accuracy of all inventory and billing data entered</li>
                    <li>Compliance with local laws regarding medicine sales and GST billing</li>
                </ul>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>3. Subscription & Payments</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                    Certain features require a paid subscription. All payments are processed securely via Stripe. We offer various plans based on the number of branches and AI features. You can cancel your subscription at any time; however, fees already paid are non-refundable.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>4. System Uptime</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                    While we strive for 99.9% uptime, we are not liable for any losses resulting from temporary system outages or data connectivity issues at your pharmacy location.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>5. Limitation of Liability</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                    IntellPharma is an assistive tool. Final verification of batch numbers, expiry dates, and billing amounts is the responsibility of the registered pharmacist. ASSETMAGNETS is not liable for medication errors or incorrect billing resulting from user error.
                </p>
            </section>

            <div style={{ marginTop: '4rem', padding: '2.5rem', background: 'var(--glass-bg)', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-md)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center' }}>
                    By clicking "Register" or using the platform, you acknowledge that you have read and understood these terms.
                </p>
            </div>
        </div>
    );
}
