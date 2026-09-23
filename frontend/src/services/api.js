const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper for HTTP fetch requests
const request = async (endpoint, options = {}) => {
  let userHeader = {};
  try {
    const storedUser = localStorage.getItem('travel_lib_user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      userHeader = {
        'x-user-role': u.role || 'user',
        'x-user-id': String(u.id || '')
      };
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...userHeader,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
};

// Authentication Services
export const authAPI = {
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
};

// Book Services
export const bookAPI = {
  getAllBooks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/books?${query}` : '/books';
    return request(endpoint);
  },

  getBookById: (id) => request(`/books/${id}`),
};

// Library Services
export const libraryAPI = {
  getAllLibraries: () => request('/libraries'),
  getLibraryById: (id) => request(`/libraries/${id}`),
};

// Connection Services
export const connectionAPI = {
  getAllConnections: () => request('/connections'),
};

// Rental Services
export const rentalAPI = {
  createRental: (rentalData) =>
    request('/rentals', {
      method: 'POST',
      body: JSON.stringify(rentalData),
    }),

  getRentalById: (id) => request(`/rentals/${id}`),

  getRentalsByUser: (userId) => request(`/rentals/user/${userId}`),
};

// Return Services
export const returnAPI = {
  processReturn: (returnData) =>
    request('/returns', {
      method: 'POST',
      body: JSON.stringify(returnData),
    }),
};

// Admin Services
export const adminAPI = {
  getDashboardStats: () => request('/admin/dashboard'),

  // Books
  getBooks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/admin/books?${query}` : '/admin/books');
  },
  createBook: (data) => request('/admin/books', { method: 'POST', body: JSON.stringify(data) }),
  updateBook: (id, data) => request(`/admin/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBook: (id) => request(`/admin/books/${id}`, { method: 'DELETE' }),

  // Libraries
  getLibraries: () => request('/admin/libraries'),
  createLibrary: (data) => request('/admin/libraries', { method: 'POST', body: JSON.stringify(data) }),
  updateLibrary: (id, data) => request(`/admin/libraries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLibrary: (id) => request(`/admin/libraries/${id}`, { method: 'DELETE' }),

  // Stock
  getStock: () => request('/admin/stock'),
  addOrUpdateStock: (data) => request('/admin/stock', { method: 'POST', body: JSON.stringify(data) }),

  // Connections
  getConnections: () => request('/admin/connections'),
  createConnection: (data) => request('/admin/connections', { method: 'POST', body: JSON.stringify(data) }),
  updateConnection: (id, data) => request(`/admin/connections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConnection: (id) => request(`/admin/connections/${id}`, { method: 'DELETE' }),

  // Rentals & Returns
  getRentals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/admin/rentals?${query}` : '/admin/rentals');
  },
  getReturns: () => request('/admin/returns'),
};
