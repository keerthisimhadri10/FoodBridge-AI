import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FoodCategory, DietaryType, MeasurementUnit } from '../../types';
import {
  Sparkles,
  Upload,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Cooked Meals (Biryani / Curry Boxes)', url: '/src/assets/images/food_cooked_meals_1793427944757.jpg' },
  { label: 'Bakery & Pastries (Sourdough & Breads)', url: '/src/assets/images/food_bakery_pastries_1793427945942.jpg' },
  { label: 'Fresh Market Produce (Veggies & Fruits)', url: '/src/assets/images/food_fresh_produce_1793427945109.jpg' },
];

export const CreateListingPage: React.FC = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  // Form Fields
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [category, setCategory] = useState<FoodCategory>('COOKED_MEALS');
  const [dietaryType, setDietaryType] = useState<DietaryType>('VEGETARIAN');
  const [totalQuantity, setTotalQuantity] = useState<number>(30);
  const [unit, setUnit] = useState<MeasurementUnit>('MEAL_BOXES');

  // Timestamps
  const now = new Date();
  const defaultPrep = new Date(now.getTime() - 2 * 3600000).toISOString().slice(0, 16);
  const defaultStart = new Date(now.getTime() + 1 * 3600000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 6 * 3600000).toISOString().slice(0, 16);
  const defaultDeadline = new Date(now.getTime() + 6 * 3600000).toISOString().slice(0, 16);

  const [preparationTime, setPreparationTime] = useState(defaultPrep);
  const [pickupStart, setPickupStart] = useState(defaultStart);
  const [pickupEnd, setPickupEnd] = useState(defaultEnd);
  const [collectionDeadline, setCollectionDeadline] = useState(defaultDeadline);

  // Protocols
  const [storageMethod, setStorageMethod] = useState('Held hot in commercial insulated thermal food containers above 65°C.');
  const [handlingInstructions, setHandlingInstructions] = useState('Maintain in insulated thermal carriers during transport. Distribute to beneficiaries within 4 hours.');
  const [allergenInformation, setAllergenInformation] = useState('Prepared in kitchen processing dairy and nuts. No direct peanut content.');
  const [pickupLocation, setPickupLocation] = useState(organization?.address || 'Kitchen Dispatch Bay, Ground Floor');

  // Compliance
  const [donorDeclarationConfirmed, setDonorDeclarationConfirmed] = useState(false);

  // AI & Upload state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // AI Description Generator (§12.B)
  const handleGenerateAIDescription = async () => {
    if (!foodName) {
      setErrorMsg('Please enter a Food Name before asking AI to generate details.');
      return;
    }
    setErrorMsg(null);
    setIsGeneratingAI(true);
    try {
      const res = await api.generateDescription({
        foodName,
        quantity: totalQuantity,
        unit,
        category,
        dietaryType,
        preparationInfo: `Prepared around ${preparationTime}`,
        storageDetails: storageMethod,
      });

      setDescription(res.description);
      if (res.storageGuidance) setStorageMethod(res.storageGuidance);
      if (res.handlingTips) setHandlingInstructions(res.handlingTips);
      if (res.allergenWarning) setAllergenInformation(res.allergenWarning);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI description generation failed.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await api.uploadImage(file);
      setImageUrl(res.url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload image. You can also pick from the gallery presets below.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!donorDeclarationConfirmed) {
      setErrorMsg('You must certify the food handling and hygiene declaration before publishing.');
      return;
    }

    if (new Date(pickupEnd).getTime() <= new Date(pickupStart).getTime()) {
      setErrorMsg('Pickup End time must be after Pickup Start time.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createListing({
        foodName,
        description,
        imageUrl,
        category,
        dietaryType,
        totalQuantity: Number(totalQuantity),
        unit,
        preparationTime: new Date(preparationTime).toISOString(),
        storageMethod,
        handlingInstructions,
        allergenInformation,
        pickupLocation,
        pickupStart: new Date(pickupStart).toISOString(),
        pickupEnd: new Date(pickupEnd).toISOString(),
        collectionDeadline: new Date(collectionDeadline).toISOString(),
        donorDeclarationConfirmed: true,
      });

      navigate('/donor/listings');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish food listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/donor/dashboard')}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-xs text-stone-500 font-mono">
          Organization: {organization?.organizationName || 'Donor'}
        </span>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/90 shadow-xs space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Create Surplus Food Listing</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Provide transparent kitchen information to help accredited NGOs safely collect and distribute meals.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: Food Essentials */}
          <div className="space-y-4">
            <div className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2">
              1. Food Identification & Dietary Classification
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">Food Item Name *</label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g., Vegetable Dum Biryani & Mirchi Salan"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Dietary Classification *</label>
                <select
                  value={dietaryType}
                  onChange={(e) => setDietaryType(e.target.value as DietaryType)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="VEGETARIAN">🌱 Vegetarian</option>
                  <option value="NON_VEGETARIAN">🍖 Non-Vegetarian</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="COOKED_MEALS">Cooked Meals</option>
                  <option value="BAKERY">Bakery Products</option>
                  <option value="VEGETABLES">Vegetables</option>
                  <option value="FRUITS">Fruits</option>
                  <option value="DAIRY">Dairy Products</option>
                  <option value="PACKAGED">Packaged Food</option>
                  <option value="RAW_INGREDIENTS">Raw Ingredients</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Available Quantity *</label>
                <input
                  type="number"
                  min={1}
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(Math.max(1, Number(e.target.value)))}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Measurement Unit *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="MEAL_BOXES">Meal Boxes</option>
                  <option value="PLATES">Plates</option>
                  <option value="KILOGRAMS">Kilograms (kg)</option>
                  <option value="LITRES">Litres (L)</option>
                  <option value="PACKETS">Packets</option>
                  <option value="PIECES">Pieces</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: AI Description & Protocols */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="font-bold text-stone-900 text-sm">2. Description & Handling Specifications</span>
              <button
                type="button"
                onClick={handleGenerateAIDescription}
                disabled={isGeneratingAI || !foodName}
                className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isGeneratingAI ? 'Generating AI Draft...' : 'Generate with Gemini AI'}</span>
              </button>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Detailed Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the dish freshness, packaging type, and serving suitability..."
                rows={3}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Storage Method *</label>
                <input
                  type="text"
                  value={storageMethod}
                  onChange={(e) => setStorageMethod(e.target.value)}
                  placeholder="e.g. Hot holding > 65°C / Chilled 4°C"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Handling & Transport *</label>
                <input
                  type="text"
                  value={handlingInstructions}
                  onChange={(e) => setHandlingInstructions(e.target.value)}
                  placeholder="e.g. Clean covered containers required"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Allergen Information *</label>
                <input
                  type="text"
                  value={allergenInformation}
                  onChange={(e) => setAllergenInformation(e.target.value)}
                  placeholder="e.g. Contains dairy and gluten"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Scheduling & Pickup Location */}
          <div className="space-y-4">
            <div className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2">
              3. Scheduling, Timestamps & Pickup Location
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Preparation Time *</label>
                <input
                  type="datetime-local"
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Pickup Window Start *</label>
                <input
                  type="datetime-local"
                  value={pickupStart}
                  onChange={(e) => setPickupStart(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Pickup Window End *</label>
                <input
                  type="datetime-local"
                  value={pickupEnd}
                  onChange={(e) => setPickupEnd(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Collection Deadline *</label>
                <input
                  type="datetime-local"
                  value={collectionDeadline}
                  onChange={(e) => setCollectionDeadline(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700 font-semibold text-rose-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Exact Pickup Location & Dispatch Bay *</label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g. Kitchen Loading Bay 2, Road No. 12, Banjara Hills, Hyderabad"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Section 4: Visual Photo Selection or Upload */}
          <div className="space-y-4">
            <div className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2">
              4. Food Photo Asset
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="text-xs text-stone-600">
                    Upload an authentic kitchen photo or pick from culinary photography presets:
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Upload Image (JPG/PNG)'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                      imageUrl === preset.url
                        ? 'border-emerald-700 bg-emerald-50/70 font-semibold text-emerald-950'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-8 h-8 rounded object-cover" />
                    <span className="text-[11px] line-clamp-1">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Food Safety Compliance Declaration (§23) */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="declaration"
                checked={donorDeclarationConfirmed}
                onChange={(e) => setDonorDeclarationConfirmed(e.target.checked)}
                className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-700 mt-0.5"
                required
              />
              <label htmlFor="declaration" className="text-xs text-emerald-950 leading-relaxed">
                <strong>Mandatory Food Handling & Safety Declaration:</strong> I certify on behalf of{' '}
                <strong>{organization?.organizationName || 'our donor organization'}</strong> that this surplus food was
                prepared in a sanitized, commercial food establishment, maintained under hygienic temperature controls,
                and is safe for redistribution at the time of publication. I understand FoodBridge AI operates as a
                coordination platform and does not certify biological food safety.
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => navigate('/donor/dashboard')}
              className="px-4 py-2 font-semibold text-stone-600 hover:text-stone-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 text-xs sm:text-sm"
            >
              {isSubmitting ? 'Publishing Food Listing...' : 'Publish Surplus Food Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
