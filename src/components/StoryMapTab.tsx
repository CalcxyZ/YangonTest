/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExternalLink, RefreshCw, Layers, ShieldAlert, Download } from 'lucide-react';

export default function StoryMapTab() {
  const storyMapUrl = "https://uploads.knightlab.com/storymapjs/71d8c3f4144ced51e7bfcd0f37d6aa18/k-eaak-ttnttaa-heritage/index.html";
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
    setIsLoading(true);
  };

  const handleDownloadMap = async (e: React.MouseEvent) => {
    e.preventDefault();
    const imageUrl = "https://myanmar.ca/yangonheritageapp/map/OldRangoon1929.jpg";
    const filename = "Yangon Heritage Old Rangoon Map.jpg";

    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('CORS or network blockage on source domain');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.warn("Direct blob download failed, opening image source URL directly for saving:", error);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-xl text-slate-800 rounded-3xl overflow-hidden shadow-xl relative min-h-[calc(100vh-180px)] border border-white/60">
      
      {/* Banner controller */}
      <div className="px-5 py-4 bg-white/40 backdrop-blur-md border-b border-white/50 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-slate-800 leading-tight">Interactive StoryMap</span>
            <span className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-mono font-semibold">Interactive Map Narrative</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Download 1929 Historical Map */}
          <button
            id="storymap-download-map-btn"
            onClick={handleDownloadMap}
            className="p-2 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center rounded-xl border border-emerald-200/50 transition cursor-pointer"
            title="Download Old Rangoon 1929 Map"
          >
            <Download className="w-4 h-4 text-emerald-700" />
          </button>

          {/* Refresh Action */}
          <button
            id="iframe-refresh-btn"
            onClick={handleRefresh}
            className="p-2 bg-white/60 hover:bg-white/80 active:scale-95 rounded-xl border border-white/80 transition cursor-pointer"
            title="Refresh iframe content"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>

          {/* External browser anchor */}
          <a
            id="iframe-external-link"
            href={storyMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 rounded-xl text-white flex items-center gap-1.5 shadow-lg shadow-emerald-200/50 transition cursor-pointer text-xs font-bold"
            title="Open mapping story in a new tab"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Launch Reader</span>
          </a>
        </div>
      </div>

      {/* Frame Box */}
      <div className="relative flex-1 bg-slate-50 min-h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-50 flex flex-col items-center justify-center gap-3 p-6 text-center animate-pulse">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm text-slate-800">Loading Interactive History Tour...</span>
              <span className="text-xs text-slate-500">Retrieving story layers from Knightlab Knight Foundation</span>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={storyMapUrl}
          title="Curated Heritage StoryMap"
          onLoad={() => setIsLoading(false)}
          referrerPolicy="no-referrer"
          className="max-w-full border-none bg-slate-50 rounded-b-3xl"
          style={{ height: '500px', width: '452.2px' }}
        />
      </div>

      {/* Footer hint */}
      <div className="px-5 py-3.5 bg-white/40 border-t border-white/50 text-[10px] text-slate-500 flex items-center justify-center gap-1.5 shrink-0 select-none">
        <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-semibold">Content served securely. Double-tap inside the canvas to scale individual slides.</span>
      </div>
    </div>
  );
}
