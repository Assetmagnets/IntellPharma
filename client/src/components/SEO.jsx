import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, keywords, canonicalUrl, image }) {
  const siteName = "IntellPharma";
  const defaultDescription = "IntellPharma is a smart pharmacy management system powered by AI. Manage inventory, billing, and gain real-time insights with our advanced software.";
  const defaultKeywords = "smart pharmacy management system, IntellPharma, medical shop software, inventory management, billing software, AI-driven pharmacy, pharmacy software india";
  // const defaultImage = "https://www.intellpharma.in/logo.png";
  // const baseUrl = "https://www.intellpharma.in";
  const defaultImage = "https://www.intellpharma.in/logo.png";
  const baseUrl = "https://www.intellpharma.in";

  const finalTitle = title ? `${title} | ${siteName}` : `${siteName} | Smart Pharmacy Management System`;
  const finalDescription = description || defaultDescription;
  const finalImage = image || defaultImage;
  const finalUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "IntellPharma",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": finalDescription,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "120"
    }
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "IntellPharma",
    "url": baseUrl,
    "logo": defaultImage,
    "sameAs": [
      // Add social media links here if available
    ]
  };

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={finalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(orgSchema)}
      </script>
    </Helmet>
  );
}
