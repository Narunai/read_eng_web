# Project Work Log: Read Eng Web

## Summary
A mobile-optimized web application for learning business English through news, featuring:
- News search with API integration.
- Intelligent content cleaning and sentence-based segmentation.
- Interactive word-by-word translation and TTS.
- Dynamic categorized news discovery (Business, Stocks, AI, etc.).
- Real-time "Trending Now" insights.

## Development History

### Initial Phase
- Initialized Vite + React project.
- Implemented core components: `SearchBar`, `NewsCard`, `ArticleReader`.
- Fixed build errors related to `verbatimModuleSyntax`.

### Mobile Optimization
- Applied mobile-first CSS with Tailwind 4.
- Redesigned `ArticleReader` for immersive experience (full-screen, bottom sheet).
- Polished `NewsCard` with modern gradients and typography.
- Refined `SearchBar` for mobile usability.

### Feature Enhancements
- Added "Translate All" with toggle functionality.
- Added "Read Full Article" link to bypass API content limits.
- Implemented "Read More Paragraphs" for content expansion.
- Implemented content cleaning to remove copyright/noise.
- Added dynamic "Explore by Category" and "Hot Trends" UI.
- Implemented automatic Thai translation for headlines in the news feed.
- **Search History & Personalization:**
  - Replaced trending news buttons with a persistent **Recent Searches** history.
  - History is saved locally using `localStorage` and supports up to 10 entries.
  - UI displays a maximum of 4 history items by default with a "See More" expander.
  - Clicking history items triggers a direct search, improving navigation.
- **Fixed and Enhanced Keyword Functionality:**
  - Category clicks now trigger immediate searches.
  - Search bar now reflects the active keyword or category query.
  - Improved trending keyword generation with more relevant topics.
  - Added interactive hashtag keywords to `NewsCard` and `ArticleReader` for deeper discovery.
  - Synchronized keyword clicks across all components for a seamless experience.

### API Optimization & Resilience Fixes
- **Adaptive Backoff Mechanism:** Implemented a "cool-down" period for GDELT API. If a 429 error is detected, the app automatically skips GDELT and uses the Guardian API directly for 5 minutes, ensuring a smooth user experience without repeated failures.
- **Request Deduplication:** Added a system to track pending requests. If multiple clicks trigger the same search query, the app now waits for the first request instead of sending redundant ones.
- **Guardian Query Sanitization:** Fixed a 400 Bad Request error by stripping "smart quotes" (`‘’“”`) and other special characters from search queries, which previously broke the Guardian API's syntax.
- **Eliminated Redundant Requests:** Refactored `App.tsx` to reuse initial trending articles instead of triggering a second search on mount.
- **Content Sanitization:** Improved `ArticleReader` to strip all HTML tags from content, preventing accidental rendering of embedded images or "noise" from API responses.


