import requests

payload = {
    "email": "masteradmin@gmail.com",
    "password": "#Mapua2025"
}
try:
    response = requests.post("https://resqmate-backend.onrender.com/users/login", json=payload)
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
