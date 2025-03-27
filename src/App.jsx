import { useState, useRef } from 'react';

import { LiveAudioVisualizer } from 'react-audio-visualize';
import './App.css';
import { CircleStop, Mic } from 'lucide-react';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      setAudioURL(URL.createObjectURL(audioBlob));
      audioChunks.current = [];
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className='app-container'>
      <h1 style={{ color: 'black' }}>Voice Recorder</h1>
      <div className='recorder-container'>
        {isRecording ? (
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            barColor='#6d8f97'
          />
        ) : (
          <div className='placeholder-wave' />
        )}

        <button
          className='record-btn'
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? <CircleStop /> : <Mic />}
        </button>
      </div>
      {audioURL && (
        <div className='audio-player'>
          <audio controls src={audioURL}></audio>
        </div>
      )}
    </div>
  );
}
