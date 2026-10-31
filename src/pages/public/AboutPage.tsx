import React from 'react';
import { ShieldCheck, Scale, Cpu, Globe, HeartHandshake } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">HACK-P197 · Food & Restaurant</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          About FoodBridge AI
        </h1>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          An intelligent food donation and redistribution platform designed to bridge the gap between commercial food surplus and vulnerable community nourishment.
        </p>
      </div>

      {/* The Problem & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-stone-900">The Problem</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Every day across urban centers like Hyderabad, premier restaurants, hotels, banquet halls, and supermarkets prepare wholesome edible food that cannot be sold the following morning. Simultaneously, hundreds of charitable orphanages, elder care facilities, and community shelters struggle with rising food costs.
          </p>
          <p className="text-xs text-stone-600 leading-relaxed">
            Traditional ad-hoc donations break down due to uncertainty: double-booked pickups, vague allergen information, and missed collection windows that lead to spoilage.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-stone-900">The FoodBridge Solution</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            FoodBridge AI replaces chaotic telephone calling with an automated, transactional redistribution pipeline. Donors specify holding temperatures and deadlines; verified recipient organizations request exact portions; and atomic database locks ensure that food is never promised twice.
          </p>
          <p className="text-xs text-stone-600 leading-relaxed">
            Coupled with Google Gemini AI for clear structured descriptions and demand insight analysis, the platform ensures transparency from prep to consumption.
          </p>
        </div>
      </div>

      {/* Food Safety & Responsible Handling */}
      <div className="p-6 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <span>Food Safety & Handling Safeguards</span>
        </div>
        <p className="text-xs text-emerald-950 leading-relaxed">
          FoodBridge AI strictly enforces operational food handling boundaries:
        </p>
        <ul className="text-xs text-emerald-900 space-y-2 list-disc list-inside">
          <li><strong>Donor Declaration:</strong> Every food listing requires the donor to explicitly certify that food was prepared under commercial hygiene conditions.</li>
          <li><strong>Mandatory Metadata:</strong> Preparation time, storage protocols (hot holding above 65°C or chilling below 4°C), and collection deadlines must be provided.</li>
          <li><strong>Automatic Expiration:</strong> Listings past their collection deadline are automatically transitioned to EXPIRED, preventing outdated claims.</li>
          <li><strong>Role Limitation:</strong> AI matching algorithms optimize logistics and routing; AI never declares food safe, certifies edibility, or replaces human kitchen responsibility.</li>
        </ul>
      </div>

      {/* Tech Architecture Snapshot */}
      <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-700" />
          <span>Technology & Architecture</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl">
            <span className="font-bold text-stone-900 block mb-1">Frontend</span>
            <span className="text-stone-600">React, TypeScript, Vite, Tailwind CSS, Leaflet Maps, Recharts</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl">
            <span className="font-bold text-stone-900 block mb-1">Backend</span>
            <span className="text-stone-600">Node.js, Express.js, TypeScript, JWT Auth, Mutex Concurrency Locks</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl">
            <span className="font-bold text-stone-900 block mb-1">AI Engine</span>
            <span className="text-stone-600">Google Gemini API (@google/genai) with deterministic fallback</span>
          </div>
        </div>
      </div>
    </div>
  );
};
