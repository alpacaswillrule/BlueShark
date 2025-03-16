# SafeRoute Backend API

This is the backend API for the SafeRoute application, built with FastAPI.

## Features

- RESTful API for location data
- Integration with Firebase for data storage
- External data sources for restrooms and police stations
- Background tasks for data updates

## Requirements

- Python 3.8+
- Dependencies listed in `requirements.txt`

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Make sure your Firebase configuration is set up correctly in `firebase_config.py`.

## Running the Server

You can run the server using the provided script:

```bash
./run.py
```

Or with Python:

```bash
python run.py
```

Or directly with Uvicorn:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The server will start on http://localhost:8000.

## API Documentation

Once the server is running, you can access the auto-generated API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

- `GET /api/locations` - Get locations with filtering options
- `GET /api/ratings/{location_id}` - Get ratings for a specific location
- `GET /api/external-locations` - Get external locations data
- `GET /api/debug/external-locations` - Debug endpoint for external data
- `POST /api/refresh-external-data` - Trigger a refresh of external data
- `POST /api/ratings` - Submit a new rating
