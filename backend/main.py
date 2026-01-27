import httpx
import time
import os

# 1. Your Railway URL
URL = "https://lifeos-production-4154.up.railway.app/api/ingest"

def get_system_metrics():
    """
    Grabs a real metric from your computer to simulate a 'Focus' sensor.
    High CPU usage usually correlates with high cognitive load/multitasking.
    """
    try:
        # Simple cross-platform way to get a 'dynamic' number
        # On Windows/Mac/Linux this returns a list of load averages
        load = os.getloadavg()[0] if hasattr(os, 'getloadavg') else 0.5
        focus_proxy = "Critical" if load > 2.0 else "Normal"
        return focus_proxy, load
    except:
        return "Normal", 0.1

def sync_to_lifeos():
    focus_label, raw_load = get_system_metrics()
    
    # This data is now 'Live' based on your computer's state
    my_data = {
        "hrv": "38ms",
        "sleep": "7h",
        "focus_level": focus_label,
        "system_load_proxy": f"{raw_load}%",
        "bank_balance": "$4,000",
        "timestamp": time.time()
    }
    
    try:
        print(f"Feeding data to LifeOS (Focus: {focus_label})...")
        response = httpx.post(URL, json=my_data)
        if response.status_code == 200:
            print("Success: Dashboard Updated.")
        else:
            print(f"Server Error: {response.status_code}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    print("LifeOS Sensor Active. Monitoring environment...")
    # Sync every 30 seconds for immediate feedback during testing
    while True:
        sync_to_lifeos()
        time.sleep(30)
