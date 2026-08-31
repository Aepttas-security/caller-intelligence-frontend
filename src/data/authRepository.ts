// src/data/authRepository.ts
import { CONFIG } from '../constants/Config';

const API_URL = CONFIG.API_URL;

export interface AuthError {
  message: string;
}

export interface LoginResponse {
  user_id: number;
  name: string;
  email: string;
  message: string;
}

export interface RegisterResponse {
  user_id: number;
  name: string;
  email: string;
  message: string;
}

export const loginUser = async (credentials: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(credentials),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        throw { message: data.detail || 'Login failed' };
      }
      console.log('User logged in:', data);
      return data;
    } else {
      const text = await response.text();
      console.error("Non-JSON login response:", text.substring(0, 200));
      throw { message: "Server returned an invalid response format. Please ensure the backend is running." };
    }
  } catch (error) {
    if ((error as any).message) throw error;
    console.error('Login error:', error);
    throw { message: 'Network error. Please check your connection.' };
  }
};

export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(userData),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        throw { message: data.detail || 'Registration failed' };
      }
      console.log('User registered:', data);
      return data;
    } else {
      const text = await response.text();
      console.error("Non-JSON registration response:", text.substring(0, 200));
      throw { message: "Server returned an invalid response format. Please ensure the backend is running." };
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw { message: 'Network error. Please check your connection.' };
  }
};
