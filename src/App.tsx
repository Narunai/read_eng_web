import { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { NewsCard } from './components/NewsCard';
import { ArticleReader } from './components/ArticleReader';
import { fetchNews, fetchTopHeadlines } from './services/newsService';
import type { NewsArticle } from './types/news';

function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [translatedTitles, setTranslatedTitles] = useState<Record<number, string>>({});
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>("Business");

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

  const [trendingKeywords, setTrendingKeywords] = useState<{ label: string, query: string }[]>([]);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const data = await fetchTopHeadlines(6);
        const keywords = data.articles.map(article => {
          // Extract first 2-3 words of the title or source name as keyword
          const label = article.source.name === "[Removed]" ? "Global" : article.source.name;
          return {
            label: `✨ ${label}`,
            query: article.title.split(' ').slice(0, 3).join(' ')
          };
        }).filter(item => item.label !== "✨ [Removed]");
        
        setTrendingKeywords(keywords);
        
        // Optionally load initial news
        if (keywords.length > 0) {
          handleSearch(keywords[0].query);
        }
      } catch (err) {
        console.error("Failed to load trending", err);
      }
    };
    loadTrending();
  }, []);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setTranslatedTitles({}); // Reset translations
    try {
      const data = await fetchNews(query);
      
      // Filter out articles that contain "copyright" in description but NOT in title
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
        // Automatically fetch translations for the filtered headlines
        const titlesToTranslate = filteredArticles.map(a => a.title).join(" ||| ");
        try {
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(titlesToTranslate)}`);
          const translationData = await res.json();
          const fullTranslation = translationData[0].map((segment: any) => segment[0]).join("");
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
    } catch (err) {
      setError("Please check your API Key in newsService.ts");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-10">
      <div className="max-w-md mx-auto px-5 py-8">
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="bg-dark-accent/10 p-3 rounded-2xl mb-4">
            <h1 className="text-4xl font-black text-gradient tracking-tighter">... / READ ENG BRO </h1>
          </div>
        </header>

        <SearchBar onSearch={handleSearch} />

        {/* Category Discovery */}
        <div className="mb-10">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 ml-1">Explore Categories</p>
          
          {/* Main Categories Scroll */}
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
            {Object.keys(categoryData).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap font-bold transition-all
                  ${activeCategory === cat 
                    ? 'bg-dark-accent text-dark-bg scale-105 shadow-lg shadow-dark-accent/20' 
                    : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-800'}
                `}
              >
                <span>{categoryData[cat].icon}</span>
                {cat}
              </button>
            ))}
          </div>

          {/* Sub Keywords for Active Category */}
          <div className="flex flex-wrap gap-2 mt-4 animate-slide-up">
            {categoryData[activeCategory].keywords.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(item.query)}
                className="bg-slate-800/20 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-dark-accent/10 hover:border-dark-accent/30 hover:text-dark-accent transition-all active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Trends Section */}
        {trendingKeywords.length > 0 && (
          <div className="mb-10">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 ml-1">Hot Trends</p>
            <div className="flex flex-wrap gap-2">
              {trendingKeywords.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(item.query)}
                  className="bg-slate-800/40 border border-slate-700/50 px-4 py-2 rounded-2xl text-[11px] font-bold text-slate-400 hover:bg-dark-accent/10 hover:border-dark-accent/50 hover:text-dark-accent transition-all"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
            />
          ))}
        </div>
      </div>

      {selectedArticle && (
        <ArticleReader 
          content={selectedArticle.content || selectedArticle.description || "No content available."}
          title={selectedArticle.title}
          url={selectedArticle.url}
          onBack={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}

export default App;
