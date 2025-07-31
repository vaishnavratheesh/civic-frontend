
import { GoogleGenAI, Type } from "@google/genai";
import { ISSUE_TYPES } from '../constants';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using mock data for Gemini service.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface GrievanceAnalysis {
  title: string;
  issueType: string;
  priorityScore: number;
  summary: string;
}

const grievanceSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'A concise title for the grievance, under 10 words.' },
    issueType: { type: Type.STRING, enum: ISSUE_TYPES, description: 'The category of the issue.' },
    priorityScore: { type: Type.INTEGER, description: 'A priority score from 1 (low) to 5 (high) based on urgency and impact.' },
    summary: { type: Type.STRING, description: 'A brief summary of the issue.' }
  },
  required: ['title', 'issueType', 'priorityScore', 'summary'],
};

export const analyzeGrievance = async (description: string, imageBase64: string): Promise<GrievanceAnalysis> => {
  if (!process.env.API_KEY) {
    // Mock response for environments without an API key
    return new Promise(resolve => setTimeout(() => resolve({
      title: "Mock: Leaking Pipe Reported",
      issueType: "Water Leakage",
      priorityScore: 4,
      summary: "This is a mock analysis. A water pipe seems to be leaking near the main road, causing waterlogging."
    }), 1500));
  }

  const prompt = "Analyze the following user-submitted grievance. Based on the description and the image, provide a suitable title, classify the issue type from the provided list, and assign a priority score from 1 (low) to 5 (critical). Also provide a brief summary.";

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: imageBase64,
    },
  };
  
  const textPart = { text: prompt };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [textPart, imagePart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: grievanceSchema,
    }
  });

  const jsonText = response.text.trim();
  const result = JSON.parse(jsonText);
  return result as GrievanceAnalysis;
};

interface WelfareScore {
    score: number;
    justification: string;
}

const welfareSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: 'An eligibility score from 1 to 100 based on need.' },
        justification: { type: Type.STRING, description: 'A brief justification for the score.' }
    },
    required: ['score', 'justification']
};

export const scoreWelfareApplication = async (reason: string, familyIncome: number, dependents: number): Promise<WelfareScore> => {
    if (!process.env.API_KEY) {
        return new Promise(resolve => setTimeout(() => resolve({
            score: Math.floor(Math.random() * 40) + 60,
            justification: "Mock analysis: The applicant demonstrates significant need based on the provided details."
        }), 1000));
    }

    const prompt = `Act as a fair welfare distribution officer. Based on the following application details, provide a need-based eligibility score from 1 to 100 and a brief justification. Higher scores mean higher need. Details: Reason='${reason}', Family Income=${familyIncome}, Dependents=${dependents}.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: welfareSchema,
        }
    });
    
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result as WelfareScore;
};

export const askAboutWard = async (question: string, wardNumber: number): Promise<string> => {
    if (!process.env.API_KEY) {
        return new Promise(resolve => setTimeout(() => resolve(
            "Mock Answer: The next garbage collection for Ward " + wardNumber + " is scheduled for Wednesday at 8 AM. Please ensure your bins are placed on the curb by 7:30 AM. For more details, you can visit the municipal website's waste management section."
        ), 1500));
    }

    const systemInstruction = `You are a helpful and friendly AI assistant for Ward ${wardNumber} of the city. Your role is to provide concise and accurate information about local services, events, rules, and personnel.
    - Councillor for Ward ${wardNumber}: Jane Doe
    - Councillor's Office: Room 201, City Hall, 123 Main St.
    - Office Hours: Mon-Fri, 9 AM - 5 PM.
    - Garbage Collection: Every Wednesday and Saturday morning.
    - Recycling: Every second and fourth Friday.
    - Local Park: "Harmony Park", open 6 AM to 10 PM.
    - Upcoming event: Community cleanup day on the first Saturday of next month.
    Based on this context and general knowledge, answer the user's question. If the question is outside the scope of ward information, politely state that you can only answer ward-related questions.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return response.text;
};
