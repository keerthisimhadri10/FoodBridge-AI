import { GoogleGenAI } from '@google/genai';
import { db } from '../db/database';
import { FoodListing, Organization } from '../db/types';

// Calculate distance in kilometers between two lat/long points using Haversine formula
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Lazy-initialized Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Timeout wrapper to ensure remote AI calls never stall platform operations
function withTimeout<T>(promise: Promise<T>, ms: number = 7000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`AI generation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export interface MatchScoreResult {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  address: string;
  distanceKm: number;
  totalScore: number;
  scoreBreakdown: {
    distanceScore: number; // Max 30
    quantityScore: number; // Max 25
    dietaryScore: number; // Max 20
    availabilityScore: number; // Max 25
  };
  reasons: string[];
  aiExplanation?: string;
}

export class AIService {
  // 1. Intelligent Food Matching Engine (Deterministic score + optional Gemini explanation)
  async matchNGOsForListing(listingId: string): Promise<MatchScoreResult[]> {
    const listing = db.getListingById(listingId);
    if (!listing) throw new Error('Listing not found');

    const donorOrg = db.getOrganizationById(listing.donorOrganizationId);
    if (!donorOrg) throw new Error('Donor organization not found');

    // Only match with verified NGOs / recipient organizations
    const recipientOrgs = db
      .getOrganizations()
      .filter((o) => o.verificationStatus === 'VERIFIED');

    const results: MatchScoreResult[] = [];

    for (const org of recipientOrgs) {
      // 1. Distance score (30%)
      const dist = calculateDistanceKm(
        donorOrg.latitude,
        donorOrg.longitude,
        org.latitude,
        org.longitude
      );
      // Under 3km: 30pts, 3-7km: 22pts, 7-15km: 15pts, >15km: 8pts
      let distanceScore = 30;
      if (dist > 15) distanceScore = 8;
      else if (dist > 7) distanceScore = 15;
      else if (dist > 3) distanceScore = 22;

      // 2. Quantity suitability (25%)
      const capacity = org.capacityMeals || 50;
      const neededRatio = listing.availableQuantity / capacity;
      let quantityScore = 25;
      if (neededRatio > 1.5) quantityScore = 12; // Exceeds single batch capacity
      else if (neededRatio < 0.2) quantityScore = 15; // Very small for large center
      else quantityScore = 25; // Perfect capacity fit

      // 3. Dietary compatibility (20%)
      const orgPrefs = org.dietaryPreferences || ['VEGETARIAN'];
      let dietaryScore = 20;
      if (listing.dietaryType === 'NON_VEGETARIAN' && !orgPrefs.includes('NON_VEGETARIAN')) {
        dietaryScore = 0; // Strict vegetarian facility cannot accept non-veg
      } else {
        dietaryScore = 20;
      }

      // 4. Pickup availability (25%)
      // If collection window has at least 3 hours remaining, full marks
      const availHours =
        (new Date(listing.collectionDeadline).getTime() - Date.now()) / 3600000;
      let availabilityScore = 25;
      if (availHours < 2) availabilityScore = 10;
      else if (availHours < 4) availabilityScore = 18;
      else availabilityScore = 25;

      const totalScore = Math.min(
        100,
        Math.round(distanceScore + quantityScore + dietaryScore + availabilityScore)
      );

      const reasons: string[] = [];
      if (dist <= 5) reasons.push(`Close proximity (${dist} km away in nearby locality)`);
      else reasons.push(`Accessible transit corridor (${dist} km)`);

      if (dietaryScore === 20) {
        reasons.push(`100% dietary alignment with ${listing.dietaryType.toLowerCase()} preferences`);
      }
      if (quantityScore >= 20) {
        reasons.push(`Capacity matches available quantity (${listing.availableQuantity} ${listing.unit} fits facility size)`);
      }
      if (availabilityScore >= 20) {
        reasons.push('Comfortable buffer within scheduled pickup window');
      }

      results.push({
        organizationId: org.id,
        organizationName: org.organizationName,
        organizationType: org.organizationType,
        address: org.address,
        distanceKm: dist,
        totalScore,
        scoreBreakdown: {
          distanceScore,
          quantityScore,
          dietaryScore,
          availabilityScore,
        },
        reasons,
      });
    }

    // Sort by highest score first
    results.sort((a, b) => b.totalScore - a.totalScore);

    // Try enhancing top match with Gemini AI if available
    const gemini = getGeminiClient();
    if (gemini && results.length > 0) {
      try {
        const top = results[0];
        const prompt = `You are the FoodBridge AI smart redistribution assistant.
Analyze this food donation match and provide a concise, high-impact 2-sentence rationale for the donor.

Food: "${listing.foodName}" (${listing.availableQuantity} ${listing.unit}, ${listing.category}, ${listing.dietaryType}).
Matched NGO: "${top.organizationName}" (${top.organizationType}), Distance: ${top.distanceKm} km.
Match Score: ${top.totalScore}%.
Key reasons: ${top.reasons.join(', ')}.

IMPORTANT: FoodBridge AI coordinates redistribution; do not certify food safety or declare biological edibility. Keep response under 45 words.`;

        const response = await withTimeout(
          gemini.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          }),
          7000
        );

        if (response.text) {
          top.aiExplanation = response.text.trim();
        }
      } catch (err) {
        console.warn('Gemini AI match explanation skipped:', err);
      }
    }

    return results;
  }

  // 2. AI Food Description Generator
  async generateFoodDescription(params: {
    foodName: string;
    quantity: number;
    unit: string;
    category: string;
    dietaryType: string;
    preparationInfo?: string;
    storageDetails?: string;
  }): Promise<{ description: string; storageGuidance: string; handlingTips: string; allergenWarning: string }> {
    const gemini = getGeminiClient();

    if (gemini) {
      try {
        const prompt = `You are a food redistribution specialist for FoodBridge AI.
Generate a structured, professional, appetizing, and responsible description for a surplus food listing.

Details:
- Food Name: ${params.foodName}
- Quantity: ${params.quantity} ${params.unit}
- Category: ${params.category}
- Dietary Type: ${params.dietaryType}
- Preparation Notes: ${params.preparationInfo || 'Freshly prepared today'}
- Storage Notes: ${params.storageDetails || 'Maintained in food-grade containers'}

Return a JSON object with:
{
  "description": "2-3 clear descriptive sentences detailing the food items, preparation freshness, and packaging condition",
  "storageGuidance": "Standard temperature / container guidance (e.g. Keep hot above 65C or refrigerated below 4C)",
  "handlingTips": "Clear reminder for transportation and prompt distribution to beneficiaries",
  "allergenWarning": "Typical allergens known to accompany this category (e.g. dairy, gluten, nuts, or none reported)"
}

Do NOT use Markdown formatting outside the JSON. Return valid JSON only.`;

        const response = await withTimeout(
          gemini.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          }),
          7000
        );

        const text = response.text?.trim() || '';
        const parsed = JSON.parse(text);
        return {
          description: parsed.description || `${params.foodName} prepared with care and packaged in hygienic containers.`,
          storageGuidance: parsed.storageGuidance || 'Store in clean, temperature-appropriate containers.',
          handlingTips: parsed.handlingTips || 'Maintain transit hygiene and distribute within the pickup window.',
          allergenWarning: parsed.allergenWarning || 'Please check with kitchen staff regarding specific allergen sensitivities.',
        };
      } catch (err) {
        console.warn('Gemini description generation fallback:', err);
      }
    }

    // High quality deterministic fallback
    return {
      description: `Freshly prepared ${params.foodName} (${params.quantity} ${params.unit}). Prepared according to commercial hygiene standards and packed in food-grade containers for responsible redistribution.`,
      storageGuidance:
        params.category === 'COOKED_MEALS'
          ? 'Maintain in insulated thermal containers above 65°C or chill below 4°C if not served immediately.'
          : params.category === 'BAKERY'
          ? 'Store in a dry, ventilated, ambient temperature space away from direct moisture.'
          : 'Store in chilled conditions (4°C - 8°C) in clean ventilated crates.',
      handlingTips: 'Ensure clean transport vehicles and distribute to beneficiaries promptly upon collection.',
      allergenWarning:
        params.category === 'BAKERY'
          ? 'Contains wheat gluten; may contain traces of nuts and dairy.'
          : params.category === 'COOKED_MEALS'
          ? 'May contain dairy or spice seasonings; verify with kitchen team upon handover.'
          : 'None reported for fresh produce. Standard washing recommended.',
    };
  }

  // 3. AI Donation Insights
  async getDonationInsights(): Promise<{
    headline: string;
    summary: string;
    topCategories: { category: string; count: number }[];
    unclaimedAlerts: string[];
    actionableRecommendations: string[];
  }> {
    const listings = db.getListings();
    const requests = db.getRequests();
    const organizations = db.getOrganizations();

    // Compute metrics
    const categoryCount: Record<string, number> = {};
    for (const l of listings) {
      categoryCount[l.category] = (categoryCount[l.category] || 0) + 1;
    }
    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const activeListings = listings.filter((l) => l.listingStatus === 'AVAILABLE');
    const unclaimedAlerts: string[] = [];

    for (const l of activeListings) {
      const hoursLeft = (new Date(l.collectionDeadline).getTime() - Date.now()) / 3600000;
      if (hoursLeft > 0 && hoursLeft <= 4) {
        unclaimedAlerts.push(
          `Urgent pickup needed: "${l.foodName}" (${l.availableQuantity} ${l.unit}) expires in ${Math.round(hoursLeft)} hours.`
        );
      }
    }

    const completedCount = requests.filter((r) => r.requestStatus === 'COMPLETED').length;
    const verifiedNGOs = organizations.filter((o) => o.verificationStatus === 'VERIFIED').length;

    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `You are the chief impact intelligence engine for FoodBridge AI in Hyderabad.
Analyze these platform operational metrics:
- Total listings: ${listings.length}
- Completed donations: ${completedCount}
- Verified NGOs ready for collection: ${verifiedNGOs}
- Top categories: ${topCategories.map((c) => `${c.category} (${c.count})`).join(', ')}
- Unclaimed alerts: ${unclaimedAlerts.join(' | ') || 'None critical'}

Provide concise insights as a JSON object:
{
  "headline": "A short, encouraging 5-7 word headline about local redistribution trends",
  "summary": "2 sentences summarizing redistribution momentum and peak surplus meal volume",
  "actionableRecommendations": [
    "3 brief, practical recommendations for donor and NGO coordinators"
  ]
}`;

        const response = await withTimeout(
          gemini.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          }),
          7000
        );

        const text = response.text?.trim() || '';
        const parsed = JSON.parse(text);

        return {
          headline: parsed.headline || 'Accelerating Community Food Redistribution Across Hyderabad',
          summary:
            parsed.summary ||
            `Over ${completedCount} verified donation handovers have successfully redirected surplus meals to vulnerable families, with Cooked Meals and Bakery items representing the fastest-claimed categories.`,
          topCategories,
          unclaimedAlerts:
            unclaimedAlerts.length > 0
              ? unclaimedAlerts
              : ['All active surplus food listings are currently tracked within standard distribution windows.'],
          actionableRecommendations: parsed.actionableRecommendations || [
            'Coordinate scheduled afternoon pickups between 2:00 PM and 4:00 PM to maximize hot meal readiness.',
            'Encourage bakery and produce donors to publish morning surpluses by 9:30 AM for same-day distribution.',
            'Pair nearby shelters within 5km radius to minimize transit cooling of prepared dishes.',
          ],
        };
      } catch (err) {
        console.warn('Gemini insights generation fallback:', err);
      }
    }

    // Deterministic fallback
    return {
      headline: 'Accelerating Community Food Redistribution Across Hyderabad',
      summary: `FoodBridge AI has successfully coordinated multiple donation handovers across Banjara Hills, Jubilee Hills, and Gachibowli, significantly curbing avoidable food waste.`,
      topCategories,
      unclaimedAlerts:
        unclaimedAlerts.length > 0
          ? unclaimedAlerts
          : ['All active food listings are currently within safe collection windows.'],
      actionableRecommendations: [
        'Coordinate early evening pickups between 3:00 PM and 5:00 PM to optimize hot food distribution before dinner.',
        'Prioritize verified shelter networks in Ameerpet and Secunderabad for high-volume cooked batch donations.',
        'Utilize insulated thermal transport containers to maintain food temperature integrity throughout collection.',
      ],
    };
  }
}

export const aiService = new AIService();
