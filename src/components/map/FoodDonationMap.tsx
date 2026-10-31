import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { FoodListing, Organization } from '../../types';

interface FoodDonationMapProps {
  listings?: FoodListing[];
  organizations?: Organization[];
  center?: [number, number];
  zoom?: number;
  selectedListingId?: string;
  onSelectListing?: (listing: FoodListing) => void;
  className?: string;
}

export const FoodDonationMap: React.FC<FoodDonationMapProps> = ({
  listings = [],
  organizations = [],
  center = [17.4300, 78.4200], // Hyderabad center
  zoom = 12,
  selectedListingId,
  onSelectListing,
  className = 'h-96 w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix leaflet marker icon issues in bundled environments
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map instance or cleanup on unmount
    };
  }, []);

  // Update markers whenever listings or organizations change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Custom food donation marker (Emerald Pin)
    const foodIcon = L.divIcon({
      className: 'custom-food-marker',
      html: `
        <div style="background-color: #065f46; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); border: 2px solid white; font-weight: bold; font-size: 14px;">
          🍲
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Custom NGO shelter marker (Blue-Gray Pin)
    const ngoIcon = L.divIcon({
      className: 'custom-ngo-marker',
      html: `
        <div style="background-color: #1e3a8a; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); border: 2px solid white; font-size: 13px;">
          🤝
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });

    // Add listing markers
    listings.forEach((listing) => {
      if (!listing.donorCoordinates?.latitude || !listing.donorCoordinates?.longitude) return;

      const marker = L.marker(
        [listing.donorCoordinates.latitude, listing.donorCoordinates.longitude],
        { icon: foodIcon }
      ).addTo(map);

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 180px; padding: 2px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #047857; font-weight: 700;">
            ${listing.category.replace('_', ' ')} · ${listing.dietaryType === 'VEGETARIAN' ? '🌱 Veg' : '🍖 Non-Veg'}
          </div>
          <div style="font-weight: 700; font-size: 14px; margin-top: 2px; color: #1c1917;">
            ${listing.foodName}
          </div>
          <div style="font-size: 12px; color: #57534e; margin-top: 2px;">
            ${listing.donorOrganizationName || 'Donor'}
          </div>
          <div style="margin-top: 6px; font-size: 12px; font-weight: 600; color: #0f766e;">
            ${listing.availableQuantity} ${listing.unit.replace('_', ' ').toLowerCase()} available
          </div>
          ${
            listing.distanceKm !== undefined && listing.distanceKm !== null
              ? `<div style="font-size: 11px; color: #78716c; margin-top: 2px;">📍 ${listing.distanceKm} km away</div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectListing) {
          onSelectListing(listing);
        }
      });

      markersRef.current.push(marker);

      if (selectedListingId === listing.id) {
        marker.openPopup();
        map.setView([listing.donorCoordinates.latitude, listing.donorCoordinates.longitude], 13);
      }
    });

    // Add organization markers if provided
    organizations.forEach((org) => {
      if (!org.latitude || !org.longitude) return;

      const marker = L.marker([org.latitude, org.longitude], { icon: ngoIcon }).addTo(map);

      const isVerified = org.verificationStatus === 'VERIFIED';
      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 160px; padding: 2px;">
          <div style="font-size: 11px; font-weight: 700; color: #2563eb;">
            ${org.organizationType.replace('_', ' ')} ${isVerified ? '· Verified ✅' : '· Pending'}
          </div>
          <div style="font-weight: 700; font-size: 13px; margin-top: 2px; color: #1c1917;">
            ${org.organizationName}
          </div>
          <div style="font-size: 11px; color: #78716c; margin-top: 4px;">
            ${org.address}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });
  }, [listings, organizations, selectedListingId, onSelectListing]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-stone-200 shadow-xs ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-stone-200/80 shadow-xs z-20 text-xs font-medium text-stone-700 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 inline-block"></span>
          Surplus Food
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-800 inline-block"></span>
          Recipient Shelters
        </span>
      </div>
    </div>
  );
};
