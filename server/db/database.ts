import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  DatabaseSchema,
  User,
  Organization,
  VolunteerProfile,
  FoodListing,
  DonationRequest,
  DeliveryTask,
  DeliveryTaskStatus,
  PickupDetails,
  DonationStatusHistory,
  Feedback,
  Notification,
  Report,
  AdminAuditLog,
  UserRole,
  VerificationStatus,
  RequestStatus,
  PickupStatus,
  ListingStatus,
} from './types';

const DATA_FILE = path.resolve(process.cwd(), 'data', 'foodbridge.json');

// Simple async mutex for concurrency protection
class Mutex {
  private mutex = Promise.resolve();

  lock(): Promise<() => void> {
    let begin: () => void = () => {};
    this.mutex = this.mutex.then(() => new Promise((res) => {
      begin = res;
    }));
    return new Promise((res) => {
      res(begin);
    });
  }
}

const dbMutex = new Mutex();

class Database {
  private data: DatabaseSchema = {
    users: [],
    organizations: [],
    volunteerProfiles: [],
    foodListings: [],
    donationRequests: [],
    deliveryTasks: [],
    pickupDetails: [],
    feedbacks: [],
    donationStatusHistory: [],
    notifications: [],
    reports: [],
    adminAuditLogs: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.ensureVolunteerAndDeliverySeed();
        this.checkExpiredListings();
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error loading database file, seeding fresh database:', err);
      this.seedInitialData();
      this.save();
    }
  }

  private ensureVolunteerAndDeliverySeed() {
    let updated = false;
    const now = new Date();
    const isoNow = now.toISOString();

    if (!this.data.volunteerProfiles) {
      this.data.volunteerProfiles = [];
      updated = true;
    }
    if (!this.data.deliveryTasks) {
      this.data.deliveryTasks = [];
      updated = true;
    }
    if (!this.data.feedbacks) {
      this.data.feedbacks = [];
      updated = true;
    }

    // Check volunteer user
    if (!this.data.users.find((u) => u.id === 'usr_volunteer')) {
      this.data.users.push({
        id: 'usr_volunteer',
        name: 'Rohan Sharma (Green Courier Volunteer)',
        email: 'volunteer@foodbridge.org',
        passwordHash: bcrypt.hashSync('volunteer123', 10),
        role: 'VOLUNTEER',
        accountStatus: 'ACTIVE',
        createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
        updatedAt: isoNow,
      });
      updated = true;
    }

    // Check volunteer profile
    if (!this.data.volunteerProfiles.find((v) => v.userId === 'usr_volunteer')) {
      this.data.volunteerProfiles.push({
        id: 'vol_rohan',
        userId: 'usr_volunteer',
        fullName: 'Rohan Sharma',
        phone: '+91 98490 12345',
        vehicleType: 'ELECTRIC_VAN',
        vehicleNumber: 'TS 09 EZ 4412',
        isAvailable: true,
        currentLatitude: 17.4200,
        currentLongitude: 78.4300,
        totalDeliveriesCompleted: 14,
        averageRating: 4.9,
        createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
        updatedAt: isoNow,
      });
      updated = true;
    }

    // Check initial active task
    if (this.data.deliveryTasks.length === 0) {
      this.data.deliveryTasks.push(
        {
          id: 'task_active_01',
          requestId: 'req_active_accepted',
          listingId: 'lst_biryani_01',
          donorOrgId: 'org_paradise',
          recipientOrgId: 'org_helpinghands',
          pickupAddress: 'Kitchen Dispatch Bay 2, Paradise Grand, Road No. 12, Banjara Hills',
          deliveryAddress: 'Helping Hands Community Center, Ameerpet, Hyderabad 500016',
          pickupCoordinates: { latitude: 17.4156, longitude: 78.4350 },
          deliveryCoordinates: { latitude: 17.4375, longitude: 78.4482 },
          status: 'AVAILABLE',
          estimatedDistanceKm: 3.4,
          pickupWindow: 'Today 3:30 PM - 5:30 PM',
          notes: 'Vegetable biryani meal boxes. Handle in upright thermal crates.',
          createdAt: new Date(now.getTime() - 35 * 60000).toISOString(),
          updatedAt: new Date(now.getTime() - 35 * 60000).toISOString(),
        },
        {
          id: 'task_hist_01',
          requestId: 'req_hist_completed_1',
          listingId: 'lst_completed_08',
          donorOrgId: 'org_paradise',
          recipientOrgId: 'org_helpinghands',
          volunteerId: 'vol_rohan',
          volunteerName: 'Rohan Sharma',
          pickupAddress: 'Kitchen Dispatch Bay 2, Paradise Grand, Banjara Hills',
          deliveryAddress: 'Helping Hands Community Center, Ameerpet, Hyderabad',
          pickupCoordinates: { latitude: 17.4156, longitude: 78.4350 },
          deliveryCoordinates: { latitude: 17.4375, longitude: 78.4482 },
          status: 'DELIVERED',
          estimatedDistanceKm: 3.4,
          pickupWindow: 'Yesterday 3:00 PM - 5:00 PM',
          pickupConfirmedAt: new Date(now.getTime() - 23 * 3600000).toISOString(),
          deliveredConfirmedAt: new Date(now.getTime() - 22 * 3600000).toISOString(),
          notes: 'Smooth delivery completed using electric van.',
          createdAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
          updatedAt: new Date(now.getTime() - 22 * 3600000).toISOString(),
        }
      );
      updated = true;
    }

    if (this.data.feedbacks.length === 0) {
      this.data.feedbacks.push(
        {
          id: 'fbk_01',
          requestId: 'req_hist_completed_1',
          listingId: 'lst_completed_08',
          reviewerUserId: 'usr_ngo_helpinghands',
          reviewerRole: 'RECIPIENT',
          targetOrgId: 'org_paradise',
          targetVolunteerId: 'vol_rohan',
          rating: 5,
          comment: 'Meals arrived steaming hot and cleanly boxed. 50 families were fed without any delays. Thank you Chef Rajesh & Rohan!',
          foodConditionRating: 5,
          punctualityRating: 5,
          createdAt: new Date(now.getTime() - 22 * 3600000).toISOString(),
        },
        {
          id: 'fbk_02',
          requestId: 'req_hist_completed_1',
          listingId: 'lst_completed_08',
          reviewerUserId: 'usr_donor_paradise',
          reviewerRole: 'DONOR',
          targetOrgId: 'org_helpinghands',
          rating: 5,
          comment: 'Helping Hands team and volunteer Rohan arrived right on schedule with verified pickup code. Perfect handover.',
          foodConditionRating: 5,
          punctualityRating: 5,
          createdAt: new Date(now.getTime() - 22 * 3600000).toISOString(),
        }
      );
      updated = true;
    }

    if (updated) {
      this.save();
    }
  }

  private save() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private checkExpiredListings() {
    const now = new Date().toISOString();
    let updated = false;
    for (const listing of this.data.foodListings) {
      if (
        (listing.listingStatus === 'AVAILABLE' || listing.listingStatus === 'PARTIALLY_RESERVED') &&
        new Date(listing.collectionDeadline).getTime() < new Date(now).getTime()
      ) {
        listing.listingStatus = 'EXPIRED';
        listing.updatedAt = now;
        updated = true;
      }
    }
    if (updated) {
      this.save();
    }
  }

  private seedInitialData() {
    const now = new Date();
    const isoNow = now.toISOString();
    
    // Hash passwords: password123 for all demo accounts
    const passwordHash = bcrypt.hashSync('foodbridge123', 10);
    const donorHash = bcrypt.hashSync('donor123', 10);
    const ngoHash = bcrypt.hashSync('ngo123', 10);
    const adminHash = bcrypt.hashSync('admin123', 10);

    // 1. Users
    const users: User[] = [
      {
        id: 'usr_admin',
        name: 'FoodBridge Operations Admin',
        email: 'admin@foodbridge.org',
        passwordHash: adminHash,
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        createdAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'usr_donor_paradise',
        name: 'Chef Rajesh Sharma (Paradise Grand)',
        email: 'donor@foodbridge.org',
        passwordHash: donorHash,
        role: 'DONOR',
        accountStatus: 'ACTIVE',
        createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'usr_donor_concu',
        name: 'Sahil & Neha (Concu Patisserie)',
        email: 'concu@foodbridge.org',
        passwordHash: donorHash,
        role: 'DONOR',
        accountStatus: 'ACTIVE',
        createdAt: new Date(now.getTime() - 45 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'usr_donor_natures',
        name: 'Vikram Mehta (Nature Fresh Supermarket)',
        email: 'naturefresh@foodbridge.org',
        passwordHash: donorHash,
        role: 'DONOR',
        accountStatus: 'ACTIVE',
        createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'usr_donor_royal',
        name: 'Arun Varma (Royal Banquets Catering)',
        email: 'royal@foodbridge.org',
        passwordHash: donorHash,
        role: 'DONOR',
        accountStatus: 'ACTIVE',
        createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'usr_donor_greenleaf',
        name: 'Priya Reddy (Green Leaf Organic)',
        email: 'greenleaf@foodbridge.org',
        passwordHash: donorHash,
        role: 'DONOR',
        accountStatus: 'ACTIVE',
        createdAt: new Date(now.getTime() - 25 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'usr_ngo_helpinghands',
        name: 'Ananya Rao (Helping Hands NGO)',
        email: 'ngo@foodbridge.org',
        passwordHash: ngoHash,
        role: 'RECIPIENT',
        accountStatus: 'ACTIVE',
        createdAt: new Date(now.getTime() - 50 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'usr_ngo_hope',
        name: 'Kiran Kumar (Hope Community Shelter)',
        email: 'hope@foodbridge.org',
        passwordHash: ngoHash,
        role: 'RECIPIENT',
        accountStatus: 'ACTIVE',
        createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'usr_ngo_sneha',
        name: 'Sister Mary (Sneha Orphanage Care)',
        email: 'sneha@foodbridge.org',
        passwordHash: ngoHash,
        role: 'RECIPIENT',
        accountStatus: 'ACTIVE',
        createdAt: new Date(now.getTime() - 55 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
    ];

    // 2. Organizations
    const organizations: Organization[] = [
      {
        id: 'org_paradise',
        userId: 'usr_donor_paradise',
        organizationName: 'Paradise Grand Restaurant',
        organizationType: 'RESTAURANT',
        description: 'Iconic authentic heritage restaurant specializing in Hyderabadi culinary feasts, wholesome biryanis, curries, and breads.',
        address: 'Road No. 12, Banjara Hills, Hyderabad, Telangana 500034',
        latitude: 17.4156,
        longitude: 78.4350,
        contactDetails: {
          phone: '+91 40 2341 5500',
          contactPerson: 'Chef Rajesh Sharma',
          website: 'https://paradise.example.com',
        },
        verificationStatus: 'VERIFIED',
        createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'org_concu',
        userId: 'usr_donor_concu',
        organizationName: 'Concu Artisanal Patisserie & Bakery',
        organizationType: 'BAKERY',
        description: 'European artisanal bakery crafting daily fresh sourdough loaves, wholewheat baguettes, and fine viennoiserie.',
        address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
        latitude: 17.4319,
        longitude: 78.4073,
        contactDetails: {
          phone: '+91 40 2355 8890',
          contactPerson: 'Neha Sahil',
          website: 'https://concu.example.com',
        },
        verificationStatus: 'VERIFIED',
        createdAt: new Date(now.getTime() - 45 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'org_natures',
        userId: 'usr_donor_natures',
        organizationName: 'Nature Fresh Supermarket',
        organizationType: 'SUPERMARKET',
        description: 'Premium grocery and fresh market providing farm-direct surplus produce, dairy products, and packaged staples.',
        address: 'Hitech City Main Rd, Madhapur, Hyderabad, Telangana 500081',
        latitude: 17.4483,
        longitude: 78.3915,
        contactDetails: {
          phone: '+91 40 4455 1200',
          contactPerson: 'Vikram Mehta',
        },
        verificationStatus: 'VERIFIED',
        createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'org_royal',
        userId: 'usr_donor_royal',
        organizationName: 'Royal Banquets & Caterers',
        organizationType: 'CATERER',
        description: 'Large-scale institutional and wedding event catering service redistributing untouched banquet culinary preparations.',
        address: 'ISB Road, Gachibowli, Hyderabad, Telangana 500032',
        latitude: 17.4401,
        longitude: 78.3489,
        contactDetails: {
          phone: '+91 40 6677 3400',
          contactPerson: 'Arun Varma',
        },
        verificationStatus: 'VERIFIED',
        createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'org_greenleaf',
        userId: 'usr_donor_greenleaf',
        organizationName: 'Green Leaf Organic Market',
        organizationType: 'SUPERMARKET',
        description: 'Community organic grocery redistributing wholesome farm-fresh veggies, pulses, and cold storage provisions.',
        address: 'Kothaguda X Roads, Kondapur, Hyderabad, Telangana 500084',
        latitude: 17.4699,
        longitude: 78.3578,
        contactDetails: {
          phone: '+91 40 2988 7766',
          contactPerson: 'Priya Reddy',
        },
        verificationStatus: 'VERIFIED',
        createdAt: new Date(now.getTime() - 25 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'org_helpinghands',
        userId: 'usr_ngo_helpinghands',
        organizationName: 'Helping Hands Welfare Foundation',
        organizationType: 'NGO',
        description: 'Registered charitable trust feeding underserved urban slum communities, daily wage laborers, and elder care homes.',
        address: 'Dharam Karan Rd, Ameerpet, Hyderabad, Telangana 500016',
        latitude: 17.4375,
        longitude: 78.4483,
        contactDetails: {
          phone: '+91 40 2373 9922',
          contactPerson: 'Ananya Rao',
          website: 'https://helpinghands.example.org',
        },
        verificationStatus: 'VERIFIED',
        capacityMeals: 150,
        dietaryPreferences: ['VEGETARIAN', 'NON_VEGETARIAN'],
        createdAt: new Date(now.getTime() - 50 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'org_hope',
        userId: 'usr_ngo_hope',
        organizationName: 'Hope Community Night Shelter & Kitchen',
        organizationType: 'SHELTER',
        description: 'Night shelter and evening community feeding program operating near Secunderabad railway terminal.',
        address: 'Station Road, Secunderabad, Hyderabad, Telangana 500003',
        latitude: 17.4399,
        longitude: 78.4983,
        contactDetails: {
          phone: '+91 40 2770 1144',
          contactPerson: 'Kiran Kumar',
        },
        verificationStatus: 'PENDING', // Pending NGO for demonstration of verification workflow
        capacityMeals: 80,
        dietaryPreferences: ['VEGETARIAN'],
        createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'org_sneha',
        userId: 'usr_ngo_sneha',
        organizationName: "Sneha Children's Home & Care",
        organizationType: 'ORPHANAGE',
        description: 'Non-profit residential care home providing daily nutrition, schooling, and shelter to 65 children.',
        address: 'Prakash Nagar, Begumpet, Hyderabad, Telangana 500016',
        latitude: 17.4447,
        longitude: 78.4664,
        contactDetails: {
          phone: '+91 40 2776 5522',
          contactPerson: 'Sister Mary',
        },
        verificationStatus: 'VERIFIED',
        capacityMeals: 75,
        dietaryPreferences: ['VEGETARIAN', 'NON_VEGETARIAN'],
        createdAt: new Date(now.getTime() - 55 * 86400000).toISOString(),
        updatedAt: isoNow,
      },
    ];

    // 3. Food Listings
    const tomorrow = new Date(now.getTime() + 24 * 3600000);
    const inTwoHours = new Date(now.getTime() + 2 * 3600000);
    const inSixHours = new Date(now.getTime() + 6 * 3600000);
    const inTenHours = new Date(now.getTime() + 10 * 3600000);
    const yesterday = new Date(now.getTime() - 24 * 3600000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 3600000);

    const foodListings: FoodListing[] = [
      {
        id: 'lst_biryani_01',
        donorOrganizationId: 'org_paradise',
        foodName: 'Fresh Vegetable Dum Biryani & Mirchi Salan',
        description: 'Freshly prepared layered vegetable basmati rice biryani with rich peanut-sesame curry sauce. Prepared in clean sanitized commercial kitchen using food-grade packaging.',
        imageUrl: '/src/assets/images/food_cooked_meals_1793427944757.jpg',
        category: 'COOKED_MEALS',
        dietaryType: 'VEGETARIAN',
        totalQuantity: 40,
        availableQuantity: 25,
        reservedQuantity: 15, // Currently reserved by a pending/accepted request
        collectedQuantity: 0,
        unit: 'MEAL_BOXES',
        preparationTime: new Date(now.getTime() - 3 * 3600000).toISOString(),
        storageMethod: 'Maintained hot in insulated thermal food containers above 65°C.',
        handlingInstructions: 'Transport in clean insulated carriers. Consume or refrigerate within 4 hours of collection.',
        allergenInformation: 'Contains peanuts and sesame in the side gravy.',
        pickupLocation: 'Kitchen Dispatch Bay 2, Paradise Grand, Road No. 12, Banjara Hills',
        pickupStart: inTwoHours.toISOString(),
        pickupEnd: inSixHours.toISOString(),
        collectionDeadline: inSixHours.toISOString(),
        listingStatus: 'PARTIALLY_RESERVED',
        donorDeclarationConfirmed: true,
        createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'lst_bakery_02',
        donorOrganizationId: 'org_concu',
        foodName: 'Artisanal Sourdough Loaves & Croissants',
        description: 'Morning bake batch of crusty country sourdough loaves, butter croissants, and braided brioche rolls. Freshly cooled and packaged in breathable bakery crates.',
        imageUrl: '/src/assets/images/food_bakery_pastries_1793427945942.jpg',
        category: 'BAKERY',
        dietaryType: 'VEGETARIAN',
        totalQuantity: 50,
        availableQuantity: 50,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'PIECES',
        preparationTime: new Date(now.getTime() - 5 * 3600000).toISOString(),
        storageMethod: 'Dry, ambient room temperature storage in wooden delivery crates.',
        handlingInstructions: 'Keep in dry covered conditions. Suitable for immediate consumption or freezing.',
        allergenInformation: 'Contains wheat gluten and dairy butter.',
        pickupLocation: 'Concu Bakery Rear Entrance, Road 36, Jubilee Hills',
        pickupStart: inTwoHours.toISOString(),
        pickupEnd: inTenHours.toISOString(),
        collectionDeadline: inTenHours.toISOString(),
        listingStatus: 'AVAILABLE',
        donorDeclarationConfirmed: true,
        createdAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'lst_produce_03',
        donorOrganizationId: 'org_natures',
        foodName: 'Farm Fresh Bell Peppers, Tomatoes & Greens',
        description: 'Wholesome surplus crate of grade-A bell peppers (red, yellow, green), farm vine tomatoes, spinach bunches, and fresh carrots. Crisp and freshly sorted.',
        imageUrl: '/src/assets/images/food_fresh_produce_1793427945109.jpg',
        category: 'VEGETABLES',
        dietaryType: 'VEGETARIAN',
        totalQuantity: 30,
        availableQuantity: 30,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'KILOGRAMS',
        preparationTime: new Date(now.getTime() - 6 * 3600000).toISOString(),
        storageMethod: 'Chilled produce cold room at 8°C.',
        handlingInstructions: 'Transport in ventilated crates. Store in cool place or prepare within 48 hours.',
        allergenInformation: 'None. Fresh raw vegetables.',
        pickupLocation: 'Nature Fresh Supermarket Loading Dock, Hitech City, Madhapur',
        pickupStart: inTwoHours.toISOString(),
        pickupEnd: tomorrow.toISOString(),
        collectionDeadline: tomorrow.toISOString(),
        listingStatus: 'AVAILABLE',
        donorDeclarationConfirmed: true,
        createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'lst_dal_rice_04',
        donorOrganizationId: 'org_paradise',
        foodName: 'Nutritious Dal Tadka & Steamed Jeera Rice',
        description: 'Fresh yellow lentil stew tempered with cumin, ghee, and tomatoes, paired with aromatic steamed jeera rice. Nutritious, easily digestible meal.',
        imageUrl: '/src/assets/images/food_cooked_meals_1793427944757.jpg',
        category: 'COOKED_MEALS',
        dietaryType: 'VEGETARIAN',
        totalQuantity: 35,
        availableQuantity: 35,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'MEAL_BOXES',
        preparationTime: new Date(now.getTime() - 2 * 3600000).toISOString(),
        storageMethod: 'Maintained at 70°C in food grade insulated thermal canisters.',
        handlingInstructions: 'Maintain temperature hygiene during transit. Best consumed hot.',
        allergenInformation: 'Contains clarified butter (ghee).',
        pickupLocation: 'Kitchen Dispatch Bay 1, Paradise Grand, Banjara Hills',
        pickupStart: inTwoHours.toISOString(),
        pickupEnd: inSixHours.toISOString(),
        collectionDeadline: inSixHours.toISOString(),
        listingStatus: 'AVAILABLE',
        donorDeclarationConfirmed: true,
        createdAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'lst_catering_paneer_05',
        donorOrganizationId: 'org_royal',
        foodName: 'Banquet Paneer Butter Masala & Tandoori Rotis',
        description: 'Surplus executive corporate banquet food. Creamy cottage cheese curry with freshly baked wholewheat tandoori flatbreads. Never served, held in kitchen hot holding.',
        imageUrl: '/src/assets/images/food_cooked_meals_1793427944757.jpg',
        category: 'COOKED_MEALS',
        dietaryType: 'VEGETARIAN',
        totalQuantity: 60,
        availableQuantity: 60,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'PLATES',
        preparationTime: new Date(now.getTime() - 3 * 3600000).toISOString(),
        storageMethod: 'Commercial hot holding cabinet at 68°C.',
        handlingInstructions: 'Packaged in individual eco food containers. Distribute promptly.',
        allergenInformation: 'Contains dairy (paneer, cream) and wheat gluten.',
        pickupLocation: 'Royal Banquets Goods Reception, ISB Road, Gachibowli',
        pickupStart: inTwoHours.toISOString(),
        pickupEnd: inEightHours(now).toISOString(),
        collectionDeadline: inEightHours(now).toISOString(),
        listingStatus: 'AVAILABLE',
        donorDeclarationConfirmed: true,
        createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'lst_dairy_06',
        donorOrganizationId: 'org_greenleaf',
        foodName: 'Fresh Packaged Paneer Blocks & Probiotic Yogurt',
        description: 'Surplus organic dairy inventory with 4 days shelf life remaining. Vacuum-sealed paneer blocks and sealed probiotic curd tubs.',
        imageUrl: '/src/assets/images/food_cooked_meals_1793427944757.jpg',
        category: 'DAIRY',
        dietaryType: 'VEGETARIAN',
        totalQuantity: 25,
        availableQuantity: 25,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'PACKETS',
        preparationTime: new Date(now.getTime() - 12 * 3600000).toISOString(),
        storageMethod: 'Refrigerated cold display at 4°C.',
        handlingInstructions: 'Maintain cold chain in transit. Keep refrigerated at below 4°C.',
        allergenInformation: 'Contains milk and dairy derivatives.',
        pickupLocation: 'Green Leaf Organic Store Front, Kondapur X Roads',
        pickupStart: inTwoHours.toISOString(),
        pickupEnd: tomorrow.toISOString(),
        collectionDeadline: tomorrow.toISOString(),
        listingStatus: 'AVAILABLE',
        donorDeclarationConfirmed: true,
        createdAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
        updatedAt: isoNow,
      },
      {
        id: 'lst_fruits_07',
        donorOrganizationId: 'org_natures',
        foodName: 'Sweet Papayas, Watermelons & Nagpur Oranges',
        description: 'Ripe whole seasonal fruits, naturally sweet and ready for immediate consumption. Ideal for community orphanages or elder care homes.',
        imageUrl: '/src/assets/images/food_fresh_produce_1793427945109.jpg',
        category: 'FRUITS',
        dietaryType: 'VEGETARIAN',
        totalQuantity: 35,
        availableQuantity: 35,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'KILOGRAMS',
        preparationTime: new Date(now.getTime() - 8 * 3600000).toISOString(),
        storageMethod: 'Well-ventilated fruit crates at 15°C.',
        handlingInstructions: 'Wash before peeling or cutting. Handle gently.',
        allergenInformation: 'None. Natural whole fresh fruit.',
        pickupLocation: 'Nature Fresh Supermarket Rear Dock, Madhapur',
        pickupStart: inTwoHours.toISOString(),
        pickupEnd: tomorrow.toISOString(),
        collectionDeadline: tomorrow.toISOString(),
        listingStatus: 'AVAILABLE',
        donorDeclarationConfirmed: true,
        createdAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
        updatedAt: isoNow,
      },
      // Completed historic listing for real platform metrics
      {
        id: 'lst_completed_08',
        donorOrganizationId: 'org_paradise',
        foodName: 'Heritage Chicken Biryani & Mirchi Ka Salan',
        description: 'High-protein cooked meal boxes from yesterday dinner service. Fully collected and distributed to community center.',
        imageUrl: '/src/assets/images/food_cooked_meals_1793427944757.jpg',
        category: 'COOKED_MEALS',
        dietaryType: 'NON_VEGETARIAN',
        totalQuantity: 50,
        availableQuantity: 0,
        reservedQuantity: 0,
        collectedQuantity: 50,
        unit: 'MEAL_BOXES',
        preparationTime: new Date(yesterday.getTime() - 4 * 3600000).toISOString(),
        storageMethod: 'Insulated hot containers.',
        handlingInstructions: 'Distributed immediately.',
        allergenInformation: 'Contains nuts and dairy.',
        pickupLocation: 'Kitchen Dispatch Bay 2, Paradise Grand, Banjara Hills',
        pickupStart: yesterday.toISOString(),
        pickupEnd: new Date(yesterday.getTime() + 4 * 3600000).toISOString(),
        collectionDeadline: new Date(yesterday.getTime() + 4 * 3600000).toISOString(),
        listingStatus: 'COMPLETED',
        donorDeclarationConfirmed: true,
        createdAt: twoDaysAgo.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      // Another completed historic listing
      {
        id: 'lst_completed_09',
        donorOrganizationId: 'org_concu',
        foodName: 'Wholewheat Bread Loaves & Cinnamon Swirls',
        description: 'Artisanal whole wheat sandwich loaves and morning cinnamon rolls.',
        imageUrl: '/src/assets/images/food_bakery_pastries_1793427945942.jpg',
        category: 'BAKERY',
        dietaryType: 'VEGETARIAN',
        totalQuantity: 60,
        availableQuantity: 0,
        reservedQuantity: 0,
        collectedQuantity: 60,
        unit: 'PIECES',
        preparationTime: new Date(twoDaysAgo.getTime() - 2 * 3600000).toISOString(),
        storageMethod: 'Bakery crates.',
        handlingInstructions: 'Stored dry.',
        allergenInformation: 'Wheat gluten.',
        pickupLocation: 'Concu Bakery Rear Entrance, Jubilee Hills',
        pickupStart: twoDaysAgo.toISOString(),
        pickupEnd: new Date(twoDaysAgo.getTime() + 6 * 3600000).toISOString(),
        collectionDeadline: new Date(twoDaysAgo.getTime() + 6 * 3600000).toISOString(),
        listingStatus: 'COMPLETED',
        donorDeclarationConfirmed: true,
        createdAt: new Date(twoDaysAgo.getTime() - 12 * 3600000).toISOString(),
        updatedAt: twoDaysAgo.toISOString(),
      },
      // Historic completed listing 3
      {
        id: 'lst_completed_10',
        donorOrganizationId: 'org_royal',
        foodName: 'South Indian Sambar, Rice & Veg Poriyal Feast',
        description: 'Nutritious South Indian traditional vegetarian banquet meal boxes.',
        imageUrl: '/src/assets/images/food_cooked_meals_1793427944757.jpg',
        category: 'COOKED_MEALS',
        dietaryType: 'VEGETARIAN',
        totalQuantity: 80,
        availableQuantity: 0,
        reservedQuantity: 0,
        collectedQuantity: 80,
        unit: 'MEAL_BOXES',
        preparationTime: new Date(now.getTime() - 3 * 86400000).toISOString(),
        storageMethod: 'Stainless steel thermal catering urns.',
        handlingInstructions: 'Transported hot and distributed.',
        allergenInformation: 'Mustard seeds.',
        pickupLocation: 'Royal Banquets, Gachibowli',
        pickupStart: new Date(now.getTime() - 3 * 86400000).toISOString(),
        pickupEnd: new Date(now.getTime() - 3 * 86400000 + 4 * 3600000).toISOString(),
        collectionDeadline: new Date(now.getTime() - 3 * 86400000 + 4 * 3600000).toISOString(),
        listingStatus: 'COMPLETED',
        donorDeclarationConfirmed: true,
        createdAt: new Date(now.getTime() - 3 * 86400000 - 6 * 3600000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
      },
    ];

    // 4. Donation Requests
    const donationRequests: DonationRequest[] = [
      {
        id: 'req_active_accepted',
        listingId: 'lst_biryani_01',
        recipientOrganizationId: 'org_helpinghands',
        requestedQuantity: 15,
        requestStatus: 'ACCEPTED',
        pickupWindow: `${inTwoHours.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${inSixHours.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        donorConfirmed: false,
        recipientConfirmed: false,
        notes: 'Our volunteer van is equipped with food warmers. We will collect at 3:30 PM.',
        createdAt: new Date(now.getTime() - 90 * 60000).toISOString(),
        updatedAt: new Date(now.getTime() - 40 * 60000).toISOString(),
      },
      {
        id: 'req_pending_01',
        listingId: 'lst_produce_03',
        recipientOrganizationId: 'org_sneha',
        requestedQuantity: 12,
        requestStatus: 'PENDING',
        pickupWindow: 'Today 4:00 PM - 6:00 PM',
        donorConfirmed: false,
        recipientConfirmed: false,
        notes: "For children's dinner salad and soup preparation.",
        createdAt: new Date(now.getTime() - 20 * 60000).toISOString(),
        updatedAt: new Date(now.getTime() - 20 * 60000).toISOString(),
      },
      {
        id: 'req_hist_completed_1',
        listingId: 'lst_completed_08',
        recipientOrganizationId: 'org_helpinghands',
        requestedQuantity: 50,
        requestStatus: 'COMPLETED',
        pickupWindow: 'Yesterday 3:00 PM - 5:00 PM',
        donorConfirmed: true,
        recipientConfirmed: true,
        notes: 'Distributed to 50 families in Ameerpet urban community.',
        createdAt: twoDaysAgo.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 'req_hist_completed_2',
        listingId: 'lst_completed_09',
        recipientOrganizationId: 'org_sneha',
        requestedQuantity: 60,
        requestStatus: 'COMPLETED',
        pickupWindow: '2 Days Ago 9:00 AM - 11:00 AM',
        donorConfirmed: true,
        recipientConfirmed: true,
        notes: 'Provided breakfast and tea snacks for children at home.',
        createdAt: new Date(twoDaysAgo.getTime() - 10 * 3600000).toISOString(),
        updatedAt: twoDaysAgo.toISOString(),
      },
      {
        id: 'req_hist_completed_3',
        listingId: 'lst_completed_10',
        recipientOrganizationId: 'org_helpinghands',
        requestedQuantity: 80,
        requestStatus: 'COMPLETED',
        pickupWindow: '3 Days Ago 1:00 PM - 3:00 PM',
        donorConfirmed: true,
        recipientConfirmed: true,
        notes: 'Community lunch serving at labor camp.',
        createdAt: new Date(now.getTime() - 3 * 86400000 - 5 * 3600000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
      },
    ];

    // 5. Pickup Details
    const pickupDetails: PickupDetails[] = [
      {
        id: 'pkup_01',
        requestId: 'req_active_accepted',
        pickupReference: 'FB-HYD-7821',
        scheduledAt: inTwoHours.toISOString(),
        pickupStatus: 'SCHEDULED',
        notes: 'Pickup at Kitchen Dispatch Bay 2. Show reference code FB-HYD-7821 on arrival.',
      },
      {
        id: 'pkup_hist_1',
        requestId: 'req_hist_completed_1',
        pickupReference: 'FB-HYD-6490',
        scheduledAt: yesterday.toISOString(),
        pickupStatus: 'COMPLETED',
        donorConfirmedAt: new Date(yesterday.getTime() + 60 * 60000).toISOString(),
        recipientConfirmedAt: new Date(yesterday.getTime() + 75 * 60000).toISOString(),
        completedAt: new Date(yesterday.getTime() + 75 * 60000).toISOString(),
        notes: 'Smooth collection by driver Ramesh.',
      },
      {
        id: 'pkup_hist_2',
        requestId: 'req_hist_completed_2',
        pickupReference: 'FB-HYD-5128',
        scheduledAt: twoDaysAgo.toISOString(),
        pickupStatus: 'COMPLETED',
        donorConfirmedAt: new Date(twoDaysAgo.getTime() + 50 * 60000).toISOString(),
        recipientConfirmedAt: new Date(twoDaysAgo.getTime() + 65 * 60000).toISOString(),
        completedAt: new Date(twoDaysAgo.getTime() + 65 * 60000).toISOString(),
      },
      {
        id: 'pkup_hist_3',
        requestId: 'req_hist_completed_3',
        pickupReference: 'FB-HYD-4011',
        scheduledAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
        pickupStatus: 'COMPLETED',
        donorConfirmedAt: new Date(now.getTime() - 3 * 86400000 + 40 * 60000).toISOString(),
        recipientConfirmedAt: new Date(now.getTime() - 3 * 86400000 + 45 * 60000).toISOString(),
        completedAt: new Date(now.getTime() - 3 * 86400000 + 45 * 60000).toISOString(),
      },
    ];

    // 6. Donation Status History
    const donationStatusHistory: DonationStatusHistory[] = [
      {
        id: 'hist_01',
        requestId: 'req_active_accepted',
        previousStatus: 'PENDING',
        newStatus: 'ACCEPTED',
        changedBy: 'usr_donor_paradise',
        timestamp: new Date(now.getTime() - 40 * 60000).toISOString(),
        remarks: 'Donor accepted request for 15 meal boxes. Scheduled for pickup.',
      },
      {
        id: 'hist_02',
        requestId: 'req_hist_completed_1',
        previousStatus: 'ACCEPTED',
        newStatus: 'COMPLETED',
        changedBy: 'SYSTEM',
        timestamp: yesterday.toISOString(),
        remarks: 'Both parties confirmed collection. Donation successfully completed.',
      },
    ];

    // 7. Notifications
    const notifications: Notification[] = [
      {
        id: 'notif_01',
        userId: 'usr_ngo_helpinghands',
        title: 'Donation Request Accepted',
        message: 'Paradise Grand Restaurant accepted your request for 15 meal boxes of Vegetable Dum Biryani. Reference: FB-HYD-7821.',
        notificationType: 'REQUEST_ACCEPTED',
        isRead: false,
        link: '/recipient/pickups',
        createdAt: new Date(now.getTime() - 40 * 60000).toISOString(),
      },
      {
        id: 'notif_02',
        userId: 'usr_donor_paradise',
        title: 'New Donation Request Received',
        message: 'Helping Hands Welfare Foundation requested 15 meal boxes.',
        notificationType: 'REQUEST_RECEIVED',
        isRead: true,
        link: '/donor/requests',
        createdAt: new Date(now.getTime() - 90 * 60000).toISOString(),
      },
      {
        id: 'notif_03',
        userId: 'usr_donor_natures',
        title: 'Incoming Request',
        message: "Sneha Children's Home requested 12 kg of Farm Fresh Produce.",
        notificationType: 'REQUEST_RECEIVED',
        isRead: false,
        link: '/donor/requests',
        createdAt: new Date(now.getTime() - 20 * 60000).toISOString(),
      },
      {
        id: 'notif_04',
        userId: 'usr_admin',
        title: 'NGO Verification Pending',
        message: 'Hope Community Night Shelter submitted documentation for verification.',
        notificationType: 'VERIFICATION_UPDATE',
        isRead: false,
        link: '/admin/verifications',
        createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
      },
    ];

    // 8. Reports
    const reports: Report[] = [
      {
        id: 'rep_01',
        reportedBy: 'usr_ngo_helpinghands',
        listingId: 'lst_dairy_06',
        reason: 'Packaging clarification requested',
        description: 'Listing says 4 days shelf life, requested verification of chilling standards during summer transport.',
        reportStatus: 'RESOLVED',
        reviewedBy: 'usr_admin',
        resolutionDetails: 'Donor confirmed commercial cold storage protocol; added transport handling warning to listing.',
        createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
        resolvedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      },
    ];

    // 9. Admin Audit Logs
    const adminAuditLogs: AdminAuditLog[] = [
      {
        id: 'aud_01',
        adminId: 'usr_admin',
        action: 'VERIFY_ORGANIZATION',
        targetType: 'ORGANIZATION',
        targetId: 'org_helpinghands',
        details: 'Approved 12A/80G NGO certification and physical kitchen inspection.',
        timestamp: new Date(now.getTime() - 49 * 86400000).toISOString(),
      },
      {
        id: 'aud_02',
        adminId: 'usr_admin',
        action: 'VERIFY_ORGANIZATION',
        targetType: 'ORGANIZATION',
        targetId: 'org_sneha',
        details: 'Approved childcare shelter registration license and food safety handler declaration.',
        timestamp: new Date(now.getTime() - 54 * 86400000).toISOString(),
      },
      {
        id: 'aud_03',
        adminId: 'usr_admin',
        action: 'RESOLVE_REPORT',
        targetType: 'REPORT',
        targetId: 'rep_01',
        details: 'Verified cold chain documentation with Green Leaf Organic Market.',
        timestamp: new Date(now.getTime() - 1 * 3600000).toISOString(),
      },
    ];

    this.data = {
      users,
      organizations,
      volunteerProfiles: [],
      foodListings,
      donationRequests,
      deliveryTasks: [],
      pickupDetails,
      feedbacks: [],
      donationStatusHistory,
      notifications,
      reports,
      adminAuditLogs,
    };
    this.ensureVolunteerAndDeliverySeed();
  }

  // --- GETTERS ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getOrganizations(): Organization[] {
    return this.data.organizations;
  }

  getOrganizationById(id: string): Organization | undefined {
    return this.data.organizations.find((o) => o.id === id);
  }

  getOrganizationByUserId(userId: string): Organization | undefined {
    return this.data.organizations.find((o) => o.userId === userId);
  }

  getListings(): FoodListing[] {
    this.checkExpiredListings();
    return this.data.foodListings;
  }

  getListingById(id: string): FoodListing | undefined {
    this.checkExpiredListings();
    return this.data.foodListings.find((l) => l.id === id);
  }

  getRequests(): DonationRequest[] {
    return this.data.donationRequests;
  }

  getRequestById(id: string): DonationRequest | undefined {
    return this.data.donationRequests.find((r) => r.id === id);
  }

  getPickupDetailsByRequestId(requestId: string): PickupDetails | undefined {
    return this.data.pickupDetails.find((p) => p.requestId === requestId);
  }

  getPickupDetailsById(id: string): PickupDetails | undefined {
    return this.data.pickupDetails.find((p) => p.id === id);
  }

  getStatusHistory(requestId: string): DonationStatusHistory[] {
    return this.data.donationStatusHistory.filter((h) => h.requestId === requestId);
  }

  getNotifications(userId: string): Notification[] {
    return this.data.notifications.filter((n) => n.userId === userId);
  }

  getReports(): Report[] {
    return this.data.reports;
  }

  getAdminAuditLogs(): AdminAuditLog[] {
    return this.data.adminAuditLogs;
  }

  // --- ATOMIC MUTATIONS WITH MUTEX ---

  async createUser(user: User): Promise<User> {
    const unlock = await dbMutex.lock();
    try {
      this.data.users.push(user);
      this.save();
      return user;
    } finally {
      unlock();
    }
  }

  async createOrganization(org: Organization): Promise<Organization> {
    const unlock = await dbMutex.lock();
    try {
      this.data.organizations.push(org);
      this.save();
      return org;
    } finally {
      unlock();
    }
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
    const unlock = await dbMutex.lock();
    try {
      const idx = this.data.organizations.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      this.data.organizations[idx] = {
        ...this.data.organizations[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.organizations[idx];
    } finally {
      unlock();
    }
  }

  async createListing(listing: FoodListing): Promise<FoodListing> {
    const unlock = await dbMutex.lock();
    try {
      // Validate inventory equality: total = available + reserved + collected
      if (listing.totalQuantity !== listing.availableQuantity + listing.reservedQuantity + listing.collectedQuantity) {
        throw new Error('Inventory mismatch: totalQuantity must equal available + reserved + collected.');
      }
      this.data.foodListings.unshift(listing);
      this.save();
      return listing;
    } finally {
      unlock();
    }
  }

  async updateListing(id: string, updates: Partial<FoodListing>, donorOrgId: string): Promise<FoodListing | null> {
    const unlock = await dbMutex.lock();
    try {
      const idx = this.data.foodListings.findIndex((l) => l.id === id);
      if (idx === -1) return null;
      const listing = this.data.foodListings[idx];
      if (listing.donorOrganizationId !== donorOrgId) {
        throw new Error('Unauthorized: Listing belongs to another donor organization.');
      }
      if (listing.listingStatus === 'COMPLETED' || listing.listingStatus === 'REMOVED') {
        throw new Error('Cannot edit completed or removed listing.');
      }

      const merged = { ...listing, ...updates, updatedAt: new Date().toISOString() };
      // Keep equation valid
      if (merged.totalQuantity !== merged.availableQuantity + merged.reservedQuantity + merged.collectedQuantity) {
        throw new Error('Inventory equality violation.');
      }

      this.data.foodListings[idx] = merged;
      this.save();
      return merged;
    } finally {
      unlock();
    }
  }

  async removeListing(id: string, donorOrgId: string): Promise<boolean> {
    const unlock = await dbMutex.lock();
    try {
      const idx = this.data.foodListings.findIndex((l) => l.id === id);
      if (idx === -1) return false;
      const listing = this.data.foodListings[idx];
      if (listing.donorOrganizationId !== donorOrgId) {
        throw new Error('Unauthorized');
      }
      if (listing.reservedQuantity > 0) {
        throw new Error('Cannot remove listing with active reserved requests.');
      }
      listing.listingStatus = 'REMOVED';
      listing.availableQuantity = 0;
      listing.updatedAt = new Date().toISOString();
      this.save();
      return true;
    } finally {
      unlock();
    }
  }

  // Submit Donation Request by NGO
  async createRequest(
    listingId: string,
    recipientOrgId: string,
    quantity: number,
    pickupWindow: string,
    notes?: string
  ): Promise<DonationRequest> {
    const unlock = await dbMutex.lock();
    try {
      this.checkExpiredListings();
      const listing = this.data.foodListings.find((l) => l.id === listingId);
      if (!listing) throw new Error('Listing not found');

      const recipientOrg = this.data.organizations.find((o) => o.id === recipientOrgId);
      if (!recipientOrg) throw new Error('Recipient organization not found');

      // Rule 1: Only admin-verified NGOs can request food
      if (recipientOrg.verificationStatus !== 'VERIFIED') {
        throw new Error('Verification required: Only admin-verified recipient organizations can request food.');
      }

      // Rule 2: Listing must be available or partially reserved
      if (listing.listingStatus !== 'AVAILABLE' && listing.listingStatus !== 'PARTIALLY_RESERVED') {
        throw new Error(`Cannot request food: Listing status is ${listing.listingStatus}`);
      }

      // Check quantity
      if (quantity <= 0) {
        throw new Error('Requested quantity must be greater than zero.');
      }

      if (quantity > listing.availableQuantity) {
        throw new Error(`Requested quantity (${quantity}) exceeds currently available quantity (${listing.availableQuantity} ${listing.unit}).`);
      }

      // Check for duplicate pending requests
      const existingPending = this.data.donationRequests.find(
        (r) =>
          r.listingId === listingId &&
          r.recipientOrganizationId === recipientOrgId &&
          (r.requestStatus === 'PENDING' || r.requestStatus === 'ACCEPTED')
      );
      if (existingPending) {
        throw new Error('You already have an active request for this listing.');
      }

      const now = new Date().toISOString();
      const newReq: DonationRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        listingId,
        recipientOrganizationId: recipientOrgId,
        requestedQuantity: quantity,
        requestStatus: 'PENDING',
        pickupWindow,
        donorConfirmed: false,
        recipientConfirmed: false,
        notes,
        createdAt: now,
        updatedAt: now,
      };

      this.data.donationRequests.push(newReq);

      // Record history
      this.data.donationStatusHistory.push({
        id: `hist_${Date.now()}`,
        requestId: newReq.id,
        previousStatus: 'PENDING',
        newStatus: 'PENDING',
        changedBy: recipientOrg.userId,
        timestamp: now,
        remarks: `Requested ${quantity} ${listing.unit} by ${recipientOrg.organizationName}`,
      });

      // Notify donor
      const donorOrg = this.data.organizations.find((o) => o.id === listing.donorOrganizationId);
      if (donorOrg) {
        this.data.notifications.push({
          id: `notif_${Date.now()}`,
          userId: donorOrg.userId,
          title: 'New Donation Request',
          message: `${recipientOrg.organizationName} requested ${quantity} ${listing.unit} of "${listing.foodName}".`,
          notificationType: 'REQUEST_RECEIVED',
          isRead: false,
          link: '/donor/requests',
          createdAt: now,
        });
      }

      this.save();
      return newReq;
    } finally {
      unlock();
    }
  }

  // Concurrency-safe Accept Request by Donor
  async acceptRequest(requestId: string, donorUserId: string): Promise<{ request: DonationRequest; pickup: PickupDetails }> {
    const unlock = await dbMutex.lock();
    try {
      const request = this.data.donationRequests.find((r) => r.id === requestId);
      if (!request) throw new Error('Request not found');

      if (request.requestStatus !== 'PENDING') {
        throw new Error(`Request cannot be accepted: Current status is ${request.requestStatus}`);
      }

      const listing = this.data.foodListings.find((l) => l.id === request.listingId);
      if (!listing) throw new Error('Listing not found');

      const donorOrg = this.data.organizations.find((o) => o.id === listing.donorOrganizationId);
      if (!donorOrg || donorOrg.userId !== donorUserId) {
        throw new Error('Unauthorized: You can only accept requests for your own listings.');
      }

      // CRITICAL CONCURRENCY CHECK: Atomic check of available inventory
      if (listing.availableQuantity < request.requestedQuantity) {
        throw new Error(
          `Insufficient inventory: Request requires ${request.requestedQuantity} ${listing.unit}, but only ${listing.availableQuantity} remain available.`
        );
      }

      const now = new Date().toISOString();

      // Reserve inventory atomically
      listing.availableQuantity -= request.requestedQuantity;
      listing.reservedQuantity += request.requestedQuantity;
      listing.listingStatus = listing.availableQuantity === 0 ? 'FULLY_RESERVED' : 'PARTIALLY_RESERVED';
      listing.updatedAt = now;

      // Update request status
      request.requestStatus = 'ACCEPTED';
      request.updatedAt = now;

      // Create PickupDetails
      const refSuffix = Math.floor(1000 + Math.random() * 9000);
      const pickup: PickupDetails = {
        id: `pkup_${Date.now()}`,
        requestId: request.id,
        pickupReference: `FB-HYD-${refSuffix}`,
        scheduledAt: listing.pickupStart,
        pickupStatus: 'SCHEDULED',
        notes: `Pickup reference ${`FB-HYD-${refSuffix}`}. Present upon collection at ${listing.pickupLocation}.`,
      };
      this.data.pickupDetails.push(pickup);

      // Record History
      this.data.donationStatusHistory.push({
        id: `hist_${Date.now()}`,
        requestId: request.id,
        previousStatus: 'PENDING',
        newStatus: 'ACCEPTED',
        changedBy: donorUserId,
        timestamp: now,
        remarks: `Accepted by donor. Reserved ${request.requestedQuantity} ${listing.unit}. Pickup Ref: ${pickup.pickupReference}`,
      });

      // Notify recipient
      const recipientOrg = this.data.organizations.find((o) => o.id === request.recipientOrganizationId);
      if (recipientOrg) {
        this.data.notifications.push({
          id: `notif_${Date.now()}`,
          userId: recipientOrg.userId,
          title: 'Donation Request Accepted',
          message: `${donorOrg.organizationName} accepted your request for ${request.requestedQuantity} ${listing.unit} of "${listing.foodName}". Pickup Code: ${pickup.pickupReference}`,
          notificationType: 'REQUEST_ACCEPTED',
          isRead: false,
          link: '/recipient/pickups',
          createdAt: now,
        });
      }

      // Automatically create a DeliveryTask for volunteers to accept
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const task: DeliveryTask = {
        id: taskId,
        requestId: request.id,
        listingId: listing.id,
        donorOrgId: donorOrg.id,
        recipientOrgId: recipientOrg ? recipientOrg.id : request.recipientOrganizationId,
        pickupAddress: listing.pickupLocation,
        deliveryAddress: recipientOrg ? recipientOrg.address : 'Recipient Community Facility',
        pickupCoordinates: {
          latitude: donorOrg.latitude,
          longitude: donorOrg.longitude,
        },
        deliveryCoordinates: {
          latitude: recipientOrg ? recipientOrg.latitude : 17.4375,
          longitude: recipientOrg ? recipientOrg.longitude : 78.4482,
        },
        status: 'AVAILABLE',
        estimatedDistanceKm: 3.8,
        pickupWindow: `${listing.pickupStart ? listing.pickupStart.split('T')[1]?.substring(0, 5) : '14:00'} - ${listing.pickupEnd ? listing.pickupEnd.split('T')[1]?.substring(0, 5) : '18:00'}`,
        notes: `Pickup reference: ${pickup.pickupReference}. Handle carefully.`,
        createdAt: now,
        updatedAt: now,
      };
      this.data.deliveryTasks.push(task);
      request.deliveryTaskId = taskId;

      // Broadcast notification to volunteers
      for (const vol of this.data.volunteerProfiles) {
        this.data.notifications.push({
          id: `notif_${Date.now()}_${vol.userId}`,
          userId: vol.userId,
          title: 'New Delivery Task Available! 🚴',
          message: `Delivery available from ${donorOrg.organizationName} to ${recipientOrg?.organizationName || 'NGO'}. Approx distance: 3.8 km.`,
          notificationType: 'DELIVERY_ASSIGNED',
          isRead: false,
          link: '/volunteer/available',
          createdAt: now,
        });
      }

      this.save();
      return { request, pickup };
    } finally {
      unlock();
    }
  }

  // Reject Request by Donor
  async rejectRequest(requestId: string, donorUserId: string, reason?: string): Promise<DonationRequest> {
    const unlock = await dbMutex.lock();
    try {
      const request = this.data.donationRequests.find((r) => r.id === requestId);
      if (!request) throw new Error('Request not found');

      if (request.requestStatus !== 'PENDING') {
        throw new Error(`Cannot reject: Request is currently ${request.requestStatus}`);
      }

      const listing = this.data.foodListings.find((l) => l.id === request.listingId);
      if (!listing) throw new Error('Listing not found');

      const donorOrg = this.data.organizations.find((o) => o.id === listing.donorOrganizationId);
      if (!donorOrg || donorOrg.userId !== donorUserId) {
        throw new Error('Unauthorized');
      }

      const now = new Date().toISOString();
      request.requestStatus = 'REJECTED';
      request.rejectionReason = reason || 'Donor is unable to fulfill this request at this time.';
      request.updatedAt = now;

      this.data.donationStatusHistory.push({
        id: `hist_${Date.now()}`,
        requestId: request.id,
        previousStatus: 'PENDING',
        newStatus: 'REJECTED',
        changedBy: donorUserId,
        timestamp: now,
        remarks: `Rejected: ${request.rejectionReason}`,
      });

      const recipientOrg = this.data.organizations.find((o) => o.id === request.recipientOrganizationId);
      if (recipientOrg) {
        this.data.notifications.push({
          id: `notif_${Date.now()}`,
          userId: recipientOrg.userId,
          title: 'Request Update',
          message: `Your request for "${listing.foodName}" could not be accepted. Reason: ${request.rejectionReason}`,
          notificationType: 'REQUEST_REJECTED',
          isRead: false,
          link: '/recipient/requests',
          createdAt: now,
        });
      }

      this.save();
      return request;
    } finally {
      unlock();
    }
  }

  // Cancel Request by Recipient (or Donor before collection)
  async cancelRequest(requestId: string, userId: string, reason?: string): Promise<DonationRequest> {
    const unlock = await dbMutex.lock();
    try {
      const request = this.data.donationRequests.find((r) => r.id === requestId);
      if (!request) throw new Error('Request not found');

      if (request.requestStatus === 'COMPLETED' || request.requestStatus === 'COLLECTED' || request.requestStatus === 'CANCELLED') {
        throw new Error(`Cannot cancel request with status ${request.requestStatus}`);
      }

      const recipientOrg = this.data.organizations.find((o) => o.id === request.recipientOrganizationId);
      const listing = this.data.foodListings.find((l) => l.id === request.listingId);
      if (!listing) throw new Error('Listing not found');
      const donorOrg = this.data.organizations.find((o) => o.id === listing.donorOrganizationId);

      const isRecipient = recipientOrg?.userId === userId;
      const isDonor = donorOrg?.userId === userId;

      if (!isRecipient && !isDonor) {
        throw new Error('Unauthorized: You cannot cancel this request.');
      }

      const previousStatus = request.requestStatus;
      const now = new Date().toISOString();

      // If it was ACCEPTED, restore inventory
      if (previousStatus === 'ACCEPTED') {
        listing.availableQuantity += request.requestedQuantity;
        listing.reservedQuantity -= request.requestedQuantity;
        listing.listingStatus = listing.availableQuantity === listing.totalQuantity ? 'AVAILABLE' : 'PARTIALLY_RESERVED';
        listing.updatedAt = now;
      }

      request.requestStatus = 'CANCELLED';
      request.cancellationReason = reason || 'Cancelled by user prior to pickup.';
      request.updatedAt = now;

      this.data.donationStatusHistory.push({
        id: `hist_${Date.now()}`,
        requestId: request.id,
        previousStatus,
        newStatus: 'CANCELLED',
        changedBy: userId,
        timestamp: now,
        remarks: `Cancelled: ${request.cancellationReason}. Inventory restored if previously reserved.`,
      });

      // Notify other party
      const notifyTargetUserId = isRecipient ? donorOrg?.userId : recipientOrg?.userId;
      if (notifyTargetUserId) {
        this.data.notifications.push({
          id: `notif_${Date.now()}`,
          userId: notifyTargetUserId,
          title: 'Request Cancelled',
          message: `Request for "${listing.foodName}" was cancelled. Reason: ${request.cancellationReason}`,
          notificationType: 'REQUEST_CANCELLED',
          isRead: false,
          link: isRecipient ? '/donor/requests' : '/recipient/requests',
          createdAt: now,
        });
      }

      this.save();
      return request;
    } finally {
      unlock();
    }
  }

  // Dual Confirmation Pickup Engine
  async confirmPickup(
    requestId: string,
    userId: string,
    userRole: UserRole,
    notes?: string
  ): Promise<{ request: DonationRequest; pickup: PickupDetails }> {
    const unlock = await dbMutex.lock();
    try {
      const request = this.data.donationRequests.find((r) => r.id === requestId);
      if (!request) throw new Error('Request not found');

      if (request.requestStatus !== 'ACCEPTED' && request.requestStatus !== 'COLLECTED') {
        throw new Error(`Invalid status for confirmation: Current status is ${request.requestStatus}`);
      }

      const listing = this.data.foodListings.find((l) => l.id === request.listingId);
      if (!listing) throw new Error('Listing not found');

      const donorOrg = this.data.organizations.find((o) => o.id === listing.donorOrganizationId);
      const recipientOrg = this.data.organizations.find((o) => o.id === request.recipientOrganizationId);

      const isDonor = donorOrg?.userId === userId;
      const isRecipient = recipientOrg?.userId === userId;

      if (!isDonor && !isRecipient) {
        throw new Error('Unauthorized: Only the donor or recipient can confirm collection.');
      }

      let pickup = this.data.pickupDetails.find((p) => p.requestId === requestId);
      if (!pickup) {
        pickup = {
          id: `pkup_${Date.now()}`,
          requestId,
          pickupReference: `FB-HYD-${Math.floor(1000 + Math.random() * 9000)}`,
          scheduledAt: listing.pickupStart,
          pickupStatus: 'SCHEDULED',
        };
        this.data.pickupDetails.push(pickup);
      }

      const now = new Date().toISOString();

      if (isDonor) {
        if (request.donorConfirmed) {
          throw new Error('Donor collection confirmation has already been recorded.');
        }
        request.donorConfirmed = true;
        pickup.donorConfirmedAt = now;
      } else if (isRecipient) {
        if (request.recipientConfirmed) {
          throw new Error('Recipient collection confirmation has already been recorded.');
        }
        request.recipientConfirmed = true;
        pickup.recipientConfirmedAt = now;
      }

      if (notes) {
        pickup.notes = (pickup.notes ? pickup.notes + ' | ' : '') + notes;
      }

      // Check if BOTH confirmed
      if (request.donorConfirmed && request.recipientConfirmed) {
        request.requestStatus = 'COMPLETED';
        pickup.pickupStatus = 'COMPLETED';
        pickup.completedAt = now;

        // Inventory update: Move from reserved to collected
        listing.reservedQuantity -= request.requestedQuantity;
        listing.collectedQuantity += request.requestedQuantity;

        // Check if listing is completely distributed
        if (listing.availableQuantity === 0 && listing.reservedQuantity === 0) {
          listing.listingStatus = 'COMPLETED';
        }
        listing.updatedAt = now;

        this.data.donationStatusHistory.push({
          id: `hist_${Date.now()}`,
          requestId: request.id,
          previousStatus: 'COLLECTED',
          newStatus: 'COMPLETED',
          changedBy: userId,
          timestamp: now,
          remarks: `Dual confirmation complete! ${request.requestedQuantity} ${listing.unit} collected and completed.`,
        });

        // Send completion notifications to both
        if (donorOrg) {
          this.data.notifications.push({
            id: `notif_${Date.now()}_d`,
            userId: donorOrg.userId,
            title: 'Donation Completed 🎉',
            message: `Donation of ${request.requestedQuantity} ${listing.unit} to ${recipientOrg?.organizationName} is officially completed!`,
            notificationType: 'DONATION_COMPLETED',
            isRead: false,
            link: '/donor/history',
            createdAt: now,
          });
        }
        if (recipientOrg) {
          this.data.notifications.push({
            id: `notif_${Date.now()}_r`,
            userId: recipientOrg.userId,
            title: 'Donation Completed 🎉',
            message: `Donation collection of "${listing.foodName}" is complete and recorded in impact history.`,
            notificationType: 'DONATION_COMPLETED',
            isRead: false,
            link: '/recipient/completed',
            createdAt: now,
          });
        }
      } else {
        // One party confirmed; state becomes COLLECTED awaiting second confirmation
        request.requestStatus = 'COLLECTED';
        pickup.pickupStatus = isDonor ? 'DONOR_CONFIRMED' : 'RECIPIENT_CONFIRMED';

        this.data.donationStatusHistory.push({
          id: `hist_${Date.now()}`,
          requestId: request.id,
          previousStatus: 'ACCEPTED',
          newStatus: 'COLLECTED',
          changedBy: userId,
          timestamp: now,
          remarks: `Collection confirmed by ${isDonor ? 'Donor' : 'Recipient'}. Awaiting counter confirmation.`,
        });

        const notifyTarget = isDonor ? recipientOrg?.userId : donorOrg?.userId;
        if (notifyTarget) {
          this.data.notifications.push({
            id: `notif_${Date.now()}`,
            userId: notifyTarget,
            title: 'Pickup Confirmation Awaiting Your Verification',
            message: `${isDonor ? donorOrg?.organizationName : recipientOrg?.organizationName} confirmed handover of "${listing.foodName}". Please confirm on your dashboard.`,
            notificationType: 'PICKUP_CONFIRMED',
            isRead: false,
            link: isDonor ? '/recipient/pickups' : '/donor/pickups',
            createdAt: now,
          });
        }
      }

      request.updatedAt = now;
      this.save();
      return { request, pickup };
    } finally {
      unlock();
    }
  }

  // Admin Organization Verification
  async verifyOrganization(
    orgId: string,
    adminId: string,
    status: VerificationStatus,
    reason?: string
  ): Promise<Organization> {
    const unlock = await dbMutex.lock();
    try {
      const org = this.data.organizations.find((o) => o.id === orgId);
      if (!org) throw new Error('Organization not found');

      const now = new Date().toISOString();
      org.verificationStatus = status;
      org.updatedAt = now;

      this.data.adminAuditLogs.push({
        id: `aud_${Date.now()}`,
        adminId,
        action: status === 'VERIFIED' ? 'APPROVE_ORGANIZATION' : 'REJECT_ORGANIZATION',
        targetType: 'ORGANIZATION',
        targetId: orgId,
        details: `${status} organization "${org.organizationName}". Reason/Notes: ${reason || 'Admin review completed.'}`,
        timestamp: now,
      });

      this.data.notifications.push({
        id: `notif_${Date.now()}`,
        userId: org.userId,
        title: status === 'VERIFIED' ? 'Organization Verified! ✅' : 'Verification Status Update',
        message:
          status === 'VERIFIED'
            ? `Congratulations! ${org.organizationName} is now verified. You can now request surplus food donations.`
            : `Your verification request was rejected. Details: ${reason || 'Please contact operations support.'}`,
        notificationType: 'VERIFICATION_UPDATE',
        isRead: false,
        link: '/recipient/profile',
        createdAt: now,
      });

      this.save();
      return org;
    } finally {
      unlock();
    }
  }

  // Admin Resolve Report
  async resolveReport(
    reportId: string,
    adminId: string,
    status: 'RESOLVED' | 'DISMISSED',
    details?: string
  ): Promise<Report> {
    const unlock = await dbMutex.lock();
    try {
      const report = this.data.reports.find((r) => r.id === reportId);
      if (!report) throw new Error('Report not found');

      const now = new Date().toISOString();
      report.reportStatus = status;
      report.reviewedBy = adminId;
      report.resolutionDetails = details || 'Reviewed and addressed by administration.';
      report.resolvedAt = now;

      this.data.adminAuditLogs.push({
        id: `aud_${Date.now()}`,
        adminId,
        action: `REPORT_${status}`,
        targetType: 'REPORT',
        targetId: reportId,
        details: `Report ${reportId} marked ${status}: ${report.resolutionDetails}`,
        timestamp: now,
      });

      this.save();
      return report;
    } finally {
      unlock();
    }
  }

  // Notifications: Mark as read
  async markNotificationRead(notifId: string, userId: string): Promise<boolean> {
    const notif = this.data.notifications.find((n) => n.id === notifId && n.userId === userId);
    if (!notif) return false;
    notif.isRead = true;
    this.save();
    return true;
  }

  async markAllNotificationsRead(userId: string): Promise<number> {
    let count = 0;
    for (const n of this.data.notifications) {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    }
    if (count > 0) this.save();
    return count;
  }

  // Submit Report by User
  async submitReport(listingId: string, userId: string, reason: string, description: string): Promise<Report> {
    const now = new Date().toISOString();
    const rep: Report = {
      id: `rep_${Date.now()}`,
      reportedBy: userId,
      listingId,
      reason,
      description,
      reportStatus: 'PENDING',
      createdAt: now,
    };
    this.data.reports.push(rep);
    this.save();
    return rep;
  }

  // --- VOLUNTEER PROFILES ---
  getVolunteerProfiles(): VolunteerProfile[] {
    return this.data.volunteerProfiles || [];
  }

  getVolunteerProfileByUserId(userId: string): VolunteerProfile | undefined {
    return (this.data.volunteerProfiles || []).find((v) => v.userId === userId);
  }

  getVolunteerProfileById(id: string): VolunteerProfile | undefined {
    return (this.data.volunteerProfiles || []).find((v) => v.id === id);
  }

  async updateVolunteerProfile(userId: string, updates: Partial<VolunteerProfile>): Promise<VolunteerProfile> {
    const unlock = await dbMutex.lock();
    try {
      let profile = (this.data.volunteerProfiles || []).find((v) => v.userId === userId);
      const now = new Date().toISOString();
      if (!profile) {
        const user = this.data.users.find((u) => u.id === userId);
        profile = {
          id: `vol_${Date.now()}`,
          userId,
          fullName: user ? user.name : 'Volunteer Partner',
          phone: updates.phone || '+91 98490 00000',
          vehicleType: updates.vehicleType || 'MOTORCYCLE',
          vehicleNumber: updates.vehicleNumber || 'TS 09 AB 1234',
          isAvailable: updates.isAvailable ?? true,
          totalDeliveriesCompleted: 0,
          averageRating: 5.0,
          createdAt: now,
          updatedAt: now,
        };
        this.data.volunteerProfiles = this.data.volunteerProfiles || [];
        this.data.volunteerProfiles.push(profile);
      } else {
        Object.assign(profile, updates, { updatedAt: now });
      }
      this.save();
      return profile;
    } finally {
      unlock();
    }
  }

  // --- DELIVERY TASKS ---
  getDeliveryTasks(filters?: { status?: DeliveryTaskStatus; volunteerId?: string }): DeliveryTask[] {
    let tasks = this.data.deliveryTasks || [];
    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }
    if (filters?.volunteerId) {
      tasks = tasks.filter((t) => t.volunteerId === filters.volunteerId);
    }
    return tasks;
  }

  getDeliveryTaskById(id: string): DeliveryTask | undefined {
    return (this.data.deliveryTasks || []).find((t) => t.id === id);
  }

  getDeliveryTaskByRequestId(requestId: string): DeliveryTask | undefined {
    return (this.data.deliveryTasks || []).find((t) => t.requestId === requestId);
  }

  async acceptDeliveryTask(taskId: string, volunteerUserId: string): Promise<DeliveryTask> {
    const unlock = await dbMutex.lock();
    try {
      const task = (this.data.deliveryTasks || []).find((t) => t.id === taskId);
      if (!task) throw new Error('Delivery task not found');

      if (task.status !== 'AVAILABLE') {
        throw new Error(`This task has already been accepted or is ${task.status}.`);
      }

      const volunteer = (this.data.volunteerProfiles || []).find((v) => v.userId === volunteerUserId);
      const user = this.data.users.find((u) => u.id === volunteerUserId);
      const volName = volunteer ? volunteer.fullName : (user ? user.name : 'Volunteer Courier');
      const volId = volunteer ? volunteer.id : `vol_${volunteerUserId}`;

      const now = new Date().toISOString();
      task.status = 'ASSIGNED';
      task.volunteerId = volId;
      task.volunteerName = volName;
      task.updatedAt = now;

      // Update linked donation request
      const request = this.data.donationRequests.find((r) => r.id === task.requestId);
      if (request) {
        request.requestStatus = 'PICKUP_SCHEDULED';
        request.deliveryTaskId = task.id;
        request.updatedAt = now;

        this.data.donationStatusHistory.push({
          id: `hist_${Date.now()}`,
          requestId: request.id,
          previousStatus: 'ACCEPTED',
          newStatus: 'PICKUP_SCHEDULED',
          changedBy: volunteerUserId,
          timestamp: now,
          remarks: `Delivery accepted by volunteer ${volName} (${volunteer?.vehicleType || 'Vehicle'}).`,
        });

        // Notify donor and recipient
        const donorOrg = this.data.organizations.find((o) => o.id === task.donorOrgId);
        const recipientOrg = this.data.organizations.find((o) => o.id === task.recipientOrgId);

        if (donorOrg) {
          this.data.notifications.push({
            id: `notif_${Date.now()}_donor`,
            userId: donorOrg.userId,
            title: 'Volunteer Assigned to Pickup 🚴',
            message: `Volunteer ${volName} has accepted the delivery task for your donation and will arrive during the pickup window.`,
            notificationType: 'DELIVERY_STATUS_UPDATE',
            isRead: false,
            link: '/donor/pickups',
            createdAt: now,
          });
        }

        if (recipientOrg) {
          this.data.notifications.push({
            id: `notif_${Date.now()}_rcpt`,
            userId: recipientOrg.userId,
            title: 'Volunteer Dispatched 🚴',
            message: `Volunteer ${volName} has accepted delivery of your requested food. Real-time tracking is now active.`,
            notificationType: 'DELIVERY_STATUS_UPDATE',
            isRead: false,
            link: '/recipient/pickups',
            createdAt: now,
          });
        }
      }

      this.save();
      return task;
    } finally {
      unlock();
    }
  }

  async updateDeliveryTaskStatus(
    taskId: string,
    volunteerUserId: string,
    newStatus: DeliveryTaskStatus,
    notes?: string
  ): Promise<DeliveryTask> {
    const unlock = await dbMutex.lock();
    try {
      const task = (this.data.deliveryTasks || []).find((t) => t.id === taskId);
      if (!task) throw new Error('Delivery task not found');

      const volunteer = (this.data.volunteerProfiles || []).find((v) => v.userId === volunteerUserId);
      const user = this.data.users.find((u) => u.id === volunteerUserId);

      // Verify that this user is assigned or admin
      if (user?.role !== 'ADMIN' && task.volunteerId && volunteer && task.volunteerId !== volunteer.id) {
        throw new Error('Unauthorized: You are not assigned to this delivery task.');
      }

      const now = new Date().toISOString();
      task.status = newStatus;
      task.updatedAt = now;
      if (notes) {
        task.notes = (task.notes ? task.notes + ' | ' : '') + notes;
      }

      const request = this.data.donationRequests.find((r) => r.id === task.requestId);
      let pickup = this.data.pickupDetails.find((p) => p.requestId === task.requestId);

      if (newStatus === 'PICKED_UP' || newStatus === 'IN_TRANSIT') {
        task.pickupConfirmedAt = now;
        if (request) {
          request.requestStatus = 'IN_TRANSIT';
          request.donorConfirmed = true;
          request.updatedAt = now;
        }
        if (pickup) {
          pickup.pickupStatus = 'IN_TRANSIT';
          pickup.donorConfirmedAt = now;
        }

        if (request) {
          this.data.donationStatusHistory.push({
            id: `hist_${Date.now()}`,
            requestId: request.id,
            previousStatus: 'PICKUP_SCHEDULED',
            newStatus: 'IN_TRANSIT',
            changedBy: volunteerUserId,
            timestamp: now,
            remarks: `Food picked up from donor facility. In transit to destination.`,
          });

          const recipientOrg = this.data.organizations.find((o) => o.id === task.recipientOrgId);
          if (recipientOrg) {
            this.data.notifications.push({
              id: `notif_${Date.now()}`,
              userId: recipientOrg.userId,
              title: 'Food In Transit 🚚',
              message: `Your food delivery is on the way! Handled by ${task.volunteerName || 'Volunteer'}.`,
              notificationType: 'DELIVERY_STATUS_UPDATE',
              isRead: false,
              link: '/recipient/pickups',
              createdAt: now,
            });
          }
        }
      } else if (newStatus === 'DELIVERED') {
        task.deliveredConfirmedAt = now;
        if (request) {
          request.requestStatus = 'COMPLETED';
          request.donorConfirmed = true;
          request.recipientConfirmed = true;
          request.updatedAt = now;

          const listing = this.data.foodListings.find((l) => l.id === request.listingId);
          if (listing) {
            listing.reservedQuantity -= request.requestedQuantity;
            listing.collectedQuantity += request.requestedQuantity;
            if (listing.availableQuantity === 0 && listing.reservedQuantity === 0) {
              listing.listingStatus = 'COMPLETED';
            }
            listing.updatedAt = now;
          }

          if (pickup) {
            pickup.pickupStatus = 'COMPLETED';
            pickup.recipientConfirmedAt = now;
            pickup.completedAt = now;
          }

          this.data.donationStatusHistory.push({
            id: `hist_${Date.now()}`,
            requestId: request.id,
            previousStatus: 'IN_TRANSIT',
            newStatus: 'COMPLETED',
            changedBy: volunteerUserId,
            timestamp: now,
            remarks: `Delivered safely to recipient organization. Dual delivery confirmed.`,
          });

          // Volunteer stats increment
          if (volunteer) {
            volunteer.totalDeliveriesCompleted += 1;
            volunteer.updatedAt = now;
          }

          // Notify both donor and recipient
          const donorOrg = this.data.organizations.find((o) => o.id === task.donorOrgId);
          const recipientOrg = this.data.organizations.find((o) => o.id === task.recipientOrgId);

          if (donorOrg) {
            this.data.notifications.push({
              id: `notif_${Date.now()}_don_done`,
              userId: donorOrg.userId,
              title: 'Donation Successfully Delivered! 🎉',
              message: `Your donation was delivered to ${recipientOrg?.organizationName || 'recipient NGO'} by ${task.volunteerName}. Thank you for saving food!`,
              notificationType: 'DONATION_COMPLETED',
              isRead: false,
              link: '/donor/history',
              createdAt: now,
            });
          }

          if (recipientOrg) {
            this.data.notifications.push({
              id: `notif_${Date.now()}_rcp_done`,
              userId: recipientOrg.userId,
              title: 'Food Delivery Completed! 🍲',
              message: `Food delivery received successfully from ${donorOrg?.organizationName}. Please leave quality feedback!`,
              notificationType: 'DONATION_COMPLETED',
              isRead: false,
              link: '/recipient/history',
              createdAt: now,
            });
          }
        }
      }

      this.save();
      return task;
    } finally {
      unlock();
    }
  }

  // --- FEEDBACK SYSTEM ---
  getFeedbacks(query?: { requestId?: string; listingId?: string; orgId?: string; volunteerId?: string }): Feedback[] {
    let feedbacks = this.data.feedbacks || [];
    if (query?.requestId) {
      feedbacks = feedbacks.filter((f) => f.requestId === query.requestId);
    }
    if (query?.listingId) {
      feedbacks = feedbacks.filter((f) => f.listingId === query.listingId);
    }
    if (query?.orgId) {
      feedbacks = feedbacks.filter((f) => f.targetOrgId === query.orgId);
    }
    if (query?.volunteerId) {
      feedbacks = feedbacks.filter((f) => f.targetVolunteerId === query.volunteerId);
    }
    return feedbacks;
  }

  async submitFeedback(feedbackData: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
    const unlock = await dbMutex.lock();
    try {
      const now = new Date().toISOString();
      const feedback: Feedback = {
        id: `fbk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ...feedbackData,
        createdAt: now,
      };

      this.data.feedbacks = this.data.feedbacks || [];
      this.data.feedbacks.push(feedback);

      // If feedback targets volunteer, recalculate volunteer rating
      if (feedback.targetVolunteerId) {
        const vol = (this.data.volunteerProfiles || []).find((v) => v.id === feedback.targetVolunteerId);
        if (vol) {
          const volFeedbacks = this.data.feedbacks.filter((f) => f.targetVolunteerId === vol.id);
          const totalRating = volFeedbacks.reduce((sum, f) => sum + f.rating, 0);
          vol.averageRating = Number((totalRating / volFeedbacks.length).toFixed(1));
          vol.updatedAt = now;
        }
      }

      this.save();
      return feedback;
    } finally {
      unlock();
    }
  }
}

function inEightHours(date: Date): Date {
  return new Date(date.getTime() + 8 * 3600000);
}

export const db = new Database();
