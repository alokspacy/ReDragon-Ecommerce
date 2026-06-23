const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

// Helper to make fetch requests
const request = async (endpoint, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('redragon_token') : null;

  const headers = {
    ...options.headers,
  };

  // Only set Content-Type to JSON if we are not sending FormData (which needs boundary header automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const api = {
  // Get image URL properly formatting local paths
  imageUrl: (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${BACKEND_URL}${path}`;
  },

  auth: {
    login: async (email, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.token) {
        localStorage.setItem('redragon_token', data.token);
      }
      return data;
    },
    register: async (name, email, password) => {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (data.token) {
        localStorage.setItem('redragon_token', data.token);
      }
      return data;
    },
    getMe: async () => {
      return request('/auth/me');
    },
    syncCart: async (cart) => {
      return request('/auth/cart', {
        method: 'PUT',
        body: JSON.stringify({ cart }),
      });
    },
    logout: () => {
      localStorage.removeItem('redragon_token');
    }
  },

  products: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.category) query.append('category', params.category);
      if (params.storeId) query.append('storeId', params.storeId);
      return request(`/products?${query.toString()}`);
    },
    getById: async (id) => {
      return request(`/products/${id}`);
    },
    create: async (formData) => {
      return request('/products', {
        method: 'POST',
        body: formData, // FormData contains file fields and text fields
      });
    },
    update: async (id, formData) => {
      return request(`/products/${id}`, {
        method: 'PUT',
        body: formData,
      });
    },
    delete: async (id) => {
      return request(`/products/${id}`, {
        method: 'DELETE',
      });
    }
  },

  stores: {
    create: async (formData) => {
      return request('/stores', {
        method: 'POST',
        body: formData,
      });
    },
    getStatus: async () => {
      return request('/stores/status');
    },
    getMyStore: async () => {
      return request('/stores/my-store');
    },
    getDashboard: async () => {
      return request('/stores/dashboard');
    },
    getAllAdmin: async () => {
      return request('/stores');
    },
    approve: async (id, status) => {
      return request(`/stores/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    getPublicStore: async (username) => {
      return request(`/stores/public/${encodeURIComponent(username)}`);
    }
  },

  orders: {
    create: async (orderData) => {
      return request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
    },
    getMyOrders: async () => {
      return request('/orders');
    },
    getStoreOrders: async () => {
      return request('/orders/store');
    },
    updateStatus: async (id, status) => {
      return request(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    getAdminDashboard: async () => {
      return request('/orders/admin-dashboard');
    },
    mockPay: async (id) => {
      return request(`/orders/mock-pay/${id}`, {
        method: 'POST',
      });
    },
    verifyRazorpay: async (verificationData) => {
      return request('/orders/verify-razorpay', {
        method: 'POST',
        body: JSON.stringify(verificationData),
      });
    }
  },

  coupons: {
    getAll: async () => {
      return request('/coupons');
    },
    create: async (couponData) => {
      return request('/coupons', {
        method: 'POST',
        body: JSON.stringify(couponData),
      });
    },
    delete: async (code) => {
      return request(`/coupons/${encodeURIComponent(code)}`, {
        method: 'DELETE',
      });
    },
    validate: async (code) => {
      return request(`/coupons/validate?code=${encodeURIComponent(code)}`);
    }
  },

  ratings: {
    create: async (ratingData) => {
      return request('/ratings', {
        method: 'POST',
        body: JSON.stringify(ratingData),
      });
    },
    getByProductId: async (productId) => {
      return request(`/ratings/product/${productId}`);
    }
  },

  address: {
    getAll: async () => {
      return request('/address');
    },
    create: async (addressData) => {
      return request('/address', {
        method: 'POST',
        body: JSON.stringify(addressData),
      });
    },
    delete: async (id) => {
      return request(`/address/${id}`, {
        method: 'DELETE',
      });
    }
  }
};
