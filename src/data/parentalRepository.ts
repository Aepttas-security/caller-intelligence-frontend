import api from '../services/api';

export const ParentalRepository = {
  async listChildren() {
    try {
      // In a real app, this would fetch from the backend
      // For now, returning an empty list as placeholder
      return [];
    } catch (error) {
      console.error('Error listing children:', error);
      throw error;
    }
  },

  async getActiveSOS(childId: string) {
    try {
      // Logic to check if child has triggered SOS
      return { is_panic_active: false };
    } catch (error) {
      console.error('Error checking SOS status:', error);
      return { is_panic_active: false };
    }
  },

  async resolveSOS(childId: string) {
    try {
      return { success: true };
    } catch (error) {
      console.error('Error resolving SOS:', error);
      throw error;
    }
  },

  async checkParentLinked(userId: number) {
    try {
      // Check if parent has any linked child devices
      return { is_linked: false, linked_child: null };
    } catch (error) {
      console.error('Error checking parent linkage:', error);
      return { is_linked: false, linked_child: null };
    }
  },

  async unlinkChildDevice(childId: string) {
    try {
      return { success: true };
    } catch (error) {
      console.error('Error unlinking child device:', error);
      throw error;
    }
  },

  async generateParentLinkingCode(userId: number) {
    try {
      // Generate a 6-digit code for child linking
      return { linking_code: '582-914' };
    } catch (error) {
      console.error('Error generating linking code:', error);
      throw error;
    }
  },

  async checkPairingStatusByCode(code: string) {
    try {
      return { status: 'PENDING' };
    } catch (error) {
      console.error('Error checking pairing status:', error);
      return { status: 'ERROR' };
    }
  }
};
