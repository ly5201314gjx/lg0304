
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie, Category, SourceKey, SourceConfig, WatchRecord } from './types';
import { fetchVodData, getSources, searchAllSources } from './services/vodService';
import { smartRerank, getDiscoveryRecommendations } from './services/geminiService';
import { MovieCard } from './components/MovieCard';
import { CategoryModal } from './components/CategoryModal';
import { MovieDetail } from './components/MovieDetail';
import { SettingsView } from './components/SettingsView';
import { VideoPlayer } from './components/VideoPlayer';

type ViewType = 'discover' | 'favorites' | 'history' | 'profile';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('discover');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [aiPicks, setAiPicks] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [history, setHistory] = useState<WatchRecord[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('全部');
  const [allSources, setAllSources] = useState<SourceConfig[]>(getSources());
  const [selectedSource, setSelectedSource] = useState<SourceKey>(allSources[0].key);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem('movie_favorites') || '[]'));
      setHistory(JSON.parse(localStorage.getItem('movie_history') || '[]'));
      setSearchHistory(JSON.parse(localStorage.getItem('search_history') || '[]'));
    } catch (e) {
      console.warn("Local storage parse failed", e);
    }
  }, []);

  const saveToHistory = (movie: Movie) => {
    const record: WatchRecord = { ...movie, watchedAt: Date.now() };
    const updated = [record, ...history.filter(h => h.id !== movie.id)].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('movie_history', JSON.stringify(updated));
  };

  const loadMovies = useCallback(async (
    source: SourceKey, cat: Category, search: string = '', page: number = 1, append: boolean = false
  ) => {
    if (append) setIsLoadingMore(true);
    else {
      setIsLoading(true);
      if (page === 1) setIsAiLoading(true);
    }

    try {
      let results: Movie[];
      if (search && page === 1) {
        // Multi-source aggregation for search
        results = await searchAllSources(search);
      } else {
        results = await fetchVodData(source, page, search, cat);
      }
      
      if (results.length > 0 && !append && (search || cat !== '全部')) {
        results = await smartRerank(results, search || `热门${cat}`);
      }
      
      if (append) setMovies(prev => [...prev, ...results]);
      else {
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
      setErrorState("资源库解析异常，请切换源重试。");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [view, favorites]);

  useEffect(() => {
    if (view === 'discover') {
      loadMovies(selectedSource, selectedCategory, activeSearch, 1, false);
      setCurrentPage(1);
    }
  }, [selectedSource, view]);

  if (errorState && movies.length === 0) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center p-8 text-center">
        <div className="bg-zinc-900 border-4 border-black p-8 rounded-3xl shadow-manga-lg max-w-sm">
          <span className="material-symbols-outlined text-6xl text-comic-pink mb-4">warning</span>
          <h2 className="text-white text-xl font-black mb-4">{errorState}</h2>
          <button onClick={() => window.location.reload()} className="w-full h-12 bg-comic-yellow border-2 border-black rounded-xl font-black shadow-manga-sm">重试连接</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display relative overflow-x-hidden transition-colors duration-300">
      <header className="px-5 py-6 bg-comic-yellow border-b-4 border-black sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center border-2 border-black shadow-manga-sm">
                <span className="material-symbols-outlined text-white font-black">movie</span>
              </div>
              <h1 className="text-2xl font-black text-black tracking-tighter">MovieHub</h1>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-zinc-900 border-4 border-black text-[11px] font-black rounded-xl px-3 py-1.5 focus:ring-0 appearance-none shadow-manga-sm text-white pr-8"
              >
                {allSources.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
              </select>
              <button onClick={() => setView('profile')} className="w-9 h-9 rounded-full border-2 border-black bg-black overflow-hidden">
                <img alt="User" src="https://picsum.photos/seed/user-avatar/100/100" />
              </button>
            </div>
          </div>

          {view === 'discover' && (
            <form onSubmit={(e) => { e.preventDefault(); setActiveSearch(searchQuery); loadMovies(selectedSource, selectedCategory, searchQuery, 1, false); }} className="relative bg-zinc-900 border-4 border-black rounded-2xl shadow-manga overflow-hidden flex items-center">
              <span className="material-symbols-outlined ml-4 text-white font-black">search</span>
              <input 
                type="text" 
                placeholder="聚合全网秒搜..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none h-14 text-sm font-bold focus:ring-0 placeholder:text-slate-500 px-3 text-white"
              />
              <button type="submit" className="mr-2 bg-primary text-white border-2 border-black px-4 py-1.5 rounded-xl font-black text-xs shadow-manga-sm manga-btn">搜索</button>
            </form>
          )}
        </div>
      </header>

      <main className="px-4 py-8 pb-32 max-w-lg mx-auto">
        {view === 'discover' && (
          <>
            {/* New: Featured AI Picks */}
            {!activeSearch && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-comic-pink">auto_awesome</span>
                    AI 为你甄选
                  </h2>
                </div>
                {isAiLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {[1,2,3].map(i => <div key={i} className="min-w-[140px] aspect-[2/3] rounded-xl bg-zinc-800 border-2 border-black animate-pulse"></div>)}
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                    {aiPicks.map(m => <div key={m.id} className="min-w-[140px]"><MovieCard movie={m} onClick={setSelectedMovie} /></div>)}
                  </div>
                )}
              </section>
            )}

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black dark:text-white uppercase">{activeSearch ? '搜索结果' : '热门放送'}</h2>
              <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-zinc-900 border-4 border-black text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-manga-sm active:translate-y-0.5">
                <span className="material-symbols-outlined text-sm">tune</span> {selectedCategory}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {movies.map(m => <MovieCard key={`${m.id}-${m.source}`} movie={m} onClick={setSelectedMovie} />)}
            </div>

            {movies.length > 0 && (
              <div className="mt-12 flex justify-center">
                <button 
                  onClick={() => { const p = currentPage + 1; setCurrentPage(p); loadMovies(selectedSource, selectedCategory, activeSearch, p, true); }} 
                  disabled={isLoadingMore} 
                  className="px-10 py-3 bg-zinc-900 border-4 border-black rounded-2xl font-black text-white shadow-manga manga-btn disabled:opacity-50"
                >
                  {isLoadingMore ? '加载中...' : '发现更多'}
                </button>
              </div>
            )}
          </>
        )}

        {view === 'history' && (
          <>
            <h2 className="text-xl font-black dark:text-white mb-8">足迹 (最近观看)</h2>
            <div className="grid grid-cols-2 gap-6">
              {history.map(m => <MovieCard key={m.watchedAt} movie={m} onClick={setSelectedMovie} />)}
              {history.length === 0 && <p className="col-span-2 text-center text-slate-500 font-bold py-20">暂无观看历史</p>}
            </div>
          </>
        )}

        {view === 'favorites' && (
          <div className="grid grid-cols-2 gap-6">
            {favorites.map(m => <MovieCard key={m.id} movie={m} onClick={setSelectedMovie} />)}
          </div>
        )}

        {view === 'profile' && <SettingsView sources={allSources} onAddSource={(n, u) => setAllSources([...allSources, { key: Date.now().toString(), name: n, baseUrl: u, isCustom: true }])} onDeleteSource={() => {}} />}
      </main>

      <nav className="fixed bottom-6 inset-x-6 h-16 bg-zinc-900 border-4 border-black rounded-2xl flex items-center justify-between px-6 z-50 shadow-manga-lg max-w-lg mx-auto no-blur">
        {[
          { icon: 'home', label: '发现', v: 'discover' },
          { icon: 'history', label: '足迹', v: 'history' },
          { icon: 'favorite', label: '收藏', v: 'favorites' },
          { icon: 'settings', label: '设置', v: 'profile' }
        ].map(item => (
          <button 
            key={item.v} 
            onClick={() => setView(item.v as any)}
            className={`flex flex-col items-center gap-1 transition-all ${view === item.v ? 'bg-comic-yellow text-black px-4 py-1 border-2 border-black rounded-xl -translate-y-2' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined font-black text-2xl">{item.icon}</span>
          </button>
        ))}
      </nav>

      <MovieDetail 
        movie={selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
        isFavorite={!!favorites.find(f => f.id === selectedMovie?.id)}
        onToggleFavorite={(m) => setFavorites(prev => prev.some(f => f.id === m.id) ? prev.filter(f => f.id !== m.id) : [...prev, m])}
        onPlay={(url) => { saveToHistory(selectedMovie!); setPlayingUrl(url); }} 
      />

      {playingUrl && <VideoPlayer url={playingUrl} title={selectedMovie?.title || ''} onClose={() => setPlayingUrl(null)} />}
      <CategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedCategory={selectedCategory} onSelect={(c) => { setSelectedCategory(c); loadMovies(selectedSource, c, '', 1, false); setIsModalOpen(false); }} />
    </div>
  );
};

export default App;
