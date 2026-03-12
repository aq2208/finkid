const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL}/api/v1`;

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('access_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  register(data) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  login(data) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  }

  setRole(role) {
    return this.request('/auth/set-role', { method: 'POST', body: JSON.stringify({ role }) });
  }

  getMe() {
    return this.request('/auth/me');
  }

  updateProfile(data) {
    return this.request('/auth/me', { method: 'PATCH', body: JSON.stringify(data) });
  }

  // Families
  createFamily(name) {
    return this.request('/families/', { method: 'POST', body: JSON.stringify({ name }) });
  }

  joinFamily(joinCode) {
    return this.request('/families/join', { method: 'POST', body: JSON.stringify({ join_code: joinCode }) });
  }

  getMyFamily() {
    return this.request('/families/me');
  }

  leaveFamily() {
    return this.request('/families/me/leave', { method: 'POST' });
  }

  // Dreams
  createDream(data) {
    return this.request('/dreams/', { method: 'POST', body: JSON.stringify(data) });
  }

  getDreams() {
    return this.request('/dreams/');
  }

  getDream(id) {
    return this.request(`/dreams/${id}`);
  }

  approveDream(id, targetPoints) {
    return this.request(`/dreams/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ target_points: targetPoints }),
    });
  }

  rejectDream(id, reason) {
    return this.request(`/dreams/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  activateDream(id) {
    return this.request(`/dreams/${id}/activate`, { method: 'POST' });
  }

  // Tasks
  createTask(data) {
    return this.request('/tasks/', { method: 'POST', body: JSON.stringify(data) });
  }

  getTasks(status) {
    const query = status ? `?task_status=${status}` : '';
    return this.request(`/tasks/${query}`);
  }

  getTask(id) {
    return this.request(`/tasks/${id}`);
  }

  deleteTask(id) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  pickupTask(id) {
    return this.request(`/tasks/${id}/pickup`, { method: 'POST' });
  }

  completeTask(id) {
    return this.request(`/tasks/${id}/complete`, { method: 'POST' });
  }

  verifyTask(id, approved, reason) {
    return this.request(`/tasks/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ approved, reason }),
    });
  }
}

export const api = new ApiClient();
