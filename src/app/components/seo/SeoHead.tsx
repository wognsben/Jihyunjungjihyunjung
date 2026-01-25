import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string;
}

export const SeoHead = ({ title, description, image }: SeoHeadProps) => {
  const { lang } = useLanguage();
  
  const siteTitle = 'JIHYUN JUNG';
  const defaultDescription = 'Minimalist Portfolio of Architect Jihyun Jung. Exploring the raw texture of materials and the precision of space.';
  
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const metaDescription = description || defaultDescription;
  const metaImage = image || 'https://raw.githubusercontent.com/wognsben/gallery/main/1.jpg'; // Default OG image

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <html lang={lang} />
    </Helmet>
  );
};
