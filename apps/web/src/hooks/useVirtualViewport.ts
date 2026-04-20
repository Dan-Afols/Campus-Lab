import { useEffect, useState } from "react";

export function useVirtualViewport() {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) {
      return;
    }

    const handler = () => {
      const offset = Math.max(0, window.innerHeight - window.visualViewport!.height);
      setKeyboardOffset(offset);
    };

    window.visualViewport.addEventListener("resize", handler);
    return () => window.visualViewport?.removeEventListener("resize", handler);
  }, []);

  return keyboardOffset;
}
