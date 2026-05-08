import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show' | 'article';
  noindex?: boolean;
}

const SITE_NAME = 'CineCasa';
const DEFAULT_DESCRIPTION = 'Assista filmes e séries online com qualidade premium. A melhor plataforma de streaming do Brasil.';
const DEFAULT_IMAGE = 'https://cinecasa.vercel.app/og-default.jpg';
const SITE_URL = 'https://cinecasa.vercel.app';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = url ? `${SITE_URL}${url}` : window.location.href;
  const fullImage = image?.startsWith('http') ? image : image?.startsWith('/t/p')
    ? `https://image.tmdb.org/t/p/w1280${image}`
    : DEFAULT_IMAGE;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Meta description
    setMeta('name', 'description', description);

    // Open Graph
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', fullImage);
    setMeta('property', 'og:url', fullUrl);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', 'pt_BR');

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', fullImage);
    setMeta('name', 'twitter:site', '@CineCasa');

    // Canonical
    setLink('canonical', fullUrl);

    // Robots
    setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');

    // Theme color
    setMeta('name', 'theme-color', '#00B7FF');

    return () => {
      // Restaurar título padrão ao desmontar
      document.title = SITE_NAME;
    };
  }, [fullTitle, description, fullImage, fullUrl, type, noindex]);

  return null;
}

function setMeta(attrName: string, attrValue: string, content: string) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.href = href;
}

// ── Hook de conveniência para páginas de conteúdo ─────────────
export function useContentSEO(content: {
  titulo?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  poster?: string;
  capa?: string;
  year?: string;
  ano?: string;
  vote_average?: number;
} | null, type: 'movie' | 'series') {
  const title = content?.titulo;
  const description = content?.overview
    ? `${content.overview.slice(0, 150)}...`
    : DEFAULT_DESCRIPTION;
  const image = content?.backdrop_path || content?.poster_path || content?.capa || content?.poster;
  const ogType = type === 'movie' ? 'video.movie' : 'video.tv_show';

  return { title, description, image, type: ogType as SEOProps['type'] };
}
