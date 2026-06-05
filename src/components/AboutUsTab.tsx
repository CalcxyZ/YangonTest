/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Globe, Users, ArrowUpRight, Github, Download, Map as MapIcon } from 'lucide-react';

interface AboutUsTabProps {
  language?: 'en' | 'my';
}

export default function AboutUsTab({ language = 'en' }: AboutUsTabProps) {
  const isMyanmar = language === 'my';

  const handleDownloadMap = async (e: React.MouseEvent) => {
    e.preventDefault();
    const imageUrl = "https://myanmar.ca/yangonheritageapp/map/OldRangoon1929.jpg";
    const filename = "Yangon Heritage Old Rangoon Map.jpg";

    try {
      // First attempt a standard Fetch logic to obtain image blob with custom naming support
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
      // Clean fallback: open the source image link in a new tab so users can long-press / right-click save
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
    <div className="flex flex-col gap-6 text-slate-800 pb-8">
      
      {/* SECTION 1: HERO HEADER */}
      {/* Feel free to replace the Unsplash image URL below with your own graphic or photo */}
      <div className="relative rounded-3xl overflow-hidden h-40 shadow-sm border border-white/40 bg-slate-100 flex items-end">
        <img 
          src="/images/oldyangon.jpg" 
          alt="Yangon Heritage Banner"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover brightness-[0.7] transform scale-100 hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>
        <div className="relative z-10 p-5 text-white">
          <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-300 font-mono">
            {isMyanmar ? 'ကျွန်ုပ်တို့၏ အမွေအနှစ် ရည်မှန်းချက်' : 'Our Heritage Mission'}
          </span>
          <h2 className="text-sm font-black tracking-tight leading-tight mt-0.5">
            {isMyanmar ? 'ရန်ကုန် ရှေးဟောင်းအမွေအနှစ် ထိန်းသိမ်းရေး' : 'Yangon Heritage Protection'}
          </h2>
          <p className="text-[10px] text-slate-300 font-medium leading-relaxed mt-1">
            {isMyanmar 
              ? 'သမိုင်းဝင် အမွေအနှစ်များကို ခေတ်မီ ခြေရာခံမြေပုံစနစ်နှင့် ချိတ်ဆက်ပေးခြင်း။' 
              : 'Bridging historical legacy with modern real-time tracking.'}
          </p>
        </div>
      </div>

      {/* HISTORICAL MAP DOWNLOAD ARCHIVE */}
      <section className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-xl rounded-3xl p-5 border border-emerald-500/20 shadow-sm flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-md shrink-0">
            <MapIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider block leading-tight font-sans">
              {isMyanmar ? 'ရှေးဟောင်း ရန်ကုန်မြေပုံ (၁၉၂၉)' : '1929 Old Rangoon Map'}
            </h3>
            <span className="text-[9.5px] text-emerald-700 font-bold uppercase tracking-wider block mt-0.5 font-mono">
              {isMyanmar ? 'မူရင်းပုံရိပ်ကို အရည်အသွေးမြင့် ဒေါင်းလုဒ်လုပ်ပါ' : 'High-Resolution Historical Archive'}
            </span>
          </div>
        </div>
        
        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
          {isMyanmar 
            ? '၁၉၂၉ ခုနှစ်ထုတ် "Old Rangoon" သမိုင်းဝင် ကိုလိုနီခေတ် မြေပုံကြီးကို လက်တွေ့ ကိုးကားအသုံးပြုနိုင်ရန် ဖုန်း သို့မဟုတ် ကွန်ပျူတာထဲသို့ အရည်အသွေးမြင့်မားစွာဖြင့် သိမ်းဆည်းရန် ဖြစ်သည်။'
            : 'Download the rare, high-resolution colonial-era map of "Old Rangoon" published in 1929. Perfect for high-fidelity archival research and historical orientation.'}
        </p>

        <button
          id="download-old-rangoon-map-btn"
          onClick={handleDownloadMap}
          className="w-full mt-1.5 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all text-white rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-200/30 text-xs font-black cursor-pointer select-none"
        >
          <Download className="w-4 h-4 text-white" />
          <span>{isMyanmar ? 'သမိုင်းဝင်မြေပုံ ဒေါင်းလုဒ်ဆွဲပါ' : 'Download Old Rangoon Map'}</span>
        </button>
      </section>

      {/* SECTION 2: INTRODUCTION / MISSION STATEMENT */}
      {/* EDIT THIS TEXT MANUALLY: Change this paragraph to reflect your core values or goals */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-sm flex flex-col gap-2.5">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{isMyanmar ? 'စီမံကိန်းအကြောင်း' : 'About This Project'}</span>
        </h3>
        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
          {isMyanmar 
            ? 'အရှေ့တောင်အာရှတွင် ၁၉ ရာစုနှောင်းပိုင်းနှင့် ၂၀ ရာစုအစောပိုင်း ကိုလိုနီခေတ် ရှေးဟောင်း အဆောက်အအုံ ဗိသုကာလက်ရာများ အများဆုံး စုစည်းရာ မြို့တစ်မြို့အဖြစ် ရန်ကုန်မြို့ (ယခင် ရန်ဂွန်) သည် ထင်ရှားကျော်ကြားလှပါသည်။ ဤမိုဘိုင်းလမ်းညွှန် မြေပုံသည် သမိုင်းဝင်အထင်ကရနေရာများ၊ ဘာသာရေး အဆောက်အအုံများနှင့် အုပ်ချုပ်ရေးဆိုင်ရာ ရှေးဟောင်းနေရာများကို အလွယ်တကူ ရှာဖွေနိုင်ရန် ကူညီပေးပါမည်။'
            : 'Yangon (formerly Rangoon) boasts one of the most stunning arrays of late 19th and early 20th-century colonial-era heritage architectures in Southeast Asia. This interactive mobile tracker guides curators, researchers, and tourists to key milestones, religious sanctuaries, and historic municipal buildings.'}
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          {isMyanmar 
            ? 'GPS စနစ်နှင့် ဆဲလ်တာဝါအချက်ပြများဖြင့် အမွေအနှစ်နေရာများကို ခြေရာခံရန်ဖြစ်စေ၊ Knightlab ၏ အသေးစိတ် ပုံပြင်များကို ဖတ်ရှုရန်ဖြစ်စေ ဤလမ်းညွှန်သည် မေ့ပျောက်လုနီးပါးဖြစ်နေသော သမိုင်းများကို ပြန်လည် ဖော်ထုတ်ပေးမည် ဖြစ်သည်။'
            : 'Whether using GPS navigation with cell tower triangulation to locate landmarks or exploring curated multimedia stories from Knightlab, this guide helps users rediscover forgotten heritage stories safely on any screen.'}
        </p>
      </section>

      {/* SECTION 3: THE TEAM / DIRECTORY */}
      {/* EDIT THIS SECTION MANUALLY: Change team member details, names, roles, or images right below */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1.5 font-sans">
          <Users className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{isMyanmar ? 'ထိန်းသိမ်းသူများနှင့် ဖန်တီးသူများ' : 'Curators & Developers'}</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-3.5 mt-1">
          {/* TEAM MEMBER 1 */}
          <div className="flex items-center gap-3 bg-white/50 p-2.5 rounded-2xl border border-slate-100/50">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-black flex items-center justify-center text-sm shadow-inner shrink-0">
              MA
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-extrabold text-slate-800 leading-none">Minn Khant Paing</h4>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1 font-mono">
                {isMyanmar ? 'Developer' : 'Developer'}
              </span>
            </div>
          </div>

          {/* TEAM MEMBER 2 (TEMPLATE FOR EXPANSION) */}
          <div className="flex items-center gap-3 bg-white/50 p-2.5 rounded-2xl border border-slate-100/50">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 font-black flex items-center justify-center text-sm shadow-inner shrink-0">
              TC
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-extrabold text-slate-800 leading-none">Thu Htoo San</h4>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1 font-mono">
                 {isMyanmar ? 'ဒီဇိုင်နာ' : 'Designer'}
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
