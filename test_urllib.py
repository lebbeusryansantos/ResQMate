import urllib.request
import json

url = "https://resqmate-backend.onrender.com/users/login"
data = json.dumps({"email":"masteradmin@gmail.com","password":"#Mapua2025"}).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(f"Error: {e}")
