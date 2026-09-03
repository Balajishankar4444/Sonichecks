/**
 * JSON-LD Schema Generators for Google Search Rich Results & AI Engine Optimization (GEO)
 */

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonichecks.com';

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sonichecks',
    url: BASE_URL,
    logo: `${BASE_URL}/icon.png`,
    description: 'Automated deterministic audio quality control platform compliant with ITU-R BS.1770-4 and EBU R128.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@sonichecks.com',
      contactType: 'customer support',
      availableLanguage: ['English'],
    },
  };
}

export function getWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Sonichecks Audio QC Engine',
    url: `${BASE_URL}/check`,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All modern web browsers (Chrome, Safari, Firefox, Edge)',
    browserRequirements: 'Requires JavaScript and Web Audio API support',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Tier',
        price: '0.00',
        priceCurrency: 'EUR',
        description: '5 free single-track audio QC checks per month with instant PASS/FAIL reports.',
      },
      {
        '@type': 'Offer',
        name: 'Pro Tier',
        price: '4.99',
        priceCurrency: 'EUR',
        description: '100 audio files/month with batch comparison matrix, PDF certificates, and SHA-256 hashes.',
      },
      {
        '@type': 'Offer',
        name: 'Studio Tier',
        price: '14.99',
        priceCurrency: 'EUR',
        description: '500 audio files/month with 200-file bulk batching and multi-track project workflows.',
      },
    ],
    featureList: [
      'In-browser local Web Audio DSP processing (Zero audio uploads)',
      'ITU-R BS.1770-4 Integrated LUFS & Loudness Range (LRA) measurement',
      '4x Polyphase True Peak (dBTP) oversampling calculation',
      'Hard digital flat-top sample clipping detection',
      'Head and tail silence duration inspection',
      'Cryptographic SHA-256 track integrity verification',
      'Exportable PDF Quality Control Inspection Certificates',
      'CSV spreadsheet batch export',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '128',
      bestRating: '5',
      worstRating: '1',
    },
  };
}

export function getFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}
