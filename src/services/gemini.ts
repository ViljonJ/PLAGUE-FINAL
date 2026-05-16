import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: any = null;

export function getAI() {
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
  uploadedFile?: { name: string, dataUrl: string, mimeType: string };
}

export interface LearningStep {
  title: string;
  content: string;
  method: string;
  difficulty: string;
  estimatedTime: string;
  resourceLink?: string;
  resourceType?: 'youtube' | 'course' | 'article';
  youtubeVideos?: { title: string; url: string; channel: string }[];
  codingProblems?: { title: string; url: string; platform: string }[];
}

export interface LearningPath {
  subject: string;
  roadmapOverview?: string;
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

export async function* solveDoubtStream(context: string, userMessage: string, history: { role: string, content: string }[], mode: 'teaching' | 'navigator' = 'teaching') {
  const ai = getAI();
  
  let prompt = '';
  if (mode === 'teaching') {
    prompt = `You are an AI teaching assistant. Help the student understand the current learning module.
  
Context of the current module:
${context}

Use the context to answer the student's question accurately and concisely.

Student's question: ${userMessage}
`;
  } else {
    prompt = `You are VIRIX, the AI Customer Support Agent, App Navigator, and core intelligence of the "Plague" learning application.

FULL APP KNOWLEDGE BASE (PLAGUE - Knowledge That Spreads):
Plague is an AI-Powered Personalized Learning System using Adaptive Pathway Intelligence and Full-Stack Cloud Architecture. It was created by Vishalkumaran V, Viljon Kumar J, Karthikeyan A S, and Hitesh Raj R L from SNS College of Technology. 
Unlike traditional e-learning platforms (like Moodle, Coursera) that use a generalized "one-course-for-all" static syllabus, Plague uses Gemini AI for intelligent content generation, adaptive curriculum synthesis, and continuous pathway optimization. 

WHY PLAGUE IS DIFFERENT & SUPERIOR:
- Dynamic Difficulty Adjustment: If accuracy > 80%, complexity increases. If < 50%, material is simplified.
- Reshape Adaptation Engine: Dynamically reconstructs learning material when conceptual difficulty is detected (provides simpler explanations, visual analogies, practical examples, stepwise derivations).
- Proven Performance: 89% engagement rate, 86% course completion, 84% retention score, 92% student satisfaction, and 34% average time saved compared to traditional LMS.
- Generative AI Integration: Real-time generation of notes, summaries, practice questions, and flashcards via Gemini AI.

KEY FEATURES & WHERE TO FIND THEM:
1. Dashboard (Main Screen): The central hub tracking Daily Streaks, XP, Rank, and completion ratios.
2. Neural Pathways (Courses Tab): Customized learning paths. Users "infect" a new module to adaptively learn it.
3. Neural Schedule (Temporal Optimization): Generates automated, AI-driven daily study routines.
4. AI Tools (Sidebar):
   - Chat Assistant (VIRIX): You! Helping users navigate and understand progress.
   - Summarizer: Users paste text here to generate condensed, Neuro-Synthesized overviews.
   - Notes Generator: Creates comprehensive study notes at Surface, Intermediate, or Advanced depth.
5. Growth Profile: Users set their goals, upload CV/Resume for skill extraction, and track their long-term learning vectors.
6. Diagnostic Assessments: End-of-module AI quizzes that feed data back to the Adaptation Engine.

YOUR MISSION:
Help the user understand what Plague is, how it works, and how to navigate its features based on the knowledge provided above. Highlight Plague's unique adaptive intelligence and Reshape Engine. Be incredibly positive, encouraging, and helpful, matching the futuristic vibe of the app (but keeping support clear and accessible). 
Keep your responses short, concise, and highly informative. Do not write long paragraphs.
DO NOT teach subjects directly here. If they ask subject/learning questions, enthusiastically guide them to use the Summarizer, Notes Generator, or to dive into an active Neural Pathway.
Never hallucinate features—stick to the architecture and functions explicitly listed here.

User Context (Profile & Stats):
${context}

User's Query: ${userMessage}
`;
  }

  const conversation = history.map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`).join('\n');
  const fullPrompt = `${prompt}\n\nConversation History:\n${conversation}\n\nStudent: ${userMessage}\nAI: `;

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: fullPrompt,
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

export async function regenerateBlueprint(profile: LearningProfile): Promise<string> {
  const ai = getAI();
  const prompt = `You are an elite AI Learning Pathway Architect and Career Mentor inside an adaptive learning platform called "PLAGUE" (Personalized Learning Pathway Agent for Guided Understanding and Excellence).

Your job is NOT to generate a short roadmap.
Your job is to generate an EXTREMELY detailed, realistic, personalized, research-style learning pathway that feels like a hybrid of:
- senior engineering mentor advice,
- university curriculum planning,
- career coaching,
- productivity guidance,
- skill-gap analysis,
- and personalized AI tutoring.

The output must feel deeply customized to the learner.

──────────────────────────────
INPUT DATA YOU WILL RECEIVE
──────────────────────────────

Name: ${profile.name}
Ultimate Goal: ${profile.goals}
Subject/Preferences: ${profile.subject}
Learning Style: ${profile.learningStyle}
Experience Level: ${profile.level}
Specific/Known Topics: ${profile.specificTopics || 'Not specified'}
Mandatory Topics/Constraints: ${profile.importantTopics || 'Not specified'}

──────────────────────────────
PRIMARY OBJECTIVE
──────────────────────────────

Generate a COMPLETE personalized roadmap. It must include:

1. Honest profile assessment
2. Skill-gap analysis
3. Realistic timeline
4. Detailed learning phases
5. Constraints-aware planning
6. What they already know
7. What they can skip
8. What they MUST master
9. Weekly strategy
10. Portfolio guidance
11. Motivation & consistency coaching
12. Project roadmap
13. Interview preparation path
14. Career readiness milestones
15. Resource recommendations
16. Daily/weekly study structure
17. Adaptive suggestions based on constraints

The response should feel like a premium mentorship report worth thousands of dollars.

──────────────────────────────
RESPONSE STYLE
──────────────────────────────

The tone should be:
- intelligent
- motivating
- realistic
- strategic
- mentor-like
- deeply personalized
- brutally honest when needed
- but encouraging

DO NOT generate generic motivational fluff.

Speak like a senior engineer mentoring a serious learner.

Use phrases like:
- "Here's the real gap..."
- "Most learners fail here because..."
- "This is optional for your goal..."
- "You do NOT need to master..."
- "Given your constraints..."
- "This is where your existing knowledge gives you leverage..."

Explain WHY each phase exists.

──────────────────────────────
OUTPUT STRUCTURE (MANDATORY MARKDOWN FORMAT)
──────────────────────────────

# Your Personalized Learning Roadmap: [Goal]

Start with a strong personalized introduction.

Then generate these sections EXACTLY:

1. Profile Assessment
- Analyze their current level
- Mention strengths
- Mention missing areas
- Mention realistic challenges
- Mention leverage points
- Mention constraints impact

2. Existing Knowledge Advantage
- Explain how their current skills help
- Explain transferable skills
- Explain what foundations are already covered

3. Skill Gap Analysis
Use a table:
| Area | Current Level | Required Level | Gap Severity | Priority |
|------|------|------|------|------|

4. What You DO NOT Need to Learn
Very important.
Remove unnecessary topics based on goals.

5. Constraints-Aware Strategy
Analyze weekly hours, learning style, burnout risk, consistency strategy.

6. Learning Phases
Create 4–8 detailed phases.
For EACH phase include: Title, Duration, Why this phase matters, Key concepts, Deep topics list, Common mistakes, What success looks like, Recommended resources (CRITICAL: MUST include 2-3 of the best recommended YouTube videos as clickable markdown links, but to prevent broken links you MUST formulate the URL as a YouTube search query link like this: \`[Video Title or Topic](https://www.youtube.com/results?search_query=channel+name+video+topic)\`), Hands-on projects, Mini milestones, Weekly schedule suggestion.

7. Suggested Daily/Weekly Routine
Create weekly plan, realistic breakdown, revision strategy, project time, burnout prevention.

8. Portfolio Development Roadmap
Explain what projects to build, project complexity progression, GitHub strategy, resume-ready projects, portfolio mistakes.

9. Interview Preparation Path
Include DSA prep, behavioral prep, mock interviews, system design prep, resume preparation.

10. Career Readiness Milestones
Create milestone table:
| Milestone | What You Should Be Able To Do |
|---|---|

11. Recommended Resources
Categorize: books, YouTube, documentation, practice platforms, communities, newsletters, GitHub repos.

12. Advanced Suggestions
Personalized suggestions based on interests, constraints, strengths, career goal.

13. Motivation & Consistency Advice
Talk about burnout, comparison, frustration, slow progress, imposter syndrome, consistency systems.

14. Final Mentor Note
End with a strong mentor-style conclusion.

──────────────────────────────
ADAPTIVE INTELLIGENCE RULES
──────────────────────────────
- If user already knows something: reduce emphasis, accelerate roadmap.
- If user has low weekly hours: optimize for high ROI learning, prioritize essentials.
- If user wants fast job readiness: prioritize portfolio + interview prep.
- If user is already intermediate: avoid beginner explanations.

──────────────────────────────
VERY IMPORTANT
──────────────────────────────
DO NOT generate short summaries. The roadmap must be EXTREMELY long and detailed.`;

  const contentsPayload: any = [{
    role: 'user',
    parts: [
      { text: prompt }
    ]
  }];

  if (profile.uploadedFile) {
    const base64Data = profile.uploadedFile.dataUrl.split(',')[1];
    contentsPayload[0].parts.push({
      inlineData: {
        data: base64Data,
        mimeType: profile.uploadedFile.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contentsPayload,
    config: {
      temperature: 0.7,
    }
  });

  return response.text || "Failed to generate blueprint.";
}

export async function generateLearningPath(profile: LearningProfile): Promise<LearningPath> {
  const ai = getAI();
  const prompt = `You are an elite AI Learning Pathway Architect and Career Mentor inside an adaptive learning platform called "PLAGUE".

Your job is NOT to generate a short roadmap.
Your job is to generate an EXTREMELY detailed, realistic, personalized, research-style learning pathway.

──────────────────────────────
INPUT DATA YOU WILL RECEIVE
──────────────────────────────

Name: ${profile.name}
Ultimate Goal: ${profile.goals}
Subject/Preferences: ${profile.subject}
Learning Style: ${profile.learningStyle}
Experience Level: ${profile.level}
Specific/Known Topics: ${profile.specificTopics || 'Not specified'}
Mandatory Topics/Constraints: ${profile.importantTopics || 'Not specified'}
${profile.uploadedFile ? `\nSupplemental Material (${profile.uploadedFile.name}): \n${profile.uploadedFile.mimeType.startsWith('text') ? profile.uploadedFile.dataUrl : '[Base64 file provided below]'}` : ''}

──────────────────────────────
PRIMARY OBJECTIVE
──────────────────────────────

Generate a COMPLETE personalized roadmap that will be returned in the 'roadmapOverview' field. It must include:

1. Honest profile assessment
2. Skill-gap analysis
3. Realistic timeline
4. Detailed learning phases
5. Constraints-aware planning
6. What they already know
7. What they can skip
8. What they MUST master
9. Weekly strategy
10. Portfolio guidance
11. Motivation & consistency coaching
12. Project roadmap
13. Interview preparation path
14. Career readiness milestones
15. Resource recommendations
16. Daily/weekly study structure
17. Adaptive suggestions based on constraints

The response should feel like a premium mentorship report worth thousands of dollars.

──────────────────────────────
RESPONSE STYLE
──────────────────────────────

The tone should be:
- intelligent
- motivating
- realistic
- strategic
- mentor-like
- deeply personalized
- brutally honest when needed
- but encouraging

DO NOT generate generic motivational fluff.

Speak like a senior engineer mentoring a serious learner.

Use phrases like:
- "Here's the real gap..."
- "Most learners fail here because..."
- "This is optional for your goal..."
- "You do NOT need to master..."
- "Given your constraints..."
- "This is where your existing knowledge gives you leverage..."

Explain WHY each phase exists.

──────────────────────────────
OUTPUT STRUCTURE FOR 'roadmapOverview' (MANDATORY MARKDOWN FORMAT)
──────────────────────────────

# Your Personalized Learning Roadmap: [Goal]

Start with a strong personalized introduction.

Then generate these sections EXACTLY:

1. Profile Assessment
- Analyze their current level
- Mention strengths
- Mention missing areas
- Mention realistic challenges
- Mention leverage points
- Mention constraints impact

2. Existing Knowledge Advantage
- Explain how their current skills help
- Explain transferable skills
- Explain what foundations are already covered

3. Skill Gap Analysis
Use a table:
| Area | Current Level | Required Level | Gap Severity | Priority |
|------|------|------|------|------|

4. What You DO NOT Need to Learn
Very important.
Remove unnecessary topics based on goals.

5. Constraints-Aware Strategy
Analyze weekly hours, learning style, burnout risk, consistency strategy.

6. Learning Phases
Create 4–8 detailed phases.
For EACH phase include: Title, Duration, Why this phase matters, Key concepts, Deep topics list, Common mistakes, What success looks like, Recommended resources (CRITICAL: MUST include 2-3 of the best recommended YouTube videos as clickable markdown links, but to prevent broken links you MUST formulate the URL as a YouTube search query link like this: \`[Video Title or Topic](https://www.youtube.com/results?search_query=channel+name+video+topic)\`), Hands-on projects, Mini milestones, Weekly schedule suggestion.

7. Suggested Daily/Weekly Routine
Create weekly plan, realistic breakdown, revision strategy, project time, burnout prevention.

8. Portfolio Development Roadmap
Explain what projects to build, project complexity progression, GitHub strategy, resume-ready projects, portfolio mistakes.

9. Interview Preparation Path
Include DSA prep, behavioral prep, mock interviews, system design prep, resume preparation.

10. Career Readiness Milestones
Create milestone table:
| Milestone | What You Should Be Able To Do |
|---|---|

11. Recommended Resources
Categorize: books, YouTube, documentation, practice platforms, communities, newsletters, GitHub repos.

12. Advanced Suggestions
Personalized suggestions based on interests, constraints, strengths, career goal.

13. Motivation & Consistency Advice
Talk about burnout, comparison, frustration, slow progress, imposter syndrome, consistency systems.

14. Final Mentor Note
End with a strong mentor-style conclusion.

──────────────────────────────
ADAPTIVE INTELLIGENCE RULES
──────────────────────────────
- If user already knows something: reduce emphasis, accelerate roadmap.
- If user has low weekly hours: optimize for high ROI learning, prioritize essentials.
- If user wants fast job readiness: prioritize portfolio + interview prep.
- If user is already intermediate: avoid beginner explanations.

──────────────────────────────
VERY IMPORTANT
──────────────────────────────
DO NOT generate short summaries. The 'roadmapOverview' must be EXTREMELY long and detailed.

Generate the 'steps' array according to the roadmap phases.
IMPORTANT FOR RESOURCES in 'steps':
- For any YouTube links provided, you MUST ensure they are from HIGHLY REPUTABLE educational sources.
- Prefer official channel links over re-uploads.`;

  const contentsPayload: any = [{
    role: 'user',
    parts: [
      { text: prompt }
    ]
  }];

  if (profile.uploadedFile) {
    const base64Data = profile.uploadedFile.dataUrl.split(',')[1];
    contentsPayload[0].parts.push({
      inlineData: {
        data: base64Data,
        mimeType: profile.uploadedFile.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contentsPayload,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          roadmapOverview: { type: Type.STRING, description: "A detailed markdown-formatted roadmap overview, containing profile assessment, learning phases, expectations, suggestions on topics, what they already know, what they don't need to know, milestones, motivation tips, and estimated timeline." },
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
                youtubeVideos: {
                  type: Type.ARRAY,
                  description: "A list of the best and most relevant YouTube videos for this specific learning step. CRITICAL: For the 'url' field, to guarantee the link is never broken, you MUST use a YouTube search URL (e.g., https://www.youtube.com/results?search_query=channel+name+video+title) instead of a direct watch URL.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      url: { type: Type.STRING },
                      channel: { type: Type.STRING }
                    },
                    required: ["title", "url", "channel"]
                  }
                },
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

export async function regenerateStepsFromBlueprint(blueprint: string, existingSteps?: LearningStep[]): Promise<LearningStep[]> {
  const ai = getAI();
  let prompt = `Based on the following highly detailed Learning Blueprint, generate the concrete learning steps.
Your job is to translate the phases and topics in this blueprint into actual actionable steps (modules) to be completed by the student.

Blueprint:
${blueprint}`;

  if (existingSteps) {
    prompt += `

IMPORTANT INSTRUCTIONS REGARDING EXISTING PROGRESS:
The user already has an existing set of modules. You MUST keep the original blueprint and module consistency.
- ONLY edit what the new blueprint implies (what the user asked to change).
- DO NOT add new modules or remove existing ones unless the blueprint clearly dictates it.
- Keep the exact same 'title' string for existing modules that shouldn't change, so that the user's progress is not lost. If you change a module's title, its progress WILL be reset.
- Maintain the original module list structure and only update/replace/add/remove exactly what is needed based on the new blueprint.

Existing Modules for Reference:
${JSON.stringify(existingSteps.map(s => ({ title: s.title, content: s.content })), null, 2)}
`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
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
                youtubeVideos: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      url: { type: Type.STRING },
                      channel: { type: Type.STRING }
                    },
                    required: ["title", "url", "channel"]
                  }
                },
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
        required: ["steps"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return parsed.steps || [];
}

export async function adaptContent(currentStep: LearningStep, feedback: string): Promise<LearningStep> {
  const ai = getAI();
  const prompt = `Adapt this learning step content based on user feedback:
  Step: ${JSON.stringify(currentStep)}
  Feedback: ${feedback}
  
  IMPORTANT: Return a JSON object of the adapted LearningStep matching the schema.
  CRITICAL: If adapting an existing step, you MUST keep the exact same "title" string as the original step unless the user's feedback explicitly demands a completely different topic. If you change the title, the user's completion progress for this module will be reset.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          method: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          estimatedTime: { type: Type.STRING },
          resourceLink: { type: Type.STRING },
          resourceType: { type: Type.STRING, enum: ['video', 'article', 'book', 'interactive', 'github'] },
          practiceExercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { title: { type: Type.STRING }, link: { type: Type.STRING } }
            }
          }
        },
        required: ["title", "content", "method", "difficulty", "estimatedTime"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateSchedule(profile: LearningProfile, goals: string, selectedModules?: string[], studyDuration?: string): Promise<DailySchedule> {
  const ai = getAI();
  let prompt = `Generate a high-performance daily schedule for a student.
  Primary Subject Area: ${profile.subject}
  Goals: ${goals}`;

  if (selectedModules && selectedModules.length > 0) {
    prompt += `\nThe student has specifically requested to study the following modules today:\n${selectedModules.join("\n")}\nNote: Some modules may be prefixed with their course/subject name.`;
  }
  if (studyDuration) {
    prompt += `\nTotal Available Study Duration: ${studyDuration}`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                activity: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['learning', 'break', 'focus', 'rest'] }
              },
              required: ["time", "activity", "type"]
            }
          }
        },
        required: ["day", "items"]
      }
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

export async function summarizeContent(promptContent: string, depth: string, file?: { data: string, mimeType: string }): Promise<string> {
  const ai = getAI();
  const prompt = `You are an AI Summarizer. Summarize the following text or file content.
  The desired summarization depth is: ${depth}. 
  Explain it clearly with key points and its explanation based on this depth.

  IMPORTANT: Return ONLY the summary markdown. Do NOT include conversational filler like "Here is the summary" or "Sure, I can help".

  Content:
  ${promptContent}`;

  const contents: any = [prompt];
  if (file) {
    contents.push({
      inlineData: {
        data: file.data.split(",")[1] || file.data,
        mimeType: file.mimeType,
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
  });

  return response.text || "I'm sorry, I couldn't summarize that.";
}

export async function scheduleStudyPlan(moduleToStudy: string, hoursPerDay: string, days: string, pathwayContext: string): Promise<string> {
  const ai = getAI();
  const prompt = `You are an AI Study Scheduler. Create a detailed daily study schedule based on the following:
  
  Module to study: ${moduleToStudy}
  Hours per day: ${hoursPerDay}
  Number of days: ${days}
  Overall Pathway context: ${pathwayContext}
  
  Please format the schedule nicely using markdown, providing a clear day-by-day plan with time blocks (e.g., hours 1-2, hours 3-4).
  
  IMPORTANT: Return ONLY the study schedule markdown. Do NOT include conversational filler like "Here is the schedule" or "Sure, I can help".`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "Failed to generate schedule.";
}

export async function analyzeResume(base64Data: string, mimeType: string): Promise<{ about: string, skills: string[] }> {
  const prompt = `Analyze this resume document. Extract a short professional summary highlighting their background, and a list of specific skills acquired (max 15 skills). Return JSON.
Format:
{
  "about": "A concise professional summary...",
  "skills": ["JavaScript", "React", "Project Management"]
}`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType: mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          about: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["about", "skills"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
