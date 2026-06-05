/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { HeritageSite, CategoryFilter } from '../types';
import { Search, MapPin, Compass, Trash2, Edit2, Plus, Info } from 'lucide-react';

interface SiteListProps {
  sites: HeritageSite[];
  selectedSite: HeritageSite | null;
  onSiteSelect: (site: HeritageSite) => void;
  userCoords: { latitude: number; longitude: number } | null;
  isAdmin: boolean;
  onEditTrigger?: (site: HeritageSite) => void;
  onDeleteTrigger?: (siteId: string) => void;
  onAddTrigger?: () => void;
  language?: 'en' | 'my';
}

// Coordinate Distance Calculation Helper (Haversine Formula)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth ratio in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Convert standard numbers to Myanmar (Burmese) digits.
export function toMyanmarDigits(num: number): string {
  const myanmarDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
  return num.toString().split('').map(d => myanmarDigits[Number(d)] ?? d).join('');
}

export default function SiteList({
  sites,
  selectedSite,
  onSiteSelect,
  userCoords,
  isAdmin,
  onEditTrigger,
  onDeleteTrigger,
  onAddTrigger,
  language = 'en'
}: SiteListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  const isMyanmar = language === 'my';

  const categoryTranslations: Record<string, string> = {
    All: isMyanmar ? 'အားလုံး' : 'All',
    Historic: isMyanmar ? 'သမိုင်းဝင်' : 'Historic',
    Cultural: isMyanmar ? 'ယဉ်ကျေးမှု' : 'Cultural',
    Natural: isMyanmar ? 'သဘာဝ' : 'Natural',
    Archeological: isMyanmar ? 'ရှေးဟောင်းသုတေသန' : 'Archeological'
  };

  // Multi-property search with localized fields and fallback support (searches both English and Myanmar fields)
  const filteredSites = sites.filter((site) => {
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch = !term ||
      (site.name && site.name.toLowerCase().includes(term)) ||
      (site.locationName && site.locationName.toLowerCase().includes(term)) ||
      (site.description && site.description.toLowerCase().includes(term)) ||
      (site.nameMy && site.nameMy.toLowerCase().includes(term)) ||
      (site.locationNameMy && site.locationNameMy.toLowerCase().includes(term)) ||
      (site.descriptionMy && site.descriptionMy.toLowerCase().includes(term));
    
    const matchesCategory = selectedCategory === 'All' || site.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Categories definition
  const categories: CategoryFilter[] = ['All', 'Historic', 'Cultural', 'Natural', 'Archeological'];

  const categoryBadges: Record<string, string> = {
    Historic: 'bg-emerald-50/80 backdrop-blur-md text-emerald-800 border-emerald-200/50',
    Cultural: 'bg-violet-50/80 backdrop-blur-md text-violet-800 border-violet-200/50',
    Natural: 'bg-teal-50/80 backdrop-blur-md text-teal-800 border-teal-200/50',
    Archeological: 'bg-amber-50/80 backdrop-blur-md text-amber-800 border-amber-200/50'
  };

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Search Header and CMS Quick Launcher */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="search-input"
            type="text"
            placeholder={isMyanmar ? 'ရန်ကုန် အမွေအနှစ်၊ နယ်မြေ၊ ကဏ္ဍ ရှာဖွေရန်...' : 'Search Yangon landmarks, areas, categories...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-lg border border-white/80 rounded-2xl text-xs placeholder-slate-500 shadow-lg shadow-black/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60 transition"
          />
        </div>
        {isAdmin && onAddTrigger && (
          <button
            id="cms-quick-add-btn"
            onClick={onAddTrigger}
            className="flex items-center gap-1.5 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200/50 text-xs font-semibold select-none cursor-pointer transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{isMyanmar ? 'နေရာသစ် ထည့်ရန်' : 'Add Site'}</span>
          </button>
        )}
      </div>

      {/* Category Horizontal Filter Tags */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-[11px] font-bold border whitespace-nowrap transition-all duration-200 cursor-pointer select-none ${
                isSelected 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-900/15' 
                  : 'bg-white/50 backdrop-blur-md hover:bg-white/80 border-white/70 text-slate-600'
              }`}
            >
              {categoryTranslations[cat] || cat}
            </button>
          );
        })}
      </div>

      {/* Search Result Count */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-semibold">
        <span>
          {isMyanmar 
            ? `အနီးနားရှိ နေရာ ${toMyanmarDigits(sites.length)} ခုအနက် ${toMyanmarDigits(filteredSites.length)} ခု ပြသနေသည်` 
            : `Showing ${filteredSites.length} of ${sites.length} locations`}
        </span>
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            className="text-emerald-600 hover:text-emerald-700 hover:underline font-bold"
          >
            {isMyanmar ? 'ရှာဖွေမှု ဖျက်ရန်' : 'Clear Search'}
          </button>
        )}
      </div>

      {/* Horizontally scrollable row of Heritage Site Cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-5 px-5">
        {filteredSites.length > 0 ? (
          filteredSites.map((site) => {
            const isSelected = selectedSite?.id === site.id;
            const displayName = (isMyanmar && site.nameMy) ? site.nameMy : site.name;
            const displayLocation = (isMyanmar && site.locationNameMy) ? site.locationNameMy : site.locationName;
            
            // Calculate real-time coordinates distance
            let distanceString = '';
            if (userCoords) {
              const km = calculateDistance(
                userCoords.latitude, 
                userCoords.longitude, 
                site.latitude, 
                site.longitude
              );
              distanceString = km < 1 
                ? `${Math.round(km * 1000)}m` 
                : `${km.toFixed(1)}km`;
            }

            return (
              <div
                id={`site-card-${site.id}`}
                key={site.id}
                onClick={() => onSiteSelect(site)}
                className={`flex flex-col w-[170px] sm:w-[190px] shrink-0 snap-start bg-white/80 backdrop-blur-xl border rounded-2xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-emerald-500 border-transparent bg-emerald-50/15 shadow-lg shadow-emerald-500/10' : 'border-white/60'
                }`}
              >
                {/* Visual Thumbnail */}
                <div className="relative h-24 w-full bg-slate-100/50 overflow-hidden">
                  <img
                    src={site.imageUrl || 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad'}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad';
                    }}
                  />
                  
                  {/* Category overlay badge */}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 text-[8px] font-extrabold tracking-wide border rounded-full uppercase shadow-sm ${
                    categoryBadges[site.category] || 'bg-white/90 backdrop-blur text-slate-800 border-white/50'
                  }`}>
                    {categoryTranslations[site.category] || site.category}
                  </span>

                  {/* GPS Distance Badge overlay */}
                  {distanceString && (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur border border-white/20 text-white rounded-md text-[8px] font-extrabold tracking-wider shadow-md uppercase">
                      <Compass className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '8s' }} />
                      <span>{distanceString}</span>
                    </span>
                  )}

                  {/* Admin Curator Controls */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {onEditTrigger && (
                        <button
                          id={`edit-site-${site.id}`}
                          onClick={() => onEditTrigger(site)}
                          className="p-1 bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-600 rounded-md shadow border border-slate-200/50 transition active:scale-95"
                          title="Edit Heritage Site"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {onDeleteTrigger && (
                        <button
                          id={`delete-site-${site.id}`}
                          onClick={() => onDeleteTrigger(site.id)}
                          className="p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md shadow transition active:scale-95"
                          title="Delete Heritage Site"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Site Info */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-1.5 select-none">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h3 className="font-extrabold text-slate-800 tracking-tight text-xs leading-snug truncate hover:text-emerald-600 transition-colors" title={displayName}>
                      {displayName}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold truncate leading-none">
                      <MapPin className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{displayLocation}</span>
                    </div>
                  </div>

                  {/* Card Coordinates Footer */}
                  <div className="flex items-center justify-between border-t border-slate-300/10 pt-1.5 mt-0.5 text-[8px] text-slate-400 font-bold font-mono">
                    <span>{site.latitude.toFixed(3)}N</span>
                    <span>{site.longitude.toFixed(3)}E</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center gap-3 bg-white border border-dashed border-gray-200 rounded-2xl w-full">
            <Info className="w-8 h-8 text-slate-300" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-slate-700">{isMyanmar ? 'ရှာဖွေမှု မတွေ့ရှိပါ' : 'No sites found'}</p>
              <p className="text-xs text-slate-500 max-w-sm px-6">
                {isMyanmar 
                  ? 'အမွေအနှစ်နေရာများကို ပိုမိုရှာဖွေရန် အခြားကဏ္ဍတစ်ခုကို ရွေးချယ်ကြည့်ပါ'
                  : 'Try revising your query or selecting another category to discover preloaded heritage sites.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
