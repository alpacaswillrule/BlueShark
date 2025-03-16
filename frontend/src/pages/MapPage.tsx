import React, { useState, useEffect, useRef } from 'react';
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
  
  // Track if component is mounted
  const isMounted = useRef(true);
  
  // Set up cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Mark component as unmounted
      isMounted.current = false;
      
      // Remove any global event listeners that might have been added by Google Maps
      const googleMaps = window.google?.maps;
      if (googleMaps && googleMaps.event) {
        googleMaps.event.clearListeners(window, 'resize');
      }
    };
  }, []);

  const handleFilterChange = (newFilters: FilterOptions) => {
    if (isMounted.current) {
      setFilters(newFilters);
    }
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
