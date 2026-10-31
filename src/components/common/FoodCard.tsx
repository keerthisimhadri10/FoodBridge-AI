import React, { useState } from 'react';
import { FoodListing } from '../../types';
import { Clock, MapPin, Building2, AlertTriangle } from 'lucide-react';

interface FoodCardProps {
  listing: FoodListing;
  onRequest?: (listing: FoodListing) => void;
  onViewDetails?: (listing: FoodListing) => void;
  onReport?: (listing: FoodListing) => void;
  showActions?: boolean;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  listing,
  onRequest,
  onViewDetails,
  onReport,
  showActions = true,
}) => {
  const [imageError, setImageError] = useState(false);

  const isVegetarian = listing.dietaryType === 'VEGETARIAN';
  const deadline = new Date(listing.collectionDeadline);
  const isExpiringSoon = deadline.getTime() - Date.now() < 3 * 3600000 && deadline.getTime() > Date.now();

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden flex flex-col hover:border-emerald-700/40 hover:shadow-sm transition-all group">
      {/* Food Image with Fallback */}
      <div className="relative h-48 bg-stone-100 overflow-hidden">
        {!imageError ? (
          <img
            src={listing.imageUrl}
            alt={listing.foodName}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-stone-900 flex flex-col items-center justify-center text-white p-4 text-center">
            <span className="text-3xl mb-1">{isVegetarian ? '🥗' : '🍲'}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              {listing.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-stone-300 mt-1 line-clamp-1">{listing.foodName}</span>
          </div>
        )}

        {/* Quiet top status badge if reserved or expiring */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {listing.listingStatus === 'PARTIALLY_RESERVED' && (
            <span className="bg-amber-800/90 backdrop-blur-xs text-amber-100 px-2 py-0.5 rounded text-[11px] font-medium">
              Partially Reserved
            </span>
          )}
          {isExpiringSoon && (
            <span className="bg-rose-800/90 backdrop-blur-xs text-rose-100 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Claim Soon
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Zero-Pill Clean Metadata Kicker */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-1.5">
          <span className="font-semibold text-emerald-800">{listing.category.replace('_', ' ')}</span>
          <span aria-hidden="true">·</span>
          <span>{isVegetarian ? '🌱 Vegetarian' : '🍖 Non-Vegetarian'}</span>
          {listing.distanceKm !== undefined && listing.distanceKm !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-stone-600 font-mono tabular-nums">{listing.distanceKm} km</span>
            </>
          )}
        </div>

        {/* Primary Title */}
        <h3 className="text-base font-bold text-stone-900 tracking-tight leading-snug line-clamp-1 group-hover:text-emerald-800 transition-colors">
          {listing.foodName}
        </h3>

        {/* Donor organization */}
        <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-1">
          <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="line-clamp-1 font-medium">{listing.donorOrganizationName || 'Donor Organization'}</span>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed flex-1">
          {listing.description}
        </p>

        {/* Quantity & Deadline Bar */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <div>
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-medium">Available</div>
            <div className="text-sm font-bold text-stone-900 font-mono tabular-nums">
              {listing.availableQuantity}{' '}
              <span className="text-xs font-normal text-stone-500">
                {listing.unit.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-stone-400 uppercase tracking-wider font-medium">Pickup Deadline</div>
            <div className="text-xs font-medium text-stone-800 flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>
                {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                {deadline.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-3 pt-2 flex items-center gap-2">
            <button
              onClick={() => onViewDetails?.(listing)}
              className="flex-1 py-1.5 px-3 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap text-center"
            >
              Details
            </button>
            <button
              onClick={() => onRequest?.(listing)}
              disabled={listing.availableQuantity <= 0}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap text-center shadow-xs ${
                listing.availableQuantity > 0
                  ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {listing.availableQuantity > 0 ? 'Request Food' : 'Unavailable'}
            </button>
            {onReport && (
              <button
                onClick={() => onReport(listing)}
                title="Report issue with listing"
                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
