import json
import threading
import time
import requests

BASE = "https://campuslabs.duckdns.org/api/v1"


def login(email: str, password: str, device_id: str):
    payload = {
        "email": email,
        "password": password,
        "deviceId": device_id,
        "os": "windows",
        "platform": "web",
    }
    r = requests.post(f"{BASE}/auth/login", json=payload, timeout=30)
    r.raise_for_status()
    return r.json()["accessToken"]


def get_course_code(token: str) -> str:
    h = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE}/timetable/mine", headers=h, timeout=30)
    r.raise_for_status()
    data = r.json()
    if data and data[0].get("course") and data[0]["course"].get("code"):
        return data[0]["course"]["code"]
    return "COM101"


def main():
    token = login("cr1@univ.edu", "CourseRep@123", "realtime-smoke-cr")
    headers = {"Authorization": f"Bearer {token}"}
    course_code = get_course_code(token)

    stream_url = f"{BASE}/realtime/stream?token={token}"
    events = []
    stop = threading.Event()

    def reader():
        with requests.get(stream_url, stream=True, timeout=60) as resp:
            resp.raise_for_status()
            for raw in resp.iter_lines(decode_unicode=True):
                if stop.is_set():
                    break
                if not raw:
                    continue
                if raw.startswith("data: "):
                    try:
                        payload = json.loads(raw[6:])
                    except Exception:
                        continue
                    events.append(payload)
                    if payload.get("channel") in {"timetable", "notifications"}:
                        stop.set()
                        break

    t = threading.Thread(target=reader, daemon=True)
    t.start()

    time.sleep(2)
    post_payload = {
        "courseCode": course_code,
        "dayOfWeek": 3,
        "startsAt": "15:00",
        "endsAt": "16:00",
        "venue": "Realtime Smoke Hall",
        "lecturer": "Realtime Smoke",
    }
    pr = requests.post(f"{BASE}/timetable/course-rep", headers=headers, json=post_payload, timeout=30)
    pr.raise_for_status()

    deadline = time.time() + 25
    while time.time() < deadline and not stop.is_set():
        time.sleep(0.5)

    stop.set()
    t.join(timeout=2)

    result = {
        "timetablePostStatus": pr.status_code,
        "capturedEvents": events[-5:],
        "capturedChannels": [e.get("channel") for e in events if isinstance(e, dict)],
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
