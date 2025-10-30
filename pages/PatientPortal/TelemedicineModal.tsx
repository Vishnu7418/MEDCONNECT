import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Appointment } from '../../types';

interface TelemedicineModalProps {
  appointment: Appointment;
  onClose: () => void;
}

type PermissionStatus = 'PENDING' | 'GRANTED' | 'DENIED' | 'ERROR';

const TelemedicineModal: React.FC<TelemedicineModalProps> = ({ appointment, onClose }) => {
  const [isMicOn, setMicOn] = useState(true);
  const [isCameraOn, setCameraOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Connected'>('Connecting');
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('PENDING');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer effect
  useEffect(() => {
    if (connectionStatus === 'Connected' && permissionStatus === 'GRANTED') {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [connectionStatus, permissionStatus]);

  // Media stream effect
  const setupMedia = useCallback(async (isMountedRef: { current: boolean }) => {
    // Reset connection status on retry
    setConnectionStatus('Connecting');
    try {
      setPermissionStatus('PENDING');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (isMountedRef.current) {
        setPermissionStatus('GRANTED');
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Simulate connection delay
        setTimeout(() => {
          if(isMountedRef.current) setConnectionStatus('Connected');
        }, 2000);
      }
    } catch (err) {
      console.error("Error accessing media devices.", err);
      if (isMountedRef.current) {
        if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          setPermissionStatus('DENIED');
        } else {
          setPermissionStatus('ERROR');
        }
      }
    }
  }, []);

  useEffect(() => {
    const isMountedRef = { current: true };
    
    setupMedia(isMountedRef);

    return () => {
      isMountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [setupMedia]);

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOn;
      });
      setCameraOn(!isCameraOn);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleRetryPermissions = () => {
    const isMountedRef = { current: true };
    setupMedia(isMountedRef);
  };
  
  const renderContent = () => {
    switch (permissionStatus) {
      case 'PENDING':
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="animate-spin h-10 w-10 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Requesting camera and microphone access...
            </div>
          </div>
        );
      case 'DENIED':
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center p-6">
            <div className="text-center text-red-400 max-w-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">Permission Denied</h3>
              <p className="text-gray-300 mb-4">MediConnect needs access to your camera and microphone for the video call. Please grant permission in your browser's address bar (usually a camera icon) and try again.</p>
              <button onClick={handleRetryPermissions} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">
                Try Again
              </button>
            </div>
          </div>
        );
      case 'ERROR':
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center p-6">
            <div className="text-center text-red-400">
                <h3 className="text-xl font-bold text-white mb-2">Device Error</h3>
                <p className="text-gray-300">Could not access camera or microphone. Please ensure they are not being used by another application and that they are connected properly.</p>
            </div>
          </div>
        );
      case 'GRANTED':
        return (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              <div ref={remoteVideoRef} className="w-full h-full flex items-center justify-center bg-gray-900">
                 <div className="text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="mt-2 font-semibold">{appointment.doctorName}</p>
                    <p>{connectionStatus === 'Connecting' ? 'Waiting for doctor to join...' : 'Connected'}</p>
                 </div>
              </div>
              <div className="absolute bottom-4 right-4 w-1/4 max-w-[200px] aspect-video rounded-md overflow-hidden border-2 border-gray-500 shadow-lg">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100"></video>
                {!isCameraOn && <div className="absolute inset-0 bg-black flex items-center justify-center"><p className="text-xs">Camera Off</p></div>}
              </div>
            </div>
        );
      default:
        return null; // Should not happen
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Video Consultation</h2>
            <p className="text-gray-400">with {appointment.doctorName} ({appointment.doctorSpecialization})</p>
          </div>
          <div className="text-right">
             <p className={`text-lg font-semibold ${
               permissionStatus === 'GRANTED' && connectionStatus === 'Connecting' ? 'text-yellow-400 animate-pulse' :
               permissionStatus === 'GRANTED' && connectionStatus === 'Connected' ? 'text-green-400' :
               permissionStatus === 'DENIED' || permissionStatus === 'ERROR' ? 'text-red-400' :
               'text-yellow-400'
             }`}>
               {permissionStatus !== 'GRANTED' ? permissionStatus : connectionStatus}
             </p>
             {permissionStatus === 'GRANTED' && <p className="text-xl font-mono">{formatTime(callDuration)}</p>}
          </div>
        </div>
        
        {renderContent()}

        <div className="mt-6 flex justify-center items-center gap-6">
          <button onClick={toggleMic} disabled={permissionStatus !== 'GRANTED'} className={`p-4 rounded-full transition-colors ${isMicOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-400'} disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500`} aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}>
            {isMicOn ? 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg> : 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 14.25a5.25 5.25 0 00-10.607 0M18 14.25v-1.5c0-1.523-.97-2.828-2.343-3.332M5 12l2 2m0 0l2-2m-2 2v6m0-6H5" /></svg>
            }
          </button>
          <button onClick={toggleCamera} disabled={permissionStatus !== 'GRANTED'} className={`p-4 rounded-full transition-colors ${isCameraOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-400'} disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500`} aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}>
            {isCameraOn ?
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> :
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1l22 22" />
              </svg>
            }
          </button>
          <button onClick={onClose} className="bg-red-600 hover:bg-red-700 p-4 rounded-full transition-colors" aria-label="End call">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }}>
                <path d="M6.62,10.79a15.22,15.22,0,0,0,6.59,6.59l2.2-2.2a1,1,0,0,1,1.11-.21l2.84,1.14a1,1,0,0,1,.6,1V20a1,1,0,0,1-1,1A17,17,0,0,1,3,4,1,1,0,0,1,4,3H7.21a1,1,0,0,1,1,.6l1.14,2.84a1,1,0,0,1-.21,1.11Z" />
             </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelemedicineModal;