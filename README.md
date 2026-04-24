# Pothole Detection System

A real-time pothole detection system using YOLOv8 for road safety monitoring.

## Features

- Real-time pothole detection using computer vision
- GPS location tracking (placeholder for hardware integration)
- Web dashboard for monitoring detected potholes
- Data logging and status management

## Technologies Used

- Python 3.12
- YOLOv8 (Ultralytics)
- OpenCV
- Flask
- HTML/CSS/JavaScript

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pothole-detection.git
   cd pothole-detection
   ```

2. Install dependencies:
   ```bash
   pip install ultralytics opencv-python flask
   ```
   Or if using Pipenv:
   ```bash
   pipenv install
   ```

3. Download YOLOv8 model weights (yolov8n.pt) or use the provided best.pt

## Usage

### Camera Detection
Run the camera detection script:
```bash
python camera_test.py
```

### Dashboard
Start the web dashboard:
```bash
python dashboard.py
```
Then open http://localhost:5000 in your browser.

## Project Structure

- `camera_test.py`: Main detection script
- `dashboard.py`: Flask web application
- `Dataset/`: Training data
- `static/`: CSS and JS files
- `templates/`: HTML templates
- `best.pt`: Trained model weights

## Future Enhancements

- Hardware integration (GPS, GSM modules)
- Cloud storage for images
- Mobile app interface
- Advanced analytics

## Contributing

Feel free to fork and contribute!

## License

MIT License