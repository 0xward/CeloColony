'use client'
import { useEffect, useRef } from 'react'

interface Star {
  x: number; y: number; r: number
  opacity: number; speed: number; phase: number
  color: string
}

const COLORS = ['#ffffff', '#22D3EE', '#35D07F', '#FBCC5C', '#A5B4FC']

export default function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx    = canvas.getContext('2d')!
    let rafId: number
    let stars: Star[]

    function init() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      stars = Array.from({ length: 220 }, () => ({
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        r:       Math.random() * 1.4 + 0.3,
        opacity: Math.random(),
        speed:   Math.random() * 0.008 + 0.003,
        phase:   Math.random() * Math.PI * 2,
        color:   COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
    }

    function draw(t: number) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const s of stars) {
        const op = 0.35 + 0.65 * Math.abs(Math.sin(t * s.speed + s.phase))
        ctx.globalAlpha = op
        ctx.fillStyle   = s.color
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      rafId = requestAnimationFrame(draw)
    }

    init()
    rafId = requestAnimationFrame(draw)
    const onResize = () => init()
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.5 }}
    />
  )
}
