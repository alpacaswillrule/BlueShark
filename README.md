# Blue Shark

Blue Shark is a web application that helps users find and rate queer-friendly spaces in their community. The application displays a map with pins for public restrooms, restaurants, and police departments, allowing users to see ratings and submit their own experiences.

## Features

- Interactive map showing queer-friendly locations
- Filter locations by type, rating, and distance
- Submit ratings and reports for locations
- View detailed information and comments for each location
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React, TypeScript, Google Maps API
- **Backend**: Flask (Python)
- **Database**: Firebase Firestore
- **Styling**: CSS

## Project Structure

```
SafeRoute/
├── backend/               # Flask backend
│   ├── app.py             # Main Flask application
│   ├── firebase_config.py # Firebase configuration
│   └── requirements.txt   # Python dependencies
│
└── frontend/              # React frontend
    ├── public/            # Static files
    │   └── custom_icons/  # Custom map marker icons
    ├── src/               # Source code
    │   ├── components/    # React components
    │   ├── pages/         # Page components
    │   ├── services/      # API services
    │   ├── styles/        # CSS files
    │   ├── types/         # TypeScript interfaces
    │   └── utils/         # Utility functions
    ├── package.json       # NPM dependencies
    └── tsconfig.json      # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Google Maps API key
- Firebase project with Firestore database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/SafeRoute.git
   cd SafeRoute
   ```

2. Set up the backend:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in the frontend directory with your Google Maps API key:
   ```
   API_ENV_KEY=your_google_maps_api_key
   ```

5. Add your Firebase service account credentials for the backend.

### Running the Application

1. Start the backend server:
   ```
   cd backend
   python app.py
   ```

2. In a separate terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Custom Icons

To add custom icons for map markers:

1. Create PNG images for each location type
2. Name them according to the location type: `restroom.png`, `restaurant.png`, `police.png`
3. Place them in the `frontend/public/custom_icons/` directory

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
