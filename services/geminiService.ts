
import { GoogleGenAI, Modality } from "@google/genai";

export class GeminiService {
  /**
   * Always use a fresh instance with the direct process.env.API_KEY to avoid stale configuration.
   */
  private static get ai() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private static readonly GB_INSTRUCTION = "CRITICAL: You must use British English (GB) spelling at all times (e.g., 'initialise', 'programme', 'colour', 'centre', 'authorised'). All dates must be in DD/MM/YYYY format. All times must be in 24-hour format.";

  static async transcribeFile(file: File): Promise<string> {
    // For a world-class experience, we attempt to read the file if it's text-based or small, 
    // but the engine prompt is the primary controller here.
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${this.GB_INSTRUCTION}
                 Perform a STRICT VERBATIM, word-for-word transcription of the following asset. 
                 Do NOT summarise. Do NOT omit filler words if they are present in the source logic.
                 Asset Name: ${file.name}
                 Asset Size: ${file.size} bytes
                 Asset Type: ${file.type}
                 
                 Provide the verbatim stream with forensic precision, maintaining all original formatting and structural line breaks.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "Forensic Handshake successful, but no verbatim stream was returned.";
  }

  static async transcribeYoutube(url: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${this.GB_INSTRUCTION}
                 Utilise Google Search to retrieve the EXACT content of this YouTube video: ${url}.
                 
                 INSTRUCTIONS:
                 1. Provide a STRICT VERBATIM transcription of the video content. 
                 2. Do NOT provide a summary or key points; every word spoken must be represented.
                 3. Identify the ACTUAL video title and format the first line as: ACTUAL_VIDEO_TITLE: [Full Video Title]
                 4. Maintain speaker identification and 24-hour timestamps for every significant dialogue block.
                 5. Ensure all spelling is British English (GB).`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    let text = response.text || "";

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
      const sources = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri)
        .map((web: any) => `[${web.title || 'Source'}](${web.uri})`)
        .join(', ');
      
      if (sources) {
        text += `\n\n--- Forensic Verification Sources ---\n${sources}`;
      }
    }

    if (!text) throw new Error("The engine could not extract a verbatim stream.");

    return text;
  }

  static async generateSpeech(text: string): Promise<Uint8Array> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `${this.GB_INSTRUCTION} Speak this text clearly in a professional British tone: ${text.substring(0, 500)}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");
    
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  static async chatAboutTranscript(transcript: string, question: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${this.GB_INSTRUCTION}
                 Referencing the provided verbatim transcript, address the following query with absolute precision.
                 Query: ${question}
                 
                 Transcript Context:
                 ${transcript}`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "I am sorry, I could not process that forensic query.";
  }
}
