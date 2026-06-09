import React, { useState } from 'react';
import type { GoogleTranslateResponse } from '../types/translation';

interface ArticleReaderProps {
  title: string;
  content: string;
  url: string;
  imageUrl?: string;
  onBack: () => void;
  onKeywordClick?: (keyword: string) => void;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({ title, content, url, imageUrl, onBack, onKeywordClick }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simple keyword extraction for display
  const articleKeywords = title.split(' ')
    .filter(w => w.length > 5)
    .map(w => w.replace(/[^\w]/g, ''))
    .map(w => w.length > 12 ? w.substring(0, 12) + '...' : w)
    .slice(0, 3);
  
  // Clean the content from extra tags, noise, and copyright info
  const cleanContent = (text: string) => {
    return text
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/\[\+\d+ chars\]/g, "") // Remove [+xxx chars]
      .replace(/Copyright\s?©.*$/gi, "") // Remove right notices at the end
      .replace(/All\s?rights\s?reserved.*$/gi, "") // Remove All rights reserved
      .replace(/Follow\s?Us\s?On\s?Social\s?Media.*$/gi, "") // Remove social media noise
      .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .trim();
  };

  const [articleContent, setArticleContent] = useState(cleanContent(content));

  // Sentence translation states
  const [sentenceTranslations, setSentenceTranslations] = useState<Record<number, { text: string, loading: boolean }>>({});

  // Full translation states
  const [fullTranslation, setFullTranslation] = useState<string | null>(null);
  const [showFullTranslation, setShowFullTranslation] = useState(false);
  const [isFullLoading, setIsFullLoading] = useState(false);

  const handleSentenceTranslate = async (index: number, text: string) => {
    setSentenceTranslations(prev => ({
      ...prev,
      [index]: { text: "", loading: true }
    }));

    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(text)}`);
      const data = (await res.json()) as GoogleTranslateResponse;
      const translatedText = data[0].map((segment) => segment[0]).join("");
      
      setSentenceTranslations(prev => ({
        ...prev,
        [index]: { text: translatedText, loading: false }
      }));
    } catch {
      setSentenceTranslations(prev => ({
        ...prev,
        [index]: { text: "Translation error", loading: false }
      }));
    }
  };

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()"'[\]]/g, "");
    if (!cleanWord) return;
    
    setSelectedWord(cleanWord);
    
    // TTS
    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);

    // Translation
    setIsLoading(true);
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(cleanWord)}`);
      const data = (await res.json()) as GoogleTranslateResponse;
      setTranslation(data[0]?.[0]?.[0] ?? "No translation found");
    } catch {
      setTranslation("Error translating");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateAll = async () => {
    if (fullTranslation && !isFullLoading) {
      setShowFullTranslation(!showFullTranslation);
      return;
    }

    setIsFullLoading(true);
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(articleContent)}`);
      const data = (await res.json()) as GoogleTranslateResponse;
      const fullText = data[0].map((segment) => segment[0]).join("");
      setFullTranslation(fullText);
      setShowFullTranslation(true);
    } catch {
      alert("Failed to translate.");
    } finally {
      setIsFullLoading(false);
    }
  };

  const handleExpandContent = () => {
    // List of mock paragraphs to simulate "unlimited" content
    const mockParagraphs = [
      "In addition to the primary details, industry experts suggest that this development could have significant long-term implications for the market. Investors are advised to remain cautious and monitor the situation closely as more information becomes available from official sources in the coming days.",
      "Furthermore, technical analysis indicates a shifting trend that might influence broader economic sectors. Policymakers are currently debating the potential regulatory frameworks that could be established to address these emerging challenges effectively.",
      "Global stakeholders have also expressed varying opinions on the matter, highlighting the complexity of the international landscape. Future reports are expected to shed more light on the strategic partnerships being formed to mitigate potential risks associated with this change.",
      "As the situation evolves, real-time data monitoring will be crucial for all parties involved. Experts emphasize the importance of transparency and open communication to ensure that the public remains well-informed throughout this transitional period."
    ];

    // Find a paragraph we haven't added yet, or just cycle through them
    const nextParaIndex = articleContent.split("\n\n").length - 1;
    const extraParagraph = "\n\n" + (mockParagraphs[nextParaIndex % mockParagraphs.length]);
    
    setArticleContent(prev => prev + extraParagraph);
    
    // Always reset translation so user can translate the newly added content
    setFullTranslation(null);
    setShowFullTranslation(false);
  };

  // Split content into sentences for easier reading
  const sentences = articleContent.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [articleContent];

  return (
    <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="bg-dark-bg/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center gap-3 sticky top-0 z-10">
        <button 
          onClick={onBack} 
          className="bg-slate-800 p-2 rounded-xl text-dark-accent active:scale-90 transition-transform flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-sm font-bold text-slate-300 line-clamp-1 flex-1 leading-tight">
          {title}
        </h2>
        <button 
          onClick={handleTranslateAll}
          disabled={isFullLoading}
          className={`
            px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0
            ${showFullTranslation 
              ? 'bg-dark-accent text-dark-bg' 
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
          `}
        >
          {isFullLoading ? (
            <span className="w-3 h-3 border-2 border-dark-bg border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          )}
          {showFullTranslation ? "Hide Thai" : "Translate All"}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-40">
        <div className="max-w-prose mx-auto">
          {/* Main Article Image */}
          {imageUrl && (
            <div className="mb-8 -mx-6 relative h-64 overflow-hidden shadow-2xl">
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/60 to-transparent"></div>
            </div>
          )}

          {/* Full Translation Box */}
          {showFullTranslation && fullTranslation && (
            <div className="mb-8 bg-dark-accent/5 border border-dark-accent/20 p-5 rounded-3xl animate-slide-up">
              <p className="text-[10px] text-dark-accent font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1 h-1 bg-dark-accent rounded-full"></span>
                Thai Translation
              </p>
              <p className="text-lg text-slate-200 leading-relaxed font-medium">
                {fullTranslation}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {sentences.map((sentence, sIdx) => {
              const sentenceWords = sentence.trim().split(/\s+/);
              const translationState = sentenceTranslations[sIdx];

              return (
                <div key={sIdx} className="relative group">
                  <div className="text-left bg-white/[0.03] p-5 rounded-[2rem] border border-white/[0.05] shadow-inner">
                    {sentenceWords.map((word, wIdx) => (
                      <React.Fragment key={wIdx}>
                        <span 
                          onClick={() => handleWordClick(word)}
                          className={`
                            inline-block px-1 rounded-md text-xl leading-relaxed transition-all cursor-pointer
                            ${selectedWord === word.replace(/[.,/#!$%^&*;:{}=\-_`~()"'[\]]/g, "") 
                              ? 'bg-dark-accent text-dark-bg font-bold scale-110' 
                              : 'hover:bg-dark-accent/10 hover:text-dark-accent'}
                          `}
                        >
                          {word}
                        </span>
                        {" "}
                      </React.Fragment>
                    ))}

                    <button
                      onClick={() => handleSentenceTranslate(sIdx, sentence)}
                      className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all align-middle ml-2 mb-1
                        ${translationState?.text 
                          ? 'bg-dark-accent text-dark-bg' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
                      `}
                    >
                      {translationState?.loading ? (
                        <span className="w-2.5 h-2.5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      )}
                      Translate
                    </button>
                  </div>

                  {/* Sentence Translation Result */}
                  {translationState?.text && (
                    <div className="mt-3 bg-dark-accent/10 border border-dark-accent/20 p-5 rounded-[2rem] animate-slide-up shadow-inner">
                      <p className="text-[10px] text-dark-accent font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1 h-1 bg-dark-accent rounded-full"></span>
                        Thai Translation
                      </p>
                      <p className="text-lg font-medium text-dark-accent/90 leading-relaxed">
                        {translationState.text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleExpandContent}
            className="mt-10 w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 font-bold hover:border-dark-accent/50 hover:text-dark-accent transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Read More Paragraphs
          </button>
          
          <div className="mt-10 pt-10 border-t border-slate-800/50 text-slate-500 text-sm italic text-center">
            <p className="mb-6">Tap any word to hear pronunciation and see translation.</p>
            
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-dark-accent/10 text-dark-accent px-6 py-3 rounded-2xl font-bold not-italic hover:bg-dark-accent/20 transition-colors active:scale-95"
            >
              Read Full Article on Source
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Article Keywords */}
          {articleKeywords.length > 0 && (
            <div className="mt-12 p-6 bg-slate-800/30 rounded-[2rem] border border-slate-800/50">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 text-center">Related Topics</p>
              <div className="flex flex-wrap justify-center gap-2">
                {articleKeywords.map((kw, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      onKeywordClick?.(kw);
                      onBack();
                    }}
                    className="bg-slate-800 hover:bg-dark-accent/10 border border-slate-700 hover:border-dark-accent/30 text-slate-400 hover:text-dark-accent px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    #{kw.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Translation Bottom Sheet */}
      {selectedWord && (
        <div className="fixed inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-xl p-8 pt-6 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-slate-700/50 animate-slide-up z-20">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6 opacity-50"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-dark-accent uppercase tracking-[0.2em] font-black mb-1">Vocabulary</p>
              <h4 className="text-3xl font-black text-white">{selectedWord}</h4>
            </div>
            <button 
              onClick={() => setSelectedWord(null)}
              className="bg-slate-800 p-2.5 rounded-full text-slate-400 active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Translation (Thai)</p>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30">
              <p className="text-2xl text-dark-accent font-bold">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-dark-accent rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-dark-accent rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-dark-accent rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                ) : translation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
