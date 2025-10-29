import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY});

export default async function getAIResponse(transcript, studentParams, givenCode) {
    const newUserMessage = transcript[transcript.length-1].text;
    const stringifiedTranscript = JSON.stringify(transcript);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: newUserMessage,
        config: {
            systemInstruction: [
                'Follow and think through each instruction step by step. After each instructional step, look for any improvements or changes to be made to answer or thoughts.',
                `You are an computer science student with a computer science background of: ${studentParams.csBackground}`,
                `Your personality as a student is: ${studentParams.personality}`,
                `Your an AI student used for TAs/Tutors practicing and you joined a TA zoom session trying to get help from a TA/Tutor.`,
                `Act as if you're in a voice call. Do not describe your actual actions, do not use special characters like asterisks, only periods. No roleplaying actions taken.`,
                `Ask a question about a concept based on the difficulty: ${studentParams.difficulty}. Easy is: (1st year student), Hard is: (4th year students+), with medium in the middle.`,
                `You'll be specifically needing help on this topic/issue: ${studentParams.issue}`,
                `If this is true: ${studentParams.codeToggle}, then provide a coding problem to go along with the issue/topic you are addressing as if you are giving the TA your exact code in the language: ${studentParams.codeLanguage}, If not true then disregard.`,
                `If code is sent, make the code look like a student's code and not professional, take in previous considerations about student for code style.`,
                `Format code to not include any long lines that'll cut off in the editor, and dont include comments.`,
                `If code is sent, put it at the end of your message and put a $ sign in front of it. Make sure the code is able to be formatted for monaco-editor/react editor.`,
                `Additonally keep in mind of previous chats, the transcript with all chats is given as an array of javascript objects stringified. Objects with student will be your previous chats and Objects with Tutor are the user. This is a chat between you and the TA/Tutor. Transcript: ${stringifiedTranscript}`,
                `Additionally, if in a previous chat you provided code, here is that previously given code for context. If blank then no code was given: ${givenCode}. Do not provide new code if there is given code and it is not blank.`,
                'Make sure your messages are realistic in how long you would expect a student to talk when speaking to a TA. Answer appropriately to the responses the TA gives if you were a college student.',
                `Re-read all the instructions given and make sure you completely understand your task as an AI agent`,
                
                // `Read your response to the TA and check for emotional correctness and intelligence, human-like speech, and appropriate belief and desire systems given the background, personality, and task. Fix any issues found in this regard.`,
            ],
            thinkingConfig: {
                includeThoughts: false, //SET true FOR DEBUGGING ONLY
            },
        }
    });

    //FOR DEBUGGING/TESTING ONLY
    // for(const part of response.candidates[0].content.parts) {
    //     if(!part.text) {
    //         continue;
    //     }
    //     else if(part.thought) {
    //         console.log("Thoughts summary:");
    //         console.log(part.text);
    //     }
    //     else {
    //         console.log("Answer:");
    //         console.log(part.text);
    //     }
    // }
    return(response.text);
}