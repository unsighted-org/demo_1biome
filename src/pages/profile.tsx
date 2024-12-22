import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSelector } from '@/store';
import { useHealth } from '@/contexts/HealthContext';
import DashboardErrorBoundary from '../components/DashboardWithErrorBoundary';
import { MAX_PAGES } from '@/constants';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pageNumber, setPageNumber] = useState(1);
  const { loading, error, fetchHealthData } = useHealth();
  const { data: healthData, scores: healthScores, regionalComparison } = useAppSelector((state) => state.health);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchHealthData(pageNumber);
    }
  }, [user, pageNumber, fetchHealthData]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= MAX_PAGES) {
      setPageNumber(newPage);
    }
  };

  if (authLoading || loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
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
