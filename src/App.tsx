/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Map as MapIcon, 
  User as UserIcon, 
  Lock, 
  Unlock, 
  LogOut, 
  Globe, 
  Sparkles,
  Info,
  MapPin,
  BookOpen
} from 'lucide-react';
import { HeritageSite, UserState } from './types';
import { backend, isFirebaseConfigured } from './lib/firebase';
import { DEFAULT_HERITAGE_SITES } from './data/defaultSites';
import MapComponent from './components/MapComponent';
import SiteList from './components/SiteList';
import CmsPanel from './components/CmsPanel';
import StoryMapTab from './components/StoryMapTab';
import AuthModal from './components/AuthModal';
import AboutUsTab from './components/AboutUsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'about'>('home');
  const [sites, setSites] = useState<HeritageSite[]>(DEFAULT_HERITAGE_SITES);
  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null);
  const [user, setUser] = useState<UserState | null>(null);
  
  // Language Localization State (Myanmar / English)
  const [language, setLanguage] = useState<'en' | 'my'>(() => {
    try {
      const saved = localStorage.getItem('ygh_locale');
      return (saved === 'my' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('ygh_locale', language);
    } catch (e) {
      console.warn("localStorage locale save blocked:", e);
    }
  }, [language]);
  
  // Modals / Overlays state
  const [isCmsOpen, setIsCmsOpen] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState<HeritageSite | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // GPS tracking
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const gpsWatchIdRef = useRef<number | null>(null);

  // Geolocation trigger with smart cellular/GPS hybrid handover and state preservation
  const handleGpsTrigger = () => {
    setIsGpsLoading(true);

    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }

    if (!navigator.geolocation) {
      // If geolocation API completely absent, fall back safely
      setUserCoords((prev) => prev || { latitude: 16.7983, longitude: 96.1497 });
      setIsGpsLoading(false);
      return;
    }

    let hasReceivedPosition = false;

    const startWatch = (highAccuracy: boolean) => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          hasReceivedPosition = true;
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsGpsLoading(false);
        },
        (error) => {
          console.warn(`GPS tracking callback error (highAccuracy=${highAccuracy}, code=${error.code}):`, error);
          
          // Fall back from direct high-accuracy satellite GPS to standard cellular/WiFi triangulation if timeout or error
          if (highAccuracy && !hasReceivedPosition && (error.code === 3 || error.code === 2)) {
            console.log("Switching GPS provider from precise satellite to standard cellular/Wi-Fi triangulation...");
            if (gpsWatchIdRef.current !== null) {
              navigator.geolocation.clearWatch(gpsWatchIdRef.current);
            }
            startWatch(false);
            return;
          }

          // CRITICAL: Preserve existing real coords instead of resetting to Shwedagon on transient signal loss
          setUserCoords((prev) => {
            if (prev !== null) return prev;
            return {
              latitude: 16.7983, 
              longitude: 96.1497
            };
          });
          setIsGpsLoading(false);
        },
        { 
          enableHighAccuracy: highAccuracy, 
          // 15 seconds limit for satellite acquisition, 25 seconds for cellular/Wi-Fi fallback
          timeout: highAccuracy ? 15000 : 25000, 
          // Accept cached locations up to 15 seconds old for GPS, up to 1 minute old for hybrid networks
          maximumAge: highAccuracy ? 15000 : 60000 
        }
      );

      gpsWatchIdRef.current = watchId;
    };

    // Begin with precise satellite GPS
    startWatch(true);
  };

  // Load local static data & optional cleanups
  useEffect(() => {
    // Keep list set to the default static Yangon sites explicitly
    setSites(DEFAULT_HERITAGE_SITES);

    // Automatically trigger GPS tracking and centering on startup
    handleGpsTrigger();

    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      }
    };
  }, []);

  // CMS Handlers
  const handleOpenAddSite = () => {
    setSiteToEdit(null);
    setIsCmsOpen(true);
  };

  const handleOpenEditSite = (site: HeritageSite) => {
    setSiteToEdit(site);
    setIsCmsOpen(true);
  };

  const handleSaveSite = async (site: HeritageSite) => {
    try {
      if (siteToEdit) {
        await backend.updateSite(site, user?.uid);
      } else {
        await backend.addSite(site, user?.uid);
      }
      setIsCmsOpen(false);
      setSiteToEdit(null);
    } catch (err) {
      console.error("Failed to save site:", err);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (confirm("Are you sure you want to remove this curated landmark from the heritage record?")) {
      try {
        await backend.deleteSite(siteId);
        if (selectedSite?.id === siteId) {
          setSelectedSite(null);
        }
      } catch (err) {
        console.error("Deletion failed:", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await backend.logout();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div id="heritage-app-root" className="min-h-screen w-full bg-[#e8ecef] flex flex-col items-center justify-center p-0 sm:p-4 md:p-8 font-sans relative overflow-x-hidden">
      
      {/* Smartphone Outer Container simulation */}
      <div className="w-full max-w-lg bg-white/40 backdrop-blur-2xl h-[100dvh] sm:h-[840px] sm:rounded-[3.5rem] sm:shadow-[0_32px_64px_rgba(0,0,0,0.15)] flex flex-col justify-between sm:border-[10px] sm:border-[#1e293b] overflow-hidden relative">
        
        {/* Background gradient layout pattern */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#d4d9cc] via-[#f1f5f9] to-[#c7dceb] -z-10 pointer-events-none"></div>

        {/* APP BRAND BAR & HEADER */}
        <header className="px-5 py-4 bg-white/40 backdrop-blur-xl border-b border-white/60 flex items-center justify-between shadow-sm sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-slate-800 text-sm tracking-tight leading-none flex items-center gap-1">
                <span>{language === 'my' ? 'ရန်ကုန် အမွေအနှစ်' : 'Yangon Heritage'}</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              </h1>
              <span className="text-[10px] text-slate-500 mt-1 uppercase font-semibold font-mono tracking-wider">
                {language === 'my' ? 'WGS-84 ခြေရာခံမြေပုံ' : 'WGS-84 Mobile Tracker'}
              </span>
            </div>
          </div>

          {/* Languages Dropdown Tab Selection */}
          <div className="relative">
            <button
              id="language-selector-toggle"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 px-3 py-1.5 rounded-full text-[10px] font-extrabold text-emerald-800 shadow-sm select-none cursor-pointer transition active:scale-95"
            >
              <span>🌍 {language === 'en' ? 'English' : 'မြန်မာ'}</span>
              <span className="text-[7.5px] text-slate-500">▼</span>
            </button>
            {isLangDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-28 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden font-sans py-1">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-emerald-50 transition-colors flex items-center justify-between ${
                      language === 'en' ? 'text-emerald-700 bg-emerald-50/40' : 'text-slate-600'
                    }`}
                  >
                    <span>English</span>
                    {language === 'en' && <span className="text-[10px]">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('my');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-emerald-50 transition-colors flex items-center justify-between ${
                      language === 'my' ? 'text-emerald-700 bg-emerald-50/40' : 'text-slate-600'
                    }`}
                  >
                    <span>မြန်မာ</span>
                    {language === 'my' && <span className="text-[10px]">✓</span>}
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* PRIMARY VIEW CONTENT - Tab Selection Rendering */}
        <main className="flex-1 overflow-y-auto px-5 py-4 bg-transparent flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {activeTab === 'home' ? (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                {/* 1. Map Canvas displaying markings, user position and centering coordinates */}
                <section aria-label="Geographic Explorer Map" className="w-full min-h-[320px] relative rounded-3xl overflow-hidden">
                  <MapComponent
                    sites={sites}
                    selectedSite={selectedSite}
                    onSiteSelect={setSelectedSite}
                    userCoords={userCoords}
                    onGpsTrigger={handleGpsTrigger}
                    isGpsLoading={isGpsLoading}
                    language={language}
                  />
                </section>

                {/* 2. Interactive searchable, tag-filtrable cards list below the map */}
                <section aria-label=" Curated Sites list and search">
                  <div className="flex items-center justify-between border-b border-slate-300/40 pb-1.5 mt-2">
                    <span className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-1">
                      {language === 'my' ? 'အနီးနားရှိ အမွေအနှစ်များ' : 'Nearby Landmarks'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">
                      {language === 'my' ? 'ရန်ကုန် အမွေအနှစ်' : 'Yangon Heritage'}
                    </span>
                  </div>
                  <SiteList
                    sites={sites}
                    selectedSite={selectedSite}
                    onSiteSelect={setSelectedSite}
                    userCoords={userCoords}
                    isAdmin={false}
                    language={language}
                  />
                </section>
              </motion.div>
            ) : activeTab === 'map' ? (
              // Map view tab links directly to the Knightlab interactive mapping service
              <motion.div
                key="storymap-tab"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="h-full flex flex-col"
              >
                <section aria-label="Interactive StoryMap Tour">
                  <StoryMapTab />
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="about-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="h-full flex flex-col"
              >
                <section aria-label="About Us & Project Mission">
                  <AboutUsTab language={language} />
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* BOTTOM NAVIGATION TAB MENU */}
        <nav className="h-16 bg-white/70 backdrop-blur-3xl border-t border-white/40 flex items-center justify-around px-8 shrink-0 z-30 select-none">
          {/* Tab 1: Home (Compass Icon) */}
          <button
            id="nav-tab-home"
            onClick={() => setActiveTab('home')}
            className="flex flex-col items-center gap-1 group cursor-pointer transition"
          >
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
              activeTab === 'home'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200/50 scale-105'
                : 'text-slate-500 opacity-50 hover:opacity-80'
            }`}>
              <Compass className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <span className={`text-[10px] font-bold ${
              activeTab === 'home' ? 'text-slate-800' : 'text-slate-500 opacity-75'
            }`}>{language === 'my' ? 'ပင်မစာစု' : 'Home'}</span>
          </button>

          {/* Tab 2: Story Map (BookOpen Icon) */}
          <button
            id="nav-tab-story-map"
            onClick={() => setActiveTab('map')}
            className="flex flex-col items-center gap-1 group cursor-pointer transition"
          >
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
              activeTab === 'map'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200/50 scale-105'
                : 'text-slate-500 opacity-50 hover:opacity-80'
            }`}>
              <BookOpen className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <span className={`text-[10px] font-bold ${
              activeTab === 'map' ? 'text-slate-800' : 'text-slate-500 opacity-75'
            }`}>{language === 'my' ? 'ခရီးသွားမြေပုံ' : 'Story Map'}</span>
          </button>

          {/* Tab 3: About Us (Info Icon) */}
          <button
            id="nav-tab-about"
            onClick={() => setActiveTab('about')}
            className="flex flex-col items-center gap-1 group cursor-pointer transition"
          >
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
              activeTab === 'about'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200/50 scale-105'
                : 'text-slate-500 opacity-50 hover:opacity-80'
            }`}>
              <Info className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <span className={`text-[10px] font-bold ${
              activeTab === 'about' ? 'text-slate-800' : 'text-slate-500 opacity-75'
            }`}>{language === 'my' ? 'ကျွန်ုပ်တို့အကြောင်း' : 'About Us'}</span>
          </button>
        </nav>

        {/* CMS DRAWER MODAL SHEET */}
        <AnimatePresence>
          {isCmsOpen && (
            <CmsPanel
              siteToEdit={siteToEdit}
              onSave={handleSaveSite}
              onCancel={() => {
                setIsCmsOpen(false);
                setSiteToEdit(null);
              }}
              userCoords={userCoords}
            />
          )}
        </AnimatePresence>

        {/* AUTH DIALOG MODAL */}
        <AnimatePresence>
          {isAuthOpen && (
            <AuthModal
              onSuccess={() => {
                setIsAuthOpen(false);
              }}
              onCancel={() => {
                setIsAuthOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Selected Landmark Explanatory Bottom Sheet Drawer */}
        <AnimatePresence>
          {selectedSite && activeTab === 'home' && (
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="absolute bottom-16 left-0 right-0 mx-4 mb-4 z-40 bg-white/95 backdrop-blur-2xl rounded-3xl p-4 border border-white/80 shadow-[0_24px_50px_rgba(0,0,0,0.22)] text-slate-800 flex flex-col gap-2.5 max-h-[340px] overflow-hidden"
            >
              {/* Drag handle / context bar */}
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-1 shrink-0"></div>

              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 block leading-normal mb-1 font-mono">
                    {language === 'my' ? 'သမိုင်းအသေးစိတ်' : 'History Detail'}
                  </span>
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-800 leading-snug whitespace-normal break-words py-0.5">
                    {(language === 'my' && selectedSite.nameMy) ? selectedSite.nameMy : selectedSite.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer shrink-0 text-xs font-bold font-sans"
                >
                  ✕
                </button>
              </div>

              {/* Scrolling Content */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin">
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {(language === 'my' && selectedSite.descriptionMy) ? selectedSite.descriptionMy : selectedSite.description}
                </p>

                <div className="flex flex-col gap-1.5 mt-2 bg-emerald-50/40 p-2.5 rounded-2xl border border-emerald-50/60 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-800 font-extrabold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{(language === 'my' && selectedSite.locationNameMy) ? selectedSite.locationNameMy : selectedSite.locationName}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold font-mono flex items-center gap-2 pl-5 mt-0.5 leading-none">
                    <span className="bg-slate-200/50 px-1.5 py-0.5 rounded text-[8px] font-bold">WGS84 GPS</span>
                    <span>LAT: {selectedSite.latitude.toFixed(5)}</span>
                    <span>•</span>
                    <span>LNG: {selectedSite.longitude.toFixed(5)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
