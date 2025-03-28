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
  let retryCount = 0; // To avoid infinite retries

  const MAX_RETRIES = 5; // Retry up to 5 times if silent

  const startRecording = async () => {
    try {
      console.log(`🎤  v3 Starting recording... (Retry ${retryCount})`);

      // 🔹 Step 1: Get the default microphone
      const devices = await navigator.mediaDevices.enumerateDevices();
      let defaultMic = devices.find((d) => d.kind === 'audioinput');

      if (!defaultMic) {
        console.warn('⚠️ No microphone found!');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: defaultMic.deviceId } },
      });

      console.log(`🎤 Using microphone: ${defaultMic.label}`);

      // 🔹 Step 2: Check for Silence Using Web Audio API
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let hasAudio = false;

      const checkAudio = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        if (dataArray.some((value) => value > 0)) {
          hasAudio = true;
          clearInterval(checkAudio);
          retryCount = 0; // Reset retries on success
        }
      }, 500);

      setTimeout(async () => {
        if (!hasAudio) {
          console.warn(
            `⚠️ No sound detected. Retrying... (${
              retryCount + 1
            }/${MAX_RETRIES})`
          );
          stream.getTracks().forEach((track) => track.stop()); // Close the stream

          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(startRecording, 1000); // Retry after 1 second
          }
          return;
        }
      }, 2000);

      // 🔹 Step 3: Start Recording Only If Mic is Active
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (audioChunks.current.length === 0) {
          console.warn('❌ No audio data received. Retrying...');
          startRecording(); // Restart if needed
          return;
        }

        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(audioBlob));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      retryCount = 0; // Reset retry count on success
    } catch (error) {
      console.error('🚨 Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
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

// import { useState, useRef } from 'react';
// import { LiveAudioVisualizer } from 'react-audio-visualize';
// import './App.css';
// import { CircleStop, Mic } from 'lucide-react';

// export default function App() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioURL, setAudioURL] = useState(null);
//   const [mediaRecorder, setMediaRecorder] = useState(null);
//   const audioChunks = useRef([]);

//   const checkMicUsage = async () => {
//     console.log('Checking mic permissions');
//     const devices = await navigator.mediaDevices.enumerateDevices();
//     const micInUse = devices.some(
//       (device) =>
//         device.kind === 'audioinput' &&
//         device.label.toLowerCase().includes('in use')
//     );

//     if (micInUse) {
//       alert(
//         'Microphone is being used by another app. Close Loom, Google Meet, or any recording software.'
//       );
//       return false;
//     }
//     console.log('MIC Permissions granted');
//     return true;
//   };
//   // const startRecording = async () => {
//   //   try {
//   //     console.log('🎤 Starting recording...');

//   //     // 🔹 Force default microphone selection
//   //     const devices = await navigator.mediaDevices.enumerateDevices();
//   //     const defaultMic = devices.find(
//   //       (d) => d.kind === 'audioinput' && d.deviceId
//   //     );

//   //     if (!defaultMic) {
//   //       alert('No microphone detected. Please check your audio settings.');
//   //       return;
//   //     }

//   //     const stream = await navigator.mediaDevices.getUserMedia({
//   //       audio: { deviceId: { exact: defaultMic.deviceId } },
//   //     });

//   //     console.log('🎤 Using Default Mic:', defaultMic.label);

//   //     const recorder = new MediaRecorder(stream, {
//   //       mimeType: 'audio/webm;codecs=opus',
//   //     });

//   //     audioChunks.current = [];

//   //     recorder.ondataavailable = (event) => {
//   //       if (event.data.size > 0) {
//   //         audioChunks.current.push(event.data);
//   //       }
//   //     };

//   //     recorder.onstop = () => {
//   //       if (audioChunks.current.length === 0) {
//   //         alert('Recording failed. No audio detected.');
//   //         return;
//   //       }

//   //       const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
//   //       setAudioURL(URL.createObjectURL(audioBlob));
//   //     };

//   //     recorder.start();
//   //     setMediaRecorder(recorder);
//   //     setIsRecording(true);
//   //   } catch (error) {
//   //     console.error('Error starting recording:', error);
//   //     alert('Failed to access the microphone. Try closing other apps.');
//   //   }
//   // };
//   const startRecording = async () => {
//     try {
//       console.log('🎤 Trying to start recording...');

//       // Step 1️⃣: Force default microphone selection
//       const devices = await navigator.mediaDevices.enumerateDevices();
//       const defaultMic = devices.find(
//         (d) => d.kind === 'audioinput' && d.deviceId
//       );

//       if (!defaultMic) {
//         alert('No microphone detected. Please check your audio settings.');
//         return;
//       }

//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: { deviceId: { exact: defaultMic.deviceId } },
//       });

//       console.log('🎤 Using Default Mic:', defaultMic.label);

//       // Step 2️⃣: Check for silent recordings
//       const audioContext = new (window.AudioContext ||
//         window.webkitAudioContext)();
//       const source = audioContext.createMediaStreamSource(stream);
//       const analyser = audioContext.createAnalyser();
//       source.connect(analyser);

//       const dataArray = new Uint8Array(analyser.frequencyBinCount);
//       let hasAudio = false;

//       const checkAudioInterval = setInterval(() => {
//         analyser.getByteFrequencyData(dataArray);
//         if (dataArray.some((value) => value > 0)) {
//           hasAudio = true;
//           clearInterval(checkAudioInterval);
//         }
//       }, 500);

//       setTimeout(() => {
//         if (!hasAudio) {
//           alert(
//             'Microphone detected, but no sound captured. Restarting recording...'
//           );
//           stream.getTracks().forEach((track) => track.stop()); // Stop bad stream
//           setTimeout(startRecording, 1000); // Restart recording
//         }
//       }, 2000);

//       // Step 3️⃣: Start recording with Opus codec (better than WAV)
//       const recorder = new MediaRecorder(stream, {
//         mimeType: 'audio/webm;codecs=opus',
//       });

//       audioChunks.current = [];

//       recorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           audioChunks.current.push(event.data);
//         }
//       };

//       recorder.onstop = () => {
//         if (audioChunks.current.length === 0) {
//           alert('Recording failed. No audio detected. Retrying...');
//           startRecording(); // Restart recording
//           return;
//         }

//         const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
//         setAudioURL(URL.createObjectURL(audioBlob));
//       };

//       recorder.start();
//       setMediaRecorder(recorder);
//       setIsRecording(true);
//     } catch (error) {
//       console.error('Error starting recording:', error);
//       alert('Failed to access the microphone. Try closing other apps.');
//     }
//   };

//   const stopRecording = () => {
//     console.log('Recording is stopped');
//     if (mediaRecorder) {
//       mediaRecorder.stop();
//       setIsRecording(false);
//     }
//   };

//   return (
//     <div className='app-container'>
//       <h1 style={{ color: 'black' }}>TT Voice Recorder</h1>
//       <div className='recorder-container'>
//         {isRecording && (
//           <LiveAudioVisualizer
//             mediaRecorder={mediaRecorder}
//             barColor='#6d8f97'
//           />
//         )}

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
