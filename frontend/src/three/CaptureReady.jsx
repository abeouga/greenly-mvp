import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

// Render synchronously before reading the WebGL buffer; no permanent buffer is needed.
export function CaptureReady() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    function capture() {
      gl.render(scene, camera);
    }
    window.addEventListener("kusakari-canvas-capture", capture);
    return () => window.removeEventListener("kusakari-canvas-capture", capture);
  }, [gl, scene, camera]);
  return null;
}
