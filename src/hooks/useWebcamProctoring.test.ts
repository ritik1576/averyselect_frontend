import { renderHook, act } from '@testing-library/react';
import { useWebcamProctoring } from './useWebcamProctoring';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as mediapipe from '@mediapipe/tasks-vision';

// Mock mediapipe
vi.mock('@mediapipe/tasks-vision', () => {
  const detectForVideo = vi.fn().mockReturnValue({ faceCategories: [], detections: [] });
  return {
    FaceDetector: {
      createFromOptions: vi.fn().mockResolvedValue({
        detectForVideo,
        close: vi.fn()
      })
    },
    FilesetResolver: {
      forVisionTasks: vi.fn().mockResolvedValue({})
    }
  };
});

describe('useWebcamProctoring', () => {
  let mockGetUserMedia: any;
  let mockStream: any;
  let mockTrack: any;
  let onIntegrityEvent: any;
  let mockDetectForVideo: any;

  beforeEach(() => {
    onIntegrityEvent = vi.fn();
    mockTrack = { stop: vi.fn(), onended: null };
    mockStream = {
      getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
      getTracks: vi.fn().mockReturnValue([mockTrack])
    };
    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true
    });

    mockDetectForVideo = (mediapipe.FaceDetector.createFromOptions as any).mock.results?.[0]?.value?.detectForVideo;
    if (!mockDetectForVideo) {
       // fallback for setup
       mockDetectForVideo = vi.fn().mockReturnValue({ detections: [] });
       vi.mocked(mediapipe.FaceDetector.createFromOptions).mockResolvedValue({
         detectForVideo: mockDetectForVideo,
         close: vi.fn()
       } as any);
    }
    
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('1. Camera permission granted', async () => {
    const { result } = renderHook(() => useWebcamProctoring({ onIntegrityEvent }));
    
    expect(result.current.cameraStatus).toBe('starting');

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.cameraStatus).toBe('active');
    expect(result.current.mediaStream).toBe(mockStream);
    expect(onIntegrityEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'CAMERA_STARTED' }));
  });

  it('2. Camera permission denied', async () => {
    const error = new Error('NotAllowedError');
    error.name = 'NotAllowedError';
    mockGetUserMedia.mockRejectedValue(error);
    const { result } = renderHook(() => useWebcamProctoring({ onIntegrityEvent }));
    
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.cameraStatus).toBe('denied');
    expect(onIntegrityEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'CAMERA_PERMISSION_DENIED' }));
  });

  it('3. Camera track ends', async () => {
    const { result } = renderHook(() => useWebcamProctoring({ onIntegrityEvent }));
    
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.cameraStatus).toBe('active');
    
    act(() => {
      if (mockTrack.onended) mockTrack.onended();
    });

    expect(result.current.cameraStatus).toBe('unavailable');
    expect(onIntegrityEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'CAMERA_DISCONNECTED' }));
  });

  it('4. Candidate leaves test (cleanup)', async () => {
    const { unmount } = renderHook(() => useWebcamProctoring({ onIntegrityEvent }));
    
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    unmount();
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it('5. Event deduplication - same face state repeated', async () => {
    mockDetectForVideo.mockReturnValue({ detections: [] }); // 0 faces

    const { result } = renderHook(() => useWebcamProctoring({ onIntegrityEvent }));
    
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    
    // Simulate initial video play setup
    result.current.videoRef.current = { readyState: 4, currentTime: 1 } as any;

    // Fast forward to trigger multiple detection cycles
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Should only report FACE_NOT_DETECTED once
    const faceEvents = onIntegrityEvent.mock.calls.filter((call: any[]) => call[0].eventType.includes('FACE'));
    expect(faceEvents.length).toBe(1);
    expect(faceEvents[0][0].eventType).toBe('FACE_NOT_DETECTED');
  });

  it('6. Face transitions (0 -> 1 -> 2 -> 1 -> 0)', async () => {
    // 0 faces
    mockDetectForVideo.mockReturnValue({ detections: [] });
    const { result } = renderHook(() => useWebcamProctoring({ onIntegrityEvent }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    
    result.current.videoRef.current = { readyState: 4, currentTime: 1 } as any;

    await act(async () => { vi.advanceTimersByTime(2000); });

    // 1 face
    mockDetectForVideo.mockReturnValue({ detections: [{}] });
    if (result.current.videoRef.current) result.current.videoRef.current.currentTime = 2;
    await act(async () => { vi.advanceTimersByTime(2000); });

    // 2 faces
    mockDetectForVideo.mockReturnValue({ detections: [{}, {}] });
    if (result.current.videoRef.current) result.current.videoRef.current.currentTime = 3;
    await act(async () => { vi.advanceTimersByTime(2000); });

    // 1 face again
    mockDetectForVideo.mockReturnValue({ detections: [{}] });
    if (result.current.videoRef.current) result.current.videoRef.current.currentTime = 4;
    await act(async () => { vi.advanceTimersByTime(2000); });

    const faceEvents = onIntegrityEvent.mock.calls.filter((call: any[]) => call[0].eventType.includes('FACE'));
    expect(faceEvents.map((c: any[]) => c[0].eventType)).toEqual([
      'FACE_NOT_DETECTED',
      'FACE_DETECTED',
      'MULTIPLE_FACES_DETECTED',
      'FACE_DETECTED'
    ]);
  });
});
