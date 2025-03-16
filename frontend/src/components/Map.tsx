import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Location, Rating, FilterOptions } from '../types';
import { getLocations, getRatings } from '../services/api';
import '../styles/InfoWindow.css';

// Get Google Maps API key from environment variables
const googleMapsApiKey = process.env.REACT_APP_API_ENV_KEY || '';

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (can be updated with user's location)
const defaultCenter = {
  lat: 40.7128, // New York City
  lng: -74.0060
};

// Custom map styles for Blue Shark theme
const mapStyles = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#ADD8E6' }] // Light blue water
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }] // White landscape
  },
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ color: '#FFC0CB' }] // Pink POI icons
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ color: '#FFC0CB' }] // Pink transit icons
  }
];

interface MapProps {
  filters: FilterOptions;
}

const Map: React.FC<MapProps> = ({ filters }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationRatings, setLocationRatings] = useState<Rating[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch locations when filters change
  useEffect(() => {
    const fetchLocations = async () => {
      if (userLocation) {
        const data = await getLocations(filters, userLocation.lat, userLocation.lng);
        setLocations(data);
      } else {
        const data = await getLocations(filters);
        setLocations(data);
      }
    };

    fetchLocations();
  }, [filters, userLocation]);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Error getting location');
        }
      );
    }
  }, []);

  // Fetch ratings when a location is selected
  useEffect(() => {
    const fetchRatings = async () => {
      if (selectedLocation) {
        const ratings = await getRatings(selectedLocation.id);
        setLocationRatings(ratings);
      }
    };

    fetchRatings();
  }, [selectedLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    map.setOptions({
      styles: mapStyles
    });
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calculate the normalized rating (0-5 scale)
  const calculateRating = (location: Location): number => {
    if (location.total_ratings === 0) return 0;
    
    const positiveWeight = location.positive_count;
    const negativeWeight = -1 * location.negative_count;
    const totalWeight = positiveWeight + negativeWeight;
    
    return (totalWeight / location.total_ratings + 1) / 2 * 5;
  };

  // Get marker icon based on location type
  const getMarkerIcon = (type: string): string => {
    // Try to use custom icons from the custom_icons folder
    // Fall back to default markers if custom icons are not available
    const customIconPath = `/custom_icons/${type}.png`;
    
    // Create an image element to check if the custom icon exists
    const img = new Image();
    img.src = customIconPath;
    
    // If the custom icon exists, use it
    if (img.complete) {
      return customIconPath;
    }
    
    // Otherwise, use default markers
    switch (type) {
      case 'restroom':
        return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      case 'restaurant':
        return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
      case 'police':
        return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
      default:
        return 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';
    }
  };

  // Render the map
  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={userLocation || defaultCenter}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {/* Render location markers */}
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={{ lat: location.lat, lng: location.lng }}
          icon={getMarkerIcon(location.type)}
          onClick={() => setSelectedLocation(location)}
        />
      ))}

      {/* Render info window for selected location */}
      {selectedLocation && (
        <InfoWindow
          position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
          onCloseClick={() => setSelectedLocation(null)}
        >
          <div className="info-window">
            <h3>{selectedLocation.name}</h3>
            <p>{selectedLocation.address}</p>
            <p>
              Rating: {calculateRating(selectedLocation).toFixed(1)} / 5
              ({selectedLocation.total_ratings} ratings)
            </p>
            <div className="rating-breakdown">
              <div>Positive: {selectedLocation.positive_count}</div>
              <div>Neutral: {selectedLocation.neutral_count}</div>
              <div>Negative: {selectedLocation.negative_count}</div>
            </div>
            <h4>Recent Comments:</h4>
            <div className="comments">
              {locationRatings.length > 0 ? (
                locationRatings
                  .filter(rating => rating.comment)
                  .slice(0, 3)
                  .map(rating => (
                    <div key={rating.id} className="comment">
                      <div className={`sentiment ${rating.sentiment}`}>
                        {rating.sentiment}
                      </div>
                      <div className="comment-text">{rating.comment}</div>
                    </div>
                  ))
              ) : (
                <p>No comments yet.</p>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  ) : (
    <div>Loading Map...</div>
  );
};

export default Map;
