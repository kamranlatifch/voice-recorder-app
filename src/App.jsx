// import { useState, useRef } from 'react';

// import { LiveAudioVisualizer } from 'react-audio-visualize';
// import './App.css';
// import { CircleStop, Mic } from 'lucide-react';

// export default function App() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioURL, setAudioURL] = useState(null);
//   const [mediaRecorder, setMediaRecorder] = useState(null);
//   const audioChunks = useRef([]);

//   // const startRecording = async () => {
//   //   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//   //   const recorder = new MediaRecorder(stream);

//   //   recorder.ondataavailable = (event) => {
//   //     audioChunks.current.push(event.data);
//   //   };

//   //   recorder.onstop = () => {
//   //     const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
//   //     setAudioURL(URL.createObjectURL(audioBlob));
//   //     audioChunks.current = [];
//   //   };

//   //   recorder.start();
//   //   setMediaRecorder(recorder);
//   //   setIsRecording(true);
//   // };
//   const startRecording = async () => {
//     try {
//       // Try accessing the microphone
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

//       const recorder = new MediaRecorder(stream);
//       recorder.ondataavailable = (event) =>
//         audioChunks.current.push(event.data);
//       recorder.onstop = () => {
//         const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
//         setAudioURL(URL.createObjectURL(audioBlob));
//         audioChunks.current = [];
//       };

//       recorder.start();
//       setMediaRecorder(recorder);
//       setIsRecording(true);
//     } catch (error) {
//       // If microphone is in use by another app, an error will be thrown
//       alert(
//         'Another app is using the microphone. Close other apps before recording.'
//       );
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorder) {
//       mediaRecorder.stop();
//       setIsRecording(false);
//     }
//   };

//   return (
//     <div className='app-container'>
//       <h1 style={{ color: 'black' }}>Voice Recorder</h1>
//       <div className='recorder-container'>
//         {
//           isRecording && (
//             <LiveAudioVisualizer
//               mediaRecorder={mediaRecorder}
//               barColor='#6d8f97'
//             />
//           )
//           // ) : (
//           //   <div className='placeholder-wave' />
//           // )
//         }

//         <button
//           className='record-btn'
//           onClick={isRecording ? stopRecording : startRecording}
//         >
//           {isRecording ? <CircleStop /> : <Mic />}
//         </button>
//       </div>
//       {audioURL && (
//         <div className='audio-player'>
//           <audio controls src={audioURL}></audio>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useRef } from 'react';
import { LiveAudioVisualizer } from 'react-audio-visualize';
import './App.css';
import { CircleStop, Mic } from 'lucide-react';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);

  const checkMicUsage = async () => {
    console.log('Checking mic permissions');
    const devices = await navigator.mediaDevices.enumerateDevices();
    const micInUse = devices.some(
      (device) =>
        device.kind === 'audioinput' &&
        device.label.toLowerCase().includes('in use')
    );

    if (micInUse) {
      alert(
        'Microphone is being used by another app. Close Loom, Google Meet, or any recording software.'
      );
      return false;
    }
    console.log('MIC Permissions granted');
    return true;
  };

  const startRecording = async () => {
    try {
      console.log('Trying to start recording');

      // Stop previous media stream if it's still active
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }

      const micAvailable = await checkMicUsage();
      if (!micAvailable) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 🔥 STOP ALL PREVIOUS AUDIO STREAMS TO FIX MIC ISSUES
      stream.getAudioTracks().forEach((track) => {
        track.stop();
      });

      // 🔥 RESTART AUDIO STREAM TO FIX ISSUES
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      console.log('Audio stream tracked:', newStream.getAudioTracks());

      if (!newStream.getAudioTracks().length) {
        alert('No microphone input detected. Please check your mic settings.');
        return;
      }

      const recorder = new MediaRecorder(newStream);
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        console.log('Audio chunk received:', event.data.size);
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log('Recorder stopped. Chunks:', audioChunks.current.length);
        if (audioChunks.current.length === 0) {
          alert('Recording failed. Please try again.');
          return;
        }

        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setAudioURL(URL.createObjectURL(audioBlob));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access the microphone. Try closing other apps.');
    }
  };

  const stopRecording = () => {
    console.log('Recording is stopped');
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className='app-container'>
      <h1 style={{ color: 'black' }}>TT Voice Recorder</h1>
      <div className='recorder-container'>
        {isRecording && (
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            barColor='#6d8f97'
          />
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
