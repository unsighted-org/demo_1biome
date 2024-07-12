// src/types/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      age: null;
      height: null;
      weight: null;
      avatarUrl: null;
      id: string;
      email: string;
      name: string;
      createdAt: string;
      connectedDevices: string[];
      // Add any other properties your user object might have
    }
  }

  interface User {
    id: string;
    email: string;
    name: string;
    password: string;
    createdAt: string;
    connectedDevices: string[];
    // Add any other properties your user object might have
  }
}