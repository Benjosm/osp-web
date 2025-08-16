import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class AuthService {
  async signIn(username: string, password: string): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signin`, { username, password });
      const token = response.data.token;

      if (token) {
        localStorage.setItem('token', token);
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Authentication failed');
    }
  }

  signOut(): void {
    localStorage.removeItem('token');
    window.location.href = '/signin';
  }
}

export default new AuthService();
