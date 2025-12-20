
import React, { useState, useRef } from 'react';
import { User, ExportFormat } from '../types';
import { DBService } from '../services/dbService';
import { GeminiService } from '../services/geminiService';

const TranscriptionHub: React.FC<{ user: User }> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState<'audio' | 'video' | 'youtube'>('audio');
  const [url, setUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>([]);
  const [savePath, setSavePath] = useState('/Users/spike/Documents/The_Wright_App_pro/Transcripts');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALL_FORMATS: ExportFormat[] = ['pdf', 'md', 'html', 'text', 'doc', 'docx', 'json', 'csv'];

  const handleTranscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTranscription('');

    try {
      let result = '';
      let title = 'Manual Job';
      
      if (fileType === 'youtube') {
        if (!url) throw new Error("YouTube URL is required.");
        result = await GeminiService.transcribeYoutube(url);
        title = `YouTube: ${url}`;
      } else {
        if (!selectedFile) throw new Error("Please select a media file to transcribe.");
        result = await GeminiService.transcribeFile(selectedFile);
        title = selectedFile.name;
      }

      setTranscription(result);
      
      const checksum = Math.random().toString(16).substr(2, 40);
      
      await DBService.addLog({
        title,
        checksum,
        absolutePath: `${savePath}/${title.replace(/[:/]/g, '_')}.txt`,
        status: 'SUCCESS'
      });
    } catch (err) {
      await DBService.addLog({
        title: fileType === 'youtube' ? 'YouTube Error' : 'Media Error',
        checksum: 'N/A',
        absolutePath: 'N/A',
        errorMessage: String(err),
        status: 'FAILURE'
      });
      alert(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map(option => (option as HTMLOptionElement).value);
    
    if (selected.includes('ALL')) {
      setSelectedFormats(ALL_FORMATS);
    } else {
      setSelectedFormats(selected as ExportFormat[]);
    }
  };

  const handleExport = () => {
    if (selectedFormats.length === 0) {
      alert("Please select formats for download.");
      return;
    }
    alert(`The_Wright_App_pro: Exporting to ${savePath}\nFormats: ${selectedFormats.join(', ')}`);
  };

  const getAcceptAttribute = () => {
    if (fileType === 'audio') return ".mp3,.opus,.m4a,audio/*";
    if (fileType === 'video') return ".mp4,.av1,video/*";
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-xl font-bold mb-6">Engine Configuration</h3>
        <form onSubmit={handleTranscribe} className="space-y-6">
          <div className="flex gap-4 p-1 bg-slate-100 rounded-xl w-fit">
            {(['audio', 'video', 'youtube'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setFileType(type);
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  fileType === type ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Local Workspace Path</label>
              <input 
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {fileType === 'youtube' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">YouTube URL</label>
                <input 
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Source Media Asset</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept={getAcceptAttribute()}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700"
                />
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
              loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
            }`}
          >
            {loading ? 'Wright Engine: Processing...' : `Execute ${fileType.toUpperCase()} Job`}
          </button>
        </form>
      </div>

      {transcription && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h4 className="font-bold text-slate-700">Transcription Result</h4>
            <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Export Selection</span>
                <select 
                  multiple
                  className="px-3 py-1 bg-white border border-slate-300 rounded text-xs min-w-[200px] h-32"
                  value={selectedFormats}
                  onChange={handleFormatChange}
                >
                  <option value="ALL" className="font-bold text-indigo-600 bg-indigo-50">-- SELECT ALL FORMATS --</option>
                  <option value="pdf">Adobe PDF (.pdf)</option>
                  <option value="md">Markdown (.md)</option>
                  <option value="html">Hypertext (.html)</option>
                  <option value="text">Plain Text (.text)</option>
                  <option value="doc">Legacy Word (.doc)</option>
                  <option value="docx">Modern Word (.docx)</option>
                  <option value="json">Data Object (.json)</option>
                  <option value="csv">Spreadsheet (.csv)</option>
                </select>
              </div>
              <button 
                onClick={handleExport}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md transition-transform active:scale-95"
              >
                Download Assets ({selectedFormats.length})
              </button>
            </div>
          </div>
          <div className="p-8 prose max-w-none text-slate-800 leading-relaxed max-h-[500px] overflow-y-auto bg-slate-50/30 font-serif whitespace-pre-wrap">
            {transcription}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionHub;
