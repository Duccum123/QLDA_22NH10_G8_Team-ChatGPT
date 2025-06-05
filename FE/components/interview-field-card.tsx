"use client"

import { Card, CardContent } from "@/components/ui/card"

interface InterviewFieldProps {
  field: {
    id: string
    name: string
    icon: string
    questions: number
  }
  isSelected: boolean
  onSelect: () => void
}

export default function InterviewFieldCard({ field, isSelected, onSelect }: InterviewFieldProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "border-2 border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20"
          : "hover:border-purple-200 dark:hover:border-purple-800"
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="text-3xl">{field.icon}</div>
        <div>
          <h3 className="font-medium">{field.name}</h3>
        </div>
      </CardContent>
    </Card>
  )
}
