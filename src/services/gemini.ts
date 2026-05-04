import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: any = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface LearningProfile {
  name: string;
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  goals: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  subject: string;
  specificTopics?: string;
  importantTopics?: string;
}

export interface LearningStep {
  title: string;
  content: string;
  method: string;
  difficulty: string;
  estimatedTime: string;
  resourceLink?: string;
  resourceType?: 'youtube' | 'course' | 'article';
  codingProblems?: { title: string; url: string; platform: string }[];
}

export interface LearningPath {
  subject: string;
  steps: LearningStep[];
}

export interface ScheduleItem {
  time: string;
  activity: string;
  type: 'learning' | 'break' | 'focus' | 'rest';
}

export interface DailySchedule {
  day: string;
  items: ScheduleItem[];
}

export interface StudyNotes {
  title: string;
  summary: string;
  introduction: string;
  keyConcepts: { 
    concept: string;
    explanation: string;
    examples: {
      description: string;
      code?: string;
      contentType?: 'code' | 'equation' | 'reaction';
      codeExplanation?: string;
    }[]
  }[];
  detailedBreakdown: string;
  mainExampleCode?: string;
  mainExampleContentType?: 'code' | 'equation' | 'reaction';
  mainExampleExplanation?: string;
  qa: { question: string; answer: string }[];
  codingProblems?: { title: string; url: string; difficulty: 'Easy' | 'Medium' | 'Hard'; platform: string }[];
  suggestedSources: { name: string; type: string; url: string }[];
}

export interface AssessmentQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Assessment {
  title: string;
  questions: AssessmentQuestion[];
}

export async function solveDoubt(moduleContext: string, userMessage: string, history: { role: string, content: string }[]): Promise<string> {
  const ai = getAI();
  const prompt = `You are an AI teaching assistant. Help the student understand the current learning module.
  
Context of the current module:
${moduleContext}

Use the context to answer the student's question accurately and concisely.

Student's question: ${userMessage}
`;

  const conversation = history.map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`).join('\n');
  const fullPrompt = `${prompt}\n\nConversation History:\n${conversation}\n\nStudent: ${userMessage}\nAI: `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: fullPrompt,
  });

  return response.text || "I'm sorry, I couldn't process that.";
}

export async function generateLearningPath(profile: LearningProfile): Promise<LearningPath> {
  const ai = getAI();
  const prompt = `Generate a personalized learning path for a student with the following profile:
  Name: ${profile.name}
  Learning Style: ${profile.learningStyle}
  Goals: ${profile.goals}
  Current Level: ${profile.level}
  Subject: ${profile.subject}
  Specific Topics of Interest: ${profile.specificTopics || 'Not specified'}
  Mandatory Topics to Cover: ${profile.importantTopics || 'Not specified'}

  The path should have a logical flow of steps that fully covers the subject in depth.
  
  IMPORTANT FOR RESOURCES:
  - For any YouTube links provided, you MUST ensure they are from HIGHLY REPUTABLE educational sources (e.g., Khan Academy, CrashCourse, MIT OpenCourseWare, 3Blue1Brown, Stand-up Maths, etc.).
  - Double-check that the URL is a standard, non-restricted, and generally evergreen video that is likely to remain available.
  - Prefer official channel links over re-uploads.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                method: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                estimatedTime: { type: Type.STRING },
                resourceLink: { type: Type.STRING },
                resourceType: { type: Type.STRING, enum: ['youtube', 'course', 'article'] },
                codingProblems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      url: { type: Type.STRING },
                      platform: { type: Type.STRING }
                    },
                    required: ["title", "url", "platform"]
                  }
                }
              },
              required: ["title", "content", "method", "difficulty", "estimatedTime", "resourceLink", "resourceType"]
            }
          }
        },
        required: ["subject", "steps"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function adaptContent(currentStep: LearningStep, feedback: string): Promise<LearningStep> {
  const ai = getAI();
  const prompt = `Adapt this learning step content based on feedback:
  Step: ${JSON.stringify(currentStep)}
  Feedback: ${feedback}
  
  Return a JSON object of the adapted LearningStep.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateSchedule(profile: LearningProfile, goals: string): Promise<DailySchedule> {
  const ai = getAI();
  const prompt = `Generate a high-performance daily schedule for:
  Subject: ${profile.subject}
  Goals: ${goals}
  
  Return a JSON object conforming to DailySchedule interface.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateStudyNotes(subject: string, level: string): Promise<StudyNotes> {
  const ai = getAI();
  const prompt = `
  Generate exhaustive, high-quality study notes for the topic: "${subject}" at a ${level} level.
  These notes should be designed for deep learning and high retention.
  
  Include:
  1. A compelling title.
  2. A concise summary.
  3. A detailed introduction.
  4. 3-5 Key Concepts, each with an explanation and 1-2 examples.
  5. Examples can include code, equations, or chemical reactions. Use clear formatting.
  6. A detailed breakdown of the topic.
  7. A "Master Example" (code/equation/reaction) that synthesizes everything.
  8. 5 high-quality Q&A pairs for self-testing.
  9. 2-3 coding problems (if applicable, or conceptual problems) with LeetCode/Hackerrank style titles.
  10. 3 suggested sources (YouTube, Official Docs, etc.).

  IMPORTANT:
  - For YouTube links, you MUST use URLs from verified, major educational creators (e.g., Coursera, edX, FreeCodeCamp, Physics Girl, Veritasium, etc.) to ensure long-term availability and playability.
  - Do NOT use plain LaTeX blocks (e.g. $$...$$). Instead, use human-readable plain text symbols where possible, or very simple inline math if necessary.
  - Return the results in a valid JSON format according to the specified schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          introduction: { type: Type.STRING },
          keyConcepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                concept: { type: Type.STRING },
                explanation: { type: Type.STRING },
                examples: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      description: { type: Type.STRING },
                      code: { type: Type.STRING },
                      contentType: { type: Type.STRING, enum: ['code', 'equation', 'reaction'] },
                      codeExplanation: { type: Type.STRING }
                    },
                    required: ["description"]
                  }
                }
              },
              required: ["concept", "explanation", "examples"]
            }
          },
          detailedBreakdown: { type: Type.STRING },
          mainExampleCode: { type: Type.STRING },
          mainExampleContentType: { type: Type.STRING, enum: ['code', 'equation', 'reaction'] },
          mainExampleExplanation: { type: Type.STRING },
          qa: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          },
          codingProblems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
                platform: { type: Type.STRING }
              },
              required: ["title", "url", "difficulty", "platform"]
            }
          },
          suggestedSources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["name", "type", "url"]
            }
          }
        },
        required: ["title", "summary", "introduction", "keyConcepts", "detailedBreakdown", "qa", "suggestedSources"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateAssessment(subject: string, level: string, notesContext: string, isSecondAttempt: boolean = false): Promise<Assessment> {
  const ai = getAI();
  const prompt = `Generate a high-stakes, 25-question multiple-choice assessment based STRICTLY on the following context about "${subject}":
  
  Context: ${notesContext.slice(0, 10000)}
  
  Assessment Requirements:
  - Subject Knowledge Level: ${level}
  - Attempt Status: ${isSecondAttempt ? 'SECOND ATTEMPT. You MUST change all questions, options, and question order from any previous version. Ensure a completely fresh set of challenges.' : 'FIRST ATTEMPT.'}
  - CONTENT CONSTRAINT: Generate questions ONLY from the information provided in the Context (the study notes).
  - VOLUME: Exactly 25 questions.
  - OPTIONS: Exactly 4 options per question. Choose the "best option" style where distractors are plausible.
  - QUALITY: Focus on deep conceptual understanding and application, not simple keyword recall.
  - FEEDBACK: Include a clear educational explanation for every question.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  minItems: 4,
                  maxItems: 4
                },
                correctAnswerIndex: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswerIndex", "explanation"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
