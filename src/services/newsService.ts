import type { NewsArticle, NewsResponse } from '../types/news';

const GUARDIAN_API_KEY = import.meta.env.VITE_GUARDIAN_API_KEY || 'test';
const GUARDIAN_BASE_URL = 'https://content.guardianapis.com';
const SHOW_FIELDS = 'headline,trailText,bodyText,thumbnail';

interface GuardianArticle {
  id: string;
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

const stripHtml = (html = '') => {
  if (!html) return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
};

const toNewsResponse = (data: GuardianResponse, limit: number): NewsResponse => {
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
  const topic = query.trim() || 'business English';
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

const requestGuardian = async (params: URLSearchParams, limit: number, fallbackQuery: string) => {
  params.set('order-by', 'newest');
  params.set('page-size', String(limit));
  params.set('show-fields', SHOW_FIELDS);
  params.set('api-key', GUARDIAN_API_KEY);

  try {
    const response = await fetch(`${GUARDIAN_BASE_URL}/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Guardian API returned ${response.status}`);
    }

    const data = (await response.json()) as GuardianResponse;
    const newsResponse = toNewsResponse(data, limit);

    return newsResponse.articles.length > 0 ? newsResponse : fallbackArticles(fallbackQuery, limit);
  } catch (error) {
    console.error('Error fetching news:', error);
    return fallbackArticles(fallbackQuery, limit);
  }
};

export const fetchNews = async (query: string, limit: number = 5): Promise<NewsResponse> => {
  const params = new URLSearchParams({
    q: query,
  });

  return requestGuardian(params, limit, query);
};

export const fetchTopHeadlines = async (limit: number = 6): Promise<NewsResponse> => {
  const params = new URLSearchParams({
    section: 'business',
  });

  return requestGuardian(params, limit, 'business');
};
