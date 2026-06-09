import { useCallback, useEffect, useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { NewsCard } from './components/NewsCard';
import { ArticleReader } from './components/ArticleReader';
import { fetchNews, fetchTopHeadlines, fetchSourceTopHeadlines } from './services/newsService';
import type { NewsArticle } from './types/news';
import type { GoogleTranslateResponse } from './types/translation';

function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [translatedTitles, setTranslatedTitles] = useState<Record<number, string>>({});
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>("Business");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categoryData: Record<string, { icon: string, keywords: { label: string, query: string }[] }> = {
    "Business": {
      icon: "💼",
      keywords: [
        { label: "Startups", query: "tech startups" },
        { label: "Economy", query: "global economy" },
        { label: "Crypto", query: "cryptocurrency business" },
        { label: "Banking", query: "banking sector" }
      ]
    },
    "Stocks": {
      icon: "📈",
      keywords: [
        { label: "S&P 500", query: "S&P 500 index" },
        { label: "Nasdaq", query: "Nasdaq tech stocks" },
        { label: "Dividends", query: "dividend stocks" },
        { label: "Investing", query: "stock investing tips" }
      ]
    },
    "AI": {
      icon: "🤖",
      keywords: [
        { label: "ChatGPT", query: "openai chatgpt" },
        { label: "Robotics", query: "advanced robotics" },
        { label: "ML", query: "machine learning news" },
        { label: "Future", query: "future of AI" }
      ]
    },
    "Space": {
      icon: "🚀",
      keywords: [
        { label: "SpaceX", query: "spacex starship" },
        { label: "NASA", query: "nasa mars mission" },
        { label: "Astronomy", query: "latest astronomy discovery" },
        { label: "Moon", query: "moon base artemis" }
      ]
    },
    "Fashion": {
      icon: "👗",
      keywords: [
        { label: "Trends", query: "fashion trends 2024" },
        { label: "Luxury", query: "luxury brands news" },
        { label: "Design", query: "fashion design" },
        { label: "Shows", query: "paris fashion week" }
      ]
    },
    "Food": {
      icon: "🍽️",
      keywords: [
        { label: "Michelin", query: "michelin star restaurants" },
        { label: "Recipes", query: "gourmet cooking" },
        { label: "Tech", query: "food technology" },
        { label: "Vegan", query: "plant based food" }
      ]
    }
  };

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('read_eng_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    setIsLoading(true);
    setError(null);
    setTranslatedTitles({}); 

    // Update history
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 10); // Keep last 10
      localStorage.setItem('read_eng_history', JSON.stringify(updated));
      return updated;
    });

    try {
      const data = await fetchNews(query);
      
      const filteredArticles = data.articles.filter(article => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        if (descLower.includes("copyright") && !titleLower.includes("copyright")) {
          return false;
        }
        return true;
      });

      setArticles(filteredArticles);

      if (filteredArticles.length === 0) {
        setError("No relevant articles found for this topic.");
      } else {
        const titlesToTranslate = filteredArticles.map(a => a.title).join(" ||| ");
        try {
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(titlesToTranslate)}`);
          const translationData = (await res.json()) as GoogleTranslateResponse;
          const fullTranslation = translationData[0].map((segment) => segment[0]).join("");
          const translatedList = fullTranslation.split(" ||| ");
          
          const newTranslatedTitles: Record<number, string> = {};
          translatedList.forEach((t: string, i: number) => {
            newTranslatedTitles[i] = t.trim();
          });
          setTranslatedTitles(newTranslatedTitles);
        } catch (transErr) {
          console.error("Headline translation failed", transErr);
        }
      }
    } catch {
      setError("Please check your API Key in newsService.ts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const topData = await fetchTopHeadlines(8);
        if (topData.articles.length > 0) {
          setArticles(topData.articles);
          
          const titlesToTranslate = topData.articles.map(a => a.title).join(" ||| ");
          fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(titlesToTranslate)}`)
            .then(res => res.json())
            .then((translationData: GoogleTranslateResponse) => {
              const fullTranslation = translationData[0].map((segment) => segment[0]).join("");
              const translatedList = fullTranslation.split(" ||| ");
              const newTranslatedTitles: Record<number, string> = {};
              translatedList.forEach((t: string, i: number) => {
                newTranslatedTitles[i] = t.trim();
              });
              setTranslatedTitles(newTranslatedTitles);
            })
            .catch(err => console.error("Initial translation failed", err));
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };
    loadInitialData();
  }, []);



  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-10">
      <div className="max-w-md mx-auto px-5 py-6">
        <header className="mb-4 flex flex-col items-center text-center">
          <div className="bg-dark-accent/10 p-3 rounded-2xl mb-3">
            <h1 className="text-4xl font-black text-gradient tracking-tighter">... / READ ENG BRO </h1>
          </div>
        </header>

        <SearchBar onSearch={handleSearch} externalQuery={searchQuery} />

        {/* Quick Discovery Section */}
        <div className="mb-8 bg-slate-800/20 p-4 rounded-[2rem] border border-slate-800/50">
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3 ml-1">Discover & Trends</p>
          
          {/* Main Categories Scroll (Smaller) */}
          <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
            {Object.keys(categoryData).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  handleSearch(cat);
                }}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-bold transition-all
                  ${activeCategory === cat 
                    ? 'bg-dark-accent text-dark-bg scale-105 shadow-md shadow-dark-accent/20' 
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800'}
                `}
              >
                <span className="text-sm">{categoryData[cat].icon}</span>
                {cat}
              </button>
            ))}
          </div>

          {/* Combined Keywords & Trends (Compact) */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {/* Sub Keywords */}
            {categoryData[activeCategory].keywords.map((item, idx) => (
              <button
                key={`sub-${idx}`}
                onClick={() => handleSearch(item.query)}
                className="bg-dark-accent/5 border border-dark-accent/10 px-3 py-1 rounded-lg text-[10px] font-bold text-dark-accent/70 hover:bg-dark-accent/20 hover:text-dark-accent transition-all active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>
            
          {/* Search History (Recent Searches) */}
          {searchHistory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/50">
              <div className="flex justify-between items-center mb-2 px-1">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Recent Searches</p>
                {searchHistory.length > 4 && (
                  <button 
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="text-[9px] text-dark-accent font-black uppercase tracking-widest hover:underline"
                  >
                    {showAllHistory ? "Show Less" : "See More"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(showAllHistory ? searchHistory : searchHistory.slice(0, 4)).map((item, idx) => (
                  <button
                    key={`history-${idx}`}
                    onClick={() => handleSearch(item)}
                    className="bg-slate-800/40 border border-slate-700/50 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all flex items-center gap-1.5"
                  >
                    <span className="opacity-50">🕒</span>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-dark-accent border-t-transparent shadow-lg shadow-dark-accent/20"></div>
            <p className="mt-4 text-slate-400 font-bold animate-pulse">Fetching latest news...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-red-400 mb-8 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && articles.length === 0 && (
          <div className="text-center py-20 opacity-40">
            <div className="text-6xl mb-4">📰</div>
            <p className="text-lg font-bold">Search for articles to start learning</p>
          </div>
        )}

        <div className="space-y-6">
          {articles.map((article, index) => (
            <NewsCard 
              key={index} 
              article={article} 
              translatedTitle={translatedTitles[index]}
              onClick={() => setSelectedArticle(article)}
              onKeywordClick={handleSearch}
            />
          ))}
        </div>
      </div>

      {selectedArticle && (
        <ArticleReader 
          content={selectedArticle.content || selectedArticle.description || "No content available."}
          title={selectedArticle.title}
          url={selectedArticle.url}
          imageUrl={selectedArticle.urlToImage}
          onBack={() => setSelectedArticle(null)}
          onKeywordClick={handleSearch}
        />
      )}
    </div>
  );
}

export default App;
