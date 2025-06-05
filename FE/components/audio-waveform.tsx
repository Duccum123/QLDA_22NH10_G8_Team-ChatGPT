"use client"

import { useEffect, useRef } from "react"

export default function AudioWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    const bars = 50
    const barWidth = canvas.width / bars - 2

    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw waveform bars
      for (let i = 0; i < bars; i++) {
        const height = Math.random() * 50 + 5
        const x = i * (barWidth + 2)
        const y = (canvas.height - height) / 2

        const hue = 270 // Purple hue
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`
        ctx.fillRect(x, y, barWidth, height)
      }

      animationId = requestAnimationFrame(renderFrame)
    }

    renderFrame()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} width={400} height={80} className="w-full h-16 rounded-lg" />
}
