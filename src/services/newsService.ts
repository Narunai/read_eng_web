import type { NewsArticle, NewsResponse } from '../types/news';

const isDev = import.meta.env.DEV;

const GDELT_BASE_URL = isDev ? '/api-gdelt' : 'https://api.gdeltproject.org/api/v2/doc/doc';
const GUARDIAN_API_KEY = import.meta.env.VITE_GUARDIAN_API_KEY || 'test';
const GUARDIAN_BASE_URL = isDev ? '/api-guardian' : 'https://content.guardianapis.com';
const GUARDIAN_FIELDS = 'headline,trailText,bodyText,thumbnail';
const CACHE_TTL_MS = 10 * 60 * 1000;
const GDELT_MIN_INTERVAL_MS = 5500;

interface GdeltArticle {
  url: string;
  title: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

interface GuardianArticle {
  sectionName: string;
  webPublicationDate: string;
  webTitle: string;
  webUrl: string;
  fields?: {
    headline?: string;
    trailText?: string;
    bodyText?: string;
    thumbnail?: string;
  };
}

interface GuardianResponse {
  response: {
    status: string;
    total: number;
    results: GuardianArticle[];
  };
}

const cache = new Map<string, { expiresAt: number; data: NewsResponse }>();
let lastGdeltRequestAt = 0;
let gdeltRequestChain = Promise.resolve();

const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

const getCached = (key: string) => {
  const item = cache.get(key);
  if (!item || item.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  return item.data;
};

const setCached = (key: string, data: NewsResponse) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const runGdeltRequest = async <T,>(request: () => Promise<T>) => {
  const scheduledRequest = gdeltRequestChain.then(async () => {
    const elapsed = Date.now() - lastGdeltRequestAt;
    if (elapsed < GDELT_MIN_INTERVAL_MS) {
      await sleep(GDELT_MIN_INTERVAL_MS - elapsed);
    }

    lastGdeltRequestAt = Date.now();
    return request();
  });

  gdeltRequestChain = scheduledRequest.then(
    () => undefined,
    () => undefined,
  );

  return scheduledRequest;
};

const stripHtml = (html = '') => {
  if (!html) return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
};

const parseGdeltDate = (value?: string) => {
  const match = value?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return new Date().toISOString();

  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
};

const sourceNameFromDomain = (domain?: string) => {
  if (!domain) return 'Global News';

  const cleanDomain = domain.replace(/^www\./, '');
  const knownSources: Record<string, string> = {
    'bbc.com': 'BBC',
    'bbc.co.uk': 'BBC',
    'cnbc.com': 'CNBC',
    'finance.yahoo.com': 'Yahoo Finance',
    'forbes.com': 'Forbes',
    'reuters.com': 'Reuters',
    'theguardian.com': 'The Guardian',
    'wsj.com': 'Wall Street Journal',
  };

  return knownSources[cleanDomain] || cleanDomain;
};

const articleContentFromTitle = (title: string, domain?: string) => {
  const sourceName = sourceNameFromDomain(domain);

  return `${title}. This report was published by ${sourceName}. Read the original article for the full context, then use this reader to practice vocabulary, pronunciation, and sentence structure from the headline.`;
};

const toGdeltNewsResponse = (data: GdeltResponse, limit: number): NewsResponse => {
  const seenUrls = new Set<string>();
  const articles = (data.articles || [])
    .filter(article => article.title && article.url && article.language === 'English')
    .filter(article => {
      if (seenUrls.has(article.url)) return false;
      seenUrls.add(article.url);
      return true;
    })
    .slice(0, limit)
    .map((article): NewsArticle => ({
      title: article.title,
      description: `From ${sourceNameFromDomain(article.domain)}${article.sourcecountry ? `, ${article.sourcecountry}` : ''}.`,
      content: articleContentFromTitle(article.title, article.domain),
      url: article.url,
      urlToImage: article.socialimage || '',
      publishedAt: parseGdeltDate(article.seendate),
      source: {
        name: sourceNameFromDomain(article.domain),
      },
    }));

  return {
    status: 'ok',
    totalResults: articles.length,
    articles,
  };
};

const toGuardianNewsResponse = (data: GuardianResponse, limit: number): NewsResponse => {
  const articles = data.response.results.slice(0, limit).map((article): NewsArticle => {
    const description = stripHtml(article.fields?.trailText) || article.webTitle;
    const content = article.fields?.bodyText || description;

    return {
      title: article.fields?.headline || article.webTitle,
      description,
      content,
      url: article.webUrl,
      urlToImage: article.fields?.thumbnail || '',
      publishedAt: article.webPublicationDate,
      source: {
        name: article.sectionName || 'The Guardian',
      },
    };
  });

  return {
    status: data.response.status,
    totalResults: data.response.total,
    articles,
  };
};

const fallbackArticles = (query: string, limit: number): NewsResponse => {
  const topic = query.replace(/\bdomain:[^\s]+/g, '').trim() || 'business English';
  const now = new Date().toISOString();
  const articles: NewsArticle[] = [
    {
      title: `Market update: key vocabulary for ${topic}`,
      description: `A short learning article about ${topic}, written for business English practice when live news is temporarily unavailable.`,
      content: `Companies and investors often respond quickly when new information changes expectations. This learning article uses the topic ${topic} to practice words such as revenue, demand, supply, forecast, risk, and strategy. Read each sentence slowly and tap difficult words to translate them.`,
      url: 'https://www.theguardian.com/business',
      urlToImage: '',
      publishedAt: now,
      source: { name: 'Learning Sample' },
    },
    {
      title: `Business briefing: understanding the language of ${topic}`,
      description: `Practice common news phrases used in reports about markets, technology, and global business.`,
      content: `Business news often explains cause and effect. A company may expand because demand is rising. A market may fall because investors are worried about uncertainty. These patterns are useful for English learners because they appear in many articles about ${topic}.`,
      url: 'https://www.theguardian.com/business',
      urlToImage: '',
      publishedAt: now,
      source: { name: 'Learning Sample' },
    },
  ];

  return {
    status: 'ok',
    totalResults: articles.length,
    articles: articles.slice(0, limit),
  };
};

const requestGdelt = async (query: string, limit: number) => {
  const cacheKey = `gdelt:${query}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const data = await runGdeltRequest(async () => {
    const params = new URLSearchParams({
      query,
      mode: 'ArtList',
      format: 'json',
      maxrecords: String(Math.max(limit * 2, 10)),
      sort: 'DateDesc',
    });

    const response = await fetch(`${GDELT_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`GDELT API returned ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as GdeltResponse;
    } catch (e) {
      console.warn('GDELT returned non-JSON response:', text.substring(0, 100));
      return { articles: [] };
    }
  });

  const newsResponse = toGdeltNewsResponse(data, limit);
  if (newsResponse.articles.length > 0) {
    setCached(cacheKey, newsResponse);
  }

  return newsResponse;
};

const requestGuardian = async (query: string, limit: number) => {
  const cacheKey = `guardian:${query}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const cleanedQuery = query.replace(/\bdomain:[^\s]+/g, '').trim() || 'business';
  const params = new URLSearchParams({
    q: cleanedQuery,
    'order-by': 'newest',
    'page-size': String(limit),
    'show-fields': GUARDIAN_FIELDS,
    'api-key': GUARDIAN_API_KEY,
  });

  const response = await fetch(`${GUARDIAN_BASE_URL}/search?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Guardian API error details:', errorText);
    throw new Error(`Guardian API returned ${response.status}`);
  }

  const text = await response.text();
  try {
    const data = JSON.parse(text) as GuardianResponse;
    const newsResponse = toGuardianNewsResponse(data, limit);
    if (newsResponse.articles.length > 0) {
      setCached(cacheKey, newsResponse);
    }
    return newsResponse;
  } catch (e) {
    console.error('Guardian returned non-JSON response');
    return { status: 'error', totalResults: 0, articles: [] };
  }
};

const requestNews = async (query: string, limit: number): Promise<NewsResponse> => {
  try {
    const gdeltNews = await requestGdelt(query, limit);
    if (gdeltNews.articles.length > 0) return gdeltNews;
  } catch (error) {
    console.error('Error fetching multi-source news:', error);
  }

  try {
    const guardianNews = await requestGuardian(query, limit);
    if (guardianNews.articles.length > 0) return guardianNews;
  } catch (error) {
    console.error('Error fetching Guardian news:', error);
  }

  return fallbackArticles(query, limit);
};

export const fetchNews = async (query: string, limit: number = 5): Promise<NewsResponse> => {
  return requestNews(query, limit);
};

export const fetchTopHeadlines = async (limit: number = 6): Promise<NewsResponse> => {
  return requestNews('business OR finance OR technology OR stock market', limit);
};
