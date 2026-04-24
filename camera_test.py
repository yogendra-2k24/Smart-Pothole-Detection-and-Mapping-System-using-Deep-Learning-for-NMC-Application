import cv2
from ultralytics import YOLO 
import time
import os
import json
import random

# --- Placeholder Functions (When hardware is available) ---

def get_gps_location():
    # This function will read data from a GPS module
    # For now we return dummy data with slight jitter to map multiple distinct points
    lat = 21.1458 + random.uniform(-0.005, 0.005)
    lon = 79.0882 + random.uniform(-0.005, 0.005)
    print("GPS: Reading location...")
    return f"{lat:.5f} N, {lon:.5f} E"

def send_to_server(image_path, location):
    # This function will command a GSM module to send data to a server
    print(f"GSM: Sending data to server...")
    print(f"Location: {location}")
    print(f"Image saved at: {image_path}")
    print("---------------------------------")
    # Actual network/send code will go here
    pass

# --------------------------------------------------

# Load model
model = YOLO('best.pt')

# Webcam or video source
source = 1 # 1 for USB webcam (0 is usually built-in laptop camera)
#source = 'Dataset/sample_video.mp4'

# Cooldown time (to avoid taking many photos of the same pothole)
last_capture_time = 0
capture_cooldown = 3 # One photo per 5 seconds

# Metadata file
metadata_file = 'pothole_metadata.json'

# Load existing metadata or create empty list
if os.path.exists(metadata_file):
    with open(metadata_file, 'r') as f:
        pothole_data = json.load(f)
else:
    pothole_data = []

# Loop through detection results
for result in model.predict(source, stream=True, show=False):
    
    # Save the original frame before calling 'plot()'
    original_frame = result.orig_img 
    
    # 'plot()' draws bounding boxes for display
    display_frame = result.plot() 
    
    # Check whether anything was detected in this frame
    if len(result.boxes) > 0:
        
        current_time = time.time()
        
        # Check cooldown
        if current_time - last_capture_time > capture_cooldown:
            
            # Take coordinates of the first detected pothole only
            box = result.boxes[0].xyxy[0].cpu().numpy().astype(int)
            x1, y1, x2, y2 = box
            
            # === STEP 1: Crop the pothole ===
            cropped_pothole_image = original_frame[y1:y2, x1:x2]
            
            # Save the cropped image
            image_filename = f"captures/pothole_{int(current_time)}.jpg"
            os.makedirs('captures', exist_ok=True) # Create folder if missing
            cv2.imwrite(image_filename, cropped_pothole_image)
            
            # === STEP 2: Detect location ===
            current_location = get_gps_location()
            
            # === STEP 3: Send to server ===
            send_to_server(image_filename, current_location)
            
            # Save metadata
            pothole_entry = {
                'id': len(pothole_data) + 1,
                'image_path': image_filename,
                'location': current_location,
                'timestamp': current_time,
                'status': 'reported'  # default status
            }
            pothole_data.append(pothole_entry)
            with open(metadata_file, 'w') as f:
                json.dump(pothole_data, f, indent=4)
            
            # Update cooldown timestamp
            last_capture_time = current_time

    # Display the detection window (commented out for headless)
    cv2.imshow('Pothole Detection (Press Q to quit)', display_frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cv2.destroyAllWindows()