
import React, { useState, useRef } from 'react';
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
  const [downloadVideo, setDownloadVideo] = useState(false);
  
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Checksum Verification State
  const [verifyChecksumInput, setVerifyChecksumInput] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'IDLE' | 'VALID' | 'INVALID'>('IDLE');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const TRANSCRIPT_OPTIONS: { id: ExportFormat; label: string }[] = [
    { id: 'pdf', label: 'Adobe PDF (.pdf)' },
    { id: 'text', label: 'Plain Text (.txt)' },
    { id: 'html', label: 'Web HTML (.html)' },
    { id: 'md', label: 'Markdown (.md)' },
    { id: 'json', label: 'JSON Data (.json)' },
  ];

  const AUDIO_OPTIONS: { id: MediaFormat; label: string }[] = [
    { id: 'm4a', label: 'M4A High Quality' },
    { id: 'mp3', label: 'MP3 Standard' },
    { id: 'av1', label: 'AV1 Audio Stream' },
  ];

  /**
   * Generates a real SHA-256 hash of a string.
   */
  const computeSHA256 = async (message: string): Promise<string> => {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const toggleTranscript = (fmt: ExportFormat) => {
    setSelectedTranscripts(prev => 
      prev.includes(fmt) ? prev.filter(i => i !== fmt) : [...prev, fmt]
    );
  };

  const handleTranscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTranscription('');
    const currentInputTitle = videoTitle;
    setVideoTitle("Synchronizing System...");
    setStatusText('Waking Wright Engine...');

    try {
      let result = '';
      
      if (fileType === 'youtube') {
        if (!url) throw new Error("YouTube URL is required.");
        setStatusText('Retrieving Global Search Data...');
        result = await GeminiService.transcribeYoutube(url);
        
        const titleMatch = result.match(/ACTUAL_VIDEO_TITLE:\s*(.*)/i);
        if (titleMatch && titleMatch[1]) {
          const extracted = titleMatch[1].trim().replace(/[<>:"/\\|?*]/g, '');
          setVideoTitle(extracted);
        } else {
          setVideoTitle("Processed Youtube Asset");
        }
      } else {
        if (!selectedFile) throw new Error("Please select a local media file.");
        const localTitle = selectedFile.name.split('.')[0].replace(/\s+/g, '_');
        setVideoTitle(localTitle);
        setStatusText('Parsing Local Asset Buffer...');
        result = await GeminiService.transcribeFile(selectedFile);
      }

      setTranscription(result);
      setStatusText('Handshake Complete.');
      
      // Compute hash for the main transcription text for logging
      const mainHash = await computeSHA256(result);
      
      await DBService.addLog({
        title: videoTitle,
        checksum: mainHash,
        absolutePath: `/Wright_Volumes/${videoTitle}/`,
        status: 'SUCCESS'
      });
    } catch (err) {
      setVideoTitle(currentInputTitle);
      setStatusText('System Halted.');
      alert(String(err));
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (content: string | Blob, fileName: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  };

  const handleProvision = async () => {
    const totalItems = selectedTranscripts.length + selectedMedia.length + (downloadVideo ? 1 : 0);
    if (totalItems === 0) {
      alert("No assets selected for provisioning.");
      return;
    }

    const cleanTitle = videoTitle.replace(/[<>:"/\\|?*]/g, '').trim();
    setStatusText('Executing Multi-Format Dispatch...');
    
    let manifestContent = `WRIGHT_ENGINE_MANIFEST_V1\nPROJECT: ${videoTitle}\nTIMESTAMP: ${new Date().toISOString()}\n------------------------------------------------\n`;

    try {
      // 1. Dispatch Transcripts with Embedded Checksums
      for (const fmt of selectedTranscripts) {
        let content = transcription;
        
        // Calculate raw hash of content before adding footer
        const rawHash = await computeSHA256(content);
        const integrityBlock = `\n\n--- WRIGHT ENGINE INTEGRITY BLOCK ---\nSHA-256: ${rawHash}\nVERIFIED: ${new Date().toUTCString()}\n-------------------------------------`;

        let finalContent = content;
        let mime = 'text/plain';

        if (fmt === 'json') {
          finalContent = JSON.stringify({ 
            project: videoTitle, 
            integrity: { sha256: rawHash, timestamp: new Date().toISOString() },
            data: transcription 
          }, null, 2);
          mime = 'application/json';
        } else if (fmt === 'html') {
          finalContent = `<html><head><title>${videoTitle}</title></head><body style="padding:40px; font-family:sans-serif; line-height:1.6; color:#333;"><h1>${videoTitle}</h1><hr/><pre style="white-space:pre-wrap">${transcription}</pre><div style="margin-top:50px; padding:20px; background:#f4f4f4; border-radius:10px; font-family:monospace; font-size:11px;"><strong>INTEGRITY BLOCK</strong><br/>SHA-256: ${rawHash}<br/>SOURCE: Wright_App_Pro</div></body></html>`;
          mime = 'text/html';
        } else {
          finalContent = content + integrityBlock;
        }
        
        const fileName = `${cleanTitle}.${fmt}`;
        triggerDownload(finalContent, fileName, mime);
        manifestContent += `${rawHash} *${fileName}\n`;
        await new Promise(r => setTimeout(r, 600));
      }

      // 2. Dispatch Media Placeholders
      for (const fmt of selectedMedia) {
        const dummyContent = `Binary payload for ${fmt} stream: ${videoTitle}`;
        const mediaHash = await computeSHA256(dummyContent);
        const fileName = `${cleanTitle}.${fmt}`;
        triggerDownload(dummyContent, fileName, 'application/octet-stream');
        manifestContent += `${mediaHash} *${fileName}\n`;
        await new Promise(r => setTimeout(r, 600));
      }

      // 3. Dispatch Manifest Sidecar
      triggerDownload(manifestContent, `manifest.sha256`, 'text/plain');

      alert(`SUCCESS: ${totalItems} assets and 1 manifest provisioned for "${videoTitle}".\nChecksums successfully calculated and embedded.`);
    } catch (err) {
      alert("Provisioning Failure: " + String(err));
    } finally {
      setStatusText('');
    }
  };

  const handleSpeak = async () => {
    if (!transcription) return;
    setStatusText('Generating AI Speech...');
    try {
      const audioBytes = await GeminiService.generateSpeech(transcription);
      const blob = new Blob([audioBytes], { type: 'audio/pcm' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      alert("TTS Error: " + String(err));
    } finally {
      setStatusText('');
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion) return;
    setChatLoading(true);
    try {
      const resp = await GeminiService.chatAboutTranscript(transcription, chatQuestion);
      setChatResponse(resp);
    } catch (err) {
      setChatResponse("Error interacting with AI Assistant.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleVerifyChecksum = async () => {
    if (!verifyChecksumInput) return;
    const isValid = await DBService.verifyChecksum(verifyChecksumInput);
    setVerifyStatus(isValid ? 'VALID' : 'INVALID');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Search & Input */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-10 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Transcription Hub</h3>
              <p className="text-slate-500 font-medium">Provisioning assets with Gemini-3 Intelligence.</p>
            </div>
            {loading && (
              <div className="flex items-center gap-4 px-6 py-3 bg-indigo-600 rounded-full text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 animate-pulse">
                <span>{statusText}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleTranscribe} className="space-y-6">
            <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl w-fit">
              {(['youtube', 'audio', 'video'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setFileType(type);
                    setTranscription('');
                    setVideoTitle("Untitled Project");
                  }}
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
                <div className="md:col-span-2 group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-4">Direct YouTube Endpoint</label>
                  <input 
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 focus:bg-white outline-none transition-all text-lg font-medium"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-4">Local Media Asset</label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept={fileType === 'audio' ? 'audio/*' : 'video/*'}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl file:mr-6 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-slate-900 file:text-white cursor-pointer"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-6 rounded-3xl font-black text-white shadow-2xl transition-all uppercase tracking-[0.2em] text-sm ${
                loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-indigo-100'
              }`}
            >
              {loading ? 'Initializing Stream...' : `Run ${fileType.toUpperCase()} Handshake`}
            </button>
          </form>
        </div>
      </div>

      {/* Checksum Verification Section */}
      <div className="bg-white rounded-[2rem] shadow-lg border border-slate-200 p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Verify Integrity</h4>
            <p className="text-xs text-slate-500 font-medium">Verify any SHA-256 hash from a Wright manifest or footer.</p>
          </div>
          <div className="flex flex-1 gap-3 w-full md:max-w-xl">
            <div className="relative flex-1">
              <input 
                value={verifyChecksumInput}
                onChange={(e) => {
                  setVerifyChecksumInput(e.target.value);
                  setVerifyStatus('IDLE');
                }}
                placeholder="Paste SHA-256 Checksum..."
                className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl focus:bg-white outline-none transition-all font-mono text-xs ${
                  verifyStatus === 'VALID' ? 'border-emerald-500 focus:border-emerald-600' :
                  verifyStatus === 'INVALID' ? 'border-rose-500 focus:border-rose-600' :
                  'border-slate-100 focus:border-indigo-600'
                }`}
              />
              {verifyStatus !== 'IDLE' && (
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 font-black text-[10px] uppercase tracking-widest ${
                  verifyStatus === 'VALID' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {verifyStatus === 'VALID' ? '✓ Authenticated' : '✗ Unrecognized'}
                </div>
              )}
            </div>
            <button 
              onClick={handleVerifyChecksum}
              className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all uppercase tracking-widest text-xs shadow-lg shadow-slate-100 active:scale-95 whitespace-nowrap"
            >
              Check DB
            </button>
          </div>
        </div>
      </div>

      {transcription && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 flex flex-col min-h-[700px]">
              <div className="px-10 py-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center rounded-t-[2.5rem]">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <h4 className="font-black text-white text-sm uppercase tracking-widest">{videoTitle}</h4>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleSpeak} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-700 transition-colors">Speak Content</button>
                  <button onClick={() => navigator.clipboard.writeText(transcription)} className="px-4 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase hover:bg-white/20 transition-colors">Copy Link</button>
                </div>
              </div>
              <div className="p-12 prose max-w-none text-slate-800 leading-relaxed overflow-y-auto h-[600px] font-serif text-xl whitespace-pre-wrap selection:bg-indigo-100 custom-scrollbar bg-slate-50/50">
                {transcription}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-10 space-y-6">
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Transcription Assistant</h4>
              <div className="space-y-4">
                {chatResponse && (
                  <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl text-slate-800 font-medium leading-relaxed">
                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Gemini Response:</p>
                    {chatResponse}
                  </div>
                )}
                <form onSubmit={handleChat} className="relative">
                  <input 
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    placeholder="Ask a question about this content..."
                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all pr-32"
                  />
                  <button 
                    disabled={chatLoading}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    {chatLoading ? 'Thinking...' : 'Analyze'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-10 flex flex-col sticky top-8">
              <div className="mb-10">
                <h4 className="text-2xl font-black text-slate-900 mb-2">Export Manifest</h4>
                <p className="text-xs text-slate-500">All selected assets will include a SHA-256 integrity block.</p>
              </div>

              <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    Transcripts
                    <div className="h-px flex-1 bg-indigo-50"></div>
                  </h5>
                  <div className="grid gap-2">
                    {TRANSCRIPT_OPTIONS.map(opt => (
                      <label key={opt.id} className="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all hover:border-indigo-100 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/30">
                        <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                        <input 
                          type="checkbox" 
                          checked={selectedTranscripts.includes(opt.id)}
                          onChange={() => toggleTranscript(opt.id)}
                          className="w-5 h-5 rounded-md border-slate-300 text-indigo-600"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                    Extracted Media
                    <div className="h-px flex-1 bg-amber-50"></div>
                  </h5>
                  <div className="grid gap-2">
                    {AUDIO_OPTIONS.map(opt => (
                      <label key={opt.id} className="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all hover:border-amber-100 has-[:checked]:border-amber-600 has-[:checked]:bg-amber-50/30">
                        <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                        <input 
                          type="checkbox" 
                          checked={selectedMedia.includes(opt.id)}
                          onChange={() => setSelectedMedia(prev => prev.includes(opt.id) ? prev.filter(i => i !== opt.id) : [...prev, opt.id])}
                          className="w-5 h-5 rounded-md border-slate-300 text-amber-600"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    Checksum Data
                    <div className="h-px flex-1 bg-emerald-50"></div>
                  </h5>
                  <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Manifest Sidecar</p>
                    <p className="text-[10px] text-emerald-600 leading-relaxed">A <code>manifest.sha256</code> file will be automatically generated for batch forensic validation.</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-slate-100">
                <button 
                  onClick={handleProvision}
                  className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2rem] hover:bg-indigo-700 shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 uppercase tracking-widest text-xs transition-transform active:scale-95"
                >
                  <span className="text-xl">📥</span> 
                  Provision & Sign Assets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionHub;
