import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, keywords, canonicalUrl, image }) {
  const siteName = "IntellPharma";
  const defaultDescription = "Transform your pharmacy with IntellPharma's AI-driven management system. Optimize inventory, streamline billing, and gain real-time insights.";
  const defaultKeywords = "pharmacy management, medical shop software, inventory management, billing software";
  const defaultImage = "https://intellpharma.in/logo.png";
  const baseUrl = "https://intellpharma.in";

  const finalTitle = title ? `${title} | ${siteName}` : `${siteName} | AI-Powered Pharmacy Management`;
  const finalDescription = description || defaultDescription;
  const finalImage = image || defaultImage;
  const finalUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords || defaultKeywords} />}
      <link rel="canonical" href={finalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
    </Helmet>
  );
}
