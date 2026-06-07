'use client'
import { useEffect, useRef, useCallback } from 'react'
import type { PlacedBuilding, Drone, Particle } from '@/types/game'
import { BUILDINGS, TILE_W, TILE_H, BUILDING_SLOTS } from '@/lib/game/constants'

interface Props {
  buildings:  PlacedBuilding[]
  happiness:  number
  onTileClick?: (col: number, row: number) => void
}

// ─── Stars ────────────────────────────────────────────────────────────────────
interface Star { x: number; y: number; r: number; phase: number; speed: number; color: string }
const STAR_COLORS = ['#fff', '#22D3EE', '#35D07F', '#FBCC5C', '#A5B4FC']

function makeStars(w: number, h: number): Star[] {
  return Array.from({ length: 180 }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: Math.random() * 1.2 + 0.2,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.006 + 0.002,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
  }))
}

function makeDrones(): Drone[] {
  return Array.from({ length: 3 }, (_, i) => ({
    x: 0, y: 0, angle: 0, speed: 0.3 + i * 0.15,
    path: i, pathT: (i / 3) * Math.PI * 2,
  }))
}

// ─── Grid → Screen ────────────────────────────────────────────────────────────
function gridToScreen(col: number, row: number, cx: number, cy: number) {
  return {
    x: cx + (col - row) * (TILE_W / 2),
    y: cy + (col + row) * (TILE_H / 2),
  }
}

// ─── Screen → Grid ────────────────────────────────────────────────────────────
function screenToGrid(sx: number, sy: number, cx: number, cy: number): [number, number] {
  const dx = sx - cx
  const dy = sy - cy
  const col = Math.round((dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2)
  const row = Math.round((dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2)
  return [col, row]
}

// ─── Build drawing functions for each shape ───────────────────────────────────
function drawTower(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, level: number, color: string, accent: string, t: number) {
  const h  = 40 + level * 8
  const hw = w * 0.5
  const glow = 0.5 + 0.5 * Math.sin(t * 2)

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(x, y + 4, hw * 1.1, hw * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Right face
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.moveTo(x + hw, y); ctx.lineTo(x + hw, y - h)
  ctx.lineTo(x, y - h - TILE_H * 0.5)
  ctx.lineTo(x, y - TILE_H * 0.5); ctx.closePath(); ctx.fill()

  // Left face
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x - hw, y); ctx.lineTo(x - hw, y - h)
  ctx.lineTo(x, y - h - TILE_H * 0.5)
  ctx.lineTo(x, y - TILE_H * 0.5); ctx.closePath(); ctx.fill()

  // Top face
  ctx.fillStyle = '#fff'
  ctx.globalAlpha = 0.12
  ctx.beginPath()
  ctx.moveTo(x, y - h - TILE_H * 0.5)
  ctx.lineTo(x + hw, y - h)
  ctx.lineTo(x, y - h + TILE_H * 0.5)
  ctx.lineTo(x - hw, y - h); ctx.closePath(); ctx.fill()
  ctx.globalAlpha = 1

  // Windows
  const rows = Math.min(level + 1, 5)
  for (let r = 0; r < rows; r++) {
    const wy = y - 16 - r * 12
    for (let c = 0; c < 2; c++) {
      const side = c === 0 ? -1 : 1
      const wx   = x + side * hw * 0.5 - 3
      ctx.fillStyle = `rgba(255,255,180,${0.6 + glow * 0.4})`
      ctx.fillRect(wx, wy, 5, 4)
    }
  }

  // Antenna
  if (level >= 3) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9
    ctx.beginPath(); ctx.moveTo(x, y - h - TILE_H * 0.5); ctx.lineTo(x, y - h - TILE_H * 0.5 - 16); ctx.stroke()
    ctx.fillStyle = color; ctx.globalAlpha = glow
    ctx.beginPath(); ctx.arc(x, y - h - TILE_H * 0.5 - 17, 2.5, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
  }
}

function drawPyramid(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, level: number, color: string, accent: string, t: number) {
  const h  = 30 + level * 6
  const hw = w * 0.55
  const steps = Math.min(level + 2, 5)
  const glow  = 0.5 + 0.5 * Math.sin(t * 1.5)

  for (let s = steps; s >= 0; s--) {
    const ratio = s / steps
    const sw = hw * (1 - ratio * 0.7)
    const sy = y - s * (h / steps)

    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.moveTo(x + sw, sy); ctx.lineTo(x + sw * 0.7, sy - h / steps)
    ctx.lineTo(x, sy - h / steps - TILE_H * 0.3); ctx.lineTo(x, sy - TILE_H * 0.3); ctx.closePath(); ctx.fill()

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x - sw, sy); ctx.lineTo(x - sw * 0.7, sy - h / steps)
    ctx.lineTo(x, sy - h / steps - TILE_H * 0.3); ctx.lineTo(x, sy - TILE_H * 0.3); ctx.closePath(); ctx.fill()

    // Gold trim
    ctx.strokeStyle = '#FBCC5C'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.5 + glow * 0.3
    ctx.beginPath(); ctx.moveTo(x - sw, sy); ctx.lineTo(x + sw, sy); ctx.stroke()
    ctx.globalAlpha = 1
  }
}

function drawDome(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, level: number, color: string, t: number) {
  const r    = w * 0.5 + level * 2
  const glow = 0.4 + 0.6 * Math.sin(t * 1.2)

  // Base
  ctx.fillStyle = color + '80'
  ctx.beginPath()
  ctx.ellipse(x, y, r * 1.1, r * 0.45, 0, 0, Math.PI * 2); ctx.fill()

  // Dome
  ctx.save()
  ctx.beginPath(); ctx.ellipse(x, y, r * 1.1, r * 0.45, 0, Math.PI, 0); ctx.clip()
  ctx.fillStyle = color
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.35, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Rim glow
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = glow * 0.7
  ctx.beginPath(); ctx.ellipse(x, y, r * 1.1, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke()
  ctx.globalAlpha = 1
}

function drawWide(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, level: number, color: string, accent: string, t: number) {
  const h  = 20 + level * 4
  const hw = w * 0.75
  const glow = 0.5 + 0.5 * Math.sin(t * 1.8)

  // Right face
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.moveTo(x + hw, y); ctx.lineTo(x + hw, y - h)
  ctx.lineTo(x, y - h - TILE_H * 0.4)
  ctx.lineTo(x, y - TILE_H * 0.4); ctx.closePath(); ctx.fill()
  // Left face
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x - hw, y); ctx.lineTo(x - hw, y - h)
  ctx.lineTo(x, y - h - TILE_H * 0.4)
  ctx.lineTo(x, y - TILE_H * 0.4); ctx.closePath(); ctx.fill()
  // Top face
  ctx.fillStyle = color; ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.moveTo(x, y - h - TILE_H * 0.4)
  ctx.lineTo(x + hw, y - h)
  ctx.lineTo(x, y - h + TILE_H * 0.4)
  ctx.lineTo(x - hw, y - h); ctx.closePath(); ctx.fill()
  ctx.globalAlpha = 1

  // Neon sign
  ctx.fillStyle = '#fff'
  ctx.globalAlpha = glow * 0.8
  ctx.fillRect(x - hw * 0.4, y - h * 0.6 - TILE_H * 0.2, hw * 0.8, 5)
  ctx.globalAlpha = 1
}

function drawAntenna(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, level: number, color: string, t: number) {
  const h  = 35 + level * 7
  const hw = w * 0.3
  const glow = 0.5 + 0.5 * Math.sin(t * 3)

  // Base block
  ctx.fillStyle = color + 'aa'
  ctx.fillRect(x - hw, y - 14, hw * 2, 14)

  // Shaft
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = 0.9
  ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x, y - h); ctx.stroke()
  ctx.globalAlpha = 1

  // Dishes / rings
  const rings = Math.min(level, 4)
  for (let i = 0; i < rings; i++) {
    const ry = y - 22 - i * 10
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6
    ctx.beginPath(); ctx.ellipse(x, ry, 10 - i * 1.5, 4, 0, 0, Math.PI * 2); ctx.stroke()
    ctx.globalAlpha = 1
  }

  // Tip blink
  ctx.fillStyle = color; ctx.globalAlpha = glow
  ctx.beginPath(); ctx.arc(x, y - h, 3, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1
}

// ─── Main island ─────────────────────────────────────────────────────────────
function drawIsland(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  const cols = 7, rows = 7
  // Sort tiles back-to-front
  const tiles: [number, number][] = []
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) tiles.push([c, r])
  tiles.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]))

  for (const [c, r] of tiles) {
    const { x, y } = gridToScreen(c, r, cx, cy)
    const hw = TILE_W / 2, hh = TILE_H / 2

    // Rock underside (depth)
    ctx.fillStyle = '#0B1018'
    ctx.beginPath()
    ctx.moveTo(x - hw, y + hh)
    ctx.lineTo(x, y + hh * 2 + 10)
    ctx.lineTo(x + hw, y + hh)
    ctx.closePath()
    ctx.fill()

    // Tile top — edge tiles slightly different
    const isEdge = c === 0 || r === 0 || c === cols - 1 || r === rows - 1
    ctx.fillStyle = isEdge ? '#111820' : '#0F1B26'
    ctx.beginPath()
    ctx.moveTo(x, y - hh)
    ctx.lineTo(x + hw, y)
    ctx.lineTo(x, y + hh)
    ctx.lineTo(x - hw, y)
    ctx.closePath()
    ctx.fill()

    // Glowing border on top tiles
    const glowAlpha = 0.1 + 0.05 * Math.sin(t + c * 0.5 + r * 0.3)
    ctx.strokeStyle = `rgba(53,208,127,${glowAlpha})`; ctx.lineWidth = 0.8
    ctx.stroke()
  }
}

// ─── Particles ───────────────────────────────────────────────────────────────
function spawnParticles(
  particles: Particle[],
  bx: number, by: number,
  color: string,
) {
  if (particles.length > 80) return
  for (let i = 0; i < 3; i++) {
    particles.push({
      x: bx + (Math.random() - 0.5) * 30,
      y: by - 10,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.random() * 0.6 - 0.3,
      life: 1,
      color,
      size: Math.random() * 3 + 1,
    })
  }
}

function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.012 }))
    .filter((p) => p.life > 0)
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function GameCanvas({ buildings, happiness, onTileClick }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const starsRef   = useRef<Star[]>([])
  const dronesRef  = useRef<Drone[]>(makeDrones())
  const partRef    = useRef<Particle[]>([])
  const rafRef     = useRef<number>(0)

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W   = canvas.width, H = canvas.height
    const cx  = W / 2
    const floatY  = H * 0.42 + Math.sin(t * 0.0005) * 8
    const ts  = t * 0.001 // time in seconds

    ctx.clearRect(0, 0, W, H)

    // ── Background gradient
    const bg = ctx.createRadialGradient(cx, H * 0.5, 0, cx, H * 0.5, Math.max(W, H))
    bg.addColorStop(0, '#0A1220'); bg.addColorStop(1, '#040608')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    // ── Stars
    for (const s of starsRef.current) {
      const op = 0.3 + 0.7 * Math.abs(Math.sin(ts * s.speed + s.phase))
      ctx.globalAlpha = op; ctx.fillStyle = s.color
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1

    // ── Nebula glow
    const neb = ctx.createRadialGradient(cx * 0.4, H * 0.3, 0, cx * 0.4, H * 0.3, W * 0.6)
    neb.addColorStop(0, 'rgba(53,208,127,0.04)'); neb.addColorStop(1, 'transparent')
    ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H)

    // ── Island
    drawIsland(ctx, cx, floatY, ts)

    // ── Buildings (sort painter's algorithm)
    const sorted = [...buildings].sort(
      (a, b) => (a.col + a.row) - (b.col + b.row),
    )

    partRef.current = updateParticles(partRef.current)

    for (const b of sorted) {
      const def = BUILDINGS[b.type]
      const { x, y } = gridToScreen(b.col, b.row, cx, floatY)
      const hw  = TILE_W * 0.48

      // Spawn particles occasionally
      if (Math.random() < 0.005) {
        spawnParticles(partRef.current, x, y, def.color)
      }

      // Building selection ring
      ctx.strokeStyle = def.color; ctx.lineWidth = 1; ctx.globalAlpha = 0.25
      ctx.beginPath()
      ctx.moveTo(x, y - TILE_H / 2); ctx.lineTo(x + hw, y)
      ctx.lineTo(x, y + TILE_H / 2); ctx.lineTo(x - hw, y); ctx.closePath()
      ctx.stroke(); ctx.globalAlpha = 1

      // Draw building shape
      switch (def.shape) {
        case 'tower':   drawTower(ctx, x, y, hw * 1.6, b.level, def.color, def.accentColor, ts); break
        case 'pyramid': drawPyramid(ctx, x, y, hw * 1.8, b.level, def.color, def.accentColor, ts); break
        case 'dome':    drawDome(ctx, x, y, hw * 1.5, b.level, def.color, ts); break
        case 'wide':    drawWide(ctx, x, y, hw * 1.8, b.level, def.color, def.accentColor, ts); break
        case 'antenna': drawAntenna(ctx, x, y, hw * 1.2, b.level, def.color, ts); break
      }

      // Label
      ctx.save()
      ctx.font       = '10px "Share Tech Mono"'
      ctx.textAlign  = 'center'
      const labelY   = y - (40 + b.level * 7) - TILE_H * 0.7
      ctx.fillStyle  = 'rgba(8,13,22,0.75)'
      const tw       = ctx.measureText(def.name).width
      ctx.fillRect(x - tw / 2 - 5, labelY - 12, tw + 10, 16)
      ctx.fillStyle  = def.color; ctx.globalAlpha = 0.9
      ctx.fillText(def.name, x, labelY); ctx.globalAlpha = 1
      ctx.font       = '9px "Share Tech Mono"'; ctx.fillStyle = '#FBCC5C'
      ctx.fillText(`Lv.${b.level}`, x, labelY + 11)
      ctx.restore()
    }

    // ── Particles
    for (const p of partRef.current) {
      ctx.globalAlpha = p.life * 0.7
      ctx.fillStyle   = p.color
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1

    // ── Drones
    for (const d of dronesRef.current) {
      d.pathT += 0.004 * d.speed
      let dx = 0, dy = 0
      if (d.path === 0) {
        dx = cx + Math.cos(d.pathT) * W * 0.35
        dy = floatY - 60 + Math.sin(d.pathT * 2) * 30
      } else if (d.path === 1) {
        dx = cx + Math.sin(d.pathT) * W * 0.28
        dy = floatY - 80 + Math.cos(d.pathT) * 20
      } else {
        dx = cx - 80 + Math.cos(d.pathT * 1.3) * W * 0.2
        dy = floatY - 100 + Math.sin(d.pathT * 0.9) * 25
      }
      d.x = dx; d.y = dy

      ctx.save()
      ctx.translate(dx, dy)
      ctx.rotate(d.pathT + Math.PI / 2)
      ctx.fillStyle    = '#22D3EE'; ctx.globalAlpha = 0.8
      ctx.beginPath()
      ctx.moveTo(0, -7); ctx.lineTo(4, 4); ctx.lineTo(0, 2); ctx.lineTo(-4, 4); ctx.closePath()
      ctx.fill()
      // Engine glow trail
      ctx.globalAlpha  = 0.25
      ctx.strokeStyle  = '#22D3EE'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, 14); ctx.stroke()
      ctx.restore()
      ctx.globalAlpha  = 1
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [buildings])

  useEffect(() => {
    const canvas = canvasRef.current!
    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      starsRef.current = makeStars(canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    rafRef.current = requestAnimationFrame(draw)
    return () => { ro.disconnect(); cancelAnimationFrame(rafRef.current) }
  }, [draw])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onTileClick) return
    const canvas = canvasRef.current!
    const rect   = canvas.getBoundingClientRect()
    const cx     = canvas.width / 2
    const cy     = canvas.height * 0.42
    const sx     = (e.clientX - rect.left) * (canvas.width  / rect.width)
    const sy     = (e.clientY - rect.top)  * (canvas.height / rect.height)
    const [col, row] = screenToGrid(sx, sy, cx, cy)
    if (col >= 0 && col < 7 && row >= 0 && row < 7) onTileClick(col, row)
  }, [onTileClick])

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="w-full h-full crt"
      style={{ cursor: onTileClick ? 'crosshair' : 'default', display: 'block' }}
    />
  )
}
