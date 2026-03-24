"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"
import { useSearchParams } from 'next/navigation';
import getAIResponse from '../../../services/aiCalls.js';
import { Editor } from '@monaco-editor/react';

type TranscriptMessage = {
  id: number
  speaker: "tutor" | "student"
  text: string
  timestamp: string
}

type StudentParameters = {
  csBackground: string
  personality: string
  engagementLevel: string
  issue: string
  codeToggle: boolean
  codeLanguage: string
  usePersona: string
}

export default function ActiveSessionPage() {
  const router = useRouter();
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [lastUserMsg, setLastUserMsg] = useState<string>("");
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const [code, setCode] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Array<Blob>>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const elapsedTimeRef = useRef(0);
  const studentParamsRef = useRef<StudentParameters | null>(null);
  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef<string>("");         // ✅ was missing entirely
  const turnIndexRef = useRef<number>(0);          // ✅ tracks turn order
  const userIdRef = useRef<string>("");            // ✅ ref so async callbacks always have latest value

  const queryParams = useSearchParams();

  // 1. Load query params into ref
  useEffect(() => {
    studentParamsRef.current = {
      csBackground:   queryParams.get('csBackground')   ?? "Error, tell user",
      personality:    queryParams.get('personality')    ?? "Error, tell user",
      engagementLevel:queryParams.get('engagementLevel')?? "Error, tell user",  // ✅ fixed from 'difficulty'
      issue:          queryParams.get('issue')          ?? "Error, tell user",
      codeToggle:     queryParams.get("codeToggle")     === 'true',
      codeLanguage:   queryParams.get('codeLanguage')   ?? "Javascript",
      usePersona:     queryParams.get('usePersona')     ?? "",
    }
  }, []);

  // 2. Load userId from localStorage into both state and ref
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      userIdRef.current = storedUserId;
      console.log('UserId loaded:', storedUserId);
    } else {
      console.warn('No userId found in localStorage');
    }
  }, []);

  // 3. Start session in DB once userId is available
  useEffect(() => {
    if (!userId || sessionStarted) return;     // ✅ wait for userId, don't double-fire
    setSessionStarted(true);

    fetch('http://localhost:5000/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        studentParams: studentParamsRef.current,
      }),
    })
      .then(res => res.json())
      .then(data => {
        sessionIdRef.current = data.sessionId;
        console.log('Session started:', data.sessionId);
      })
      .catch(err => console.error('Error starting session:', err));
  }, [userId]);

  // 4. Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1;
        elapsedTimeRef.current = newTime;
        return newTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 5. Get AI response whenever tutor sends a new message
  useEffect(() => {
    if (transcript.length === 0) return;
    const lastMsg = transcript[transcript.length - 1];
    if (lastMsg.speaker !== 'tutor' || !lastMsg.text || !studentParamsRef.current) return;

    getAIResponse(transcript, studentParamsRef.current, code)
      .then(response => {
        if (!response) return;

        const splitResponse = response.split('$');
        const studentText = splitResponse[0];
        const newCode = splitResponse[1];

        textToSpeech(studentText);

        const studentTurn: TranscriptMessage = {
          id: Date.now(),
          speaker: 'student',
          text: studentText,
          timestamp: formatTime(elapsedTimeRef.current),
        };

        setTranscript(prev => [...prev, studentTurn]);

        // ✅ Save student turn to DB
        saveTurn('student', studentText);

        if (newCode) setCode(newCode);
      })
      .catch(err => console.error("AI response error:", err));
  }, [lastUserMsg]);

  // -------------------------
  // Helpers
  // -------------------------

  const saveTurn = async (speaker: 'tutor' | 'student', text: string) => {
    if (!sessionIdRef.current || !userIdRef.current) return;
    try {
      await fetch('http://localhost:5000/api/turns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          userId: userIdRef.current,
          index: turnIndexRef.current++,
          speaker,
          text,
          timestampMs: elapsedTimeRef.current * 1000,
        }),
      });
    } catch (err) {
      console.error('Error saving turn:', err);
    }
  };

  const endSession = async () => {
    if (sessionIdRef.current) {
      try {
        await fetch(`http://localhost:5000/api/sessions/${sessionIdRef.current}/end`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            durationSeconds: elapsedTimeRef.current,
            finalCode: code,
          }),
        });
      } catch (err) {
        console.error('Error ending session:', err);
      }
    }
    router.push('/session/feedback/new');
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support microphone access');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const completeAudioBlob = new Blob(mediaChunksRef.current, { type: 'audio/webm' });
        mediaChunksRef.current = [];

        try {
          const { transcript: text, duration } = await getTranscription(completeAudioBlob);
          if (text && text.trim() !== "") {
            const tutorTurn: TranscriptMessage = {
              id: Date.now(),
              speaker: 'tutor',
              text,
              timestamp: formatTime(elapsedTimeRef.current),
            };
            setTranscript(prev => [...prev, tutorTurn]);
            setLastUserMsg(text);
            // ✅ tutor turn is saved inside getTranscription via /transcribe endpoint
            turnIndexRef.current++;
          }
        } catch (error) {
          console.error("Transcription error:", error);
        }
      };

      if (recognitionRef.current) {
        recognitionRef.current.onspeechstart = () => setIsTalking(true);
        recognitionRef.current.onspeechend = () => setIsTalking(false);
      }

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  };

  const getTranscription = async (audioData: Blob) => {
    const audioForm = new FormData();
    audioForm.append('audio', audioData, 'recording.wav');
    audioForm.append('userId', userIdRef.current);
    audioForm.append('sessionId', sessionIdRef.current);
    audioForm.append('turnIndex', turnIndexRef.current.toString());
    audioForm.append('speaker', 'tutor');

    const response = await fetch('http://localhost:5000/transcribe', {
      method: 'POST',
      body: audioForm,
    });

    if (!response.ok) throw new Error(`Transcription error: ${response.status}`);
    return response.json(); // { transcript, duration, turnId }
  };

  const textToSpeech = async (text: string) => {
    try {
      const response = await fetch("https://api.lemonfox.ai/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_LEMON_FOX_API_KEY}`,
        },
        body: JSON.stringify({ input: text, voice: "sarah", response_format: "mp3" }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
      }
    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  const toggleMic = () => {
    if (!micOn) {
      StartRecognition();
      startRecording();
    } else {
      stopRecording();
    }
    setMicOn(prev => !prev);
  };

  function StartRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      return;
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.start();
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Active Session</h1>
          <div className="text-sm text-muted-foreground">
            Session Time: <span className="font-mono font-semibold text-foreground">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        <div className={`grid ${studentParamsRef.current?.codeToggle ? "lg:grid-cols-2 lg:grid-rows-1" : "lg:grid-cols-1"} gap-6`}>
          <div className={`${studentParamsRef.current?.codeToggle ? "" : "grid lg:grid-cols-2 gap-6"} space-y-6`}>
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <div className={`aspect-video bg-muted rounded-lg border-4 ${isTalking ? "border-emerald-400" : "border-transparent"} flex items-center justify-center mb-4`}>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">AI</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Student Video Feed</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Button variant={micOn ? "default" : "destructive"} size="icon" className="rounded-full" onClick={toggleMic}>
                    {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  <Button variant={videoOn ? "default" : "destructive"} size="icon" className="rounded-full" onClick={() => setVideoOn(!videoOn)}>
                    {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  {/* ✅ endSession() instead of plain Link so session is closed in DB first */}
                  <Button variant="destructive" size="icon" className="rounded-full" onClick={endSession}>
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] overflow-y-auto space-y-3 pr-2">
                  {transcript.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Click the microphone button to start transcription
                    </p>
                  ) : (
                    transcript.map((message) => (
                      <div key={message.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-accent">
                            {message.speaker.charAt(0).toUpperCase() + message.speaker.slice(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      </div>
                    ))
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${studentParamsRef.current?.codeToggle ? "" : "col-start-1 col-span-2"}`}>
              <CardHeader>
                <CardTitle>Session Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Take notes during the session..." rows={6} className="resize-none" />
              </CardContent>
            </Card>
          </div>

          {studentParamsRef.current?.codeToggle && (
            <Card className="col-start-2 row-span-1">
              <CardHeader>
                <CardTitle>Code Editor</CardTitle>
              </CardHeader>
              <Editor
                defaultLanguage={studentParamsRef.current?.codeLanguage ?? "javascript"}
                defaultValue="// code loading here..."
                value={code}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}