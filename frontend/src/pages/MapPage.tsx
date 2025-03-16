import React, { useState } from 'react';
import Map from '../components/Map';
import FilterControls from '../components/FilterControls';
import { FilterOptions } from '../types';
import '../styles/MapPage.css';

const MapPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    type: null,
    rating_min: 0,
    radius: 10
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="map-page">
      <div className="sidebar">
        <FilterControls onFilterChange={handleFilterChange} />
      </div>
      <div className="map-container">
        <Map filters={filters} />
      </div>
    </div>
  );
};

export default MapPage;
