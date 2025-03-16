import firebase_admin
from firebase_admin import credentials

cred = credentials.Certificate("/Users/johanvlassak/Documents/saferoute-ee884-firebase-adminsdk-fbsvc-17a255c5b5.json")
firebase_admin.initialize_app(cred)
