import { useEffect, useRef, useState } from "react";

type MotionPermissionDeviceMotionEvent = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function useStepCounter(weightKg = 70, dailyGoal = 8000) {
  const [steps, setSteps] = useState(0);
  const accelData = useRef({ lastMagnitude: 0, lastStep: 0 });

  useEffect(() => {
    const eventApi = DeviceMotionEvent as MotionPermissionDeviceMotionEvent;

    const handleMotion = (event: DeviceMotionEvent) => {
      const x = event.accelerationIncludingGravity?.x ?? 0;
      const y = event.accelerationIncludingGravity?.y ?? 0;
      const z = event.accelerationIncludingGravity?.z ?? 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (magnitude > 12 && accelData.current.lastMagnitude <= 12 && now - accelData.current.lastStep > 300) {
        setSteps((prev) => prev + 1);
        accelData.current.lastStep = now;
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }

      accelData.current.lastMagnitude = magnitude;
    };

    const start = () => window.addEventListener("devicemotion", handleMotion);

    if (eventApi.requestPermission) {
      void eventApi.requestPermission().then((permission) => {
        if (permission === "granted") {
          start();
        }
      });
    } else {
      start();
    }

    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  const calories = steps * 0.04 * (weightKg / 70);
  const distanceKm = steps * 0.00078;
  const remaining = Math.max(0, dailyGoal - steps);

  return { steps, calories, distanceKm, remaining, dailyGoal };
}
