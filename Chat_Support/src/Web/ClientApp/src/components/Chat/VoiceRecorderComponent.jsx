import React, {useState, useRef, useEffect} from 'react';
import {BsMic, BsStopFill, BsSend, BsX, BsPlayFill, BsPauseFill} from 'react-icons/bs';
import {chatApi, MessageType} from '../../services/chatApi';
import {Button} from 'react-bootstrap';
const VoiceRecorderComponent = ({onVoiceRecorded, disabled, chatRoomId}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {type: 'audio/webm'});
        setAudioBlob(audioBlob);

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const pauseResumeRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !chatRoomId) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await chatApi.uploadFile(
        audioBlob,
        chatRoomId,
        MessageType.Audio, // assuming MessageType.AUDIO is 3
        (progress) => setUploadProgress(progress)
      );

      // Send to parent component
      onVoiceRecorded({
        url: result.fileUrl,
        duration: recordingTime,
        size: audioBlob.size,
        type: MessageType.AUDIO,
        mimeType: 'audio/webm',
      });

      // Reset
      resetRecording();
      setIsUploading(false);
    } catch (error) {
      console.error('Failed to send voice message:', error);
      alert('Failed to send voice message');
      setIsUploading(false);
    }
  };

  const resetRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setPlaybackTime(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updatePlaybackTime = () => {
    if (audioRef.current) {
      setPlaybackTime(Math.floor(audioRef.current.currentTime));

      if (!audioRef.current.paused) {
        animationRef.current = requestAnimationFrame(updatePlaybackTime);
      }
    }
  };

  // Recording UI
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-red-50 rounded-lg p-2">
        <Button variant="link" onClick={stopRecording} className="p-2 bg-red-200 rounded-full hover:bg-red-300 transition border-0" title="Stop recording">
          <BsStopFill style={{color: '#d32f2f'}} className="w-5 h-5" />
        </Button>

        <Button variant="link" onClick={pauseResumeRecording} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition border-0" title={isPaused ? 'Resume' : 'Pause'}>
          {isPaused ? <BsPlayFill style={{color: '#1976d2'}} className="w-5 h-5" /> : <BsPauseFill style={{color: '#1976d2'}} className="w-5 h-5" />}
        </Button>

        <div className="flex items-center gap-2 px-3">
          <div className="flex gap-1">
            <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse"></span>
            <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
            <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
          </div>
          <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
        </div>
      </div>
    );
  }

  // Preview UI
  if (audioBlob) {
    return (
      <div className="absolute bottom-12 left-0 right-0 bg-white shadow-lg rounded-lg p-4 border mx-4">
        <div className="flex items-center gap-3">
          <Button variant="link" onClick={togglePlayback} className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition border-0" disabled={isUploading}>
            {isPlaying ? <BsPauseFill style={{color: '#1976d2'}} className="w-5 h-5" /> : <BsPlayFill style={{color: '#1976d2'}} className="w-5 h-5" />}
          </Button>

          <div className="flex-1">
            <audio
              ref={audioRef}
              src={audioUrl}
              onLoadedMetadata={(e) => setDuration(Math.floor(e.target.duration))}
              onPlay={updatePlaybackTime}
              onPause={() => cancelAnimationFrame(animationRef.current)}
              onEnded={() => {
                setIsPlaying(false);
                setPlaybackTime(0);
              }}
              className="hidden"
            />

            <div className="bg-gray-200 rounded-full h-2 relative">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${duration > 0 ? (playbackTime / duration) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatTime(playbackTime)}</span>
              <span>{formatTime(duration || recordingTime)}</span>
            </div>
          </div>

          {isUploading ? (
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-2 relative">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{width: `${uploadProgress}%`}} />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">{uploadProgress}%</div>
            </div>
          ) : (
            <>
              <Button variant="link" onClick={sendVoiceMessage} className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition border-0" title="Send voice message" disabled={!chatRoomId}>
                <BsSend style={{color: '#388e3c'}} className="w-5 h-5" />
              </Button>

              <Button variant="link" onClick={resetRecording} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition border-0" title="Cancel" disabled={isUploading}>
                <BsX style={{color: '#757575'}} className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Default UI
  return (
    <Button variant="link" onClick={startRecording} disabled={disabled} className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 border-0" title="پیام صوتی">
      <BsMic size={20} className="w-5 h-5" />
    </Button>
  );
};

// کامپوننت پخش صدا در پیام
export const VoiceMessagePlayer = ({audioUrl, duration}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);

      if (progressRef.current) {
        const percentage = (audio.currentTime / audio.duration) * 100;
        progressRef.current.style.width = `${percentage}%`;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      if (progressRef.current) {
        progressRef.current.style.width = '0%';
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(Math.floor(audio.duration));
    });

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audioRef.current.duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-3 min-w-[280px]">
      <Button variant="link" onClick={togglePlayback} className="p-2 bg-white rounded-full hover:bg-gray-200 transition flex-shrink-0 border-0">
        {isPlaying ? <BsPauseFill style={{color: '#1976d2'}} className="w-5 h-5" /> : <BsPlayFill style={{color: '#1976d2'}} className="w-5 h-5" />}
      </Button>

      <div className="flex-1">
        <div className="bg-gray-300 rounded-full h-1.5 cursor-pointer relative" onClick={handleProgressClick}>
          <div ref={progressRef} className="bg-blue-500 h-1.5 rounded-full transition-all absolute top-0 left-0" style={{width: '0%'}} />
        </div>

        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>

      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
};

export default VoiceRecorderComponent;
