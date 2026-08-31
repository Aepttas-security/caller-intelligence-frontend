import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  async getUserProfile() {
    const data = await AsyncStorage.getItem('user_profile');
    return data ? JSON.parse(data) : null;
  },
  async setUserProfile(profile: any) {
    await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
    this.notify('user_profile');
  },
  async getAuthToken() {
    return await AsyncStorage.getItem('auth_token');
  },
  async setAuthToken(token: string) {
    await AsyncStorage.setItem('auth_token', token);
  },
  async getAssignedRole() {
    return await AsyncStorage.getItem('assigned_role');
  },
  async setAssignedRole(role: string) {
    await AsyncStorage.setItem('assigned_role', role);
  },
  async getLinkedChild() {
    const data = await AsyncStorage.getItem('linked_child');
    return data ? JSON.parse(data) : null;
  },
  async setLinkedChild(child: any) {
    await AsyncStorage.setItem('linked_child', JSON.stringify(child));
  },
  async setChildId(id: string) {
    await AsyncStorage.setItem('child_id', id);
  },
  async saveRegisteredAccount(account: any) {
    const accounts = await AsyncStorage.getItem('registered_accounts');
    const list = accounts ? JSON.parse(accounts) : [];
    list.push(account);
    await AsyncStorage.setItem('registered_accounts', JSON.stringify(list));
  },

  // Simple pub-sub for storage changes
  listeners: {} as Record<string, Function[]>,
  subscribe(key: string, callback: Function) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(callback);
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  },
  notify(key: string) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(cb => cb());
    }
  }
};
