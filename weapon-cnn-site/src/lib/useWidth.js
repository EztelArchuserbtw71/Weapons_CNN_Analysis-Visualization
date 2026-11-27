import { useEffect, useRef, useState } from 'react'

// Measures an element's width so SVG charts draw at real pixel size
// (text stays readable on phones instead of shrinking with a viewBox).
export function useWidth(initial = 640) {
  const ref = useRef(null)
  const [width, setWidth] = useState(initial)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}
