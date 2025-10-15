"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk"
import { useSearchParams } from 'next/navigation';
import getAIResponse from '../../../services/aiCalls.js';

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
    issue: string
}

export default function ActiveSessionPage() {
  const [micOn, setMicOn] = useState(false)  // Start with mic on?
  const [videoOn, setVideoOn] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [lastUserMsg, setLastUserMsg] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const connectionRef = useRef<any>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const elapsedTimeRef = useRef(0)
  const studentParamsRef = useRef<StudentParameters>(null);


  const [code, setCode] = useState(`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Student is trying to understand recursion
print(fibonacci(5))`)


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
      issue: queryParams.get('issue') ?? "Error, tell user"
      }
  }, [])



  useEffect(() => {
    if(transcript.length !== 0 && transcript[transcript.length-1].text !== "" && studentParamsRef.current) {
      console.log(transcript);
      getAIResponse(transcript, studentParamsRef.current).then(response => {
        console.log("response: ", response);
        setTranscript((prev) => [...prev, {
            id: Date.now(),
            speaker: 'student',
            text: response as string,
            timestamp: formatTime(elapsedTimeRef.current),
        }
      ])
      }).catch(error => {
        console.error("Error found: ", error);
      })

    }
  }, [lastUserMsg]);

  // // Auto-scroll transcript
  // useEffect(() => {
  //   transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  // }, [transcript])

  const startTranscription = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support microphone access')
        return
      }

      // microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (stream) {
        console.log('Microphone access granted')
      }

      const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY)
      const connection = deepgram.listen.live({ model: 'nova-2', smart_format: true, interim_results: true, endpointing: 0,utterance_end_ms: 1000})
      connectionRef.current = connection

      // for when Deepgram sends back transcription
      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        console.log('Transcription started: ', data);
        const text = data.channel.alternatives[0].transcript
        if (text && data.is_final) {
          setTranscript((prev) => [...prev, {
            id: Date.now(),
            speaker: 'tutor',
            text,
            timestamp: formatTime(elapsedTimeRef.current),
          }])
          
          setLastUserMsg(text);
          // console.log('Transcript:', text) // For debugging
          // console.log('Elapsed Time:', elapsedTimeRef.current) // For debugging
        }
      })

      // Send audio to Deepgram
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) connection.send(event.data)
      }
      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder

    } catch (error) {
      console.error('Mic error:', error)
      alert('Please allow microphone access')
    }
  }

  const stopTranscription = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
    connectionRef.current?.finish()
    console.log('Transcription stopped')
  }

  // Toggle mic on/off
  const toggleMic = () => {
    if (!micOn) {
      startTranscription()
      
      console.log('Mic On')
    } else {
      stopTranscription()
      console.log('Mic Off')
    }
    setMicOn(!micOn)
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

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
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

            <Card>
              <CardHeader>
                <CardTitle>Session Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Take notes during the session..." rows={6} className="resize-none" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Code Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-muted rounded-lg p-4 font-mono text-sm h-[600px] resize-none"
                spellCheck={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}