import type { NewsResponse } from '../types/news';

const API_KEY = 'a13bd9b9b72a422f80ff3dbba78cdd3c'; // User should replace this
const BASE_URL = 'https://newsapi.org/v2';

export const fetchNews = async (query: string, limit: number = 5): Promise<NewsResponse> => {
  try {
    const response = await fetch(
      `${BASE_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${limit}&apiKey=${API_KEY}&language=en&sortBy=publishedAt`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

export const fetchTopHeadlines = async (limit: number = 6): Promise<NewsResponse> => {
  try {
    const response = await fetch(
      `${BASE_URL}/top-headlines?category=technology&pageSize=${limit}&apiKey=${API_KEY}&language=en`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch top headlines');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching top headlines:', error);
    throw error;
  }
};
