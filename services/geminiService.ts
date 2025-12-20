
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  /**
   * Always use a fresh instance with the direct process.env.API_KEY to avoid stale configuration.
   */
  private static get ai() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async transcribeFile(file: File): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a high-fidelity transcription simulation for the following file:
                 Name: ${file.name}
                 Size: ${file.size} bytes
                 Type: ${file.type}
                 Provide a detailed, professional-grade transcription summary.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "Handshake successful, but no text was returned.";
  }

  static async transcribeYoutube(url: string): Promise<string> {
    // Use Pro with Search for accurate retrieval
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Utilise Google Search to identify the EXACT title and content of this YouTube video: ${url}.
                 
                 INSTRUCTIONS:
                 1. Identify the ACTUAL video title.
                 2. Provide a detailed transcription summary.
                 3. Format the first line as: ACTUAL_VIDEO_TITLE: [Full Video Title]
                 4. Provide key timestamps and speaker identification where possible.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    let text = response.text;
    if (!text && response.candidates?.[0]?.content?.parts) {
      text = response.candidates[0].content.parts
        .map(part => part.text || '')
        .join('\n');
    }

    if (!text) throw new Error("The engine could not extract a verbatim stream.");

    // Extract sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
      const sources = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri)
        .map((web: any) => `[${web.title || 'Source'}](${web.uri})`)
        .join(', ');
      
      if (sources) {
        text += `\n\n--- Verification Sources ---\n${sources}`;
      }
    }

    return text;
  }

  static async generateSpeech(text: string): Promise<Uint8Array> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${text.substring(0, 500)}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");
    
    // Manual decoding as per rules
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
      contents: `Based on the following transcript, answer this question: ${question}\n\nTranscript: ${transcript}`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  }
}
