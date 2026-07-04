import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "FitSadhana | Cultivate Your Strength", 
  description = "The ultimate AI-powered fitness and nutrition tracker.", 
  url = "https://fitsadhana.dhanvatix.in", 
  image = "https://fitsadhana.dhanvatix.in/og-image.jpg", 
  type = "website" 
}) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "FitSadhana",
    "url": url,
    "description": description,
    "publisher": {
      "@type": "Organization",
      "name": "FitSadhana"
    }
  };

  return (
    <Helmet>
      {/* Standard SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

export default SEO;
