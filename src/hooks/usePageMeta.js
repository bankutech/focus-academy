import { useEffect } from 'react';

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://focus-academy-virid.vercel.app').replace(/\/+$/, '');

const ensureTag = (selector, create) => {
  let element = document.head.querySelector(selector);
  const created = !element;
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  return { element, created };
};

export function usePageMeta({ title, description, path, robots } = {}) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const previousTitle = document.title;
    if (title) document.title = title;

    let descriptionTag = null;
    let previousDescription = null;
    if (description) {
      const { element } = ensureTag('meta[name="description"]', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        return meta;
      });
      descriptionTag = element;
      previousDescription = element.getAttribute('content');
      element.setAttribute('content', description);
    }

    let canonicalTag = null;
    let previousCanonical = null;
    let createdCanonical = false;
    if (path) {
      const { element, created } = ensureTag('link[rel="canonical"]', () => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        return link;
      });
      canonicalTag = element;
      createdCanonical = created;
      previousCanonical = created ? null : element.getAttribute('href');
      element.setAttribute('href', `${SITE_URL}${path === '/' ? '/' : path}`);
    }

    let robotsTag = null;
    let previousRobots = null;
    if (robots) {
      const { element } = ensureTag('meta[name="robots"]', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        return meta;
      });
      robotsTag = element;
      previousRobots = element.getAttribute('content');
      element.setAttribute('content', robots);
    }

    return () => {
      document.title = previousTitle;
      if (descriptionTag && previousDescription !== null) descriptionTag.setAttribute('content', previousDescription);
      if (canonicalTag) {
        if (createdCanonical) canonicalTag.remove();
        else if (previousCanonical !== null) canonicalTag.setAttribute('href', previousCanonical);
      }
      if (robotsTag) {
        if (previousRobots === null) robotsTag.remove();
        else robotsTag.setAttribute('content', previousRobots);
      }
    };
  }, [title, description, path, robots]);
}

export default usePageMeta;
