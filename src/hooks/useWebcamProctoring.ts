import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export type IntegrityEventType =
  | 'CAMERA_STARTED'
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_ERROR'
  | 'CAMERA_DISCONNECTED'
  | 'FACE_NOT_DETECTED'
  | 'FACE_DETECTED'
  | 'MULTIPLE_FACES_DETECTED';

export interface IntegrityEvent {
  eventType: IntegrityEventType;
  metadata?: Record<string, any>;
}

interface UseWebcamProctoringProps {
  onIntegrityEvent?: (event: IntegrityEvent) => void;
  faceDetectionIntervalMs?: number;
}

type FaceStatus = 'unknown' | 'no-face' | 'one-face' | 'multiple-faces';
type CameraStatus = 'starting' | 'active' | 'denied' | 'unavailable';

export function useWebcamProctoring({ onIntegrityEvent, faceDetectionIntervalMs = 2000 }: UseWebcamProctoringProps = {}) {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('starting');
  const [faceStatus, setFaceStatus] = useState<FaceStatus>('unknown');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Refs for deduplication
  const lastCameraEvent = useRef<IntegrityEventType | null>(null);
  const lastFaceEvent = useRef<IntegrityEventType | null>(null);

  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const isComponentMounted = useRef(true);
  const rafId = useRef<number | null>(null);
  const lastVideoTime = useRef<number>(-1);

  const dispatchEvent = useCallback((event: IntegrityEvent, type: 'camera' | 'face') => {
    if (type === 'camera') {
      if (lastCameraEvent.current === event.eventType) return;
      lastCameraEvent.current = event.eventType;
    } else {
      if (lastFaceEvent.current === event.eventType) return;
      lastFaceEvent.current = event.eventType;
    }
    onIntegrityEvent?.(event);
  }, [onIntegrityEvent]);

  // Init Camera
  useEffect(() => {
    isComponentMounted.current = true;
    let streamToStop: MediaStream | null = null;

    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (!isComponentMounted.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamToStop = stream;
        setMediaStream(stream);
        setCameraStatus('active');
        dispatchEvent({ eventType: 'CAMERA_STARTED' }, 'camera');

        const track = stream.getVideoTracks()[0];
        if (track) {
          track.onended = () => {
            setCameraStatus('unavailable');
            dispatchEvent({ eventType: 'CAMERA_DISCONNECTED' }, 'camera');
          };
        }
      })
      .catch((err) => {
        if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
          setCameraStatus('denied');
          dispatchEvent({ eventType: 'CAMERA_PERMISSION_DENIED', metadata: { error: err.name } }, 'camera');
        } else {
          setCameraStatus('denied');
          dispatchEvent({ eventType: 'CAMERA_ERROR', metadata: { error: err.message } }, 'camera');
        }
      });

    return () => {
      isComponentMounted.current = false;
      if (streamToStop) {
        streamToStop.getTracks().forEach((t) => t.stop());
      }
    };
  }, [dispatchEvent]);

  // Attach Stream to Video element
  useEffect(() => {
    if (videoRef.current && mediaStream && videoRef.current.srcObject !== mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(console.warn);
    }
  }); // Runs after every render to handle React remounts

  // Init Face Detector
  useEffect(() => {
    let active = true;
    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        if (!active) return;
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'CPU' // Use CPU by default to avoid WebGL context issues in some environments
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.5
        });
        if (!active) {
            detector.close();
            return;
        }
        faceDetectorRef.current = detector;
      } catch (err) {
        console.warn("Face detector init failed", err);
      }
    };
    initDetector();

    return () => {
      active = false;
      if (faceDetectorRef.current) {
        faceDetectorRef.current.close();
        faceDetectorRef.current = null;
      }
      if (rafId.current) clearInterval(rafId.current);
    };
  }, []);

  // Detection Loop
  useEffect(() => {
    const detectFace = () => {
      if (!isComponentMounted.current) return;
      const video = videoRef.current;
      const detector = faceDetectorRef.current;

      // HTMLMediaElement.HAVE_CURRENT_DATA = 2
      if (video && detector && video.readyState >= 2 && mediaStream && cameraStatus === 'active') {
        
        // Ensure we only process new frames
        if (video.currentTime !== lastVideoTime.current) {
          lastVideoTime.current = video.currentTime;
          
          try {
            const results = detector.detectForVideo(video, performance.now());
            const faceCount = results.detections.length;
            
            if (faceCount === 0) {
              setFaceStatus('no-face');
              dispatchEvent({ eventType: 'FACE_NOT_DETECTED' }, 'face');
            } else if (faceCount === 1) {
              setFaceStatus('one-face');
              dispatchEvent({ eventType: 'FACE_DETECTED' }, 'face');
            } else {
              setFaceStatus('multiple-faces');
              dispatchEvent({ eventType: 'MULTIPLE_FACES_DETECTED' }, 'face');
            }
          } catch (e) {
             console.warn("Detection failed", e);
          }
        }
      }
    };

    if (cameraStatus === 'active') {
      rafId.current = window.setInterval(detectFace, faceDetectionIntervalMs);
    }

    return () => {
      if (rafId.current) clearInterval(rafId.current);
    };
  }, [cameraStatus, mediaStream, dispatchEvent, faceDetectionIntervalMs]);

  return { mediaStream, cameraStatus, faceStatus, videoRef };
}
