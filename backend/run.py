#!/usr/bin/env python3
"""
Simple script to run the FastAPI server with Uvicorn.
"""
import uvicorn

if __name__ == "__main__":
    print("Starting SafeRoute API server...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
