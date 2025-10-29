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
  const [micOn, setMicOn] = useState(false)
  const [videoOn, setVideoOn] = useState(true)
  const [endCallOff, setEndCallOff] = useState(true) //phone is off when session is active
  const [elapsedTime, setElapsedTime] = useState(0)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [lastUserMsg, setLastUserMsg] = useState<string>("")
  const [isTalking, setIsTalking] = useState<boolean>(false)
  const [userId, setUserId] = useState<string>("")
  const [micError, setMicError] = useState<boolean>(false)
  const [sessionId, setSessionId] = useState<string>("")
  const [currentSpeaker, setCurrentSpeaker] = useState<'tutor' | 'student' | null>(null);
  const [partialText, setPartialText] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaChunksRef = useRef<Array<Blob>>([])
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const elapsedTimeRef = useRef(0)
  const studentParamsRef = useRef<StudentParameters | null>(null)
  const recognitionRef = useRef<any>(null)
  const sessionIdRef = useRef<string>("")

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL

  if (API_URL === undefined) {
    throw new Error("API URL is not defined in environment variables")
  }
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

  // Load query params
  // Load query params
const queryParams = useSearchParams()
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

// Load userId and start session automatically
useEffect(() => {
  const storedUserId = localStorage.getItem('userId')
  if (storedUserId) {
    setUserId(storedUserId)
    console.log('UserId loaded:', storedUserId)
    
    // Auto-start transcription session when page loads
    startTranscription(storedUserId).then(newSessionId => {
      if (newSessionId) {
        setSessionId(newSessionId)
        sessionIdRef.current = newSessionId
        console.log("Session auto-started with sessionId:", newSessionId)
      }
    })
  } else {
    console.warn('No userId found in localStorage')
  }
}, [])

const startTranscription = async (uid: string): Promise<string | null> => {
  try {
    const response = await fetch(`${API_URL}/api/transcripts/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: uid, 
        studentParameters: studentParamsRef.current 
      })
    })

    const data = await response.json()
    if (data.success) {
      console.log("Transcript started: ", data.sessionId)
      return data.sessionId
    }
    return null
  } catch (err) {
    console.error("Error starting transcription session: ", err)
    return null
  }
}

  const saveMessageToDB = async (speaker: "tutor" | "student", text: string, timestamp: string) => {
    const currentSessionId = sessionIdRef.current || sessionId
    
    if (!currentSessionId) {
      console.warn('No active session to save message to')
      return
    }

    try {
      await fetch(`${API_URL}/api/transcript/add-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          speaker,
          text,
          timestamp
        })
      })
    } catch (error) {
      console.error('Error saving message to transcript:', error)
    }
  }

  const endTranscription = async () => {
    const currentSessionId = sessionIdRef.current || sessionId
    
    if (!currentSessionId) {
      console.warn('No active session to end')
      return
    }
    try {
      await fetch(`${API_URL}/api/transcript/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: currentSessionId, 
          duration: elapsedTimeRef.current 
        })
      })
      console.log("Transcript ended: ", currentSessionId)
    } catch (error) {
      console.error('Error ending transcript session:', error)
    }
  }

  // Handle AI response when user speaks
  useEffect(() => {
    if (transcript.length !== 0 && 
        transcript[transcript.length - 1].text !== "" && 
        studentParamsRef.current &&
        transcript[transcript.length - 1].speaker === 'tutor') {
      
      console.log(transcript)
      getAIResponse(transcript, studentParamsRef.current)
        .then(response => {
          const stuText = response as string
          const timestamp = formatTime(elapsedTimeRef.current)
          
          textToSpeech(stuText)

          const stuDialog = {
            id: Date.now(),
            speaker: 'student' as const,
            text: stuText,
            timestamp,
          }

          setTranscript((prev) => [...prev, stuDialog])
          saveMessageToDB('student', stuText, timestamp)
        })
        .catch(err => {
          console.error("Student Transcription Error: ", err)
        })
    }
  }, [lastUserMsg])

  useEffect(() => {
    if (micError) {
      alert('Microphone access is required for this session. Please enable microphone permissions in your browser settings.')
    }
  }, [micError])

  const startRecording = async () => {
    // Session should already be started, just verify it exists
    const currentSessionId = sessionIdRef.current || sessionId
    if (!currentSessionId) {
      console.error('No active session found. This should not happen.')
      return
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support microphone access')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (stream) {
        setMicError(false)
        console.log('Microphone access granted')
      } else {
        setMicError(true)
        console.error("Microphone access DENIED")
        return
      }

      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log("Recorder stopped. Sending chunks...")
        const completeAudioBlob = new Blob(mediaChunksRef.current, { type: 'audio/webm' })

        if (mediaChunksRef.current.length === 0) {
          console.error("No audio chunks recorded")
          return
        }

        mediaChunksRef.current = []

        try {
          const text = await getTranscription(completeAudioBlob, userId)
          if (text && text.trim() !== "") {
            const timestamp = formatTime(elapsedTimeRef.current)

            const TutDialog = {
              id: Date.now(),
              speaker: 'tutor' as const,
              text: text,
              timestamp,
            }
            
            setTranscript((prev) => [...prev, TutDialog])
            setLastUserMsg(text)
            
            await saveMessageToDB('tutor', text, timestamp)
          }
        } catch (error) {
          console.error("Tutor Transcription error:", error)
        }
      }

      if (recognitionRef.current) {
        recognitionRef.current.onspeechstart = () => {
          setIsTalking(true)
        }

        recognitionRef.current.onspeechend = () => {
          setIsTalking(false)
        }
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
    } catch (err) {
      console.error("An error has occurred with attempting to record: ", err)
      setMicError(true)
    }
  }

  const stopRecording = () => {
    console.log("stopping recording... ", mediaChunksRef.current)
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
  }

  const textToSpeech = async (text: string) => {
    try {
      const response = await fetch("https://api.lemonfox.ai/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_LEMON_FOX_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: text,
          voice: "sarah",
          response_format: "mp3"
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const audioBlobURL = URL.createObjectURL(blob)
        const audio = new Audio()
        audio.src = audioBlobURL
        audio.play()
      }
    } catch (err) {
      console.error("Error with text to speech has occurred: ", err)
    }
  }

  const getTranscription = async (audioData: Blob, userId: string) => {
    console.log("getTranscription called")
    console.log("Blob size:", audioData.size)
    console.log("UserId:", userId)
    
    try {
      const audioForm = new FormData()
      audioForm.append('audio', audioData, 'recording.webm')
      audioForm.append('userId', userId)

      console.log(`Sending request to ${API_URL}/transcribe`)

      const response = await fetch(`${API_URL}/transcribe`, {
        method: 'POST',
        body: audioForm,
      })

      console.log("Response received:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error response:', errorText)
        throw new Error(`Error with response: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Transcription data:", data)

      return data.transcript
    } catch (error) {
      console.error("Error with getting transcription: ", error)
      throw error
    }
  }

  const toggleMic = () => {
    if (!micOn) {
      startRecording()
      StartRecognition()
      console.log('Mic On')
    } else {
      stopRecording()
    }
    setMicOn(!micOn)
  }

  const togglePhone = async () => {
    // Phone button only ends the call, doesn't start it
    endTranscription()
    console.log('Phone toggled - ending session')
  }

  function StartRecognition() {
    if (typeof window !== "undefined") {
      console.log("recognition has started...")
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.start()
      } else {
        console.error("Speech recognition not supported in this browser.")
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
                      <PhoneOff 
                        className="w-4 h-4" 
                        onClick={togglePhone}
                      />
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