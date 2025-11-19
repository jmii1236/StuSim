"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"
import { useSearchParams } from 'next/navigation';
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { finished } from "stream/promises";
import getAIResponse from '../../../services/aiCalls.js';
import { Editor } from '@monaco-editor/react';

type TranscriptMessage = {
  id: number
  speaker: "tutor" | "student"
  text: string
  timestamp: string
}

type StudentParameters = {
    csBackground: string,
    personality: string,
    difficulty: string,
    issue: string,
    codeToggle: boolean,
    codeLanguage: string
}

export default function ActiveSessionPage() {
  const [micOn, setMicOn] = useState(false);  // Start with mic off
  const [videoOn, setVideoOn] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [lastUserMsg, setLastUserMsg] = useState<string>("");
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Array<Blob>>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const elapsedTimeRef = useRef(0);
  const studentParamsRef = useRef<StudentParameters>(null);
  const recognitionRef = useRef<any>(null);


  const [code, setCode] = useState('')

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1
        elapsedTimeRef.current = newTime
        return newTime
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  
  //Add given params to ref
  const queryParams = useSearchParams();
  useEffect(() => {
    studentParamsRef.current = {
      csBackground: queryParams.get('csBackground') ?? "Error, tell user",
      personality: queryParams.get('personality') ?? "Error, tell user",
      difficulty: queryParams.get('difficulty') ?? "Error, tell user",
      issue: queryParams.get('issue') ?? "Error, tell user",
      codeToggle: (queryParams.get("codeToggle") === 'true'),
      codeLanguage: queryParams.get('codeLanguage') ?? "Error, tell user",
      }
  }, [])

  // see if userId is loaded in 
  useEffect(() => {
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId) {
    setUserId(storedUserId);
    console.log('UserId loaded:', storedUserId);
  } else {
    console.warn('No userId found in localStorage');
  }
}, [])

  useEffect(() => {
    if(transcript.length !== 0 && transcript[transcript.length-1].text !== "" && studentParamsRef.current) {
      console.log(transcript);
      getAIResponse(transcript, studentParamsRef.current, code).then(response => {
        if(response) {
          const splitResponse = response?.split('$');
          textToSpeech(splitResponse[0] as string);
          if(splitResponse)
            setTranscript((prev) => [...prev, {
                id: Date.now(),
                speaker: 'student',
                text: splitResponse[0],
                timestamp: formatTime(elapsedTimeRef.current),
            }
          ])
          if(splitResponse.length > 1) setCode(splitResponse[1])
        }

      }).catch(error => {
        console.error("Error found: ", error);
      })

    }
  }, [lastUserMsg]);
  

  const startRecording = async () => {
      // microphone access
      try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support microphone access')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (stream) {
        console.log('Microphone access granted')
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recorder stopped. Sending chunks...");
        const completeAudioBlob = new Blob(mediaChunksRef.current, {type: 'audio/webm'});
        mediaChunksRef.current = [];

        console.log("Current userId:", userId);

        try {
          const text = await getTranscription(completeAudioBlob, userId)
          if (text && text.trim() !== "") {
            setTranscript((prev) => [...prev, {
              id: Date.now(),
              speaker: 'tutor',
              text,
              timestamp: formatTime(elapsedTimeRef.current),
            }])
            setLastUserMsg(text)
          }
        } catch (error) {
          console.error("Transcription error:", error)
        }
      }; 

      recognitionRef.current.onspeechstart = () => {
        setIsTalking(true);
      }

      recognitionRef.current.onspeechend = () => {
        setIsTalking(false);
      }

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    } catch(err) {
      console.error("An error has occured with attempting to record: ", err);
    }
  }

const stopRecording = () => {
  console.log("stopping recording... ", mediaChunksRef.current);
  mediaRecorderRef.current?.stop();
  mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
}

const textToSpeech = async (text: string) => {
  try {
    const response = await fetch("https://api.lemonfox.ai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_LEMON_FOX_API_KEY}`
      },
      body: JSON.stringify({
        input: text,
        voice: "sarah",
        response_format: "mp3"
      })
    })

    if(response) {
      const blob = await response.blob();
      const audioBlobURL = URL.createObjectURL(blob);
      const audio = new Audio();
      audio.src = audioBlobURL;
      audio.play();

    }
  } catch (err) {
    console.error("Error with text to speech has occurred: ", err);
  }
}


  // Auto-scroll transcript
  // useEffect(() => {
  //   transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  // }, [transcript])
  // i dont like this atm i think its annoying but im open to changing/fixing it and putting back later

  const getTranscription = async (audioData : Blob, userId: string) => {
    try {
      const audioForm = new FormData();

    audioForm.append('audio', audioData, 'recording.wav');
    audioForm.append('userId', userId);

    const response = await fetch('http://localhost:5000/transcribe', {
      method: 'POST',
      body: audioForm,
    });

    
    if(!response.ok) {
      throw new Error(`Error with response: ${response.status}`);
    }
    const data = await response.json();

    return data.transcript;
  } catch (error) {
    console.error("Error with getting transcription: ", error);
    throw error;
  }
}



  // Toggle mic on/off
  const toggleMic = () => {
    if (!micOn) {
      startRecording();
      StartRecognition();
      console.log('Mic On')
    }
    else {
      stopRecording();
    }
    setMicOn(!micOn)
  }

  function StartRecognition() {
    if (typeof window !== "undefined") {
          console.log("recognition has started...");
          const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
            if(recognitionRef.current) {
              recognitionRef.current.stop();
            }
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.start();
          } else {
            console.error("Speech recognition not supported in this browser.");
          }
      }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Active Session</h1>
          <div className="text-sm text-muted-foreground">
            Session Time: <span className="font-mono font-semibold text-foreground">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        <div className={`grid ${studentParamsRef.current?.codeToggle ? "lg:grid-cols-2" : "lg-grid-cols-1"} gap-6`}>
          <div className={`${studentParamsRef.current?.codeToggle ? "" : "grid lg:grid-cols-2 gap-6"} space-y-6`}>
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <div className={`aspect-video bg-muted rounded-lg border-4 ${isTalking ? "border-emerald-400" : ""} flex items-center justify-center mb-4`}>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">AI</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Student Video Feed</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant={micOn ? "default" : "destructive"}
                    size="icon"
                    className="rounded-full"
                    onClick={toggleMic}
                  >
                    {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant={videoOn ? "default" : "destructive"}
                    size="icon"
                    className="rounded-full"
                    onClick={() => setVideoOn(!videoOn)}
                  >
                    {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="destructive" size="icon" className="rounded-full" asChild>
                    <Link href="/session/feedback/new">
                      <PhoneOff className="w-4 h-4" />
                    </Link>
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
          
          {studentParamsRef.current?.codeToggle ? <Card>
            <CardHeader>
              <CardTitle>Code Editor</CardTitle>
            </CardHeader>
              <Editor defaultLanguage={studentParamsRef?.current?.codeLanguage ?? "Javascript"} defaultValue="// code loading here..." value={code} />
          </Card> : null}
        </div>
      </div>
    </div>
  )
}