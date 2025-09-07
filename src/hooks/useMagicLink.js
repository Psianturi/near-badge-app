import { useEffect } from "react";
import { normalizeEventName } from "../utils/normalizeEventName";

export function useMagicLink(setMode, setClaimEventName) {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventFromUrl = urlParams.get("event");

    if (eventFromUrl) {
      setMode("claim");
      const decoded = decodeURIComponent(eventFromUrl);
      const clean = normalizeEventName(decoded);
      setClaimEventName(clean);
    }
  }, []); // run once
}
