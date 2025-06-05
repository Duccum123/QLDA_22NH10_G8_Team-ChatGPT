"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, Video, VideoOff, MicOff, Play, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AudioWaveform from "@/components/audio-waveform"
import InterviewFieldCard from "@/components/interview-field-card"
import EmotionIndicator from "@/components/emotion-indicator"
import { useToast } from "@/hooks/use-toast"
import { set } from "date-fns"

const interviewFields = [
  { id: "IT", name: "Information Technology", icon: "💻", questions: 15 },
  { id: "marketing", name: "Marketing", icon: "📊", questions: 12 },
  { id: "sales", name: "Sales", icon: "💼", questions: 10 },
  { id: "design", name: "Design", icon: "🎨", questions: 8 },
  { id: "finance", name: "Finance", icon: "💰", questions: 14 },
  { id: "hr", name: "Human Resources", icon: "👥", questions: 11 },
]

let questions = [
  "Tell me about a time when you had to solve a complex technical problem.",
  "How do you prioritize tasks when working on multiple projects?",
  "Describe a situation where you had to work with a difficult team member.",
  "What's your approach to learning new technologies or skills?",
  "How do you handle feedback, especially when it's critical?",
]


type Emotion = "neutral" | "happy" | "sad" | "angry" | "surprised" | "disgusted" | "fearful" | string

let emotions: Emotion[] = []

export default function InterviewPlatform() {
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isAnswering, setIsAnswering] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState("neutral")
  const [isRecording, setIsRecording] = useState(false)
  const { toast } = useToast()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([]) // Thêm dòng này
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [feedback, setFeedback] = useState<string>("")
  const [Score, setScore] = useState<number>(0)
  useEffect(() => {
    let stream: MediaStream | null = null
    if (videoEnabled && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((mediaStream) => {
          stream = mediaStream
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err)
        })
    }
    // Cleanup: stop camera when component unmounts or video disabled
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoEnabled])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (interviewStarted && videoEnabled) {
      interval = setInterval(() => {
        captureAndAnalyzeEmotion()
      }, 3000) // 3 giây gửi 1 lần
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [interviewStarted, videoEnabled])

  const startInterview = async () => {
    emotions = [] // Reset emotions array
    if (!selectedField) {
      toast({
        title: "Select a field",
        description: "Please select an interview field to continue",
        variant: "destructive",
      })
      return
    }
    // fetch questions based on selected field
    const field = selectedField
    const questionsData = await fetch(`http://127.0.0.1:8000/generate-questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ field }),
    })
      .then((res) => res.json())
      .catch((error) => {
        console.error("Error fetching questions:", error)
        toast({
          title: "Error",
          description: "Failed to load questions. Please try again later.",
          variant: "destructive",
        })
        return []
      })
      questions = questionsData.questions || questions
      console.log("Fetched questions:", questions)
    setInterviewStarted(true)
    setIsAnswering(true)
  }
  const uploadAudio = async (audioBlob: Blob) => {
    const formData = new FormData()
    // Nếu MediaRecorder không hỗ trợ mp3, bạn có thể dùng "audio/webm" hoặc "audio/wav"
    const file = new File([audioBlob], "recording.mp3", { type: "audio/mp3" })
    formData.append("file", file)

    try {
      const res = await fetch("http://127.0.0.1:8000/upload-audio", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      // Xử lý transcript ở đây
      setTranscript(data.transcript || "")
      console.log("Transcript:", transcript)
      evaluate()
    } catch (err) {
      console.error("Upload failed", err)
    }
  }
  // hàm đánh giá
  const evaluate = async () => {
    const formData = await fetch("http://127.0.0.1:8000/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questions : questions.join("\n"),
        emotions: emotions.join(", "),
        transcript,
        field : selectedField,
      }),
    })
      .then((res) => res.json())
      .catch((error) => {
        console.error("Error evaluating interview:", error)
        toast({
          title: "Error",
          description: "Failed to evaluate interview. Please try again later.",
          variant: "destructive",
        })
        return null
      })
      setFeedback(formData.feedback || "No feedback available.")
      setScore(formData.score || 0)
  }
  

  const record = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      // Start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/mp3" }) // hoặc "audio/webm"
        setAudioUrl(URL.createObjectURL(blob))
        uploadAudio(blob) // Gửi file lên API sau khi dừng ghi âm
      }

      mediaRecorder.start()
      setIsRecording(true)
    }
  }
  const completeInterview = () => {
    setInterviewCompleted(true)
  }

  const resetInterview = () => {
    setSelectedField(null)
    setInterviewStarted(false)
    setInterviewCompleted(false)
    setCurrentQuestion(0)
    setIsAnswering(false)
    emotions = [] // Reset emotions array
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      completeInterview()
    }
  }

  const captureAndAnalyzeEmotion = async () => {
    if (!videoRef.current) return

    // Tạo canvas và vẽ frame hiện tại từ video
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    // Chuyển canvas thành blob (ảnh jpg)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const formData = new FormData()
      formData.append("file", new File([blob], "frame.jpg", { type: "image/jpeg" }))

      try {
        const res = await fetch("http://127.0.0.1:8000/analyze-face", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        const emotion = data.emotion || "neutral"
        emotions.push(emotion) // Lưu cảm xúc vào mảng
        setCurrentEmotion(emotion) // Cập nhật cảm xúc vào state
      } catch (err) {
        console.error("Emotion API error", err)
      }
    }, "image/jpeg")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-purple-600 text-white p-2 rounded-lg">
              <Mic className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">InterviewAI Coach</h1>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="outline">Dashboard</Button>
            <Button variant="outline">History</Button>
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>US</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {!interviewStarted && !interviewCompleted && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Choose Interview Field</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {interviewFields.map((field) => (
              <InterviewFieldCard
                key={field.id}
                field={field}
                isSelected={selectedField === field.id}
                onSelect={() => setSelectedField(field.id)}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              size="lg"
              onClick={startInterview}
              disabled={!selectedField}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Play className="mr-2 h-4 w-4" /> Start Interview
            </Button>
          </div>
        </section>
      )}

      {interviewStarted && !interviewCompleted && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <section className="mb-6">
                <Card className="border-2 border-purple-200 dark:border-purple-900">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <Badge variant="outline" className="text-sm">
                        Question {currentQuestion + 1} of {questions.length}
                      </Badge>
                      <Select defaultValue={selectedField || undefined}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {interviewFields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.icon} {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{questions[currentQuestion]}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">Technical Skills</Badge>
                      <Badge variant="secondary">Problem Solving</Badge>
                      <Badge variant="secondary">Communication</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => setVideoEnabled(!videoEnabled)}>
                          {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setAudioEnabled(!audioEnabled)}>
                          {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div>
                        <p>Chỉ bấm dừng ghi âm khi hoàn thành cuộc phỏng vấn.</p>
                      </div>
                      <Button onClick={record}>
                        {isRecording ? "Stop Recording" : "Start Recording"}
                      </Button>
                      <Button onClick={nextQuestion}>
                        {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Interview"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-2">
                      {videoEnabled ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                          <VideoOff className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Camera Preview</span>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-2">Audio Input</h4>
                    {isRecording && audioEnabled ? (
                      <AudioWaveform />
                    ) : (
                      <div className="h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {audioEnabled ? "Waiting for audio..." : "Microphone is muted"}
                        </span>
                      </div>
                    )}
                    {audioUrl && (
                      <audio controls src={audioUrl} className="mt-2" />
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>

            <div className="lg:col-span-1">
              <section className="mb-6">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Real-time Analysis</h3>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Emotion Detection</h4>
                      <EmotionIndicator emotion={currentEmotion} />
                    </div>

                    {/* <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Speech Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Speaking Pace</span>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            Good
                          </Badge>
                        </div>
                        <Progress value={75} className="h-2" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Clarity</span>
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          >
                            Moderate
                          </Badge>
                        </div>
                        <Progress value={60} className="h-2" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Filler Words</span>
                          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300">
                            Too Many
                          </Badge>
                        </div>
                        <Progress value={30} className="h-2" />
                      </div>
                    </div> */}

                    <div>
                      <h4 className="text-sm font-medium mb-2">Live Transcript</h4>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm max-h-40 overflow-y-auto">
                        <p>
                          {transcript || "Waiting for your response..."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </>
      )}

      {interviewCompleted && (
        <section>
          <Card className="border-2 border-purple-200 dark:border-purple-900">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Interview Summary</h2>
                <Badge className="bg-purple-600">Completed</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-4 flex flex-col items-center">
                    <h3 className="text-lg font-medium mb-2">Overall Score</h3>
                    <div className="relative w-24 h-24 mb-2">
                      <svg className="w-24 h-24" viewBox="0 0 100 100">
                        <circle
                          className="text-gray-200 stroke-current"
                          strokeWidth="10"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                        />
                        <circle
                          className="text-purple-600 stroke-current"
                          strokeWidth="10"
                          strokeLinecap="round"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset="62.8"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{Score}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-medium mb-2">Key Metrics</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Confidence</span>
                          <span className="text-sm font-medium">82%</span>
                        </div>
                        <Progress value={82} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Clarity</span>
                          <span className="text-sm font-medium">68%</span>
                        </div>
                        <Progress value={68} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Emotional Stability</span>
                          <span className="text-sm font-medium">78%</span>
                        </div>
                        <Progress value={78} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Technical Accuracy</span>
                          <span className="text-sm font-medium">70%</span>
                        </div>
                        <Progress value={70} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card> */}

                
              </div>

              <Tabs defaultValue="feedback">
                <TabsList className="mb-4">
                  <TabsTrigger value="feedback">Detailed Feedback</TabsTrigger>
                  <TabsTrigger value="transcript">Full Transcript</TabsTrigger>
                </TabsList>

                <TabsContent value="feedback">
                  <div className="space-y-4">
                    <div dangerouslySetInnerHTML={{ __html: feedback || "<p>No feedback available. Please complete the interview to generate feedback.</p>" }} />
                  </div>
                </TabsContent>

                <TabsContent value="transcript">
                  <Card>
                    <CardContent className="p-4 max-h-80 overflow-y-auto">
                      <p>
                        {transcript || "No transcript available. Please complete the interview to generate a transcript."}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                
              </Tabs>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={resetInterview}>
                  Start New Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
