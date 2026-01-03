
import React, { useState } from 'react';

interface VideoPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, onClose }) => {
  const isM3U8 = url.includes('.m3u8');
  
  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center px-4 z-10">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="ml-2 text-white font-bold truncate">{title}</h2>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        {/* Simple implementation using standard video tag. 
            Note: Native m3u8 requires HLS.js for full browser support, 
            but many mobile browsers and Safari support it natively. */}
        <video 
          src={url} 
          controls 
          autoPlay 
          className="w-full max-h-full object-contain"
          poster="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1000"
        >
          您的浏览器不支持播放此视频格式。
        </video>

        {isM3U8 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 rounded-full">
            <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">HLS Stream</p>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="p-4 bg-black/40 backdrop-blur-sm">
        <p className="text-xs text-slate-500 break-all truncate">资源地址: {url}</p>
      </div>
    </div>
  );
};
