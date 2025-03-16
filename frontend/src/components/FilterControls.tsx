import React, { useState, useEffect } from 'react';
import { FilterOptions, MapViewType } from '../types';
import '../styles/FilterControls.css';

interface FilterControlsProps {
  onFilterChange: (filters: FilterOptions, includeExternal?: boolean) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ onFilterChange }) => {
  const [locationType, setLocationType] = useState<MapViewType>('all');
  const [ratingMin, setRatingMin] = useState<number>(0);
  const [radius, setRadius] = useState<number>(10); // Default 10km radius
  const [includeExternal, setIncludeExternal] = useState<boolean>(true); // Default to include external data

  // Update filters when any filter option changes
  useEffect(() => {
    const filters: FilterOptions = {
      type: locationType === 'all' ? null : locationType,
      rating_min: ratingMin,
      radius: radius
    };
    
    onFilterChange(filters, includeExternal);
  }, [locationType, ratingMin, radius, includeExternal, onFilterChange]);

  return (
    <div className="filter-controls">
      <h3>Filters</h3>
      
      <div className="filter-section">
        <label>Location Type</label>
        <div className="button-group">
          <button 
            className={locationType === 'all' ? 'active' : ''} 
            onClick={() => setLocationType('all')}
          >
            All
          </button>
          <button 
            className={locationType === 'restroom' ? 'active' : ''} 
            onClick={() => setLocationType('restroom')}
          >
            Restrooms
          </button>
          <button 
            className={locationType === 'restaurant' ? 'active' : ''} 
            onClick={() => setLocationType('restaurant')}
          >
            Restaurants
          </button>
          <button 
            className={locationType === 'police' ? 'active' : ''} 
            onClick={() => setLocationType('police')}
          >
            Police
          </button>
        </div>
      </div>
      
      <div className="filter-section">
        <label htmlFor="rating-slider">Minimum Rating: {ratingMin.toFixed(1)}</label>
        <input
          id="rating-slider"
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={ratingMin}
          onChange={(e) => setRatingMin(parseFloat(e.target.value))}
          className="slider"
        />
      </div>
      
      <div className="filter-section">
        <label htmlFor="radius-slider">Distance: {radius} km</label>
        <input
          id="radius-slider"
          type="range"
          min="1"
          max="50"
          step="1"
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="slider"
        />
      </div>
      
      <div className="filter-section">
        <label>Data Sources</label>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeExternal}
              onChange={(e) => setIncludeExternal(e.target.checked)}
            />
            Include External Data
          </label>
          <div className="help-text">
            Show data from Refuge Restrooms, GoWeeWee, and police stations CSV
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
