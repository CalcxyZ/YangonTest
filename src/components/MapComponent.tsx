/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { HeritageSite } from '../types';
import { Compass, Navigation, Locate, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface MapComponentProps {
  sites: HeritageSite[];
  selectedSite: HeritageSite | null;
  onSiteSelect: (site: HeritageSite) => void;
  userCoords: { latitude: number; longitude: number } | null;
  onGpsTrigger: () => void;
  isGpsLoading: boolean;
  language?: 'en' | 'my';
}

export default function MapComponent({
  sites,
  selectedSite,
  onSiteSelect,
  userCoords,
  onGpsTrigger,
  isGpsLoading,
  language = 'en'
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Follow tracking modes
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [isGpsHelpOpen, setIsGpsHelpOpen] = useState(false);
  const lastUserCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Auto-enable follow mode on first position acquisition
  useEffect(() => {
    if (userCoords && !lastUserCoordsRef.current) {
      setIsFollowingUser(true);
    }
    lastUserCoordsRef.current = userCoords;
  }, [userCoords]);

  // Initialize the Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default to Center of Yangon, Myanmar or immediate user location if already populated
    const initialLat = selectedSite ? selectedSite.latitude : (userCoords ? userCoords.latitude : 16.7900);
    const initialLng = selectedSite ? selectedSite.longitude : (userCoords ? userCoords.longitude : 96.1600);
    const initialZoom = selectedSite ? 13 : 13;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false, // Custom position
      minZoom: 11,
      maxZoom: 21,
      maxBounds: [[16.3, 95.8], [17.3, 96.5]] // Restrict pan area strictly around Yangon & immediate surroundings
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxNativeZoom: 19,
      maxZoom: 21
    }).addTo(map);

    // Custom zoom selector
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    markersGroupRef.current = L.featureGroup().addTo(map);
    mapInstanceRef.current = map;

    // Disable auto follow tracking whenever the user manually pans the map
    map.on('dragstart', () => {
      setIsFollowingUser(false);
    });

    // Handle map resize container logic nicely
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Markers to sites list
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear previous markers
    markersGroup.clearLayers();

    sites.forEach((site) => {
      const isSelected = selectedSite?.id === site.id;

      // Dynamic pin style based on Category and Selection State
      const categoryColors: Record<string, string> = {
        Historic: 'bg-emerald-600',
        Cultural: 'bg-violet-600',
        Natural: 'bg-teal-600',
        Archeological: 'bg-amber-600'
      };
      
      const pinColor = categoryColors[site.category] || 'bg-[#e89d1b]';
      const scaleStyle = isSelected ? 'scale-125 z-[999] border-white ring-4 ring-emerald-400/50' : 'scale-100 hover:scale-110';

      const siteName = (language === 'my' && site.nameMy) ? site.nameMy : site.name;

      const customPin = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center transition-all duration-300 ${scaleStyle}">
            <div class="absolute -top-10 bg-slate-900 text-white text-[10px] uppercase tracking-wide px-2 py-0.5 rounded shadow-md whitespace-nowrap opacity-0 hover:opacity-100 pointer-events-none transition-opacity duration-200">
              ${siteName}
            </div>
            <div class="w-8 h-8 rounded-full ${pinColor} border-2 border-white shadow-xl flex items-center justify-center">
              <span class="text-white text-[10px] font-bold">🏛️</span>
            </div>
            <div class="absolute bottom-[-6px] border-solid border-t-8 border-t-white border-x-transparent border-x-4 border-b-0 w-0 h-0"></div>
          </div>
        `,
        className: 'custom-heritage-pin',
        iconSize: [32, 40],
        iconAnchor: [16, 40]
      });

      const marker = L.marker([site.latitude, site.longitude], { icon: customPin });
      marker.on('click', () => {
        onSiteSelect(site);
      });
      markersGroup.addLayer(marker);
    });

    // Center securely on the first site at a high detail zoom of 13 instead of zooming out to fit all
    if (sites.length > 0 && !selectedSite && !userCoords) {
      try {
        const firstSite = sites[0];
        map.setView([firstSite.latitude, firstSite.longitude], 13, { animate: false });
      } catch (err) {
        // Safe fallback
      }
    }
  }, [sites, selectedSite, language]);

  // Sync GPS coordinate
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userCoords) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const { latitude, longitude } = userCoords;

    const gpsPin = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center border-none">
          <div class="absolute w-10 h-10 bg-blue-500/25 rounded-full animate-ping"></div>
          <div class="w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
            <div class="w-2 h-2 bg-white rounded-full bg-radial"></div>
          </div>
        </div>
      `,
      className: 'gps-identity-pin',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([latitude, longitude]);
    } else {
      userMarkerRef.current = L.marker([latitude, longitude], { icon: gpsPin }).addTo(map);
    }

    // Auto-center and preserve the user's current zoom level when tracking (defaulting to 13 if not already zoomed in)
    if (isFollowingUser && !selectedSite) {
      const currentZoom = map.getZoom();
      const targetZoom = currentZoom && currentZoom > 12 ? currentZoom : 13;
      map.setView([latitude, longitude], targetZoom, {
        animate: true,
        duration: 1.0
      });
    }
  }, [userCoords, isFollowingUser, selectedSite]);

  // Pan to Selected Site
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedSite) return;

    // Direct selection suspends tracking center lock on the user's position
    setIsFollowingUser(false);

    const currentZoom = map.getZoom();
    const targetZoom = currentZoom && currentZoom > 12 ? currentZoom : 13;

    map.setView([selectedSite.latitude, selectedSite.longitude], targetZoom, {
      animate: true,
      duration: 1.0
    });
  }, [selectedSite]);

  return (
    <div className="relative w-full h-[320px] rounded-3xl overflow-hidden shadow-inner border border-white/60 bg-white/20 backdrop-blur-md">
      {/* Map Element */}
      <div id="map" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Geolocate & Helper Row Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-1.5 pointer-events-auto">
        <button
          id="geolocate-action-btn"
          onClick={() => {
            onGpsTrigger();
            setIsFollowingUser(true);
            if (userCoords && mapInstanceRef.current) {
              const currentZoom = mapInstanceRef.current.getZoom();
              const targetZoom = currentZoom && currentZoom > 12 ? currentZoom : 13;
              mapInstanceRef.current.setView([userCoords.latitude, userCoords.longitude], targetZoom, {
                animate: true,
                duration: 1.0
              });
            }
          }}
          disabled={isGpsLoading}
          className={`flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md hover:bg-white/95 text-slate-800 rounded-xl shadow-lg border border-white/80 font-bold text-[10px] transition-all duration-200 active:scale-95 disabled:opacity-70 cursor-pointer ${
            isFollowingUser ? 'ring-2 ring-emerald-500/50 border-emerald-400 bg-emerald-50/90 text-emerald-955' : ''
          }`}
        >
          <Locate className={`w-3.5 h-3.5 ${isFollowingUser ? 'text-emerald-700' : 'text-emerald-600'} ${isGpsLoading ? 'animate-spin' : ''}`} />
          <span>
            {selectedSite 
              ? "GPS" 
              : (userCoords 
                ? (isFollowingUser 
                  ? (language === 'my' ? "လမ်းကြောင်းနောက်သို့" : "Tracking") 
                  : (language === 'my' ? "အသက်ဝင်သည်" : "Active")) 
                : (language === 'my' ? "ရှာဖွေပါ" : "Find Me"))}
          </span>
        </button>

        {/* GPS Help Button */}
        <button
          id="gps-troubleshoot-btn"
          onClick={() => setIsGpsHelpOpen(!isGpsHelpOpen)}
          className={`p-2 bg-white/90 backdrop-blur-md hover:bg-white/95 text-slate-700 rounded-xl shadow-lg border border-white/80 flex items-center justify-center transition cursor-pointer ${
            isGpsHelpOpen ? 'ring-2 ring-amber-500/50 border-amber-400 text-amber-800' : ''
          }`}
          title={language === 'my' ? "GPS အခက်အခဲ ဖြေရှင်းရန်" : "GPS Troubleshooting Tips"}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* GPS Troubleshooting Popup Overlay */}
      {isGpsHelpOpen && (
        <div className="absolute inset-x-3 bottom-14 z-[450] bg-slate-950/95 backdrop-blur-xl text-white rounded-2xl p-4 shadow-2xl border border-slate-800 text-[10px] flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 font-sans">
              🎯 {language === 'my' ? 'GPS တည်နေရာ လမ်းညွှန်ချက်များ' : 'GPS / APK Locating Guide'}
            </span>
            <button 
              onClick={() => setIsGpsHelpOpen(false)}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-extrabold cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
            <div className="flex flex-col gap-1">
              <span className="font-extrabold text-slate-300">📱 {language === 'my' ? 'အဆင့် ၁ - ဖုန်းစနစ်စစ်ဆေးရန်' : 'Step 1: Check Device Settings'}</span>
              <p className="text-slate-400 font-medium leading-relaxed">
                {language === 'my' 
                  ? 'သင့်ဖုန်း၏ Settings > Location တွင် တည်နေရာပြစနစ်ကို ဖွင့်ထားပေးရန် လိုအပ်ပြီး browser သို့မဟုတ် အက်ပ်ကို ခွင့်ပြုချက် ပေးထားရပါမည်။'
                  : 'Ensure location services (GPS) are enabled in your phone\'s settings, and that permission is allowed for this application.'}
              </p>
            </div>
            <div className="flex flex-col gap-1 border-t border-slate-800/60 pt-1.5">
              <span className="font-extrabold text-emerald-400 font-sans">🤖 {language === 'my' ? 'အဆင့် ၂ - APK အက်ပ် ခွင့်ပြုချက် (ဖန်တီးသူများအတွက်)' : 'Step 2: APK WebView Fix (For Developers)'}</span>
              <p className="text-slate-400 font-medium leading-relaxed">
                {language === 'my'
                  ? 'Android WebView ကွန်တိန်နာများသည် geolocation တောင်းဆိုမှုများကို default ပိတ်ထားလေ့ရှိပါသည်။ သင့် Kotlin သို့မဟုတ် Java ကုဒ်ရှိ WebChromeClient တွင် geolocation permissions ကို explicitly forward ပြုလုပ်ပေးရပါမည်။'
                  : 'By default, Android WebViews block site geolocation access. You must explicitly configure the WebChromeClient to prompt and grant geolocation permissions inside your Java/Kotlin source.'}
              </p>
              <pre className="p-1.5 bg-slate-950 rounded border border-slate-850 font-mono text-[8.5px] text-emerald-300 overflow-x-auto select-all leading-normal">
{`// Add to your Android WebView configuration:
webView.getSettings().setGeolocationEnabled(true);
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onGeolocationPermissionsShowPrompt(
        String origin, GeolocationPermissions.Callback callback) {
        callback.invoke(origin, true, false);
    }
});`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Key Legend Overlay (Collapsible) */}
      <div 
        id="map-legend-panel"
        className={`absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-white/80 text-[10px] text-slate-700 flex flex-col gap-1.5 transition-all duration-300 pointer-events-auto origin-top-left ${selectedSite ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        <button
          onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
          className="flex items-center justify-between gap-2.5 font-bold text-slate-800 text-left outline-none cursor-pointer w-full select-none"
        >
          <span>{language === 'my' ? 'အမွေအနှစ်လမ်းညွှန်' : 'Heritage Guide'}</span>
          {isLegendCollapsed ? (
            <ChevronDown className="w-3 h-3 text-slate-500" />
          ) : (
            <ChevronUp className="w-3 h-3 text-slate-500" />
          )}
        </button>

        {!isLegendCollapsed && (
          <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-100 pt-1.5 transition-all duration-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
              <span className="font-semibold text-[9px]">
                {language === 'my' ? 'သမိုင်းဝင်' : 'Historic'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-600 inline-block"></span>
              <span className="font-semibold text-[9px]">
                {language === 'my' ? 'ယဉ်ကျေးမှု' : 'Cultural'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
              <span className="font-semibold text-[9px]">
                {language === 'my' ? 'သဘာဝ' : 'Natural'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block"></span>
              <span className="font-semibold text-[9px]">
                {language === 'my' ? 'ရှေးဟောင်းသုတေသန' : 'Archeological'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
