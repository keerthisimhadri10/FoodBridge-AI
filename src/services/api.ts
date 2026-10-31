import {
  User,
  Organization,
  VolunteerProfile,
  FoodListing,
  DonationRequest,
  DeliveryTask,
  DeliveryTaskStatus,
  PickupDetails,
  Feedback,
  Notification,
  Report,
  AdminAuditLog,
  MatchScoreResult,
  PlatformAnalytics,
} from '../types';

const TOKEN_KEY = 'foodbridge_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const data = await request<{ token: string; user: User; organization: Organization | null }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    setStoredToken(data.token);
    return data;
  },

  async quickLogin(accountType: 'donor' | 'ngo' | 'pending_ngo' | 'volunteer' | 'admin') {
    const data = await request<{ token: string; user: User; organization: Organization | null }>(
      '/api/auth/quick-login',
      {
        method: 'POST',
        body: JSON.stringify({ accountType }),
      }
    );
    setStoredToken(data.token);
    return data;
  },

  async register(formData: any) {
    const data = await request<{ token: string; user: User; organization: Organization }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(formData),
      }
    );
    setStoredToken(data.token);
    return data;
  },

  async me() {
    return request<{ user: User; organization: Organization | null }>('/api/auth/me');
  },

  logout() {
    setStoredToken(null);
  },

  // Listings
  async getListings(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        query.set(k, String(v));
      }
    }
    return request<FoodListing[]>(`/api/listings?${query.toString()}`);
  },

  async getListing(id: string) {
    return request<FoodListing & { donorOrganization: any; requestsCount: number; activeRequestsCount: number }>(
      `/api/listings/${id}`
    );
  },

  async createListing(listingData: Partial<FoodListing>) {
    return request<FoodListing>('/api/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  },

  async updateListing(id: string, updates: Partial<FoodListing>) {
    return request<FoodListing>(`/api/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async removeListing(id: string) {
    return request<{ message: string }>(`/api/listings/${id}`, {
      method: 'DELETE',
    });
  },

  // Requests
  async getRequests(params: { status?: string; listingId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.listingId) query.set('listingId', params.listingId);
    return request<DonationRequest[]>(`/api/requests?${query.toString()}`);
  },

  async getRequest(id: string) {
    return request<DonationRequest & { listing: FoodListing; donorOrganization: Organization; recipientOrganization: Organization; pickupDetails?: PickupDetails }>(
      `/api/requests/${id}`
    );
  },

  async createRequest(data: { listingId: string; requestedQuantity: number; pickupWindow?: string; notes?: string }) {
    return request<DonationRequest>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async acceptRequest(id: string) {
    return request<{ message: string; request: DonationRequest; pickup: PickupDetails }>(
      `/api/requests/${id}/accept`,
      {
        method: 'PATCH',
      }
    );
  },

  async rejectRequest(id: string, reason?: string) {
    return request<{ message: string; request: DonationRequest }>(`/api/requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  async cancelRequest(id: string, reason?: string) {
    return request<{ message: string; request: DonationRequest }>(`/api/requests/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  // Pickups
  async getPickup(id: string) {
    return request<PickupDetails>(`/api/pickups/${id}`);
  },

  async confirmPickup(requestId: string, notes?: string) {
    return request<{ message: string; request: DonationRequest; pickup: PickupDetails }>(
      '/api/pickups/confirm',
      {
        method: 'PATCH',
        body: JSON.stringify({ requestId, notes }),
      }
    );
  },

  // Organizations
  async getOrganizations(params: { type?: string; verificationStatus?: string } = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.verificationStatus) query.set('verificationStatus', params.verificationStatus);
    return request<Organization[]>(`/api/organizations?${query.toString()}`);
  },

  async getOrganization(id: string) {
    return request<Organization & { stats: any }>(`/api/organizations/${id}`);
  },

  async updateProfile(profileData: any) {
    return request<Organization>('/api/organizations/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Admin
  async getAdminDashboard() {
    return request<{
      totalUsers: number;
      totalDonors: number;
      totalRecipients: number;
      verifiedRecipients: number;
      pendingVerifications: number;
      totalListings: number;
      activeListings: number;
      totalRequests: number;
      completedDonations: number;
      totalMealsRedistributed: number;
      pendingReports: number;
    }>('/api/admin/dashboard');
  },

  async getAdminUsers() {
    return request<any[]>('/api/admin/users');
  },

  async toggleUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    return request<any>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getAdminVerifications() {
    return request<Organization[]>('/api/admin/verifications');
  },

  async verifyOrganization(id: string, reason?: string) {
    return request<{ message: string; organization: Organization }>(
      `/api/admin/organizations/${id}/verify`,
      {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }
    );
  },

  async rejectOrganization(id: string, reason?: string) {
    return request<{ message: string; organization: Organization }>(
      `/api/admin/organizations/${id}/reject`,
      {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }
    );
  },

  async getAdminListings() {
    return request<FoodListing[]>('/api/admin/listings');
  },

  async removeAdminListing(id: string) {
    return request<{ message: string }>(`/api/admin/listings/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminReports() {
    return request<Report[]>('/api/admin/reports');
  },

  async resolveReport(id: string, status: 'RESOLVED' | 'DISMISSED', details?: string) {
    return request<{ message: string; report: Report }>(`/api/admin/reports/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ status, details }),
    });
  },

  async getAdminAuditLogs() {
    return request<AdminAuditLog[]>('/api/admin/audit-logs');
  },

  // Analytics
  async getPlatformAnalytics() {
    return request<PlatformAnalytics>('/api/analytics/platform');
  },

  async getDonorAnalytics() {
    return request<{
      totalListings: number;
      activeListings: number;
      availableQuantity: number;
      reservedQuantity: number;
      collectedQuantity: number;
      pendingRequests: number;
      acceptedRequests: number;
      completedDonations: number;
      rejectedOrCancelled: number;
      estimatedMealsRedistributed: number;
    }>('/api/analytics/donor');
  },

  async getRecipientAnalytics() {
    return request<{
      pendingRequests: number;
      acceptedRequests: number;
      upcomingPickups: number;
      completedDonations: number;
      totalQuantityReceived: number;
      estimatedMealsReceived: number;
      verificationStatus: string;
    }>('/api/analytics/recipient');
  },

  // Notifications
  async getNotifications() {
    return request<{ notifications: Notification[]; unreadCount: number }>('/api/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead() {
    return request<{ success: boolean; markedCount: number }>('/api/notifications/read-all', {
      method: 'PATCH',
    });
  },

  // AI
  async matchListing(listingId: string) {
    return request<{ listingId: string; matches: MatchScoreResult[]; criteria: any }>('/api/ai/match', {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    });
  },

  async generateDescription(params: any) {
    return request<{
      description: string;
      storageGuidance: string;
      handlingTips: string;
      allergenWarning: string;
    }>('/api/ai/generate-description', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getAIInsights() {
    return request<{
      headline: string;
      summary: string;
      topCategories: { category: string; count: number }[];
      unclaimedAlerts: string[];
      actionableRecommendations: string[];
    }>('/api/ai/insights');
  },

  // File Upload
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return request<{ url: string; filename: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Reports
  async submitReport(listingId: string, reason: string, description?: string) {
    return request<{ message: string; report: Report }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ listingId, reason, description }),
    });
  },

  // Deliveries (Volunteer Portal)
  async getDeliveries(params?: { status?: string; my?: boolean }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.my) query.set('my', 'true');
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<DeliveryTask[]>(`/api/deliveries${qs}`);
  },

  async getDeliveryById(id: string) {
    return request<DeliveryTask>(`/api/deliveries/${id}`);
  },

  async acceptDelivery(id: string) {
    return request<{ message: string; task: DeliveryTask }>(`/api/deliveries/${id}/accept`, {
      method: 'PATCH',
    });
  },

  async updateDeliveryStatus(id: string, status: DeliveryTaskStatus, notes?: string) {
    return request<{ message: string; task: DeliveryTask }>(`/api/deliveries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async getVolunteerProfile() {
    return request<VolunteerProfile | null>('/api/deliveries/volunteer/profile');
  },

  async updateVolunteerProfile(data: Partial<VolunteerProfile>) {
    return request<VolunteerProfile>('/api/deliveries/volunteer/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Feedback & Ratings
  async getFeedbacks(params?: { requestId?: string; listingId?: string; orgId?: string; volunteerId?: string }) {
    const query = new URLSearchParams();
    if (params?.requestId) query.set('requestId', params.requestId);
    if (params?.listingId) query.set('listingId', params.listingId);
    if (params?.orgId) query.set('orgId', params.orgId);
    if (params?.volunteerId) query.set('volunteerId', params.volunteerId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Feedback[]>(`/api/feedback${qs}`);
  },

  async submitFeedback(data: {
    requestId: string;
    listingId: string;
    rating: number;
    comment: string;
    foodConditionRating?: number;
    punctualityRating?: number;
    targetOrgId?: string;
    targetVolunteerId?: string;
  }) {
    return request<{ message: string; feedback: Feedback }>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
