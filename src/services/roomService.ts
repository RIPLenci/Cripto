import { apiRequest } from './api';
import { ChatRoom } from '../types';

export const roomService = {
  async getRooms(token?: string): Promise<ChatRoom[]> {
    return apiRequest<ChatRoom[]>('/api/rooms/list', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async createRoom(name: string, accessMode: 'open' | 'closed' | 'global' = 'global', description?: string, token?: string): Promise<ChatRoom> {
    return apiRequest<ChatRoom>('/api/rooms/create', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ name, accessMode, isPrivate: accessMode !== 'global', description }),
    });
  },

  async updateAccessMode(roomId: string, accessMode: 'open' | 'closed' | 'global', token?: string): Promise<{ message: string; room: ChatRoom }> {
    return apiRequest<{ message: string; room: ChatRoom }>('/api/rooms/update-access-mode', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ roomId, accessMode }),
    });
  },

  async joinRoomByCode(code: string, token?: string): Promise<ChatRoom> {
    return apiRequest<ChatRoom>('/api/rooms/join-code', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ code }),
    });
  },
};
