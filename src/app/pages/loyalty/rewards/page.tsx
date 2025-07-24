'use client'
import React, { useState } from 'react';
import RoyaltyPointsTable from '@/app/components/RewardsTable';
import AddRoyaltyPointModal from '@/app/components/AddRewardModal';
import { RoyaltyBonus } from '@/interfaces/interfaces';
import DefaultLayout from '@/components/Layouts/DefaultLayout';

const RoyaltyPointsPage = () => {
  const [royaltyPoints, setRoyaltyPoints] = useState<RoyaltyBonus[]>([]);
  const [refresh, setRefresh] = useState(0);

  // Handler to add new loyalty point to the table
  const handleRoyaltyPointAdded = (royaltyPoint: RoyaltyBonus) => {
    setRoyaltyPoints(prev => [royaltyPoint, ...prev]);
    setRefresh(r => r + 1); // force table refresh if needed
  };

  return (
    <DefaultLayout>
      <div className='px-2 py-4 md:py-8 md:px-4'>
       <div className='w-full flex justify-between'>
       <h1 className="text-2xl text-primary font-bold mb-4">Manage Loyalty Bonuses</h1>
       <AddRoyaltyPointModal onRoyaltyPointAdded={handleRoyaltyPointAdded} />
        </div> 
        <RoyaltyPointsTable key={refresh} />
      </div>
    </DefaultLayout>
  );
};
export default RoyaltyPointsPage; 