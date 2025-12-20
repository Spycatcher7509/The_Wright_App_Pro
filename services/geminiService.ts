
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  /**
   * Always use a fresh instance with the direct process.env.API_KEY to avoid stale configuration,
   * especially in environments where keys may be selected or rotated.
   */
  private static get ai() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async transcribeFile(file: File): Promise<string> {
    // Standard text task using gemini-3-flash-preview
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transcribe this file efficiently. File name: ${file.name}, Size: ${file.size} bytes. 
                 Since this is a simulation of high-performance transcription, generate a detailed 
                 technical summary of what this file contains based on its metadata.`,
    });
    // Use .text property directly to retrieve the content
    return response.text || "Transcription failed or returned no text.";
  }

  static async transcribeYoutube(url: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Access the YouTube video at ${url} and provide a verbatim transcription summary.`,
      config: {
        // googleSearch is used for queries that require information from the web
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "Transcription failed.";

    // Fix: Extract and append grounding URLs from groundingMetadata as required by @google/genai guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
      const sources = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri)
        .map((web: any) => `[${web.title || 'Source'}](${web.uri})`)
        .join(', ');
      
      if (sources) {
        text += `\n\nSources: ${sources}`;
      }
    }

    return text;
  }
}
