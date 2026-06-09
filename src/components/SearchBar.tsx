import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  externalQuery?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, externalQuery }) => {
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    if (externalQuery) {
      setQuery(externalQuery);
    }
  }, [externalQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 group">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-500 group-focus-within:text-dark-accent transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search crypto or business..."
          className="w-full bg-slate-800/50 backdrop-blur-sm border-2 border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-dark-accent/50 focus:bg-slate-800 transition-all placeholder:text-slate-500 font-medium shadow-inner"
        />
        <button
          type="submit"
          className="absolute right-2 bg-dark-accent text-dark-bg px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-dark-accent/20 active:scale-90 transition-all hover:brightness-110"
        >
          Search
        </button>
      </div>
    </form>
  );
};
