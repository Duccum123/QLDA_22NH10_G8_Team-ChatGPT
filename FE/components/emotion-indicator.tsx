"use client"

import { useState, useEffect } from "react"
import { Smile, Meh, Frown, AlertTriangle, Zap, Angry } from "lucide-react"

interface EmotionIndicatorProps {
  emotion: string
}

export default function EmotionIndicator({ emotion }: EmotionIndicatorProps) {
  const [currentEmotion, setCurrentEmotion] = useState(emotion)

  useEffect(() => {
    setCurrentEmotion(emotion)
  }, [emotion])

  const getEmotionColor = () => {
    switch (currentEmotion) {
      case "happy":
        return "text-green-500 bg-green-50 dark:bg-green-900/20"
      case "neutral":
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
      case "angry":
      case "fear":
        return "text-red-500 bg-red-50 dark:bg-red-900/20"
      case "sad":
        return "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
      case "disgust":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
      case "surprise":
        return "text-purple-500 bg-purple-50 dark:bg-purple-900/20"
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-800"
    }
  }

  const getEmotionIcon = () => {
    switch (currentEmotion) {
      case "happy":
        return <Smile className="h-5 w-5" />
      case "neutral":
        return <Meh className="h-5 w-5" />
      case "angry":
        return <Angry className="h-5 w-5" />
      case "fear":
        return <AlertTriangle className="h-5 w-5" />
      case "sad":
        return <Frown className="h-5 w-5" />
      case "disgust":
        return <Frown className="h-5 w-5 rotate-180" />
      case "surprise":
        return <Zap className="h-5 w-5" />
      default:
        return <Meh className="h-5 w-5" />
    }
  }

  const getBarColor = () => {
    switch (currentEmotion) {
      case "happy":
        return "bg-green-500 w-[85%]"
      case "neutral":
        return "bg-blue-500 w-[60%]"
      case "angry":
      case "fear":
        return "bg-red-500 w-[30%]"
      case "sad":
        return "bg-indigo-500 w-[40%]"
      case "disgust":
        return "bg-yellow-600 w-[35%]"
      case "surprise":
        return "bg-purple-500 w-[70%]"
      default:
        return "bg-gray-400 w-[50%]"
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`p-2 rounded-full ${getEmotionColor()}`}>{getEmotionIcon()}</div>
      <div>
        <span className="font-medium capitalize">{currentEmotion}</span>
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full mt-1">
          <div className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`} />
        </div>
      </div>
    </div>
  )
}
