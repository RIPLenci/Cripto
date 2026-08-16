import { apiRequest } from './api';
import { SystemStats, UserProfile, ThreatLog, SecurityAccessLog, BannedIpDetail, ForensicCase } from '../types';

export const adminService = {
  async getStats(token?: string): Promise<SystemStats> {
    return apiRequest<SystemStats>('/api/admin/stats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async getUsers(token?: string): Promise<UserProfile[]> {
    return apiRequest<UserProfile[]>('/api/admin/users', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async createUser(data: { email: string; password?: string; name: string; ip?: string; role?: string }, token?: string): Promise<any> {
    return apiRequest('/api/admin/create-user', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    });
  },

  async editUser(data: { userId: string; name?: string; email?: string; role?: string; status?: string; ip?: string; isPremium?: boolean; planTier?: 'free' | 'premium' | 'cyber_elite'; premiumExpiresAt?: number }, token?: string): Promise<any> {
    return apiRequest('/api/admin/edit-user', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    });
  },

  async setUserPlan(userId: string, planTier: 'free' | 'premium' | 'cyber_elite', days?: number, token?: string): Promise<any> {
    return apiRequest('/api/admin/set-user-plan', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ userId, planTier, days }),
    });
  },

  async updateUserBadges(userId: string, badges: string[], customBadgeText?: string, token?: string): Promise<any> {
    return apiRequest('/api/admin/users/update-badges', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ userId, badges, customBadgeText }),
    });
  },

  async deleteUser(userId: string, token?: string): Promise<any> {
    return apiRequest('/api/admin/delete-user', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ userId }),
    });
  },

  async toggleStatus(userId: string, status: 'Activo' | 'Baneado', token?: string): Promise<any> {
    return apiRequest('/api/admin/toggle-status', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ userId, status }),
    });
  },

  async toggleRole(userId: string, role: 'admin' | 'user', token?: string): Promise<any> {
    return apiRequest('/api/admin/toggle-role', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ userId, role }),
    });
  },

  async resetUserPassword(userId: string, newPassword: string, token?: string): Promise<any> {
    return apiRequest('/api/admin/reset-user-password', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ userId, newPassword }),
    });
  },

  async getRooms(token?: string): Promise<any[]> {
    return apiRequest('/api/admin/rooms', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async deleteRoom(roomId: string, token?: string): Promise<any> {
    return apiRequest('/api/admin/delete-room', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ roomId }),
    });
  },

  async banIp(data: { ip: string; reason?: string; severity?: string; evidence?: string; userId?: string }, token?: string): Promise<any> {
    return apiRequest('/api/admin/ban-ip', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    });
  },

  async unbanIp(data: { ip?: string; userId?: string }, token?: string): Promise<any> {
    return apiRequest('/api/admin/unban-ip', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    });
  },

  async getThreats(token?: string): Promise<ThreatLog[]> {
    return apiRequest<ThreatLog[]>('/api/admin/threats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async getBannedIps(token?: string): Promise<BannedIpDetail[]> {
    return apiRequest<BannedIpDetail[]>('/api/admin/banned-ips', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async getAccessLogs(token?: string): Promise<SecurityAccessLog[]> {
    return apiRequest<SecurityAccessLog[]>('/api/admin/access-logs', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async getMongoStats(token?: string): Promise<any> {
    return apiRequest('/api/admin/mongo-stats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async getForensicCases(token?: string): Promise<ForensicCase[]> {
    return apiRequest<ForensicCase[]>('/api/admin/forensic-cases', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async deleteForensicCase(caseId: string, token?: string): Promise<any> {
    return apiRequest('/api/admin/delete-forensic-case', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ caseId }),
    });
  },
};
