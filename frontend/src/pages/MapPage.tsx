import React, { useState, useEffect, useRef } from 'react';
import MapComponent from '../components/Map';
import FilterControls from '../components/FilterControls';
import { FilterOptions } from '../types';
import { refreshExternalData } from '../services/api';
import '../styles/MapPage.css';

const MapPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    type: null,
    rating_min: 0,
    radius: 10
  });
  const [includeExternal, setIncludeExternal] = useState<boolean>(true);
  
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

  const handleFilterChange = (newFilters: FilterOptions, includeExt: boolean = true) => {
    if (isMounted.current) {
      setFilters(newFilters);
      setIncludeExternal(includeExt);
    }
  };

  // Refresh external data when the component mounts
  useEffect(() => {
    refreshExternalData();
  }, []);

  return (
    <div className="map-page">
      <div className="sidebar">
        <FilterControls onFilterChange={handleFilterChange} />
      </div>
      <div className="map-container">
        <MapComponent filters={filters} includeExternal={includeExternal} />
      </div>
    </div>
  );
};

export default MapPage;
