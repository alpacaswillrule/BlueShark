import React, { useState } from 'react';
import { submitRating } from '../services/api';
import '../styles/RatingForm.css';

interface RatingFormProps {
  locationId?: string;
  locationName?: string;
  onSubmitSuccess?: () => void;
}

const RatingForm: React.FC<RatingFormProps> = ({
  locationId,
  locationName,
  onSubmitSuccess
}) => {
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral');
  const [comment, setComment] = useState('');
  const [isNewLocation, setIsNewLocation] = useState(!locationId);
  const [newLocationName, setNewLocationName] = useState(locationName || '');
  const [newLocationType, setNewLocationType] = useState<'restroom' | 'restaurant' | 'police'>('restaurant');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationLat, setNewLocationLat] = useState<number | ''>('');
  const [newLocationLng, setNewLocationLng] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get current location for new locations
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewLocationLat(position.coords.latitude);
          setNewLocationLng(position.coords.longitude);
        },
        () => {
          setError('Error getting your location. Please enter coordinates manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please enter coordinates manually.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (isNewLocation) {
        if (!newLocationName.trim()) {
          throw new Error('Please enter a location name');
        }
        if (!newLocationAddress.trim()) {
          throw new Error('Please enter a location address');
        }
        if (newLocationLat === '' || newLocationLng === '') {
          throw new Error('Please provide location coordinates');
        }
      }

      // Prepare rating data
      const ratingData = {
        location_id: locationId || 'temp-id', // Will be updated by backend for new locations
        sentiment,
        comment: comment.trim() || undefined
      };

      // Prepare location data for new locations
      const locationData = isNewLocation
        ? {
            name: newLocationName.trim(),
            type: newLocationType,
            address: newLocationAddress.trim(),
            lat: typeof newLocationLat === 'number' ? newLocationLat : parseFloat(newLocationLat),
            lng: typeof newLocationLng === 'number' ? newLocationLng : parseFloat(newLocationLng)
          }
        : undefined;

      // Submit rating
      const result = await submitRating(ratingData, isNewLocation, locationData);

      if (result) {
        setSuccess(true);
        // Reset form
        setSentiment('neutral');
        setComment('');
        if (isNewLocation) {
          setNewLocationName('');
          setNewLocationAddress('');
          setNewLocationLat('');
          setNewLocationLng('');
        }
        // Notify parent component
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        throw new Error('Failed to submit rating. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rating-form-container">
      <h2>Submit a Rating</h2>
      
      {success ? (
        <div className="success-message">
          <p>Thank you for your feedback!</p>
          <button 
            className="submit-button"
            onClick={() => setSuccess(false)}
          >
            Submit Another Rating
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rating-form">
          {isNewLocation ? (
            <div className="form-section">
              <h3>New Location Details</h3>
              
              <div className="form-group">
                <label htmlFor="location-name">Location Name *</label>
                <input
                  id="location-name"
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="location-type">Location Type *</label>
                <select
                  id="location-type"
                  value={newLocationType}
                  onChange={(e) => setNewLocationType(e.target.value as any)}
                  required
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="restroom">Public Restroom</option>
                  <option value="police">Police Department</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="location-address">Address *</label>
                <input
                  id="location-address"
                  type="text"
                  value={newLocationAddress}
                  onChange={(e) => setNewLocationAddress(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group coordinates">
                <div>
                  <label htmlFor="location-lat">Latitude *</label>
                  <input
                    id="location-lat"
                    type="number"
                    step="any"
                    value={newLocationLat}
                    onChange={(e) => setNewLocationLat(e.target.value ? parseFloat(e.target.value) : '')}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="location-lng">Longitude *</label>
                  <input
                    id="location-lng"
                    type="number"
                    step="any"
                    value={newLocationLng}
                    onChange={(e) => setNewLocationLng(e.target.value ? parseFloat(e.target.value) : '')}
                    required
                  />
                </div>
                
                <button 
                  type="button" 
                  className="location-button"
                  onClick={getCurrentLocation}
                >
                  Use My Location
                </button>
              </div>
            </div>
          ) : (
            <div className="form-section">
              <h3>Rating for: {locationName}</h3>
            </div>
          )}
          
          <div className="form-section">
            <h3>Your Rating</h3>
            
            <div className="sentiment-buttons">
              <button
                type="button"
                className={`sentiment-button ${sentiment === 'positive' ? 'active' : ''}`}
                onClick={() => setSentiment('positive')}
              >
                Positive
              </button>
              
              <button
                type="button"
                className={`sentiment-button ${sentiment === 'neutral' ? 'active' : ''}`}
                onClick={() => setSentiment('neutral')}
              >
                Neutral
              </button>
              
              <button
                type="button"
                className={`sentiment-button ${sentiment === 'negative' ? 'active' : ''}`}
                onClick={() => setSentiment('negative')}
              >
                Negative
              </button>
            </div>
            
            <div className="form-group">
              <label htmlFor="comment">Comment (Optional)</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Share your experience..."
              />
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </form>
      )}
    </div>
  );
};

export default RatingForm;
