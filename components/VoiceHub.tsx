
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { User } from '../types';

const VoiceHub: React.FC<{ user: User }> = ({ user }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Gateway Closed');
  const [transcriptions, setTranscriptions] = useState<{ role: 'user' | 'ai'; text: string; time: string }[]>([]);
  const [currentTurn, setCurrentTurn] = useState<{ role: 'user' | 'ai'; text: string } | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const IN_SAMPLE_RATE = 16000;
  const OUT_SAMPLE_RATE = 24000;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions, currentTurn]);

  // Real-time Visualiser Logic
  useEffect(() => {
    if (isActive && canvasRef.current && analyserRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          const r = 99 + (i * 2);
          const g = 102;
          const b = 241;
          
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      };
      draw();
    } else if (!isActive && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isActive]);

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encodeBase64 = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }

  const startSession = async () => {
    try {
      setStatus('Initialising Handshake...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: IN_SAMPLE_RATE });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUT_SAMPLE_RATE });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Visualiser setup
      const analyser = audioContextInRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
          systemInstruction: `CRITICAL: You are the Wright Intelligence Voice Engine. 
          Use British English (GB) spelling at all times (Initialise, Optimise, Forensic). 
          All dates DD/MM/YYYY. 24-hour time. 
          Be word-for-word verbatim when referencing context. Be professional and high-performance.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('Secure Link Active');
            
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            source.connect(analyser); // Connect to analyser for visualiser
            
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBase64 = encodeBase64(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Logic for turn-based transcription buffering
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              setCurrentTurn(prev => ({ role: 'user', text: (prev?.text || '') + text }));
            }
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              setCurrentTurn(prev => ({ role: 'ai', text: (prev?.text || '') + text }));
            }
            if (msg.serverContent?.turnComplete && currentTurn) {
              setTranscriptions(prev => [...prev, { 
                ...currentTurn!, 
                time: new Date().toLocaleTimeString('en-GB', { hour12: false }) 
              }]);
              setCurrentTurn(null);
            }

            // Handle Audio Data
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, OUT_SAMPLE_RATE);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Handshake Error:', e);
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
            setStatus('Gateway Closed');
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      alert('Handshake Failed: ' + err);
      setStatus('Gateway Closed');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextInRef.current) {
      audioContextInRef.current.close();
      audioContextInRef.current = null;
    }
    if (audioContextOutRef.current) {
      audioContextOutRef.current.close();
      audioContextOutRef.current = null;
    }
    setIsActive(false);
    setStatus('Gateway Closed');
    setCurrentTurn(null);
  };

  const downloadSessionLog = () => {
    const logHeader = `OFFICIAL WRIGHT_APP_PRO VOICE LAB FORENSIC ARCHIVE\nGenerated: ${new Date().toLocaleString('en-GB')}\nSecurity: SHA-512 Enveloped Session\n\n`;
    const logBody = transcriptions.map(t => `[${t.time}] ${t.role.toUpperCase()}: ${t.text}`).join('\n\n');
    const blob = new Blob([logHeader + logBody], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Forebatim_Session_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="flex gap-8 flex-1 min-h-0">
        
        {/* Connection Control & Visualiser */}
        <div className="w-96 flex flex-col gap-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden h-fit">
            <div className="relative z-10 space-y-8 w-full">
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <canvas 
                  ref={canvasRef} 
                  width={200} 
                  height={200} 
                  className={`absolute inset-0 rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} 
                />
                <div className={`relative z-10 w-32 h-32 rounded-full border-4 flex items-center justify-center text-5xl transition-all duration-500 ${
                  isActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-800/50'
                }`}>
                  {isActive ? '🎙️' : '💤'}
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-black text-xl uppercase tracking-tighter italic">Voice Lab Gateway</h3>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] h-4">{status}</p>
              </div>

              <button
                onClick={isActive ? stopSession : startSession}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                  isActive 
                    ? 'bg-rose-600 text-white hover:bg-rose-700' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-900/40'
                }`}
              >
                {isActive ? 'Terminate Link' : 'Establish Secure Link'}
              </button>
            </div>
            
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]"></div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h4 className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Link Metrics</h4>
              <button 
                onClick={downloadSessionLog} 
                disabled={transcriptions.length === 0}
                className="text-indigo-600 hover:text-indigo-800 text-[9px] font-black uppercase disabled:opacity-0"
              >
                Archive Log
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold uppercase">
                  <span className="text-slate-400">Signal Integrity</span>
                  <span className={isActive ? "text-indigo-600" : "text-slate-300"}>{isActive ? '99.9%' : '0%'}</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-indigo-500 transition-all duration-500 ${isActive ? 'w-full' : 'w-0'}`}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold uppercase">
                  <span className="text-slate-400">Buffer Health</span>
                  <span className={isActive ? "text-emerald-600" : "text-slate-300"}>{isActive ? 'Optimal' : 'Offline'}</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-emerald-500 transition-all duration-500 ${isActive ? 'w-full' : 'w-0'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Transcription Stream */}
        <div className="flex-1 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative">
          <div className="p-8 border-b border-slate-800 bg-black/40 flex justify-between items-center z-10">
            <h4 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Forebatim Voice Stream</h4>
            <div className="flex gap-2">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
              <span className="text-[9px] text-slate-500 font-bold uppercase">SHA-512 Secure Tunnel</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar z-10">
            {transcriptions.length === 0 && !currentTurn ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 text-center space-y-4">
                <span className="text-4xl">🌫️</span>
                <p className="text-xs font-black uppercase tracking-widest">Awaiting Transcription Handshake...</p>
              </div>
            ) : (
              <>
                {transcriptions.map((t, i) => (
                  <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`p-6 rounded-[2rem] text-sm leading-relaxed max-w-[80%] ${
                      t.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                    }`}>
                      {t.text}
                    </div>
                    <div className="mt-2 px-4 flex items-center gap-2">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{t.role === 'user' ? user.name : 'Wright Engine'}</span>
                      <span className="text-[8px] font-mono text-slate-700">{t.time}</span>
                    </div>
                  </div>
                ))}
                
                {/* Active Buffering Turn */}
                {currentTurn && (
                  <div className={`flex flex-col ${currentTurn.role === 'user' ? 'items-end' : 'items-start'} opacity-60 animate-pulse`}>
                    <div className={`p-6 rounded-[2rem] text-sm leading-relaxed max-w-[80%] ${
                      currentTurn.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-inner' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                    }`}>
                      {currentTurn.text}
                    </div>
                    <div className="mt-2 px-4">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">In-Progress Stream...</span>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {isActive && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/60 backdrop-blur-md rounded-full border border-slate-800 z-20 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Live Uplink Active</span>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default VoiceHub;
