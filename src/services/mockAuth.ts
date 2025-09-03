export interface MockAuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  };
  error?: string;
}

export class MockAuthService {
  // Mock Google OAuth authentication
  static async signInWithGoogle(): Promise<MockAuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate successful Google OAuth
    return {
      success: true,
      user: {
        id: `google_user_${Date.now()}`,
        email: 'user@gmail.com',
        displayName: 'Google User',
        photoURL: 'https://via.placeholder.com/40',
      }
    };
  }

  // Mock sign out
  static async signOut(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Mock sign out completed');
  }

  // Mock get current user
  static getCurrentUser(): any {
    return null;
  }

  // Mock auth state listener
  static onAuthStateChanged(callback: (user: any) => void) {
    // Simulate no current user
    callback(null);
    return () => {}; // Return unsubscribe function
  }
}
