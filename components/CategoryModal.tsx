
import React from 'react';
import { CATEGORIES, Category } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: Category;
  onSelect: (category: Category) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedCategory, 
  onSelect 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-hidden no-blur">
      <div 
        aria-hidden="true" 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-[380px] rounded-3xl bg-background-light dark:bg-zinc-900 shadow-manga-lg border-4 border-black flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h3 className="text-black dark:text-white text-xl font-black uppercase tracking-tighter">探索宇宙</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center text-black shadow-manga-sm manga-btn"
          >
            <span className="material-symbols-outlined text-xl font-black">close</span>
          </button>
        </div>

        <div className="px-6 pb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">请选择您感兴趣的版块</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelect(cat)}
                  className={`h-11 rounded-xl font-black text-xs transition-all border-2 border-black shadow-manga-sm active:translate-y-0 active:translate-x-0
                    ${isSelected 
                      ? 'bg-primary text-white -translate-y-0.5 -translate-x-0.5 shadow-manga' 
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 hover:bg-comic-yellow/20'
                    }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-5 bg-white dark:bg-zinc-800 border-t-4 border-black">
          <button 
            onClick={onClose}
            className="w-full h-14 bg-comic-yellow text-black border-4 border-black rounded-2xl font-black shadow-manga manga-btn flex items-center justify-center text-sm"
          >
            就这样，进入该版块！
          </button>
        </div>
      </div>
    </div>
  );
};
