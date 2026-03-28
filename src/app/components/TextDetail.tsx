import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { fetchTextById } from '@/services/wp-api';
import { TextItem } from '@/data/texts';
import { getLocalizedThumbnail } from '@/utils/getLocalizedImage';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Footer } from '@/app/components/Footer';
import { BlockRenderer } from '@/app/components/BlockRenderer';

interface TextDetailProps {
  textId: string | null;
  isPage?: boolean;
}

const cleanText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
};

// Sanitize HTML: only allow safe inline tags
const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  let sanitized = html.replace(
    /<a\s+([^>]*)>([\s\S]*?)<\/a>/gi,
    (_match, attrs, content) => {
      const hrefMatch = attrs.match(/href=["']([^"']*)["']/);
      const href = hrefMatch ? hrefMatch[1] : '#';

      // 외부 링크만 새창
      if (href.startsWith('http') || href.startsWith('//')) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
      }

      // 내부 링크 / footnote 는 target 제거
      return `<a href="${href}">${content}</a>`;
    }
  );

  sanitized = sanitized.replace(
    /<(?!\/?(?:a|strong|b|em|i|u|mark|span|sup|sub)\b)[^>]+>/gi,
    ''
  );

  return sanitized;
};

export const TextDetail = ({ textId, isPage = false }: TextDetailProps) => {
  const { lang } = useLanguage();
  const { texts, works, translateTextsByIds, currentLang } = useWorks();

  const [localText, setLocalText] = useState<TextItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contextText = texts.find((t) => t.id === textId);

  useEffect(() => {
    if (!textId) return;

    if (contextText) {
      setLocalText(contextText);
      setLoading(false);
      return;
    }

    const loadSingleText = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetched = await fetchTextById(textId);
        if (fetched) {
          setLocalText(fetched);
        } else {
          setError('Text not found on server');
        }
      } catch (_err) {
        setError('Failed to load text');
      } finally {
        setLoading(false);
      }
    };

    loadSingleText();
  }, [textId, contextText]);

  const text = localText;

  useEffect(() => {
    if (textId && lang !== 'ko' && lang !== currentLang && contextText) {
      translateTextsByIds([textId], lang);
    }
  }, [textId, lang, currentLang, contextText, translateTextsByIds]);

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a') as HTMLAnchorElement | null;

    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';

    // 외부 링크는 그대로
    if (href.startsWith('http') || href.startsWith('//')) return;

    // 라우터 링크는 그대로
    if (href.startsWith('#/')) return;

    // footnote / in-page anchor 만 수동 처리
    if (href.startsWith('#')) {
      const id = href.replace(/^#/, '');

      const el =
        document.getElementById(id) ||
        document.getElementById(`footnote-${id}`) ||
        document.getElementById(`fn-${id}`) ||
        document.getElementById(`note-${id}`) ||
        document.getElementById(id.replace(/[^\d]/g, '')) ||
        document.getElementById(`footnote-${id.replace(/[^\d]/g, '')}`) ||
        document.getElementById(`fn-${id.replace(/[^\d]/g, '')}`) ||
        document.getElementById(`note-${id.replace(/[^\d]/g, '')}`);

      if (el) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-pulse text-xs tracking-[0.2em] uppercase opacity-50">
          Loading from Archive...
        </div>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <h1 className="text-lg font-light">Content Unavailable</h1>
        <p className="text-[10px] text-muted-foreground font-mono">ID: {textId}</p>
        {error && <p className="text-[10px] text-red-400/50">{error}</p>}
      </div>
    );
  }

  const title = text.title[lang] || text.title.ko;
  const content = text.content
    ? text.content[lang] || text.content.ko
    : text.summary
      ? text.summary[lang] || text.summary.ko
      : '';

  const rawHtml = text.contentHtml
    ? text.contentHtml[lang] || text.contentHtml.ko
    : undefined;

  const useBlockRenderer = !!rawHtml;

  const paragraphs =
    !useBlockRenderer && content
      ? (() => {
          const doubleNewlineSplit = content.split('\n\n').filter((p) => p.trim());
          if (doubleNewlineSplit.length > 1) return doubleNewlineSplit;

          const singleNewlineSplit = content.split('\n').filter((p) => p.trim());
          if (singleNewlineSplit.length > 1) return singleNewlineSplit;

          return doubleNewlineSplit;
        })()
      : [];

  const reverseRelatedWorks = works
    .filter((work) => work.relatedArticles?.some((article) => article.id === textId))
    .map((work) => {
      const workTitle =
        lang === 'en' ? work.title_en : lang === 'jp' ? work.title_jp : work.title_ko;

      return {
        id: work.id,
        slug: work.slug,
        title: workTitle || work.title_ko,
        thumbnail: getLocalizedThumbnail(work, lang),
        year: String(work.year),
      };
    });

  const mergedRelatedWorks = text
    ? [...(text.relatedWorks || []), ...reverseRelatedWorks].filter(Boolean)
    : [];

  const allRelatedWorks = mergedRelatedWorks.filter((work, index, self) => {
    const currentKey =
      work?.id ?? work?.slug ?? work?.title ?? `related-${index}`;

    return (
      index ===
      self.findIndex((w) => {
        const compareKey = w?.id ?? w?.slug ?? w?.title;
        return compareKey === currentKey;
      })
    );
  });

  return (
    <div className="relative w-full h-full bg-background text-foreground overflow-y-auto selection:bg-foreground/10 custom-scrollbar">
      {isPage && (
        <>
          <div className="block md:hidden px-6 pt-24 mb-2">
            <button
              onClick={() => window.history.back()}
              className="group flex items-center gap-3 px-0 py-2 bg-transparent focus:outline-none"
            >
              <ArrowLeft className="w-3 h-3 transition-transform duration-500 ease-out group-hover:-translate-x-1 opacity-50 group-hover:opacity-80" />
              <span className="text-[10px] tracking-[0.25em] lowercase font-light opacity-50 group-hover:opacity-80 transition-opacity duration-300">
                back
              </span>
            </button>
          </div>

          <div className="hidden md:block fixed top-32 left-16 z-40 mix-blend-difference text-white dark:text-white">
            <button
              onClick={() => window.history.back()}
              className="group flex items-center gap-3 px-4 py-2 bg-transparent focus:outline-none"
            >
              <ArrowLeft className="w-3 h-3 transition-transform duration-500 ease-out group-hover:-translate-x-1 opacity-70 group-hover:opacity-100" />
              <span className="text-[10px] tracking-[0.25em] lowercase font-light opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                back
              </span>
            </button>
          </div>
        </>
      )}

      <div
        className={`px-6 md:px-12 max-w-5xl mx-auto ${
          isPage ? 'pt-4 md:pt-40 pb-32' : 'py-8 md:py-10'
        }`}
      >
        <article>
          <header className="mb-12 md:mb-16 space-y-6 max-w-3xl mx-auto text-center">
  <div className="flex items-center justify-center text-[10px] tracking-[0.15em] lowercase text-muted-foreground/80 font-mono">
    <div className="flex items-center gap-3">
      <span className="font-[SansSerif]">{text.category.toLowerCase()}</span>
      <span className="opacity-30">/</span>
      <span>{text.year}</span>
    </div>
  </div>

  <motion.h1
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
    className={`font-light text-foreground/90 leading-tight text-[24px] text-center ${
      lang === 'jp' ? 'font-[Shippori_Mincho]' : 'font-serif'
    }`}
  >
    {cleanText(title)}
  </motion.h1>

            {text.image && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                className="relative w-full aspect-[2/1] rounded-sm overflow-hidden bg-foreground/5 mt-6"
              >
                <img
                  src={text.image}
                  alt={title}
                  className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                />
              </motion.div>
            )}

            <div className="h-px w-full bg-foreground/5 mt-8" />
          </header>

          <div className="space-y-6">
            {useBlockRenderer ? (
              <div onClick={handleContentClick}>
                <BlockRenderer html={rawHtml!} lang={lang} compact />
              </div>
            ) : (
              paragraphs.map((paragraph, index) => (
                <motion.p
                  key={index}
                  onClick={handleContentClick}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + index * 0.1,
                    ease: 'easeOut',
                  }}
                  className={`text-sm md:text-[0.95rem] leading-[1.8] text-foreground/80 text-justify [&_a]:text-foreground/60 [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-foreground/20 [&_a]:transition-all [&_a]:duration-300 hover:[&_a]:text-foreground/90 hover:[&_a]:decoration-foreground/40 ${
                    lang === 'jp' ? 'font-[Shippori_Mincho]' : 'font-serif'
                  }`}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(paragraph) }}
                />
              ))
            )}
          </div>

          {allRelatedWorks.length > 0 && (
            <div className="mt-24 pt-12 border-t border-foreground/5">
              <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground/60 font-mono mb-8">
                related
              </h2>

              {allRelatedWorks.length <= 3 ? (
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-8">
                  {allRelatedWorks.map((work, index) => {
                    const itemKey =
                      work?.id ?? work?.slug ?? work?.title ?? `related-${index}`;
                    const itemHref = work?.id ?? work?.slug ?? '';

                    return (
                      <a
                        href={`#/work/${itemHref}`}
                        key={itemKey}
                        className="group block w-[calc(50%_-_8px)] md:w-[calc(33.333%_-_11px)] lg:w-[calc(25%_-_12px)]"
                      >
                        <div className="aspect-[4/3] bg-foreground/5 mb-3 overflow-hidden">
                          {work.thumbnail ? (
                            <img
                              src={work.thumbnail}
                              alt={work.title}
                              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-foreground/5 text-muted-foreground/30 text-[8px]">
                              NO IMAGE
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="text-[11px] tracking-wide font-medium leading-tight group-hover:underline underline-offset-4 decoration-foreground/30">
                            {cleanText(work.title)}
                          </div>
                          <div className="text-[10px] text-muted-foreground/60 font-mono">
                            <span>{work.year}</span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                  {allRelatedWorks.map((work, index) => {
                    const itemKey =
                      work?.id ?? work?.slug ?? work?.title ?? `related-${index}`;
                    const itemHref = work?.id ?? work?.slug ?? '';

                    return (
                      <a
                        href={`#/work/${itemHref}`}
                        key={itemKey}
                        className="group block"
                      >
                        <div className="aspect-[4/3] bg-foreground/5 mb-3 overflow-hidden">
                          {work.thumbnail ? (
                            <img
                              src={work.thumbnail}
                              alt={work.title}
                              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-foreground/5 text-muted-foreground/30 text-[8px]">
                              NO IMAGE
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="text-[11px] tracking-wide font-medium leading-tight group-hover:underline underline-offset-4 decoration-foreground/30">
                            {cleanText(work.title)}
                          </div>
                          <div className="text-[10px] text-muted-foreground/60 font-mono">
                            <span>{work.year}</span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-foreground/5 flex justify-center opacity-30" />
        </article>
      </div>

      {isPage && <Footer />}
    </div>
  );
};

export default TextDetail;