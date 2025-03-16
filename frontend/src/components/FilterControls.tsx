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
  // Handle location type change with direct feedback
  const handleLocationTypeChange = (type: MapViewType) => {
    console.log(`Changing location type to: ${type}`);
    setLocationType(type);
    
    // Directly trigger filter change for immediate effect
    const filters: FilterOptions = {
      type: type === 'all' ? null : type,
      rating_min: ratingMin,
      radius: radius
    };
    
    onFilterChange(filters, includeExternal);
  };

  // Update filters when any filter option changes
  useEffect(() => {
    console.log(`Filter effect triggered`);
    
    const filters: FilterOptions = {
      type: locationType === 'all' ? null : locationType,
      rating_min: ratingMin,
      radius: radius
    };
    
    onFilterChange(filters, includeExternal);
  }, [ratingMin, radius, includeExternal, onFilterChange]);

  return (
    <div className="filter-controls">
      <h3>Filters</h3>
      
      <div className="filter-section">
        <label>Location Type</label>
        <div className="button-group">
          <button 
            className={locationType === 'all' ? 'active' : ''} 
            onClick={() => handleLocationTypeChange('all')}
            style={{ 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            All
            {locationType === 'all' && (
              <span 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(255,255,255,0.3)',
                  animation: 'ripple 0.6s linear'
                }}
              />
            )}
          </button>
          <button 
            className={locationType === 'restroom' ? 'active' : ''} 
            onClick={() => handleLocationTypeChange('restroom')}
            style={{ 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            Restrooms
            {locationType === 'restroom' && (
              <span 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(255,255,255,0.3)',
                  animation: 'ripple 0.6s linear'
                }}
              />
            )}
          </button>
          <button 
            className={locationType === 'restaurant' ? 'active' : ''} 
            onClick={() => handleLocationTypeChange('restaurant')}
            style={{ 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            Restaurants
            {locationType === 'restaurant' && (
              <span 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(255,255,255,0.3)',
                  animation: 'ripple 0.6s linear'
                }}
              />
            )}
          </button>
          <button 
            className={locationType === 'police' ? 'active' : ''} 
            onClick={() => handleLocationTypeChange('police')}
            style={{ 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            Police
            {locationType === 'police' && (
              <span 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(255,255,255,0.3)',
                  animation: 'ripple 0.6s linear'
                }}
              />
            )}
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
          onChange={(e) => {
            setRatingMin(parseFloat(e.target.value));
          }}
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
          onChange={(e) => {
            setRadius(parseInt(e.target.value));
          }}
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
              onChange={(e) => {
                setIncludeExternal(e.target.checked);
              }}
            />
            Include External Data
          </label>
          <div className="help-text">
            Show data from Refuge Restrooms and police stations CSV
          </div>
        </div>
      </div>
      
      {/* Add ripple animation */}
      <style>
        {`
          @keyframes ripple {
            0% {
              transform: scale(0);
              opacity: 1;
            }
            100% {
              transform: scale(4);
              opacity: 0;
            }
          }
        `}
      </style>
      
    </div>
  );
};

export default FilterControls;
