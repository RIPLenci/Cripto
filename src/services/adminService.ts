import { apiRequest } from './api';
import { SystemStats, UserProfile, ThreatLog, SecurityAccessLog } from '../types';

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

  async getThreats(token?: string): Promise<ThreatLog[]> {
    return apiRequest<ThreatLog[]>('/api/admin/threats', {
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
};
