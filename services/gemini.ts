import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData } from "../utils/audio";
import { SocialOptions, StepItem, AppSettings } from "../types";

/**
 * Decodes the obfuscated secure key provided by the user.
 * Follows the custom multi-layer reversible transformation.
 */
const decodeSecureKey = (encoded: string): string | null => {
  if (!encoded) return null;
  try {
    // 1. Character Unshifting
    const unshifted = encoded
      .split("")
      .map((char) => String.fromCharCode(char.charCodeAt(0) - 1))
      .join("");

    // 2. Base64 Decoding
    const decoded = atob(unshifted);
    const parts = decoded.split("|");

    // 3. Validate Salt Layer
    if (parts[1] !== "sk_v1_obfuscation_layer") {
      console.warn("Security mismatch: Salt validation failed.");
      return null;
    }

    // 4. Reverse and Return
    return parts[0].split("").reverse().join("");
  } catch (e) {
    console.error("Critical error decoding API key:", e);
    return null;
  }
};

/**
 * Resolves the API key to use for the session.
 * Checks localStorage for a user-provided obfuscated key first.
 */
const getEffectiveApiKey = (): string => {
  const settingsStr = localStorage.getItem("speedrun_studio_settings_v2");
  if (settingsStr) {
    try {
      const settings: AppSettings = JSON.parse(settingsStr);
      if (settings.encodedApiKey) {
        const decoded = decodeSecureKey(settings.encodedApiKey);
        if (decoded) return decoded;
      }
    } catch (e) {
      console.error("Local storage key resolution error", e);
    }
  }
  return process.env.API_KEY || "";
};

export const generateTutorialScript = async (
  title: string,
  steps: StepItem[],
  social: SocialOptions,
  isTurboMode: boolean = true
): Promise<string> => {
  const apiKey = getEffectiveApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const stepsText = steps.map((s, i) => `${i + 1}. ${s.text}`).join("\n");

  let socialInstructions = "";
  if (social.includeLike) socialInstructions += "- Ask for a LIKE.\n";
  if (social.includeSubscribe) socialInstructions += "- Ask for SUBSCRIBE.\n";
  if (social.includeBell) socialInstructions += "- Mention the BELL.\n";

  const prompt = `
    You are an expert YouTube tutorial scriptwriter.
    Create a script for a video titled: "${title}"
    
    Steps to cover:
    ${stepsText}
    
    Engagement elements:
    ${socialInstructions}
    
    STRICT GUIDELINES:
    1. **LENGTH**: At least 250-300 words.
    2. **TONE**: High energy, professional.
    3. **STRUCTURE**: Continuous monologue. No scene directions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Script generation error:", error);
    throw new Error(
      "Generation failed. Please verify your Production API Key in Settings."
    );
  }
};

export const generateVoiceover = async (
  text: string,
  voiceName: string = "Fenrir"
): Promise<AudioBuffer> => {
  const apiKey = getEffectiveApiKey();
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio payload received.");

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
  } catch (error) {
    console.error("TTS error:", error);
    throw new Error(
      "Voice synthesis failed. Check your Production Key settings."
    );
  }
};
