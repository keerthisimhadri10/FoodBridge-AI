import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FoodListing, FoodCategory, DietaryType } from '../../types';
import { FoodCard } from '../../components/common/FoodCard';
import { FoodDetailsModal } from '../../components/common/FoodDetailsModal';
import { FoodDonationMap } from '../../components/map/FoodDonationMap';
import { Search, Filter, MapPin, SlidersHorizontal, Layers, Check } from 'lucide-react';

export const BrowsePage: React.FC = () => {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDietary, setSelectedDietary] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showMap, setShowMap] = useState<boolean>(true);

  // User location reference: Banjara Hills, Hyderabad
  const userLat = 17.4156;
  const userLng = 78.4350;

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getListings({
        q: searchQuery,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        dietaryType: selectedDietary !== 'ALL' ? selectedDietary : undefined,
        sortBy,
        userLat,
        userLng,
      });
      setListings(data);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [selectedCategory, selectedDietary, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadListings();
  };

  const categories: { label: string; value: string }[] = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Cooked Meals', value: 'COOKED_MEALS' },
    { label: 'Bakery', value: 'BAKERY' },
    { label: 'Vegetables', value: 'VEGETABLES' },
    { label: 'Fruits', value: 'FRUITS' },
    { label: 'Dairy', value: 'DAIRY' },
    { label: 'Packaged Food', value: 'PACKAGED' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Browse Surplus Food Donations
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Discover fresh edible food available for collection by accredited charitable organizations across Hyderabad.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              showMap
                ? 'bg-emerald-800 text-white border-emerald-900'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{showMap ? 'Hide Map View' : 'Show Map View'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Map View */}
      {showMap && (
        <div className="space-y-2">
          <div className="text-xs text-stone-500 flex items-center justify-between">
            <span>📍 Showing donor kitchens and available batch locations in Hyderabad</span>
            <span className="font-mono text-stone-400">Reference: Banjara Hills</span>
          </div>
          <FoodDonationMap
            listings={listings}
            className="h-80 w-full"
            selectedListingId={selectedListing?.id}
            onSelectListing={(l) => setSelectedListing(l)}
          />
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by food name, ingredients, or description (e.g., Biryani, Sourdough, Apples)..."
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
          >
            Search
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
          {/* Category Tabs (Segmented Control - Allowed per constitution §1.A) */}
          <div className="flex flex-wrap items-center gap-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dietary & Sort dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDietary}
              onChange={(e) => setSelectedDietary(e.target.value)}
              className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-md font-medium text-stone-700"
            >
              <option value="ALL">All Dietary Types</option>
              <option value="VEGETARIAN">🌱 Vegetarian</option>
              <option value="NON_VEGETARIAN">🍖 Non-Vegetarian</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-md font-medium text-stone-700 font-mono text-[11px]"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="nearest">Sort: Nearest Distance</option>
              <option value="quantity">Sort: Highest Quantity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-stone-700">
            {listings.length} {listings.length === 1 ? 'Food Listing' : 'Food Listings'} Found
          </span>
          <span className="text-xs text-stone-400 font-mono">
            Updated in real-time from registered donors
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-80 bg-stone-200/70 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-stone-200 space-y-3">
            <span className="text-4xl">🔍</span>
            <h3 className="text-base font-bold text-stone-900">No Food Listings Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No surplus food matches your current search criteria. Try selecting "All Categories" or clearing the search keyword.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedDietary('ALL');
              }}
              className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <FoodCard
                key={listing.id}
                listing={listing}
                onViewDetails={(l) => setSelectedListing(l)}
                onRequest={(l) => setSelectedListing(l)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details & Request Modal */}
      {selectedListing && (
        <FoodDetailsModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onRequestSubmitted={() => {
            loadListings();
          }}
        />
      )}
    </div>
  );
};
