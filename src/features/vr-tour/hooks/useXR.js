import { useState, useEffect } from 'react';

export const useXR = (wrapperRef, sceneRef, scene) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [enableHandTracking, setEnableHandTracking] = useState(false);
  const [isInVR, setIsInVR] = useState(false);

  useEffect(() => {
    const updateFullscreenState = () => {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;
      setIsFullscreen(fullscreenElement === wrapperRef.current);
    };

    updateFullscreenState();
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
      document.removeEventListener('mozfullscreenchange', updateFullscreenState);
      document.removeEventListener('MSFullscreenChange', updateFullscreenState);
    };
  }, [wrapperRef]);

  const toggleFullscreen = async () => {
    const wrapperEl = wrapperRef.current;
    if (!wrapperEl) return;

    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;

    if (fullscreenElement === wrapperEl) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
      else if (document.msExitFullscreen) await document.msExitFullscreen();
      return;
    }

    const request = wrapperEl.requestFullscreen || wrapperEl.webkitRequestFullscreen || wrapperEl.mozRequestFullScreen || wrapperEl.msRequestFullscreen;
    if (request) await request.call(wrapperEl, { navigationUI: 'hide' });
  };

  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    let session = null;
    const handleInputSourcesChange = () => {
      try {
        session = sceneEl.renderer?.xr?.getSession?.();
        const hasHand = session && Array.from(session.inputSources || []).some(s => !!s.hand);
        setEnableHandTracking(Boolean(hasHand));
      } catch (err) {
        setEnableHandTracking(false);
      }
    };

    const onEnterVR = () => {
      setIsInVR(true);
      setTimeout(() => {
        try {
          session = sceneEl.renderer?.xr?.getSession?.();
          if (session) {
            const hasHand = Array.from(session.inputSources || []).some(s => !!s.hand);
            setEnableHandTracking(Boolean(hasHand));
            session.addEventListener?.('inputsourceschange', handleInputSourcesChange);
          } else {
            setEnableHandTracking(false);
          }
        } catch (err) {
          setEnableHandTracking(false);
        }
      }, 200);
    };

    const onExitVR = () => {
      setIsInVR(false);
      try {
        session = sceneEl.renderer?.xr?.getSession?.();
        session?.removeEventListener?.('inputsourceschange', handleInputSourcesChange);
      } catch (err) { }
      setEnableHandTracking(false);
    };

    if (sceneEl.is && sceneEl.is('vr-mode')) setIsInVR(true);

    sceneEl.addEventListener('enter-vr', onEnterVR);
    sceneEl.addEventListener('exit-vr', onExitVR);

    return () => {
      sceneEl.removeEventListener('enter-vr', onEnterVR);
      sceneEl.removeEventListener('exit-vr', onExitVR);
      try {
        session = sceneEl.renderer?.xr?.getSession?.();
        session?.removeEventListener?.('inputsourceschange', handleInputSourcesChange);
      } catch (err) { }
    };
  }, [sceneRef, scene]);

  return { isFullscreen, toggleFullscreen, enableHandTracking, isInVR };
};