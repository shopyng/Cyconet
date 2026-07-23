/**
 * Structured data (JSON-LD) for Cyconet.
 *
 * Cyconet is three businesses at one address, so a flat Organization node would
 * under-describe it. Instead we emit an @graph where each arm is its own node
 * with a stable @id, wired together with `parentOrganization` / `subOrganization`:
 *
 *   #organization  EducationalOrganization  — the school, incl. Cybersecurity Academy
 *   #solutions     ProfessionalService      — the tech solutions agency
 *   #hub           LocalBusiness            — the co-working tech hub
 *   #website       WebSite
 *   + Course nodes per track, and an FAQPage for rich results
 *
 * Per the Next.js JSON-LD guide, this is rendered as a native <script> tag with
 * `<` escaped to `<` to close off XSS via injected content.
 */

import {
  SITE_URL,
  brand,
  faqs,
  programs,
  services,
  hubPlans,
} from './content';

const ORG_ID = `${SITE_URL}/#organization`;
const SOLUTIONS_ID = `${SITE_URL}/#solutions`;
const HUB_ID = `${SITE_URL}/#hub`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const postalAddress = {
  '@type': 'PostalAddress',
  streetAddress: brand.address.street,
  addressLocality: brand.address.locality,
  addressRegion: brand.address.region,
  addressCountry: brand.address.country,
};

/**
 * Keywords do nothing for Google rankings directly, but the array doubles as
 * the `about` topic list on the Organization node, which does help entity
 * matching. Ordered by search intent.
 */
export const keywords = [
  // Primary intent
  'cybersecurity academy',
  'cybersecurity training',
  'cyber security school',
  'penetration testing course',
  'tech school',
  'software engineering bootcamp',
  'data science course',
  'AI and machine learning training',
  'cloud computing certification',
  // Agency
  'tech solutions agency',
  'software development agency',
  'security audit services',
  // Hub
  'co-working space',
  'co-working tech hub',
  // Local — most searches for a school, agency or desk are city-qualified,
  // so the city-tagged variants matter more here than the generic ones above.
  'cybersecurity academy Ibadan',
  'tech school Ibadan',
  'coding bootcamp Ibadan',
  'co-working space Ibadan',
  'tech hub Ibadan',
  'software development company Ibadan',
  'tech school Oyo State',
  'Cyconet',
];

/** Cities and regions the three arms actually serve, for `areaServed`. */
const AREA_SERVED = [
  { '@type': 'City', name: 'Ibadan' },
  { '@type': 'AdministrativeArea', name: 'Oyo State' },
  { '@type': 'Country', name: 'Nigeria' },
];

function buildGraph() {
  return [
    /* --- Arm 01: the school, led by the Cybersecurity Academy --- */
    {
      '@type': ['EducationalOrganization', 'Organization'],
      '@id': ORG_ID,
      name: brand.name,
      alternateName: 'Cyconet Cybersecurity Academy',
      url: `${SITE_URL}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/cyconet-logo.svg`,
        width: 512,
        height: 512,
      },
      image: `${SITE_URL}/opengraph-image`,
      description: brand.shortDescription,
      foundingDate: brand.founded,
      email: brand.email,
      telephone: brand.phone,
      address: postalAddress,
      areaServed: AREA_SERVED,
      sameAs: [
        'https://x.com/cyconet',
        'https://www.linkedin.com/company/cyconet',
        'https://github.com/cyconet',
        'https://www.youtube.com/@cyconet',
      ],
      knowsAbout: keywords,
      subOrganization: [{ '@id': SOLUTIONS_ID }, { '@id': HUB_ID }],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Cyconet programs',
        itemListElement: programs.map((program) => ({
          '@type': 'Course',
          '@id': `${SITE_URL}/#course-${program.id}`,
          name: program.title,
          description: program.description,
          teaches: program.skills.join(', '),
          educationalLevel: program.level,
          provider: { '@id': ORG_ID },
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'onsite',
            courseWorkload: program.duration,
          },
        })),
      },
    },

    /* --- Arm 02: the tech solutions agency --- */
    {
      '@type': ['ProfessionalService', 'Organization'],
      '@id': SOLUTIONS_ID,
      name: 'Cyconet Solutions',
      alternateName: 'Cyconet Tech Solutions Agency',
      url: `${SITE_URL}/#solutions`,
      description:
        'Tech solutions agency delivering security audits and penetration testing, custom software, cloud and DevOps engineering, and data and AI consulting.',
      parentOrganization: { '@id': ORG_ID },
      address: postalAddress,
      areaServed: AREA_SERVED,
      email: brand.email,
      telephone: brand.phone,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Agency services',
        itemListElement: services.map((service) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.title,
            description: service.body,
            serviceType: service.deliverables.join(', '),
            provider: { '@id': SOLUTIONS_ID },
          },
        })),
      },
    },

    /* --- Arm 03: the co-working tech hub --- */
    {
      '@type': ['LocalBusiness', 'Organization'],
      '@id': HUB_ID,
      name: 'Cyconet Hub',
      alternateName: 'Cyconet Co-Working Tech Hub',
      url: `${SITE_URL}/#hub`,
      description:
        'Co-working tech hub with fibre internet, full backup power, 24/7 secure access, meeting rooms and a 120-seat event floor.',
      parentOrganization: { '@id': ORG_ID },
      address: postalAddress,
      areaServed: AREA_SERVED,
      email: brand.email,
      telephone: brand.phone,
      priceRange: '₦₦',
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '00:00',
        closes: '23:59',
      },
      makesOffer: hubPlans.map((plan) => ({
        '@type': 'Offer',
        name: plan.name,
        description: plan.body,
        priceCurrency: 'NGN',
      })),
    },

    /* --- The site itself --- */
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: `${SITE_URL}/`,
      name: brand.name,
      description: brand.shortDescription,
      publisher: { '@id': ORG_ID },
      inLanguage: 'en',
    },

    /* --- FAQ, eligible for rich results --- */
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ];
}

/**
 * Serialize any structured-data payload for `dangerouslySetInnerHTML`.
 * `<` is escaped so no value can break out of the script tag and inject markup.
 */
export function serializeJsonLd(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

/** The site-wide graph, rendered once in the root layout. */
export function jsonLdScript(): string {
  return serializeJsonLd({
    '@context': 'https://schema.org',
    '@graph': buildGraph(),
  });
}

/* ------------------------------------------------------------------ *
 * Per-page structured data
 * ------------------------------------------------------------------ */

/**
 * BreadcrumbList for a sub-page. Search results render this as a trail in place
 * of the raw URL, which measurably improves click-through on deep pages.
 */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]): string {
  return serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  });
}

/**
 * Full `Course` node for a dedicated program page.
 *
 * Richer than the summary courses in the site-wide OfferCatalog: it carries the
 * syllabus, prerequisites and delivery details, and it lives on the page that
 * actually describes the course — which is where Google expects to find it.
 */
export function courseJsonLd(course: {
  slug: string;
  path: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  prerequisites: string;
  skills: string[];
  modules: { title: string; body: string }[];
}): string {
  return serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${SITE_URL}${course.path}#course`,
    url: `${SITE_URL}${course.path}`,
    name: course.title,
    description: course.description,
    provider: { '@id': ORG_ID },
    teaches: course.skills.join(', '),
    educationalLevel: course.level,
    coursePrerequisites: course.prerequisites,
    inLanguage: 'en',
    syllabusSections: course.modules.map((module, index) => ({
      '@type': 'Syllabus',
      position: index + 1,
      name: module.title,
      description: module.body,
    })),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'onsite',
      courseWorkload: course.duration,
      location: {
        '@type': 'Place',
        name: 'Cyconet',
        address: postalAddress,
      },
    },
  });
}
