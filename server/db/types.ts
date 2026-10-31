export type UserRole = 'DONOR' | 'RECIPIENT' | 'VOLUNTEER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';

export type OrganizationType =
  | 'RESTAURANT'
  | 'HOTEL'
  | 'BAKERY'
  | 'SUPERMARKET'
  | 'CATERER'
  | 'COMMUNITY_KITCHEN'
  | 'NGO'
  | 'ORPHANAGE'
  | 'SHELTER'
  | 'CHARITY'
  | 'COMMUNITY_GROUP';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type FoodCategory =
  | 'COOKED_MEALS'
  | 'BAKERY'
  | 'FRUITS'
  | 'VEGETABLES'
  | 'DAIRY'
  | 'PACKAGED'
  | 'RAW_INGREDIENTS'
  | 'OTHER';

export type DietaryType = 'VEGETARIAN' | 'NON_VEGETARIAN';

export type MeasurementUnit =
  | 'MEAL_BOXES'
  | 'PLATES'
  | 'KILOGRAMS'
  | 'LITRES'
  | 'PACKETS'
  | 'PIECES';

export type ListingStatus =
  | 'AVAILABLE'
  | 'PARTIALLY_RESERVED'
  | 'FULLY_RESERVED'
  | 'EXPIRED'
  | 'COMPLETED'
  | 'REMOVED';

export type RequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PICKUP_SCHEDULED'
  | 'IN_TRANSIT'
  | 'COLLECTED'
  | 'COMPLETED';

export type PickupStatus =
  | 'SCHEDULED'
  | 'IN_TRANSIT'
  | 'DONOR_CONFIRMED'
  | 'RECIPIENT_CONFIRMED'
  | 'COMPLETED';

export type DeliveryTaskStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type VehicleType = 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'ELECTRIC_VAN' | 'TRUCK';

export type NotificationType =
  | 'REQUEST_RECEIVED'
  | 'REQUEST_ACCEPTED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_CANCELLED'
  | 'PICKUP_SCHEDULED'
  | 'PICKUP_CONFIRMED'
  | 'DELIVERY_ASSIGNED'
  | 'DELIVERY_STATUS_UPDATE'
  | 'DONATION_COMPLETED'
  | 'VERIFICATION_UPDATE'
  | 'LISTING_EXPIRING'
  | 'FEEDBACK_RECEIVED'
  | 'SYSTEM';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  userId: string;
  organizationName: string;
  organizationType: OrganizationType;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  contactDetails: {
    phone: string;
    contactPerson: string;
    website?: string;
  };
  verificationStatus: VerificationStatus;
  capacityMeals?: number;
  dietaryPreferences?: DietaryType[];
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  totalDeliveriesCompleted: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface FoodListing {
  id: string;
  donorOrganizationId: string;
  foodName: string;
  description: string;
  imageUrl: string;
  category: FoodCategory;
  dietaryType: DietaryType;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  collectedQuantity: number;
  unit: MeasurementUnit;
  preparationTime: string;
  storageMethod: string;
  handlingInstructions: string;
  allergenInformation: string;
  pickupLocation: string;
  pickupStart: string;
  pickupEnd: string;
  collectionDeadline: string;
  listingStatus: ListingStatus;
  donorDeclarationConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DonationRequest {
  id: string;
  listingId: string;
  recipientOrganizationId: string;
  requestedQuantity: number;
  requestStatus: RequestStatus;
  pickupWindow: string;
  donorConfirmed: boolean;
  recipientConfirmed: boolean;
  notes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  deliveryTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryTask {
  id: string;
  requestId: string;
  listingId: string;
  donorOrgId: string;
  recipientOrgId: string;
  volunteerId?: string;
  volunteerName?: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCoordinates: { latitude: number; longitude: number };
  deliveryCoordinates: { latitude: number; longitude: number };
  status: DeliveryTaskStatus;
  estimatedDistanceKm: number;
  pickupWindow: string;
  pickupConfirmedAt?: string;
  deliveredConfirmedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PickupDetails {
  id: string;
  requestId: string;
  pickupReference: string;
  scheduledAt: string;
  pickupStatus: PickupStatus;
  donorConfirmedAt?: string;
  recipientConfirmedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface Feedback {
  id: string;
  requestId: string;
  listingId: string;
  reviewerUserId: string;
  reviewerRole: UserRole;
  targetOrgId?: string;
  targetVolunteerId?: string;
  rating: number; // 1 to 5
  comment: string;
  foodConditionRating: number;
  punctualityRating: number;
  createdAt: string;
}

export interface DonationStatusHistory {
  id: string;
  requestId: string;
  previousStatus: RequestStatus;
  newStatus: RequestStatus;
  changedBy: string;
  timestamp: string;
  remarks: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reportedBy: string;
  listingId: string;
  reason: string;
  description: string;
  reportStatus: ReportStatus;
  reviewedBy?: string;
  resolutionDetails?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface DatabaseSchema {
  users: User[];
  organizations: Organization[];
  volunteerProfiles: VolunteerProfile[];
  foodListings: FoodListing[];
  donationRequests: DonationRequest[];
  deliveryTasks: DeliveryTask[];
  pickupDetails: PickupDetails[];
  feedbacks: Feedback[];
  donationStatusHistory: DonationStatusHistory[];
  notifications: Notification[];
  reports: Report[];
  adminAuditLogs: AdminAuditLog[];
}
