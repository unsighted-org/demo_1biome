// src/context/withAuth.tsx
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { useAuth } from './AuthContext';

export const withAuth = (WrappedComponent: React.ComponentType) => {
  return (props: any) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user && router.pathname !== '/login') {
        router.replace('/login');
      }
    }, [user, loading, router]);

    if (loading) {
      return <div>Loading...</div>; // or your custom loading component
    }

    if (!user && router.pathname !== '/login') {
      return null; // or a loading indicator
    }

    return <WrappedComponent {...props} />;
  };
};