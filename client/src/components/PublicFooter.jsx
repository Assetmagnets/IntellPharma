import React from 'react';

export default function PublicFooter() {
    return (
        <footer className="landing-footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <img src="/logo.png" alt="Medistock" className="footer-logo" />
                    <span>IntellPharma</span>
                </div>
                <p style={{ color: "#BFC3D6" }}>
                    © {new Date().getFullYear()} IntellPharma by{" "}
                    <a
                        href="https://www.assetmagnets.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: "#FF4D00",
                            textDecoration: "none",
                            fontWeight: "600",
                        }}
                    >
                        ASSETMAGNETS
                    </a>
                    . All rights reserved.
                </p>
            </div>
        </footer>
    );
}
