from flask import Flask
import time
import random
import os

min_request_duration_ms = 5
max_request_duration_ms = 50

app = Flask(__name__)

@app.get("/api/rain-prediction")
def get_rain_prediction():
    wait_time = random.randint(min_request_duration_ms, max_request_duration_ms)
    time.sleep(wait_time / 100.0)

    # 25% possibility that it returns precipation between 1mm and 100mm
    if random.random() > 0.75:
        return random.randint(1, 100)

    # Else we return no precipation
    return 0

if __name__ == "__main__":
    port = int(os.environ.get('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', port=port)