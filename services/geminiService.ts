
import { GoogleGenAI, Modality } from "@google/genai";

export class GeminiService {
  private static readonly GB_INSTRUCTION = "CRITICAL: You must use British English (GB) spelling at all times (e.g., 'initialise', 'programme', 'colour', 'centre', 'authorised'). All dates must be in DD/MM/YYYY format. All times must be in 24-hour format.";

  /**
   * Fresh instantiation is mandatory to ensure the bridge picks up the 
   * latest API key injected into process.env.
   */
  private static createClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async transcribeFile(file: File): Promise<string> {
    const ai = this.createClient();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType: file.type
              }
            },
            {
              text: `${this.GB_INSTRUCTION}
                 Perform a STRICT VERBATIM, word-for-word transcription of the provided audio/video asset. 
                 Do NOT summarise. Do NOT omit filler words.
                 Asset Name: ${file.name}
                 
                 Provide the verbatim stream with forensic precision.`
            }
          ]
        }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "Forensic Handshake successful, but no verbatim stream was returned.";
  }

  static async transcribeYoutube(url: string): Promise<string> {
    const ai = this.createClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${this.GB_INSTRUCTION}
                 Utilise Google Search to retrieve the EXACT content of this YouTube video: ${url}.
                 Provide a STRICT VERBATIM transcription.`,
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
      
      if (sources) text += `\n\n--- Forensic Verification Sources ---\n${sources}`;
    }

    return text;
  }

  static async generateSpeech(text: string): Promise<Uint8Array> {
    const ai = this.createClient();
    const response = await ai.models.generateContent({
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
    const ai = this.createClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${this.GB_INSTRUCTION}
                 Referencing the provided verbatim transcript, address the query: ${question}
                 
                 Transcript Context:
                 ${transcript}`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "I am sorry, I could not process that forensic query.";
  }
}
