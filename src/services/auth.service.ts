import axios from 'axios';

const API_BASE_URL = '/api/v1/auth/login';

class AuthService {
  async signIn(username: string, password: string): Promise<any> {
    try {
      const response = await axios.post(API_BASE_URL, { username, password });
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
    window.location.href = '/';
  }
}

export default new AuthService();
