import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Leaf } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
              <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs">
                FB
              </div>
              <span>FoodBridge AI</span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed mb-4">
              Connecting surplus culinary food from restaurants and supermarkets with verified shelters and community
              kitchens through intelligent redistribution in Hyderabad.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Leaf className="w-3.5 h-3.5" />
              <span>Zero Avoidable Food Waste</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Redistribution</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/browse" className="hover:text-white transition-colors">
                  Available Surplus Food
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/impact" className="hover:text-white transition-colors">
                  Impact Analytics
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Mission & Scope
                </Link>
              </li>
            </ul>
          </div>

          {/* Roles */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">For Organizations</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register as Food Donor
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register NGO / Recipient
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In to Portal
                </Link>
              </li>
              <li>
                <span className="text-stone-500">Admin Operations Console</span>
              </li>
            </ul>
          </div>

          {/* Food Safety Disclosure */}
          <div>
            <div className="flex items-center gap-1.5 text-stone-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Food Safety Declaration</span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              FoodBridge AI operates strictly as a logistics coordination platform. Donors remain responsible for hygienic
              handling and compliance with applicable food-handling standards. AI matching algorithms optimize discovery
              and routing, but never inspect, certify, or declare biological edibility.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} FoodBridge AI · Student Hackathon Prototype (HACK-P197) · Hyderabad, India.
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Leaflet & OpenStreetMap</span>
            <span>·</span>
            <span>Google Gemini Backend AI</span>
            <span>·</span>
            <span>Relational Persistence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
