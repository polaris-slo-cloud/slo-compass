from flask import Flask, send_from_directory
from prometheus_flask_exporter import PrometheusMetrics, NO_PREFIX
import time
import random
import os

min_request_duration_ms = 5
max_request_duration_ms = 50

app = Flask(__name__)
metrics = PrometheusMetrics(app, defaults_prefix=NO_PREFIX)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def get_static_files(path):
    return send_from_directory('http', 'index.html') if path == '' else send_from_directory('http', path)

metrics.register_default()

if __name__ == "__main__":
    port = int(os.environ.get('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', port=port)