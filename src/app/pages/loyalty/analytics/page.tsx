'use client'
import React, { useState } from 'react';
import UserPointsTable from '@/app/components/UserPointsTable';
import PointsRangeFilter from '@/app/components/PointsRangeFilter';
import UserRedemptionsTable from '@/app/components/UserRedemptionsTable';
import LoyaltyTransactionsTable from '@/app/components/LoyaltyTransactionsTable';
import DefaultLayout from '@/components/Layouts/DefaultLayout';

const LoyaltyAnalyticsPage = () => {
  const [minPoints, setMinPoints] = useState(0);
  const [maxPoints, setMaxPoints] = useState(Infinity);
  const [selectedRewardId, setSelectedRewardId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Handler for points range filter
  const handleFilter = (min: number, max: number) => {
    setMinPoints(min);
    setMaxPoints(max);
  };

  // Handler for selecting a reward (for demo, you may want to fetch rewards and show a dropdown)
  // Handler for selecting a user (for demo, you may want to select from table)

  return (
    <DefaultLayout>

    <div>
      <h1 className="text-2xl font-bold mb-4">Loyalty Analytics</h1>
      <PointsRangeFilter onFilter={handleFilter} />
      {/* UserPointsTable could accept minPoints/maxPoints as props and filter accordingly, or you can implement filtering in the backend */}
      <UserPointsTable />
      {/* Example usage: <UserRedemptionsTable rewardId={selectedRewardId} /> */}
      {/* Example usage: <LoyaltyTransactionsTable userId={selectedUserId} /> */}
      {/* Add dropdowns or selection UIs as needed */}
    </div>
    </DefaultLayout>
  );
};
export default LoyaltyAnalyticsPage; 