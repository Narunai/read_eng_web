import React from 'react';
import type { NewsArticle } from '../types/news';

interface NewsCardProps {
  article: NewsArticle;
  translatedTitle?: string;
  onClick: () => void;
  onKeywordClick?: (keyword: string) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, translatedTitle, onClick, onKeywordClick }) => {
  // Simple keyword extraction for display
  const keywords = article.title.split(' ')
    .filter(w => w.length > 5)
    .map(w => w.replace(/[^\w]/g, ''))
    .slice(0, 2);

  return (
    <div 
      onClick={onClick}
      className="card-gradient group rounded-3xl border border-slate-800 shadow-xl overflow-hidden active:scale-[0.98] transition-all duration-300 cursor-pointer"
    >
      {article.urlToImage ? (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={article.urlToImage} 
            alt={article.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 to-transparent"></div>
          <div className="absolute bottom-3 left-4 flex gap-2">
            <span className="bg-dark-accent text-dark-bg text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              {article.source.name}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 pb-0 flex gap-2">
          <span className="bg-dark-accent/20 text-dark-accent text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            {article.source.name}
          </span>
        </div>
      )}
      
      <div className="p-5">
        {translatedTitle && (
          <p className="text-sm font-bold text-dark-accent mb-1 leading-tight">
            {translatedTitle}
          </p>
        )}
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-snug group-hover:text-dark-accent transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {article.description}
        </p>

        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {keywords.map((kw, i) => (
              <span 
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onKeywordClick?.(kw);
                }}
                className="text-[10px] bg-slate-800/50 text-slate-500 px-2 py-1 rounded-md hover:bg-dark-accent/20 hover:text-dark-accent transition-colors font-bold"
              >
                #{kw.toLowerCase()}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-dark-accent"></div>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
              {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <span className="text-dark-accent text-xs font-black flex items-center gap-1">
            Read More
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};
