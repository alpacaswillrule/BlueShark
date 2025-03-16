from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime
import math

# Import Firebase configuration
from firebase_config import cred

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Firestore DB
db = firestore.client()

# Calculate distance between two points using Haversine formula
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of the earth in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (
        math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
        math.sin(dLon / 2) * math.sin(dLon / 2)
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c  # Distance in km
    return distance

# API Routes
@app.route('/api/locations', methods=['GET'])
def get_locations():
    try:
        # Get filter parameters
        location_type = request.args.get('type')
        rating_min = float(request.args.get('rating_min', 0))
        radius = float(request.args.get('radius', 0))
        user_lat = request.args.get('lat')
        user_lng = request.args.get('lng')
        
        # Query Firestore
        locations_ref = db.collection('locations')
        query = locations_ref
        
        # Apply type filter if provided
        if location_type and location_type != 'all':
            query = query.where('type', '==', location_type)
            
        # Execute query
        locations = []
        for doc in query.stream():
            location = doc.to_dict()
            location['id'] = doc.id
            
            # Calculate normalized rating (0-5 scale)
            if location.get('total_ratings', 0) > 0:
                positive_weight = location.get('positive_count', 0)
                negative_weight = -1 * location.get('negative_count', 0)
                total_weight = positive_weight + negative_weight
                normalized_rating = (total_weight / location['total_ratings'] + 1) / 2 * 5
                
                # Filter by minimum rating
                if normalized_rating < rating_min:
                    continue
            elif rating_min > 0:
                # Skip locations with no ratings if minimum rating is set
                continue
                
            # Filter by distance if user location is provided
            if user_lat and user_lng and radius > 0:
                try:
                    user_lat = float(user_lat)
                    user_lng = float(user_lng)
                    distance = calculate_distance(
                        user_lat, user_lng, 
                        location.get('lat', 0), location.get('lng', 0)
                    )
                    if distance > radius:
                        continue
                except (ValueError, TypeError):
                    pass  # Skip distance calculation if coordinates are invalid
                    
            locations.append(location)
            
        return jsonify(locations)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ratings/<location_id>', methods=['GET'])
def get_ratings(location_id):
    try:
        ratings_ref = db.collection('ratings')
        query = ratings_ref.where('location_id', '==', location_id).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(10)
        
        ratings = []
        for doc in query.stream():
            rating = doc.to_dict()
            rating['id'] = doc.id
            ratings.append(rating)
            
        return jsonify(ratings)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ratings', methods=['POST'])
def submit_rating():
    try:
        data = request.json
        rating_data = data.get('rating', {})
        is_new_location = data.get('isNewLocation', False)
        location_data = data.get('locationData', {})
        
        # Add timestamp to rating
        rating_data['timestamp'] = int(datetime.now().timestamp() * 1000)
        
        # Add rating to Firestore
        rating_ref = db.collection('ratings').document()
        rating_ref.set(rating_data)
        
        # Update or create location
        if is_new_location and location_data:
            # Create new location
            location_ref = db.collection('locations').document()
            
            # Initialize rating counts
            sentiment = rating_data.get('sentiment')
            location_data['positive_count'] = 1 if sentiment == 'positive' else 0
            location_data['neutral_count'] = 1 if sentiment == 'neutral' else 0
            location_data['negative_count'] = 1 if sentiment == 'negative' else 0
            location_data['total_ratings'] = 1
            
            location_ref.set(location_data)
            
            # Update the rating with the new location ID
            rating_ref.update({'location_id': location_ref.id})
            
            return jsonify({'success': True, 'location_id': location_ref.id}), 201
        else:
            # Update existing location
            location_ref = db.collection('locations').document(rating_data.get('location_id'))
            location = location_ref.get()
            
            if location.exists:
                # Update rating counts
                sentiment = rating_data.get('sentiment')
                updates = {
                    'total_ratings': firestore.Increment(1)
                }
                
                if sentiment == 'positive':
                    updates['positive_count'] = firestore.Increment(1)
                elif sentiment == 'neutral':
                    updates['neutral_count'] = firestore.Increment(1)
                elif sentiment == 'negative':
                    updates['negative_count'] = firestore.Increment(1)
                    
                location_ref.update(updates)
                
                return jsonify({'success': True}), 201
            else:
                return jsonify({'error': 'Location not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
