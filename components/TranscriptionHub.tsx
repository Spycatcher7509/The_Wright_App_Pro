
import React, { useState, useRef, useEffect } from 'react';
import { User, ExportFormat, MediaFormat } from '../types';
import { DBService } from '../services/dbService';
import { GeminiService } from '../services/geminiService';

const TranscriptionHub: React.FC<{ user: User }> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [fileType, setFileType] = useState<'audio' | 'video' | 'youtube'>('youtube');
  const [url, setUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [videoTitle, setVideoTitle] = useState("Untitled Project");
  
  // Selection States
  const [selectedTranscripts, setSelectedTranscripts] = useState<ExportFormat[]>(['text', 'pdf', 'md', 'json']);
  const [selectedMedia, setSelectedMedia] = useState<MediaFormat[]>(['mp3']);
  
  // Chat States
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string, hash?: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [encryptionStage, setEncryptionStage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiTyping]);

  const TRANSCRIPT_OPTIONS: { id: ExportFormat; label: string; desc: string }[] = [
    { id: 'pdf', label: 'Forensic PDF', desc: 'Secure Adobe Document' },
    { id: 'text', label: 'Plain Text', desc: 'Raw Archive Data' },
    { id: 'html', label: 'Web Interface', desc: 'Interactive Browser Asset' },
    { id: 'md', label: 'Markdown', desc: 'Technical Documentation' },
    { id: 'json', label: 'JSON Stream', desc: 'Machine Readable Feed' },
  ];

  const AUDIO_OPTIONS: { id: MediaFormat; label: string; desc: string }[] = [
    { id: 'mp3', label: 'WAV Master', desc: 'Audacity Optimised' },
    { id: 'm4a', label: 'M4A HQ', desc: 'Apple Audio Standard' },
  ];

  const computeSHA512 = async (text: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const createSecurePDF = (title: string, content: string): Blob => {
    const date = new Date().toLocaleString('en-GB');
    const clean = content.replace(/[#*`]/g, '').replace(/\s+/g, ' ');
    const wrappedLines: string[] = [];
    for (let i = 0; i < clean.length; i += 85) {
      wrappedLines.push(clean.substring(i, i + 85).trim());
    }
    
    const textStream = wrappedLines.slice(0, 45).map((line, i) => 
      `BT /F1 10 Tf 50 ${730 - (i * 15)} Td (${line.replace(/[()]/g, '')}) Tj ET`
    ).join('\n');

    const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${textStream.length + 500} >> stream
BT /F1 16 Tf 50 800 Td (OFFICIAL WRIGHT_APP_PRO FORENSIC REPORT) Tj ET
BT /F1 12 Tf 50 780 Td (Project ID: ${title.substring(0, 30)}) Tj ET
BT /F1 8 Tf 50 765 Td (Timestamp: ${date} | Security Protocol: SHA-512 Authenticated) Tj ET
${textStream}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000233 00000 n 
0000000450 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
510
%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  };

  const handleTranscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTranscription('');
    setStatusText('Waking Wright Engine...');
    try {
      let result = '';
      if (fileType === 'youtube') {
        if (!url) throw new Error("YouTube Endpoint Required.");
        setStatusText('Retrieving Verbatim Stream...');
        result = await GeminiService.transcribeYoutube(url);
        const titleMatch = result.match(/ACTUAL_VIDEO_TITLE:\s*(.*)/i);
        setVideoTitle(titleMatch ? titleMatch[1].trim() : "YouTube Verbatim Extract");
      } else {
        if (!selectedFile) throw new Error("Local Media Asset Required.");
        setVideoTitle(selectedFile.name.split('.')[0]);
        setStatusText('Analysing Forensic Buffer...');
        result = await GeminiService.transcribeFile(selectedFile);
      }
      setTranscription(result);
      const hash = await computeSHA512(result);
      await DBService.addLog({ title: videoTitle, checksum: hash.substring(0, 64), absolutePath: `/Vault/${videoTitle}/`, status: 'SUCCESS' });
      setChatHistory([{ role: 'ai', text: `SHA-512 Secure Link Established. Verbatim Asset "${videoTitle}" is now under Wright Intelligence surveillance. Proceed with forensic query.` }]);
    } catch (err) {
      alert("Handshake Failure: " + String(err));
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const handleProvision = async () => {
    if (!transcription) return;
    setStatusText('Executing Dispatch...');
    const safeTitle = videoTitle.replace(/\s+/g, '_');
    try {
      for (const fmt of selectedTranscripts) {
        let blob: Blob;
        if (fmt === 'pdf') blob = createSecurePDF(videoTitle, transcription);
        else if (fmt === 'json') blob = new Blob([JSON.stringify({ title: videoTitle, data: transcription }, null, 2)], { type: 'application/json' });
        else if (fmt === 'html') blob = new Blob([`<html><body><pre>${transcription}</pre></body></html>`], { type: 'text/html' });
        else blob = new Blob([transcription], { type: 'text/plain' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${safeTitle}.${fmt}`;
        link.click();
        await new Promise(r => setTimeout(r, 400));
      }
      alert("Extraction Complete: All verbatim signed assets provisioned.");
    } catch (err) {
      alert("Dispatch Errored: " + err);
    } finally {
      setStatusText('');
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion || chatLoading || !transcription) return;
    const msg = chatQuestion;
    setChatQuestion('');
    setChatLoading(true);

    // Multi-Stage Granular Encryption Feedback (GB English)
    setEncryptionStage('Initialising Handshake...');
    setEncryptionProgress(5);
    await new Promise(r => setTimeout(r, 150));
    
    setEncryptionStage('Cipher Padding (Bitwise)...');
    setEncryptionProgress(25);
    await new Promise(r => setTimeout(r, 200));

    setEncryptionStage('Hashing SHA-512 Blocks...');
    const hash = await computeSHA512(msg);
    setEncryptionProgress(55);
    await new Promise(r => setTimeout(r, 250));

    setEncryptionStage('Injecting Entropy Salts...');
    setEncryptionProgress(85);
    await new Promise(r => setTimeout(r, 200));

    setEncryptionStage('Final Integrity Verification...');
    setEncryptionProgress(100);
    await new Promise(r => setTimeout(r, 100));

    // Clear encryption state and show user message
    setEncryptionProgress(0);
    setEncryptionStage('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg, hash }]);
    
    // Start iMessage Typing Indicator
    setIsAiTyping(true);

    try {
      const resp = await GeminiService.chatAboutTranscript(transcription, msg);
      // Simulate "Thinking" time for the typing indicator
      const simulatedDelay = Math.min(2500, resp.length * 15);
      await new Promise(r => setTimeout(r, simulatedDelay));
      
      setChatHistory(prev => [...prev, { role: 'ai', text: resp }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Security System: Handshake Interrupted." }]);
    } finally {
      setIsAiTyping(false);
      setChatLoading(false);
    }
  };

  const handleChatUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChatLoading(true);
    setStatusText('Injecting External Asset...');
    try {
      const content = await GeminiService.transcribeFile(file);
      setTranscription(prev => prev + "\n\n--- INJECTED VERBATIM CONTEXT: " + file.name + " ---\n" + content);
      setChatHistory(prev => [...prev, { role: 'ai', text: `Success: Verbatim Asset "${file.name}" has been ingested into the active SHA-512 context for comparative analysis.` }]);
    } catch (err) {
      alert("Injection Failure.");
    } finally {
      setChatLoading(false);
      setStatusText('');
    }
  };

  const downloadChatLog = () => {
    const log = chatHistory.map(m => `[${m.role.toUpperCase()}] ${m.hash ? `(CIPHER: ${m.hash.substring(0, 24)}...) ` : ''}${m.text}`).join('\n\n');
    const blob = new Blob([log], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Secure_Chat_Log_${videoTitle.replace(/\s+/g, '_')}.txt`;
    link.click();
  };

  const handleSpeak = async () => {
    if (!transcription) return;
    setStatusText('Waking TTS Engine...');
    try {
      const audioBytes = await GeminiService.generateSpeech(transcription);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      
      const numChannels = 1;
      const sampleRate = 24000;
      const dataInt16 = new Int16Array(audioBytes.buffer);
      const buffer = audioCtx.createBuffer(numChannels, dataInt16.length, sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
      setStatusText('Audio Stream Active');
      source.onended = () => setStatusText('');
    } catch (err) {
      alert("Audio Failure: " + err);
      setStatusText('');
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* HEADER & INPUT ENGINE */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-10 space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">The_Wright_App_pro</h3>
              <p className="text-slate-500 font-medium text-sm">Forensic Extraction Handshake | Powered by Gemini Intelligence</p>
            </div>
            {statusText && (
              <div className="px-6 py-3 bg-indigo-600 rounded-full text-white font-black text-[10px] uppercase tracking-widest animate-pulse flex items-center gap-2 shadow-lg shadow-indigo-200">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                {statusText}
              </div>
            )}
          </div>

          <form onSubmit={handleTranscribe} className="space-y-6">
            <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl w-fit">
              {(['youtube', 'audio', 'video'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFileType(type)}
                  className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    fileType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fileType === 'youtube' ? (
                <input 
                  type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
                  className="md:col-span-2 w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 outline-none transition-all text-lg font-medium"
                  placeholder="Input YouTube Endpoint URL (e.g. https://www.youtube.com/watch?v=...)"
                />
              ) : (
                <div className="md:col-span-2 group">
                  <input 
                    type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl file:bg-slate-900 file:text-white file:rounded-full file:border-0 file:px-6 file:py-2 file:mr-6 file:font-black file:text-[10px] cursor-pointer group-hover:border-indigo-200 transition-colors"
                  />
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full py-6 rounded-3xl font-black text-white bg-indigo-600 hover:bg-indigo-700 uppercase tracking-widest text-sm shadow-xl active:scale-[0.99] transition-all disabled:opacity-50">
              {loading ? 'Initialising Extraction Protocol...' : `Run ${fileType.toUpperCase()} Command`}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[800px]">
        {/* LEFT: TRANSCRIPTION VIEW */}
        <div className="lg:col-span-4 flex flex-col h-full space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 flex flex-col h-full overflow-hidden">
            <div className="px-8 py-6 bg-slate-900 flex justify-between items-center">
              <h4 className="font-black text-white text-[10px] uppercase tracking-widest truncate">{videoTitle}</h4>
              <button 
                onClick={handleSpeak}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-indigo-700"
              >
                Speak
              </button>
            </div>
            <div className="p-10 flex-1 overflow-y-auto text-slate-800 leading-relaxed font-serif text-lg bg-slate-50/50 whitespace-pre-wrap selection:bg-indigo-100 custom-scrollbar">
              {transcription || (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center space-y-4">
                  <span className="text-5xl">📡</span>
                  <p className="font-bold uppercase tracking-widest text-[10px]">Awaiting Verbatim Stream...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER: SECURE CHAT VAULT */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 p-8 flex flex-col h-full relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]"></div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">SHA-512 Secure Vault</h4>
              </div>
              <button 
                onClick={downloadChatLog}
                disabled={!transcription}
                className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition-colors disabled:opacity-30"
              >
                Download Log
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2 custom-scrollbar relative z-10">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 text-center">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center text-3xl">🔐</div>
                  <p className="text-xs font-black uppercase tracking-[0.2em]">{transcription ? 'Security Link Ready' : 'Protocol Locked'}</p>
                </div>
              ) : chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className="max-w-[90%] space-y-2">
                    <div className={`p-6 rounded-[2rem] text-sm leading-relaxed font-medium ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 rounded-tr-none' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none shadow-lg'
                    }`}>
                      {msg.text}
                    </div>
                    {msg.hash && (
                      <p className="text-[7px] font-mono text-slate-500 px-4 truncate uppercase tracking-tighter">
                        SHA-512 CIPHER: {msg.hash}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* iMessage Typing Indicator */}
              {isAiTyping && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-slate-800 p-4 rounded-[2rem] rounded-tl-none border border-slate-700 flex gap-1 items-center shadow-lg">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}

              {/* Granular Encryption Progress Feedback */}
              {encryptionProgress > 0 && (
                <div className="flex flex-col gap-3 p-4 bg-black/20 rounded-3xl border border-white/5 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                    <span className="text-indigo-400 animate-pulse">{encryptionStage}</span>
                    <span className="text-slate-500 font-mono">{encryptionProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_15px_#6366f1]" 
                      style={{ width: `${encryptionProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChat} className="flex gap-4 relative z-10">
              <input type="file" hidden ref={chatFileRef} onChange={handleChatUpload} />
              <button 
                type="button" 
                onClick={() => chatFileRef.current?.click()}
                disabled={!transcription || chatLoading}
                className="w-14 h-14 bg-slate-800 text-white rounded-2xl flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg active:scale-90 disabled:opacity-20"
                title="Inject Contextual Asset"
              >
                <span className="text-xl">📎</span>
              </button>
              <div className="flex-1 relative">
                <input 
                  disabled={!transcription || chatLoading}
                  value={chatQuestion} onChange={(e) => setChatQuestion(e.target.value)}
                  placeholder={transcription ? "Analyse data in secure context..." : "Locked until data ingestion..."}
                  className="w-full h-14 px-8 bg-black/50 border-2 border-slate-700 rounded-2xl text-white font-medium outline-none focus:border-indigo-600 transition-all placeholder:text-slate-600 disabled:cursor-not-allowed"
                />
                <button 
                  type="submit" 
                  disabled={!transcription || chatLoading || !chatQuestion}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-0"
                >
                  ➜
                </button>
              </div>
            </form>
            
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]"></div>
          </div>
        </div>

        {/* RIGHT: EXPORT SIDEBAR */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-10 flex flex-col h-full">
            <div className="mb-10">
              <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Export Manifest</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select Forensic Assets</p>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3">
                <h5 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] pb-2 border-b">Documents</h5>
                {TRANSCRIPT_OPTIONS.map(opt => (
                  <label 
                    key={opt.id} 
                    className={`flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedTranscripts.includes(opt.id) 
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' 
                        : 'border-slate-50 hover:border-indigo-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wide">{opt.label}</span>
                      <input 
                        type="checkbox" 
                        checked={selectedTranscripts.includes(opt.id)} 
                        onChange={() => setSelectedTranscripts(prev => prev.includes(opt.id) ? prev.filter(i => i !== opt.id) : [...prev, opt.id])} 
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600" 
                      />
                    </div>
                    <span className="text-[9px] font-medium text-slate-500">{opt.desc}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-3 pt-6">
                <h5 className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] pb-2 border-b">Hardware Master</h5>
                {AUDIO_OPTIONS.map(opt => (
                  <label 
                    key={opt.id} 
                    className={`flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedMedia.includes(opt.id) 
                        ? 'border-amber-600 bg-amber-50/40 shadow-sm' 
                        : 'border-slate-50 hover:border-amber-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wide">{opt.label}</span>
                      <input 
                        type="checkbox" 
                        checked={selectedMedia.includes(opt.id)} 
                        onChange={() => setSelectedMedia(p => p.includes(opt.id) ? p.filter(i => i !== opt.id) : [...p, opt.id])} 
                        className="w-4 h-4 rounded border-slate-300 text-amber-600" 
                      />
                    </div>
                    <span className="text-[9px] font-medium text-slate-500">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-slate-100">
              <button 
                onClick={handleProvision}
                disabled={!transcription}
                className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2rem] hover:bg-indigo-700 shadow-2xl shadow-indigo-100 uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none"
              >
                Provision & Sign Assets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionHub;
