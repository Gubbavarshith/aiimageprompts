/**
 * SEO Utility Functions
 * 
 * Provides utilities for dynamically updating meta tags, canonical URLs,
 * and Open Graph/Twitter card tags in a client-side rendered React app.
 */

const PRODUCTION_DOMAIN = 'https://aiimageprompts.xyz';

/**
 * Get or create a meta tag element
 */
function getOrCreateMetaTag(attribute: string, value: string, tagName: string = 'meta'): HTMLElement {
  const selector = attribute === 'name' || attribute === 'property' 
    ? `${tagName}[${attribute}="${value}"]`
    : `${tagName}[${attribute}]`;
  
  let element = document.querySelector(selector) as HTMLElement;
  
  if (!element) {
    element = document.createElement(tagName);
    if (attribute === 'name' || attribute === 'property') {
      element.setAttribute(attribute, value);
    } else if (attribute === 'rel') {
      element.setAttribute('rel', value);
    }
    document.head.appendChild(element);
  }
  
  return element;
}

/**
 * Update the page title
 */
export function updateTitle(title: string): void {
  document.title = title;
}

/**
 * Update the meta description
 */
export function updateMetaDescription(description: string): void {
  const meta = getOrCreateMetaTag('name', 'description');
  meta.setAttribute('content', description);
}

/**
 * Update or create a canonical link tag
 */
export function updateCanonical(url: string): void {
  // Ensure absolute URL
  const absoluteUrl = url.startsWith('http') ? url : `${PRODUCTION_DOMAIN}${url.startsWith('/') ? url : `/${url}`}`;
  
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  
  canonical.setAttribute('href', absoluteUrl);
}

/**
 * Update Open Graph meta tags
 */
export function updateOGTags(options: {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  siteName?: string;
}): void {
  if (options.title) {
    const meta = getOrCreateMetaTag('property', 'og:title');
    meta.setAttribute('content', options.title);
  }
  
  if (options.description) {
    const meta = getOrCreateMetaTag('property', 'og:description');
    meta.setAttribute('content', options.description);
  }
  
  if (options.url) {
    const absoluteUrl = options.url.startsWith('http') ? options.url : `${PRODUCTION_DOMAIN}${options.url.startsWith('/') ? options.url : `/${options.url}`}`;
    const meta = getOrCreateMetaTag('property', 'og:url');
    meta.setAttribute('content', absoluteUrl);
  }
  
  if (options.image) {
    const absoluteUrl = options.image.startsWith('http') ? options.image : `${PRODUCTION_DOMAIN}${options.image.startsWith('/') ? options.image : `/${options.image}`}`;
    const meta = getOrCreateMetaTag('property', 'og:image');
    meta.setAttribute('content', absoluteUrl);
  }
  
  if (options.type) {
    const meta = getOrCreateMetaTag('property', 'og:type');
    meta.setAttribute('content', options.type);
  }
  
  if (options.siteName) {
    const meta = getOrCreateMetaTag('property', 'og:site_name');
    meta.setAttribute('content', options.siteName);
  }
}

/**
 * Update Twitter card meta tags
 */
export function updateTwitterTags(options: {
  card?: string;
  title?: string;
  description?: string;
  image?: string;
  site?: string;
}): void {
  if (options.card) {
    const meta = getOrCreateMetaTag('name', 'twitter:card');
    meta.setAttribute('content', options.card);
  }
  
  if (options.title) {
    const meta = getOrCreateMetaTag('name', 'twitter:title');
    meta.setAttribute('content', options.title);
  }
  
  if (options.description) {
    const meta = getOrCreateMetaTag('name', 'twitter:description');
    meta.setAttribute('content', options.description);
  }
  
  if (options.image) {
    const absoluteUrl = options.image.startsWith('http') ? options.image : `${PRODUCTION_DOMAIN}${options.image.startsWith('/') ? options.image : `/${options.image}`}`;
    const meta = getOrCreateMetaTag('name', 'twitter:image');
    meta.setAttribute('content', absoluteUrl);
  }
  
  if (options.site) {
    const meta = getOrCreateMetaTag('name', 'twitter:site');
    meta.setAttribute('content', options.site);
  }
}

/**
 * Comprehensive function to update all SEO meta tags at once
 */
export function updateMetaTags(options: {
  title: string;
  description?: string;
  canonical?: string;
  og?: {
    title?: string;
    description?: string;
    url?: string;
    image?: string;
    type?: string;
    siteName?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    site?: string;
  };
}): void {
  updateTitle(options.title);
  
  if (options.description) {
    updateMetaDescription(options.description);
  }
  
  if (options.canonical) {
    updateCanonical(options.canonical);
  }
  
  if (options.og) {
    updateOGTags(options.og);
  }
  
  if (options.twitter) {
    updateTwitterTags(options.twitter);
  }
}

