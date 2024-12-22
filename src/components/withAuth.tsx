import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { NextPage } from 'next';

const withAuth = <P extends object>(WrappedComponent: NextPage<P>) => {
  const WithAuthComponent: NextPage<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace('/login');
      }
    }, [user, loading, router]);

    if (loading) {
      return null; // Or return a loading spinner
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  // Copy getInitialProps from the wrapped component
  if (WrappedComponent.getInitialProps) {
    WithAuthComponent.getInitialProps = WrappedComponent.getInitialProps;
  }

  return WithAuthComponent;
};

export default withAuth;
