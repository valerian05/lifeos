import httpx
import time

# 1. Your Railway URL
URL = "https://lifeos-production-4154.up.railway.app/api/ingest"

def sync_to_lifeos():
    # 2. This is where your data lives. 
    # Later, we will pull this automatically from your apps.
    my_data = {
        "hrv": "38ms",
        "sleep": "7h",
        "focus_level": "High",
        "bank_balance": "$4,000"
    }
    
    try:
        print("Feeding data to LifeOS...")
        httpx.post(URL, json=my_data)
        print("Success: Dashboard Updated.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Syncs your life every 60 minutes
    while True:
        sync_to_lifeos()
        time.sleep(3600)
