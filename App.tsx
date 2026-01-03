
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie, Category, SourceKey, SourceConfig, DEFAULT_SOURCES } from './types';
import { fetchVodData, getSources } from './services/vodService';
import { smartRerank, getDiscoveryRecommendations } from './services/geminiService';
import { MovieCard } from './components/MovieCard';
import { CategoryModal } from './components/CategoryModal';
import { MovieDetail } from './components/MovieDetail';
import { SettingsView } from './components/SettingsView';
import { VideoPlayer } from './components/VideoPlayer';

type ViewType = 'discover' | 'favorites' | 'profile';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('discover');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [aiPicks, setAiPicks] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('全部');
  const [allSources, setAllSources] = useState<SourceConfig[]>(getSources());
  
  // Pick a random source on first run to ensure immediate data
  const [selectedSource, setSelectedSource] = useState<SourceKey>(() => {
    const sources = getSources();
    return sources[Math.floor(Math.random() * sources.length)].key;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedFavs = localStorage.getItem('movie_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    
    const savedHistory = localStorage.getItem('search_history');
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));

    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveFavorites = (list: Movie[]) => {
    setFavorites(list);
    localStorage.setItem('movie_favorites', JSON.stringify(list));
  };

  const saveHistory = (query: string) => {
    if (!query.trim()) return;
    const filtered = searchHistory.filter(h => h !== query);
    const updated = [query, ...filtered].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem('search_history', JSON.stringify(updated));
  };

  const removeHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = searchHistory.filter(h => h !== item);
    setSearchHistory(updated);
    localStorage.setItem('search_history', JSON.stringify(updated));
  };

  const loadMovies = useCallback(async (
    source: SourceKey, 
    cat: Category, 
    search: string = '',
    page: number = 1,
    append: boolean = false
  ) => {
    if (append) setIsLoadingMore(true);
    else {
      setIsLoading(true);
      if (page === 1) setIsAiLoading(true);
    }

    try {
      let results = await fetchVodData(source, page, search, cat);
      
      if (results.length > 0 && !append && (search || cat !== '全部')) {
        const rankContext = search || `热门${cat}影视`;
        results = await smartRerank(results, rankContext);
      }
      
      if (append) {
        setMovies(prev => [...prev, ...results]);
      } else {
        setMovies(results);
        if (view === 'discover' && results.length > 0 && !search) {
          getDiscoveryRecommendations(results, favorites).then(picks => {
            setAiPicks(picks);
            setIsAiLoading(false);
          });
        } else {
          setIsAiLoading(false);
        }
      }
    } catch (e) {
      console.error("Data load failed", e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [view, favorites]);

  // Initial load effect
  useEffect(() => {
    if (view === 'discover') {
      loadMovies(selectedSource, selectedCategory, activeSearch, 1, false);
      setCurrentPage(1);
    }
  }, [selectedSource, view]);

  const handleSearchSubmit = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const q = overrideQuery || searchQuery;
    if (!q.trim() && !overrideQuery) return;
    
    setActiveSearch(q);
    setSearchQuery(q);
    saveHistory(q);
    setShowHistory(false);
    setCurrentPage(1);
    loadMovies(selectedSource, selectedCategory, q, 1, false);
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadMovies(selectedSource, selectedCategory, activeSearch, nextPage, true);
  };

  const handleToggleFavorite = (movie: Movie) => {
    const exists = favorites.find(f => f.id === movie.id);
    if (exists) {
      saveFavorites(favorites.filter(f => f.id !== movie.id));
    } else {
      saveFavorites([...favorites, movie]);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display relative overflow-x-hidden">
      {/* Header - No white boxes for high visibility */}
      <header className="px-5 py-6 bg-comic-yellow border-b-4 border-black sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center border-2 border-black shadow-manga-sm">
                <span className="material-symbols-outlined text-white font-black">movie</span>
              </div>
              <h1 className="text-2xl font-black text-black tracking-tighter">MovieHub</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="bg-zinc-900 border-4 border-black text-[11px] font-black rounded-xl px-4 py-2 focus:ring-0 appearance-none shadow-manga-sm cursor-pointer pr-10 min-w-[120px] text-white"
                >
                  {allSources.map(s => <option key={s.key} value={s.key} className="bg-zinc-800">{s.name}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white text-sm font-black">expand_more</span>
              </div>
              <button 
                onClick={() => setView('profile')}
                className="w-10 h-10 rounded-full border-4 border-black bg-black shadow-manga-sm overflow-hidden"
              >
                <img alt="User" src="https://picsum.photos/seed/user-avatar/100/100" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          {view === 'discover' && (
            <div className="relative" ref={historyRef}>
              <form onSubmit={handleSearchSubmit} className="relative bg-zinc-900 border-4 border-black rounded-2xl shadow-manga overflow-hidden flex items-center">
                <span className="material-symbols-outlined ml-4 text-white font-black">search</span>
                <input 
                  type="text" 
                  placeholder="搜索更优质全网资源..."
                  value={searchQuery}
                  onFocus={() => setShowHistory(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none h-14 text-sm font-bold focus:ring-0 placeholder:text-slate-400 px-3 text-white"
                />
                <button type="submit" className="mr-2 bg-primary text-white border-2 border-black px-4 py-1.5 rounded-xl font-black text-xs shadow-manga-sm manga-btn active:translate-y-0 active:translate-x-0">
                  搜索
                </button>
              </form>

              {/* manage-able Search History Dropdown */}
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border-4 border-black rounded-2xl shadow-manga-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 no-blur">
                  <div className="px-4 py-3 border-b-2 border-black bg-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">历史记录</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSearchHistory([]); localStorage.removeItem('search_history'); }}
                      className="text-[10px] font-black text-comic-pink hover:underline"
                    >
                      清空记录
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto scrollbar-hide">
                    {searchHistory.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSearchSubmit(undefined, item)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-sm text-slate-500">history</span>
                          <span className="text-sm font-bold text-white">{item}</span>
                        </div>
                        <button 
                          onClick={(e) => removeHistoryItem(e, item)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-comic-pink transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 pb-32 max-w-lg mx-auto">
        {view === 'discover' && (
          <>
            {/* AI Pick Section */}
            {!activeSearch && selectedCategory === '全部' && (
              <section className="mb-10">
                <div className="flex flex-col mb-4">
                  <h2 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-comic-pink font-black">bolt</span>
                    AI 宇宙精选
                  </h2>
                  <div className="h-1.5 w-16 bg-comic-yellow mt-1 border-2 border-black rounded-full shadow-manga-sm"></div>
                </div>

                {isAiLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="min-w-[140px] aspect-[2/3] rounded-xl bg-zinc-800 border-4 border-black animate-pulse"></div>
                    ))}
                  </div>
                ) : aiPicks.length > 0 ? (
                  <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide px-1">
                    {aiPicks.map((movie) => (
                      <div key={`ai-${movie.id}`} className="min-w-[150px]">
                        <MovieCard movie={movie} onClick={setSelectedMovie} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            )}

            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-black dark:text-white uppercase">
                  {activeSearch ? `搜索: ${activeSearch}` : '全网速递'}
                </h2>
                <div className="h-1.5 w-12 bg-comic-pink mt-1 border-2 border-black rounded-full shadow-manga-sm"></div>
              </div>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-zinc-900 border-4 border-black text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-manga-sm hover:shadow-manga transition-all active:translate-y-0.5"
              >
                <span className="material-symbols-outlined text-sm font-black">tune</span>
                {selectedCategory}
              </button>
            </div>

            {isLoading && currentPage === 1 ? (
              <div className="grid grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-800 border-4 border-black animate-pulse shadow-manga"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  {movies.map((movie) => (
                    <MovieCard key={`${movie.id}-${movie.source}`} movie={movie} onClick={setSelectedMovie} />
                  ))}
                </div>

                {movies.length > 0 && (
                  <div className="mt-12 flex justify-center">
                    <button 
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-8 py-3 bg-zinc-900 border-4 border-black rounded-2xl font-black text-sm text-white shadow-manga manga-btn disabled:opacity-50"
                    >
                      {isLoadingMore ? '探测中...' : '加载更多'}
                    </button>
                  </div>
                )}
                
                {movies.length === 0 && !isLoading && (
                  <div className="text-center py-20 bg-zinc-900 border-4 border-black rounded-2xl shadow-manga">
                    <span className="material-symbols-outlined text-6xl text-comic-pink mb-4">sentiment_dissatisfied</span>
                    <p className="text-lg font-black text-white">该库暂无资源</p>
                    <p className="text-sm font-bold text-slate-500">尝试更换搜索词或顶部切换数据源</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {view === 'favorites' && (
          <>
            <h2 className="text-xl font-black text-black dark:text-white mb-8">我的私人影柜</h2>
            <div className="grid grid-cols-2 gap-6">
              {favorites.length > 0 ? (
                favorites.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} onClick={setSelectedMovie} />
                ))
              ) : (
                <div className="col-span-2 text-center py-20 bg-zinc-900 border-4 border-black rounded-2xl shadow-manga opacity-50">
                  <span className="material-symbols-outlined text-6xl mb-4 text-white">heart_broken</span>
                  <p className="font-black text-white">还没有收藏任何宝贝</p>
                </div>
              )}
            </div>
          </>
        )}

        {view === 'profile' && (
          <SettingsView 
            sources={allSources}
            onAddSource={(n, u) => {
              const newSource: SourceConfig = { key: `custom_${Date.now()}`, name: n, baseUrl: u, isCustom: true };
              const updated = [...allSources.filter(s => s.isCustom), newSource];
              localStorage.setItem('custom_sources', JSON.stringify(updated));
              setAllSources(getSources());
            }}
            onDeleteSource={(key) => {
              const updated = allSources.filter(s => s.isCustom && s.key !== key);
              localStorage.setItem('custom_sources', JSON.stringify(updated));
              setAllSources(getSources());
              if (selectedSource === key) setSelectedSource(allSources[0].key);
            }}
          />
        )}
      </main>

      {/* Footer Nav */}
      <nav className="fixed bottom-6 inset-x-6 h-16 bg-zinc-900 border-4 border-black rounded-2xl flex items-center justify-between px-8 z-40 shadow-manga-lg max-w-lg mx-auto no-blur">
        <button 
          onClick={() => setView('discover')}
          className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl transition-all ${view === 'discover' ? 'bg-primary text-white border-2 border-black -translate-y-1 shadow-manga-sm' : 'text-slate-500'}`}
        >
          <span className="material-symbols-outlined font-black text-2xl">home</span>
        </button>
        <button 
          onClick={() => setView('favorites')}
          className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl transition-all ${view === 'favorites' ? 'bg-comic-pink text-white border-2 border-black -translate-y-1 shadow-manga-sm' : 'text-slate-500'}`}
        >
          <span className="material-symbols-outlined font-black text-2xl">favorite</span>
        </button>
        <button 
          onClick={() => setView('profile')}
          className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl transition-all ${view === 'profile' ? 'bg-comic-yellow text-black border-2 border-black -translate-y-1 shadow-manga-sm' : 'text-slate-500'}`}
        >
          <span className="material-symbols-outlined font-black text-2xl">settings</span>
        </button>
      </nav>

      <CategoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCategory={selectedCategory}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          setCurrentPage(1);
          loadMovies(selectedSource, cat, activeSearch, 1, false);
          setIsModalOpen(false);
        }}
      />
      
      <MovieDetail 
        movie={selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
        isFavorite={!!favorites.find(f => f.id === selectedMovie?.id)}
        onToggleFavorite={handleToggleFavorite}
        onPlay={(url) => setPlayingUrl(url)}
      />

      {playingUrl && selectedMovie && (
        <VideoPlayer url={playingUrl} title={selectedMovie.title} onClose={() => setPlayingUrl(null)} />
      )}
    </div>
  );
};

export default App;
