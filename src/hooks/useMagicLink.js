import { useEffect } from 'react';


export function useMagicLink(setMode, setClaimEventName) {
  useEffect(() => {
    // parameter dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventFromUrl = urlParams.get('event');


    if (eventFromUrl) {
      setMode("claim"); 
      setClaimEventName(eventFromUrl); // Isi input field
    }
  }, []); // run once
}
