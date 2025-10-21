
import { GoogleGenAI, Type } from "@google/genai";
import { ISSUE_TYPES } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Using mock data for Gemini service.");
}

// Only create the GoogleGenAI instance if we have an API key
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

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
  if (!ai) {
    // Mock response for environments without an API key - classify based on keywords
    return new Promise(resolve => setTimeout(() => {
      const desc = description.toLowerCase();
      let issueType = "Other";
      let title = "Issue Reported";
      let summary = "An issue has been reported.";
      let priorityScore = 3;

      // Classify based on keywords in description
      if (desc.includes('garbage') || desc.includes('waste') || desc.includes('trash') || desc.includes('rubbish') || desc.includes('dump')) {
        issueType = "Waste Management";
        title = "Garbage Collection Issue";
        summary = "A waste management issue has been reported.";
        priorityScore = 3;
      } else if (desc.includes('water') || desc.includes('leak') || desc.includes('pipe') || desc.includes('tap')) {
        issueType = "Water Leakage";
        title = "Water Leakage Issue";
        summary = "A water leakage issue has been reported.";
        priorityScore = 4;
      } else if (desc.includes('road') || desc.includes('pothole') || desc.includes('street') || desc.includes('path')) {
        issueType = "Road Repair";
        title = "Road Repair Needed";
        summary = "A road repair issue has been reported.";
        priorityScore = 3;
      } else if (desc.includes('light') || desc.includes('lamp') || desc.includes('bulb') || desc.includes('dark')) {
        issueType = "Streetlight Outage";
        title = "Streetlight Issue";
        summary = "A streetlight outage has been reported.";
        priorityScore = 2;
      } else if (desc.includes('drain') || desc.includes('flood') || desc.includes('water logging') || desc.includes('overflow')) {
        issueType = "Drainage";
        title = "Drainage Issue";
        summary = "A drainage problem has been reported.";
        priorityScore = 4;
      } else if (desc.includes('noise') || desc.includes('nuisance') || desc.includes('disturbance')) {
        issueType = "Public Nuisance";
        title = "Public Nuisance";
        summary = "A public nuisance issue has been reported.";
        priorityScore = 2;
      }

      resolve({
        title,
        issueType,
        priorityScore,
        summary
      });
    }, 1500));
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

  const jsonText = response.text?.trim() || '{}';
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
    if (!ai) {
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
    
    const jsonText = response.text?.trim() || '{}';
    const result = JSON.parse(jsonText);
    return result as WelfareScore;
};

export const askAboutWard = async (question: string, wardNumber: number): Promise<string> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/chatbot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: question,
                ward: wardNumber
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.response || 'Sorry, I could not process your request.';
        } else {
            throw new Error('API request failed');
        }
    } catch (error) {
        console.error('AI Chatbot API error:', error);
        
        // Fallback to mock response
        return new Promise(resolve => setTimeout(() => resolve(
            "I'm having trouble connecting to the AI service right now. Here's some general information about Ward " + wardNumber + ": The next garbage collection is scheduled for Wednesday at 8 AM. Please ensure your bins are placed on the curb by 7:30 AM. For more details, you can contact your ward councillor or visit the panchayath office."
        ), 1500));
    }
};
