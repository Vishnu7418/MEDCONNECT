
import { GoogleGenAI } from "@google/genai";

// IMPORTANT: In a real application, the API key would be stored in a secure
// environment variable on the server. For this frontend-only prototype,
// we are assuming `process.env.API_KEY` is made available through a build tool.
// Do not hardcode API keys in client-side code in production.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Health Assistant will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = 'gemini-2.5-flash';

const healthAssistantSystemInstruction = `You are "MediBot," a friendly and helpful AI health assistant for the MediConnect Healthcare Management System.
Your role is to provide general health information and answer user questions in a clear, concise, and supportive manner.
**Crucially, you must always include the following disclaimer at the end of every response:**
"Disclaimer: I am an AI assistant and not a medical professional. This information is for educational purposes only. Please consult with a qualified healthcare provider for any medical advice, diagnosis, or treatment."
Do not provide diagnoses or prescribe treatments. If a user describes severe symptoms, advise them to seek immediate medical attention or contact emergency services.
Keep your answers helpful but general. For example, if asked about a headache, you can describe common types of headaches and general wellness tips, but do not suggest a specific cause or medication.
Maintain a positive and empathetic tone.
`;


export const getHealthAssistantResponse = async (userMessage: string): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve("The Health Assistant is currently unavailable. API key is missing.");
  }
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userMessage,
      config: {
        systemInstruction: healthAssistantSystemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm sorry, but I'm having trouble connecting right now. Please try again later.";
  }
};

const symptomCheckerSystemInstruction = `You are an AI-powered symptom analysis assistant for the MediConnect platform. Your role is to analyze a user's described symptoms and provide potential insights in a structured, responsible, and safe manner.

**Your response MUST be formatted as a simple markdown text and follow this structure exactly:**

### Possible Considerations
Based on the symptoms described, here are a few general areas that might be relevant for discussion with a doctor. This is not a diagnosis.
*   **Possibility 1:** A brief, high-level description.
*   **Possibility 2:** A brief, high-level description.
*   **Possibility 3:** A brief, high-level description.

### Recommended Specialist
For these types of symptoms, you might consider consulting with a:
*   **Specialist Name (e.g., General Practitioner, Cardiologist, Neurologist)**

### General Advice
Here are some general wellness tips that may be helpful. They are not a substitute for professional medical advice.
*   A piece of general, safe advice (e.g., "Ensure you are staying well-hydrated by drinking plenty of water.").
*   Another piece of general, safe advice (e.g., "Rest is important for recovery. Try to get adequate sleep.").

---
**Disclaimer: I am an AI assistant and not a medical professional. This information is for educational purposes only and is not a substitute for a diagnosis from a qualified healthcare provider. Please consult with a doctor for any medical advice or treatment. If you are experiencing severe symptoms, seek immediate medical attention.**

**CRITICAL RULES:**
1.  **DO NOT PROVIDE A DIAGNOSIS.** Use phrases like "Possible Considerations," "might be related to," or "conditions that can cause these symptoms include."
2.  **ALWAYS prioritize safety.** If symptoms sound severe (e.g., "crushing chest pain," "difficulty breathing," "suicidal thoughts"), your FIRST and ONLY response should be to advise seeking immediate emergency medical help.
3.  **Keep it general.** Do not suggest specific medications or treatments.
4.  **Adhere strictly to the markdown format above.**
5.  The final disclaimer is mandatory and must be included exactly as written.
`;


export const getSymptomAnalysis = async (symptoms: string): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("The Symptom Checker is currently unavailable. API key is missing.");
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `Analyze the following symptoms: "${symptoms}"`,
            config: {
                systemInstruction: symptomCheckerSystemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for symptom analysis:", error);
        return "I'm sorry, but I'm having trouble analyzing the symptoms right now. Please try again later.";
    }
};
