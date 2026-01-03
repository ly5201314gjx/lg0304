
import React, { useState } from 'react';
import { SourceConfig } from '../types';
import { getSources } from '../services/vodService';

interface SettingsViewProps {
  onAddSource: (name: string, url: string) => void;
  onDeleteSource: (key: string) => void;
  sources: SourceConfig[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onAddSource, onDeleteSource, sources }) => {
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newUrl) {
      onAddSource(newName, newUrl);
      setNewName('');
      setNewUrl('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-300 pb-20">
      <div className="bg-white dark:bg-slate-900 manga-border p-6 rounded-3xl shadow-manga">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-black dark:text-white">
          <span className="material-symbols-outlined text-primary font-black">add_link</span>
          新增漫库源
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="库名称 (如: 我的私人库)" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-black rounded-xl h-12 px-4 text-sm font-bold focus:ring-0"
          />
          <input 
            type="text" 
            placeholder="库 API 地址 (https://...)" 
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-black rounded-xl h-12 px-4 text-sm font-bold focus:ring-0"
          />
          <button className="h-14 bg-comic-yellow text-black border-2 border-black font-black rounded-xl shadow-manga-sm manga-btn mt-2">部署新源</button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 manga-border p-6 rounded-3xl shadow-manga">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-black dark:text-white">
          <span className="material-symbols-outlined text-comic-pink font-black">stacks</span>
          当前库列表
        </h3>
        <div className="flex flex-col gap-4">
          {sources.map(source => (
            <div key={source.key} className="p-4 bg-slate-50 dark:bg-slate-800 border-2 border-black rounded-2xl flex items-center justify-between shadow-manga-sm">
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-black text-black dark:text-white truncate">{source.name}</p>
                <p className="text-[10px] font-bold text-slate-500 truncate">{source.baseUrl}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => copyToClipboard(source.baseUrl)}
                  className="w-9 h-9 border-2 border-black rounded-lg bg-white flex items-center justify-center text-black shadow-manga-sm manga-btn"
                >
                  <span className="material-symbols-outlined text-sm font-black">content_copy</span>
                </button>
                {source.isCustom && (
                  <button 
                    onClick={() => setDeleteConfirm(source.key)}
                    className="w-9 h-9 border-2 border-black rounded-lg bg-comic-pink text-white flex items-center justify-center shadow-manga-sm manga-btn"
                  >
                    <span className="material-symbols-outlined text-sm font-black">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-white/20 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 manga-border p-6 rounded-3xl max-w-xs w-full shadow-manga-lg border-4 border-black">
            <h4 className="text-xl font-black text-black dark:text-white mb-2">确定要粉碎它？</h4>
            <p className="text-sm font-bold text-slate-500 mb-8">此操作不可撤销，该数据源将从你的宇宙中消失。</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-12 bg-white border-2 border-black rounded-xl font-black text-black shadow-manga-sm manga-btn"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  onDeleteSource(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="flex-1 h-12 bg-comic-pink border-2 border-black rounded-xl font-black text-white shadow-manga-sm manga-btn"
              >
                确定粉碎
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
