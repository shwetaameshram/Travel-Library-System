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

// Payment Services (Razorpay Integration)
export const paymentAPI = {
  createPaymentOrder: (orderData) =>
    request('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  verifyPayment: (verificationData) =>
    request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    }),

  processPayment: (paymentData) =>
    request('/payments/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
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

// Librarian Services
export const librarianAPI = {
  getDashboardStats: () => request('/librarian/dashboard'),

  // Stock Management
  getStock: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/librarian/stock?${query}` : '/librarian/stock');
  },
  addOrUpdateStock: (data) => request('/librarian/stock', { method: 'POST', body: JSON.stringify(data) }),

  // Book Catalog Management
  getBooks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/librarian/books?${query}` : '/librarian/books');
  },
  createBook: (data) => request('/librarian/books', { method: 'POST', body: JSON.stringify(data) }),
  updateBook: (id, data) => request(`/librarian/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateBookStatus: (id, status) => request(`/librarian/books/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Rentals Management
  getRentals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/librarian/rentals?${query}` : '/librarian/rentals');
  },
  createRental: (data) => request('/librarian/rentals', { method: 'POST', body: JSON.stringify(data) }),

  // Returns Management
  getReturns: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/librarian/returns?${query}` : '/librarian/returns');
  },
  processReturn: (id) => request(`/librarian/returns/${id}`, { method: 'POST' }),

  // Passengers
  getPassengers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/librarian/passengers?${query}` : '/librarian/passengers');
  },
  getPassengerDetails: (id) => request(`/librarian/passengers/${id}`),

  // Connected Libraries
  getConnectedLibraries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/librarian/libraries?${query}` : '/librarian/libraries');
  },

  // Branch Reports
  getReports: () => request('/librarian/reports'),

  // Branch Profile
  getProfile: () => request('/librarian/profile'),
};

// Admin Services
export const adminAPI = {
  getDashboardStats: () => request('/admin/dashboard'),

  // Librarians Management
  getLibrarians: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/admin/librarians?${query}` : '/admin/librarians');
  },
  getLibrarianById: (id) => request(`/admin/librarians/${id}`),
  createLibrarian: (data) => request('/admin/librarians', { method: 'POST', body: JSON.stringify(data) }),
  updateLibrarian: (id, data) => request(`/admin/librarians/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateLibrarianStatus: (id, status) => request(`/admin/librarians/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateLibrarianLibrary: (id, library_id) => request(`/admin/librarians/${id}/library`, { method: 'PATCH', body: JSON.stringify({ library_id }) }),

  // Users / Passengers Management
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/admin/users?${query}` : '/admin/users');
  },
  getUserById: (id) => request(`/admin/users/${id}`),
  createUser: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getUserRentals: (id) => request(`/admin/users/${id}/rentals`),

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
