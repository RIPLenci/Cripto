import { apiRequest } from './api';
import { ChatRoom } from '../types';

export const roomService = {
  async getRooms(token?: string): Promise<ChatRoom[]> {
    return apiRequest<ChatRoom[]>('/api/rooms/list', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async createRoom(name: string, isPrivate: boolean = false, token?: string): Promise<ChatRoom> {
    return apiRequest<ChatRoom>('/api/rooms/create', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ name, isPrivate }),
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
