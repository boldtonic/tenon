import type { FurnitureModule, HandleFinish, HandlePosition, HandleType, PublicStyle } from './types'

export const HANDLE_FINISH_SPECS: Record<HandleFinish, { color: string, metalness: number, roughness: number }> = {
  graphite: { color: '#34312c', metalness: 0.54, roughness: 0.46 },
  nickel: { color: '#b8babd', metalness: 0.84, roughness: 0.27 },
  brass: { color: '#b18a4b', metalness: 0.76, roughness: 0.33 },
}

export function moduleHandlesEnabled(module: FurnitureModule): boolean {
  return module.type !== 'shelf' && module.handlesEnabled !== false
}

export function resolveHandleType(
  module: FurnitureModule,
  style: PublicStyle['rendered']['handles'],
): Exclude<HandleType, 'auto'> {
  if (style.type !== 'auto') return style.type
  return module.type === 'drawer' ? 'bar' : 'knob'
}

export function resolveHandleCenter(
  min: number,
  max: number,
  position: HandlePosition = 'top',
): number {
  if (max <= min) return (min + max) / 2
  if (position === 'center') return (min + max) / 2
  return position === 'bottom' ? min : max
}
