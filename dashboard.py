from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__)

METADATA_FILE = 'pothole_metadata.json'

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/captures/<path:filename>')
def serve_capture(filename):
    return send_from_directory('captures', filename)

@app.route('/get_potholes')
def get_potholes():
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r') as f:
            pothole_data = json.load(f)
    else:
        pothole_data = []
    
    # Sort by timestamp descending (newest first)
    pothole_data.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
    return jsonify(pothole_data)

@app.route('/update_status', methods=['POST'])
def update_status():
    data = request.get_json()
    pothole_id = data['id']
    new_status = data['status']
    
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r') as f:
            pothole_data = json.load(f)
        for pothole in pothole_data:
            if pothole['id'] == pothole_id:
                pothole['status'] = new_status
                break
        with open(METADATA_FILE, 'w') as f:
            json.dump(pothole_data, f, indent=4)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)