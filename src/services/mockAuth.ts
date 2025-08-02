export interface AuthError {
  code: string;
  message: string;
}

class MockAuthService {
  private currentUser: any | null = null;
  private users: Map<string, { email: string; password: string; uid: string }> = new Map();
  private listeners: ((user: any | null) => void)[] = [];

  constructor() {
    // Load users from localStorage
    const savedUsers = localStorage.getItem('mockAuth_users');
    if (savedUsers) {
      this.users = new Map(JSON.parse(savedUsers));
    }

    // Load current user from localStorage
    const savedUser = localStorage.getItem('mockAuth_currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  private saveUsers() {
    localStorage.setItem('mockAuth_users', JSON.stringify(Array.from(this.users.entries())));
  }

  private saveCurrentUser() {
    if (this.currentUser) {
      localStorage.setItem('mockAuth_currentUser', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('mockAuth_currentUser');
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<{ user: any }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.users.has(email)) {
          reject({
            code: 'auth/email-already-in-use',
            message: 'The email address is already in use by another account.'
          });
          return;
        }

        if (password.length < 6) {
          reject({
            code: 'auth/weak-password',
            message: 'Password should be at least 6 characters.'
          });
          return;
        }

        const uid = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const user: any = {
          uid,
          email,
          displayName: email.split('@')[0]
        };

        this.users.set(email, { email, password, uid });
        this.currentUser = user;
        this.saveUsers();
        this.saveCurrentUser();
        this.notifyListeners();

        resolve({ user });
      }, 500); // Simulate network delay
    });
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: any }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userData = this.users.get(email);
        
        if (!userData) {
          reject({
            code: 'auth/user-not-found',
            message: 'There is no user record corresponding to this identifier.'
          });
          return;
        }

        if (userData.password !== password) {
          reject({
            code: 'auth/wrong-password',
            message: 'The password is invalid or the user does not have a password.'
          });
          return;
        }

        const user: any = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.email.split('@')[0]
        };

        this.currentUser = user;
        this.saveCurrentUser();
        this.notifyListeners();

        resolve({ user });
      }, 500); // Simulate network delay
    });
  }

  async signOut(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        this.saveCurrentUser();
        this.notifyListeners();
        resolve();
      }, 300);
    });
  }

  onAuthStateChanged(callback: (user: any | null) => void): () => void {
    this.listeners.push(callback);
    
    // Call immediately with current state
    setTimeout(() => callback(this.currentUser), 0);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getCurrentUser(): any | null {
    return this.currentUser;
  }
}

// export const mockAuth = new MockAuthService();