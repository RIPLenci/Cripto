import { apiRequest } from './api';
import { UserProfile } from '../types';

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface RegisterVerifyResponse {
  token: string;
  user: UserProfile;
}

export interface MeResponse {
  user: UserProfile | null;
  admin2FAVerified?: boolean;
}

export const authService = {
  async getMe(token?: string): Promise<MeResponse> {
    return apiRequest<MeResponse>('/api/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async sendVerificationCode(email: string): Promise<{ message: string; emailSuccess?: boolean; emailError?: string; devCode?: string }> {
    return apiRequest('/api/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async registerVerify(data: { name: string; email: string; password: string; code: string }): Promise<RegisterVerifyResponse> {
    return apiRequest<RegisterVerifyResponse>('/api/auth/register-verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string; emailSuccess?: boolean; devCode?: string }> {
    return apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    return apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },

  async updateProfile(data: { name?: string; avatar?: string; bio?: string; statusMood?: string }, token?: string): Promise<{ message: string; user: UserProfile }> {
    return apiRequest<{ message: string; user: UserProfile }>('/api/users/profile', {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    });
  },

  async changePassword(currentPassword: string, newPassword: string, token?: string): Promise<{ message: string }> {
    return apiRequest('/api/users/change-password', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async updateIpWhitelist(ipWhitelist: string[], token?: string): Promise<{ message: string; user: UserProfile }> {
    return apiRequest<{ message: string; user: UserProfile }>('/api/users/ip-whitelist', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ ipWhitelist }),
    });
  },

  async adminRequest2FACode(token?: string): Promise<{ message: string }> {
    return apiRequest('/api/admin/request-2fa-code', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async adminVerify2FA(password: string, code: string, token?: string): Promise<{ message: string; success: boolean }> {
    return apiRequest('/api/admin/verify-2fa', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ password, code }),
    });
  },
};
