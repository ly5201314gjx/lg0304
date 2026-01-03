
import React from 'react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const sourceLabel = movie.source === 'lzi' ? '量子' : movie.source === 'ffzy' ? '非凡' : '天空';
  
  return (
    <div 
      className="flex flex-col gap-0 group cursor-pointer animate-in zoom-in-95 duration-200" 
      onClick={() => onClick(movie)}
    >
      <div className="aspect-[2/3] manga-border rounded-xl bg-white overflow-hidden relative shadow-manga group-hover:shadow-manga-lg transition-all group-hover:-translate-y-1 group-hover:-translate-x-1">
        <img 
          alt={movie.title} 
          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-300" 
          src={movie.posterUrl} 
          loading="lazy"
        />
        
        {/* Source Badge */}
        <div className="absolute top-2 left-2 z-20 px-2 py-0.5 border-2 border-black bg-comic-yellow font-black text-[10px] text-black rounded-md">
          {sourceLabel}
        </div>

        {/* Rating Bubble */}
        <div className="absolute bottom-2 right-2 z-20 px-2 py-1 border-2 border-black bg-white font-black text-xs text-black rounded-lg flex items-center gap-1">
          <span className="material-symbols-outlined text-xs fill-current text-primary">star</span>
          {movie.rating.toFixed(1)}
        </div>
      </div>
      
      <div className="mt-3 px-1">
        <h3 className="text-sm font-black truncate leading-tight dark:text-white text-black">
          {movie.title}
        </h3>
        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
          {movie.year} · {movie.genre}
        </p>
      </div>
    </div>
  );
};
