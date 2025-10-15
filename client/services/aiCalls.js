import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY});

export default async function getAIResponse(transcript, studentParams) {
    const newUserMessage = transcript[transcript.length-1].text;
    const stringifiedTranscript = JSON.stringify(transcript);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: newUserMessage,
        config: {
            systemInstruction: [
                `computer science student with a computer science background of: ${studentParams.csBackground}`,
                `Your personality as a student is: ${studentParams.personality}`,
                `Your an AI being used to help TAs practice and you joined a TA session and are trying to get help. You are the student and the user is a TA.`,
                `Act as if you are having a voice call in a zoom meeting with the TA. Do not describe your actual actions and talk as if your in a call.`,
                `Make it sound natural for a college student and a human`,
                `Ask a question about a concept based on the difficulty: ${studentParams.difficulty}. Easy would be simple basic concepts (1st year student) and Hard would be more complex concepts (4th year students+), with medium in the middle.`,
                `You'll be specifically needing help on this topic/issue: ${studentParams.issue}`,
                `Additonally keep in mind of previous chats, so here is the transcript with all chats as an array of javascript objects stringified. Objects with student will be your previous chats and Objects with Tutor are the user. This is a chat between you and the TA/Tutor. Transcript: ${stringifiedTranscript}`,
                // `Additionally, keep in mind previous chats, which will be given at the end of the contents message with a dollar sign at the end to signify when the previous chats history starts. Sentences starting with pound sign will be user and percent sign will be for your previous messages, the AI.`,
                //`If the first part of the message says true, then instead of a specific concept question, ask about a code question with a simple code problem with some issue. If it says false, disregard the last sentence.`,
                //`If you do end up sending code, put it at the end of your message and put a $ sign in front of it so I can get it. Make sure the code is able to be formatted for CodeMirror editor.`,
                `Re-read all the instructions given and make sure you completely understand your task as an AI agent`,
            ]
        }
    });
    return(response.text);
}