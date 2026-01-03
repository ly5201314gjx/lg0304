
import React, { useEffect, useState } from 'react';
import { Movie } from '../types';
import { getAIInsight } from '../services/geminiService';

interface MovieDetailProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (url: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (movie: Movie) => void;
}

export const MovieDetail: React.FC<MovieDetailProps> = ({ 
  movie, 
  onClose, 
  onPlay, 
  isFavorite, 
  onToggleFavorite 
}) => {
  const [insight, setInsight] = useState<string>('正在联络AI漫评师...');

  useEffect(() => {
    if (movie) {
      setInsight('正在联络AI漫评师...');
      getAIInsight(movie).then(setInsight);
    }
  }, [movie]);

  if (!movie) return null;

  const playUrl = movie.playUrls.length > 0 ? movie.playUrls[0].url : null;

  const handleExternalPlay = () => {
    if (playUrl) {
      window.open(playUrl, '_blank');
    } else {
      alert("资源地址无效");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden no-blur">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-background-light dark:bg-surface-dark border-4 border-black rounded-t-3xl sm:rounded-3xl shadow-manga-lg flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        <div className="relative h-64 w-full border-b-4 border-black">
          <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 border-4 border-black rounded-full bg-white flex items-center justify-center text-black shadow-manga-sm manga-btn">
            <span className="material-symbols-outlined font-black">close</span>
          </button>
          
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              {movie.title}
            </h2>
          </div>
        </div>
        
        <div className="px-6 py-6 flex-1 overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-comic-yellow border-2 border-black rounded-md text-[10px] font-black text-black">{movie.year}</span>
              <span className="px-2 py-1 bg-primary text-white border-2 border-black rounded-md text-[10px] font-black">{movie.area}</span>
              <span className="px-2 py-1 bg-comic-pink text-white border-2 border-black rounded-md text-[10px] font-black">{movie.genre}</span>
            </div>
            <div className="bg-white border-2 border-black px-3 py-1 rounded-lg font-black text-black flex items-center gap-1 shadow-manga-sm">
              <span className="material-symbols-outlined text-sm fill-current text-primary">star</span>
              {movie.rating}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border-4 border-black rounded-2xl shadow-manga mb-8 relative">
            <div className="absolute -top-3 -right-2 bg-primary text-white border-2 border-black px-2 py-0.5 rounded-lg text-[10px] font-black">AI 漫评</div>
            <p className="text-sm text-black dark:text-white leading-relaxed font-bold italic">
              “{insight}”
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">演职阵容</h3>
              <p className="text-sm font-bold text-black dark:text-slate-300">导演: {movie.director || '未知'}</p>
              <p className="text-sm font-bold text-black dark:text-slate-300 mt-0.5 line-clamp-2">主演: {movie.actor || '未知'}</p>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">剧情梗概</h3>
              <p className="text-sm font-bold text-black dark:text-slate-200 leading-relaxed">
                {movie.description.replace(/<[^>]*>?/gm, '')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t-4 border-black flex flex-col gap-3">
          <div className="flex gap-3">
            <button 
              onClick={() => playUrl ? onPlay(playUrl) : alert("暂无资源")}
              className="flex-1 h-14 bg-primary text-white border-4 border-black rounded-2xl font-black text-lg shadow-manga manga-btn flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined font-black">play_arrow</span>
              内置播放
            </button>
            <button 
              onClick={handleExternalPlay}
              className="flex-1 h-14 bg-comic-yellow text-black border-4 border-black rounded-2xl font-black text-lg shadow-manga manga-btn flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined font-black">open_in_new</span>
              浏览器播放
            </button>
          </div>
          <button 
            onClick={() => onToggleFavorite(movie)}
            className={`h-14 border-4 border-black rounded-2xl flex items-center justify-center transition-all shadow-manga manga-btn font-black gap-2 ${
              isFavorite ? 'bg-comic-pink text-white' : 'bg-white text-slate-400'
            }`}
          >
            <span className={`material-symbols-outlined font-black ${isFavorite ? 'fill-current' : ''}`}>favorite</span>
            {isFavorite ? '已收藏' : '添加收藏'}
          </button>
        </div>
      </div>
    </div>
  );
};
