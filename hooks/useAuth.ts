import { useState } from 'react';

// Mock user data
const MOCK_USER = {
  id: '123',
  name: 'Test User',
};

export function useAuth() {
  const [user, setUser] = useState<typeof MOCK_USER | null>(null);

  // Mock login function
  const login = () => {
    console.log('[AUTH] Mock login function called.');
    setUser(MOCK_USER);
  };

  // Mock logout function
  const logout = () => {
    setUser(null);
  };

  return { user, login, logout };
}
