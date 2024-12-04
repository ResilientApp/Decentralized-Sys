import requests
import os

# Endpoint
url = "https://resilientfilesbackend.onrender.com/upload_and_store/"

# Required fields
data = {
    "owner_name": "Test Owner",            
    "owner_public_key": "public_key_xyz",
    "owner_private_key": "private_key_xyz"
}

file_path = os.path.join(os.path.dirname(__file__), "test_image.jpg")

try:
    with open(file_path, "rb") as file:
        # Sending as binary
        files = {
            "file": ("test_image.jpg", file, "image/jpeg")
        }

        response = requests.post(url, data=data, files=files)
        
        print("Status Code:", response.status_code)
        print("Headers:", response.headers)
        print("Response Body:", response.json())
except FileNotFoundError:
    print(f"Error: File not found at {file_path}")
except Exception as e:
    print("Error:", e)
