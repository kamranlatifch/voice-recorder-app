// import { useState, useRef } from 'react';
// import { LiveAudioVisualizer } from 'react-audio-visualize';
// import './App.css';
// import { CircleStop, Mic } from 'lucide-react';

// export default function App() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioURL, setAudioURL] = useState(null);
//   const [mediaRecorder, setMediaRecorder] = useState(null);
//   const [stream, setStream] = useState(null);
//   const audioChunks = useRef([]);
//   let retryCount = 0;
//   const MAX_RETRIES = 5;

//   // Function to check if microphone is capturing real sound
//   const checkMicActivity = async (stream) => {
//     const audioContext = new (window.AudioContext ||
//       window.webkitAudioContext)();
//     const source = audioContext.createMediaStreamSource(stream);
//     const analyser = audioContext.createAnalyser();
//     source.connect(analyser);
//     analyser.fftSize = 512;
//     const buffer = new Uint8Array(analyser.frequencyBinCount);

//     return new Promise((resolve) => {
//       setTimeout(() => {
//         analyser.getByteFrequencyData(buffer);
//         const sum = buffer.reduce((a, b) => a + b, 0);
//         resolve(sum > 0); // If sum > 0, sound is detected
//       }, 500);
//     });
//   };

//   const startRecording = async () => {
//     try {
//       console.log('🎤 Requesting microphone access...');

//       // Fetch microphone stream
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: {
//           sampleRate: 48000, // Opus preferred rate
//           channelCount: 1,
//           noiseSuppression: true,
//           echoCancellation: true,
//         },
//       });

//       console.log('✅ Microphone accessed successfully');
//       setStream(stream);

//       // **Check if mic is capturing real sound**
//       const hasAudio = await checkMicActivity(stream);
//       if (!hasAudio) {
//         console.warn('❌ No audio detected! Restarting...');
//         if (retryCount < MAX_RETRIES) {
//           retryCount++;
//           setTimeout(startRecording, 1000);
//         }
//         return;
//       }

//       // **Setup MediaRecorder with Opus codec**
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
//           console.warn('❌ No audio data received. Retrying...');
//           if (retryCount < MAX_RETRIES) {
//             retryCount++;
//             startRecording();
//           }
//           return;
//         }

//         const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
//         setAudioURL(URL.createObjectURL(audioBlob));
//       };

//       recorder.start();
//       setMediaRecorder(recorder);
//       setIsRecording(true);
//       retryCount = 0; // Reset retries on success
//     } catch (error) {
//       console.error('🚨 Error starting recording:', error);
//       if (retryCount < MAX_RETRIES) {
//         retryCount++;
//         setTimeout(startRecording, 1000);
//       }
//     }
//   };

//   const stopRecording = () => {
//     console.log('🛑 Stopping recording...');
//     if (mediaRecorder) {
//       mediaRecorder.stop();
//       setIsRecording(false);
//     }
//     if (stream) {
//       stream.getTracks().forEach((track) => track.stop());
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

import { useState, useRef, useEffect } from 'react';
import { LiveAudioVisualizer } from 'react-audio-visualize';
import './App.css';
import { CircleStop, Mic } from 'lucide-react';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [mics, setMics] = useState([]);
  const [selectedMic, setSelectedMic] = useState('default');
  const audioChunks = useRef([]);
  let retryCount = 0;
  const MAX_RETRIES = 5;

  useEffect(() => {
    async function getMicrophones() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      let micList = devices.filter((d) => d.kind === 'audioinput');

      console.log('Raw mic list:', micList);

      // **Filter out duplicate mics by groupId**
      const uniqueMics = micList.reduce((acc, mic) => {
        if (!acc.some((m) => m.groupId === mic.groupId)) {
          acc.push(mic);
        }
        return acc;
      }, []);

      console.log('Filtered mic list:', uniqueMics);
      setMics(uniqueMics);

      // **Auto-select the first mic if only one is available**
      if (uniqueMics.length === 1) {
        setSelectedMic(uniqueMics[0].deviceId);
      } else {
        setSelectedMic('default'); // Default behavior
      }
    }

    getMicrophones();
  }, []);

  // Function to check if microphone is capturing real sound
  const checkMicActivity = async (stream) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 512;
    const buffer = new Uint8Array(analyser.frequencyBinCount);

    return new Promise((resolve) => {
      setTimeout(() => {
        analyser.getByteFrequencyData(buffer);
        const sum = buffer.reduce((a, b) => a + b, 0);
        resolve(sum > 0); // If sum > 0, sound is detected
      }, 500);
    });
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Requesting microphone access...');

      // Fetch microphone stream
      const constraints = {
        audio: {
          deviceId: selectedMic === 'default' ? undefined : selectedMic,
          sampleRate: 48000, // Opus preferred rate
          channelCount: 1,
          noiseSuppression: true,
          echoCancellation: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('✅ Microphone accessed successfully');
      setStream(stream);

      // **Check if mic is capturing real sound**
      const hasAudio = await checkMicActivity(stream);
      if (!hasAudio) {
        console.warn('❌ No audio detected! Restarting...');
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(startRecording, 1000);
        }
        return;
      }

      // **Setup MediaRecorder with Opus codec**
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
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            startRecording();
          }
          return;
        }

        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(audioBlob));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      retryCount = 0; // Reset retries on success
    } catch (error) {
      console.error('🚨 Error starting recording:', error);
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(startRecording, 1000);
      }
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className='app-container'>
      <h1 style={{ color: 'black' }}>TT Voice Recorder</h1>

      {/* <div>
        <label>Select Microphone: </label>
        <select
          value={selectedMic}
          onChange={(e) => setSelectedMic(e.target.value)}
        >
          <option value='default'>Default Microphone</option>
          {mics?.map((mic) => (
            <option key={mic.deviceId} value={mic.deviceId}>
              {mic.label || `Microphone ${mics.indexOf(mic) + 1}`}
            </option>
          ))}
        </select>
      </div> */}
      {!isRecording && (
        <div>
          <label style={{ color: 'black' }}>Select Microphone: </label>
          <select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
          >
            {/* <option value='default'>Default Microphone</option> */}
            {mics?.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${mics.indexOf(mic) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

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
