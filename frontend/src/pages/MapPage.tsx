import React, { useState, useEffect, useRef, useCallback } from 'react';
import MapComponent from '../components/Map';
import FilterControls from '../components/FilterControls';
import { FilterOptions } from '../types';
import { refreshExternalData } from '../services/api';
import '../styles/MapPage.css';

const MapPage: React.FC = () => {
  // Use a key to force re-render of the Map component
  const [mapKey, setMapKey] = useState<number>(0);
  
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

  // Handle filter changes with a more direct approach
  const handleFilterChange = useCallback((newFilters: FilterOptions, includeExt: boolean = true) => {
    if (isMounted.current) {
      console.log('Filter changed:', newFilters);
      
      // Update filters state
      setFilters(newFilters);
      setIncludeExternal(includeExt);
      
      // Force re-render of the Map component by changing its key
      setMapKey(prevKey => prevKey + 1);
    }
  }, []);

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
        {/* Use key to force re-render when filters change */}
        <MapComponent 
          key={mapKey} 
          filters={filters} 
          includeExternal={includeExternal} 
        />
      </div>
    </div>
  );
};

export default MapPage;
