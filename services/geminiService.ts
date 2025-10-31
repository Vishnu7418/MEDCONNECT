import { GoogleGenAI } from "@google/genai";
import type { Medicine, User, Appointment } from '../types';
import { MOCK_DOCTORS } from '../constants';

// IMPORTANT: In a real application, the API key would be stored in a secure
// environment variable on the server. For this frontend-only prototype,
// we are assuming `process.env.API_KEY` is made available through a build tool.
// Do not hardcode API keys in client-side code in production.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = 'gemini-2.5-flash';

const chatbotSystemInstruction = `You are an intelligent hospital assistant chatbot named MediBot for the MediConnect Healthcare Management System. Your job is to give direct, factual answers based *only* on the hospital data provided to you. Do not invent information or direct users to find information elsewhere in the portal.

**Key Instructions:**
1.  **Direct Answers Only:** When a user asks a question, answer it directly using the provided data.
2.  **No Navigation:** Do not tell the user "You can find this on the X page" or "Check the portal." Provide the answer yourself.
3.  **Strictly Data-Bound:** Base all your responses on the \`Hospital Data\` JSON object. Do not use any external knowledge.
4.  **Handle Missing Data:** If the information is not in the provided data, politely state that you do not have that specific information right now.

**Example Scenarios:**
*   User: "Who is Dr. Ramesh Kumar?"
*   You: "Dr. Ramesh Kumar is our General Physician, available from 9 AM to 5 PM."
*   User: "What medicines are in stock?"
*   You: (List medicines from the pharmacy data).
*   User: "Who are the nurses?"
*   You: (List nurses from the staff data).`;


export const getChatbotResponse = async (
  userMessage: string,
  data: { users: User[], medicines: Medicine[], appointments: Appointment[] }
): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve("The Chatbot is currently unavailable. API key is missing.");
  }
  
  // Create a more comprehensive knowledge base for the model
  const departments = [...new Set(MOCK_DOCTORS.map(d => d.specialization))];

  const doctors = MOCK_DOCTORS.map(d => ({
    name: d.name,
    specialization: d.specialization,
    availability: d.availability,
  }));

  const otherStaff = data.users
    .filter(u => u.role !== 'PATIENT' && u.role !== 'DOCTOR')
    .map(u => ({ name: u.name, role: u.role, department: u.department || 'N/A' }));
  
  const medicines = data.medicines.map(m => ({ name: m.name, category: m.category, quantity: m.quantity }));
  
  // Omitting specific appointment data for general queries to provide clearer, more relevant context
  // and avoid potential privacy issues or confusion. The model will rely on doctor availability instead.

  const contextData = {
    hospitalDepartments: departments,
    doctors,
    otherStaff,
    pharmacyInventory: medicines,
  };

  const finalSystemInstruction = `${chatbotSystemInstruction}\n\nHere is the complete hospital data available to you. Use this as your sole source of truth:\n\n\`\`\`json\n${JSON.stringify(contextData, null, 2)}\n\`\`\``;
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userMessage,
      config: {
        systemInstruction: finalSystemInstruction,
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

const adminInsightsSystemInstruction = `You are an expert hospital administration analyst AI for the MediConnect HMS.
You will be given a JSON object containing current data about appointments, medicine inventory, and staff.
Your task is to analyze this data and provide a concise, actionable report for the hospital administrator.
Your report MUST be in markdown format and include the following sections:

### Key Insights
- Briefly summarize the most important findings. (e.g., "Cardiology is the busiest department this month.")
- Identify any immediate concerns. (e.g., "Several key medicines are running low on stock.")

### Appointment Trends
- Analyze the appointment data. Note any departments with high volume.
- Suggest potential scheduling optimizations if any patterns are apparent.

### Pharmacy Inventory Status
- Highlight medicines that are low in stock (quantity < 20) or expired.
- Suggest reordering priorities.

### Staffing Overview
- Comment on the distribution of staff across roles and departments.
- Point out if any department seems understaffed based on appointment volume.

### Recommendations
- Provide 2-3 clear, actionable recommendations for the administrator. (e.g., "Allocate an additional nurse to the Cardiology department on peak days.")

Be professional, data-driven, and concise.
`;

export const getAdminInsights = async (data: { appointments: any[], medicines: any[], users: any[] }): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("The AI Insights feature is currently unavailable. API key is missing.");
    }
    
    // Sanitize and summarize data to fit within token limits and focus the AI
    const appointmentSummary = data.appointments.map(a => ({
        specialization: a.doctorSpecialization,
        date: a.date,
        status: a.status
    }));

    const medicineSummary = data.medicines.map(m => ({
        name: m.name,
        category: m.category,
        quantity: m.quantity,
        expiry: m.expiry
    }));
    
    const staffSummary = data.users.filter(u => u.role !== 'PATIENT').map(u => ({
        role: u.role,
        department: u.department
    }));

    const promptData = {
        appointmentSummary,
        medicineSummary,
        staffSummary,
    };

    const prompt = `Here is the current hospital data. Please generate an administrative report based on it:\n\n${JSON.stringify(promptData)}`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: adminInsightsSystemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for admin insights:", error);
        return "I'm sorry, but I'm having trouble generating the report right now. Please try again later.";
    }
};


const medicineAlternativeSystemInstruction = `You are a helpful AI assistant for a hospital pharmacist.
You will be given the name and category of a medicine that is out of stock or expired.
Your task is to suggest 2-3 common alternative medications.
Your response MUST be in simple markdown format.
For each suggestion, provide a brief (1-sentence) reason why it's a suitable alternative.

Example format:
Here are some possible alternatives for [Medicine Name]:

*   **Alternative 1:** [Reason for suggestion].
*   **Alternative 2:** [Reason for suggestion].

---
**Disclaimer: This is an AI-generated suggestion. The final decision must be made by a qualified pharmacist or physician.**
`;

export const getMedicineAlternatives = async (medicine: { name: string, category: string }): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("The suggestion feature is currently unavailable. API key is missing.");
    }

    const prompt = `The medicine "${medicine.name}", which is in the "${medicine.category}" category, is out of stock. Please suggest alternatives.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: medicineAlternativeSystemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for medicine alternatives:", error);
        return "I'm sorry, but I'm having trouble generating suggestions right now. Please try again later.";
    }
};
