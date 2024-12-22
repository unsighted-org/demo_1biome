import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSelector } from '@/store';
import { useHealth } from '@/contexts/HealthContext';
import DashboardErrorBoundary from '../components/DashboardWithErrorBoundary';
import { MAX_PAGES } from '@/constants';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { LoadingTimeoutError } from '@/components/LoadingTimeoutError';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pageNumber, setPageNumber] = useState(1);
  const { loading, error, fetchHealthData } = useHealth();
  const { data: healthData, scores: healthScores, regionalComparison } = useAppSelector((state) => state.health);

  const hasTimedOut = useLoadingTimeout({ 
    isLoading: authLoading,
    timeoutMs: 5000 // 5 seconds for profile load
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchHealthData();
    }
  }, [user, pageNumber, fetchHealthData]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= MAX_PAGES) {
      setPageNumber(newPage);
    }
  };

  if (hasTimedOut) {
    return <LoadingTimeoutError message="Loading profile data is taking longer than expected." />;
  }

  if (authLoading || loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!user || !healthData.length || !healthScores || !regionalComparison) {
    return <div>No health data available.</div>;
  }

  return (
    <DashboardErrorBoundary
      user={user}
      healthData={healthData}
      healthScores={healthScores}
      regionalComparison={regionalComparison}
      onPageChange={handlePageChange}
      currentPage={pageNumber}
      totalPages={MAX_PAGES}
    />
  );
};

export default ProfilePage;
