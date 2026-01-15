import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api/v1' : '/api/v1');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/update-profile', data),
    verifyPassword: (password) => api.post('/auth/verify-password', { password }),
    updateSettings: (settings) => api.put('/auth/update-settings', { notificationSettings: settings }),
    testNotifications: () => api.post('/auth/test-notifications'),
    changePassword: (data) => api.post('/auth/change-password', data),
    // Forgot password APIs (Email OTP)
    requestPasswordReset: (email) => api.post('/auth/forgot-password/request-otp', { email }),
    verifyResetOTP: (email, otp) => api.post('/auth/forgot-password/verify-otp', { email, otp }),
    resetPassword: (email, otp, newPassword) => api.post('/auth/forgot-password/reset-password', { email, otp, newPassword })
};

// Branch APIs
export const branchAPI = {
    getAll: () => api.get('/branches'),
    getById: (branchId) => api.get(`/branches/${branchId}`),
    create: (data) => api.post('/branches', data),
    update: (branchId, data) => api.put(`/branches/${branchId}`, data),
    getUsers: (branchId) => api.get(`/branches/${branchId}/users`),
    addUser: (branchId, userData) => api.post(`/branches/${branchId}/users`, userData),
    removeUser: (branchId, userId, confirm = false) =>
        api.delete(`/branches/${branchId}/users/${userId}`, {
            headers: confirm ? { 'X-Confirm-Action': 'true' } : {}
        }),
    getPerformance: (params) => api.get('/branches/comparison/performance', { params }),
    updateUser: (branchId, userId, data) => api.put(`/branches/${branchId}/users/${userId}`, data),
    getUserActivity: (branchId, userId) => api.get(`/branches/${branchId}/users/${userId}/activity`)
};

// Inventory APIs
export const inventoryAPI = {
    getProducts: (branchId, params) => api.get(`/inventory/${branchId}`, { params }),
    findProduct: (branchId, params) => api.get(`/inventory/${branchId}/find`, { params }),
    createProduct: (branchId, data) => api.post(`/inventory/${branchId}`, data),
    updateProduct: (branchId, productId, data) => api.put(`/inventory/${branchId}/${productId}`, data),
    updateStock: (branchId, productId, data) => api.patch(`/inventory/${branchId}/${productId}/stock`, data),
    deleteProduct: (branchId, productId) => api.delete(`/inventory/${branchId}/${productId}`),
    getLowStock: (branchId) => api.get(`/inventory/${branchId}/alerts/low-stock`),
    getExpiring: (branchId) => api.get(`/inventory/${branchId}/alerts/expiring`),
    getCritical: (branchId) => api.get(`/inventory/${branchId}/alerts/critical`)
};

// Billing APIs
export const billingAPI = {
    createInvoice: (branchId, data) => api.post(`/billing/${branchId}`, data),
    getInvoices: (branchId, params) => api.get(`/billing/${branchId}`, { params }),
    getInvoice: (branchId, invoiceId) => api.get(`/billing/${branchId}/${invoiceId}`),
    processReturn: (branchId, invoiceId, data) => api.post(`/billing/${branchId}/${invoiceId}/return`, data),
    getSalesSummary: (branchId, params) => api.get(`/billing/${branchId}/reports/summary`, { params }),
    getAdvancedReport: (branchId, params) => api.get(`/billing/${branchId}/reports/advanced`, { params })
};

// AI APIs
export const aiAPI = {
    submitPrompt: (data) => api.post('/ai/prompt', data),
    parseBill: (data) => api.post('/ai/parse-bill', data),
    getHistory: (params) => api.get('/ai/prompt-history', { params }),
    getSuggestions: () => api.get('/ai/suggested-prompts'),
    createSuggestion: (data) => api.post('/ai/suggested-prompts', data),
    updateSettings: (data) => api.put('/ai/settings', data)
};

// Subscription APIs
export const subscriptionAPI = {
    getPlans: () => api.get('/subscription/plans'),
    getCurrent: () => api.get('/subscription/current'),
    upgrade: (data) => api.post('/subscription/upgrade', data),
    addBranches: (count) => api.post('/subscription/add-branches', { count }),
    cancelRenewal: () => api.post('/subscription/cancel-renewal'),
    getBillingHistory: () => api.get('/subscription/billing-history')
};

// Stripe Payment APIs
export const stripeAPI = {
    createCheckoutSession: (planId) => api.post('/stripe/create-checkout-session', { planId }),
    getSubscriptionStatus: () => api.get('/stripe/subscription-status'),
    createPortalSession: () => api.post('/stripe/create-portal-session'),
    verifySession: (sessionId) => api.get(`/stripe/verify-session/${sessionId}`)
};

export default api;

