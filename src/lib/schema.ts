import site from '../data/site.json';

const SITE_URL = 'https://healthrenovation.com.au';

export const businessId = `${SITE_URL}/#business`;
export const personId = `${SITE_URL}/about/#mark`;

const address = {
  '@type': 'PostalAddress',
  addressLocality: site.suburb,
  addressRegion: site.state,
  postalCode: site.postcode,
  addressCountry: 'AU',
};

const telephone = '+61' + site.phone.replace(/\s/g, '').replace(/^0/, '');

export function businessSchema(serviceNames: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    '@id': businessId,
    name: site.name,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/og-cover.jpg`,
    telephone,
    email: site.email,
    address,
    areaServed: { '@type': 'City', name: `${site.suburb}, Victoria` },
    founder: { '@id': personId },
    makesOffer: serviceNames.map((name) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name },
    })),
  };
}

export function personSchema(skills: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: site.practitioner,
    jobTitle: 'Wholistic Health Practitioner',
    url: `${SITE_URL}/about/`,
    worksFor: { '@id': businessId },
    knowsAbout: skills,
  };
}

export function serviceSchema(name: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url,
    provider: { '@id': businessId, '@type': 'HealthAndBeautyBusiness', name: site.name, telephone, address },
    areaServed: { '@type': 'City', name: `${site.suburb}, Victoria` },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function articleSchema(headline: string, description: string, date: Date, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    datePublished: date.toISOString(),
    url,
    author: { '@id': personId, '@type': 'Person', name: site.practitioner },
    publisher: { '@id': businessId, '@type': 'Organization', name: site.name },
  };
}
