import { useState, useEffect } from "react";

const STORAGE_KEY = "flowang:balance-hidden";

export function useBalanceVisibility() {
  const [isHidden, setIsHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isHidden));
    } catch {
      // ignore
    }
  }, [isHidden]);

  return { isHidden, setIsHidden };
}
