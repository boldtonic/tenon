import { describe, expect, it, vi } from 'vitest'
import * as Y from 'yjs'

vi.mock('three-bvh-csg', () => ({
  Brush: class {},
  Evaluator: class {},
  SUBTRACTION: 1,
}))

import { compileAssembly } from '~~/shared/domain/assembly'
import { DEFAULT_FURNITURE_CONFIG, normalizePublicStyle } from '~~/shared/domain/defaults'
import { resolveHandleType } from '~~/shared/domain/handles'
import type { FurnitureDoc, FurnitureModule } from '~~/shared/domain/types'
import {
  ensureInitialized,
  insertColumn,
  readFurnitureDoc,
  setModuleHandleOrientation,
  setModuleHandlePosition,
  setModuleHandlesEnabled,
  setModuleType,
} from '~~/shared/yjs/doc'

function furnitureDoc(module: FurnitureModule): FurnitureDoc {
  return {
    schemaVersion: 4,
    lastAppliedMigrationId: null,
    config: { ...DEFAULT_FURNITURE_CONFIG },
    columns: [{ width: 0.45, modules: [module] }],
  }
}

function pullOperations(module: FurnitureModule) {
  return compileAssembly(furnitureDoc(module)).operations.filter(operation => operation.id.startsWith('op:pull-hole:'))
}

describe('handle configuration', () => {
  it('preserves the current automatic graphite look as the style default', () => {
    const style = normalizePublicStyle()
    expect(style.rendered.handles).toEqual({ type: 'auto', finish: 'graphite' })
    expect(resolveHandleType({ id: 'drawer', type: 'drawer', height: 0.3 }, style.rendered.handles)).toBe('bar')
    expect(resolveHandleType({ id: 'door', type: 'left-door', height: 0.3 }, style.rendered.handles)).toBe('knob')
  })

  it('normalizes old Yjs modules with handles enabled and contextual orientation', () => {
    const doc = new Y.Doc()
    ensureInitialized(doc)
    insertColumn(doc, 0)
    setModuleType(doc, 0, 0, 'drawer')

    const module = readFurnitureDoc(doc).columns[0]!.modules[0]!
    expect(module.handlesEnabled).toBe(true)
    expect(module.handlePosition).toBe('top')
    expect(module.handleOrientation).toBe('horizontal')
  })

  it('persists module handle controls through the Yjs document', () => {
    const doc = new Y.Doc()
    ensureInitialized(doc)
    insertColumn(doc, 0)
    setModuleType(doc, 0, 0, 'right-door')
    setModuleHandlesEnabled(doc, 0, 0, false)
    setModuleHandlePosition(doc, 0, 0, 'bottom')
    setModuleHandleOrientation(doc, 0, 0, 'horizontal')

    const module = readFurnitureDoc(doc).columns[0]!.modules[0]!
    expect(module).toMatchObject({
      type: 'right-door',
      handlesEnabled: false,
      handlePosition: 'bottom',
      handleOrientation: 'horizontal',
    })
  })

  it('removes pull holes when handles are disabled', () => {
    expect(pullOperations({
      id: 'drawer',
      type: 'drawer',
      height: 0.3,
      drawerCount: 1,
      handlesEnabled: false,
      handlePosition: 'top',
      handleOrientation: 'horizontal',
    })).toHaveLength(0)
  })

  it('places a vertical drawer pair on the selected edge', () => {
    const operations = pullOperations({
      id: 'drawer',
      type: 'drawer',
      height: 0.3,
      drawerCount: 1,
      handlesEnabled: true,
      handlePosition: 'bottom',
      handleOrientation: 'vertical',
    })

    expect(operations).toHaveLength(2)
    expect(operations[0]!.center!.x).toBeCloseTo(operations[1]!.center!.x)
    expect(Math.abs(operations[0]!.center!.y - operations[1]!.center!.y)).toBeCloseTo(DEFAULT_FURNITURE_CONFIG.pullHolePairGap)
    expect((operations[0]!.center!.y + operations[1]!.center!.y) / 2).toBeLessThan(0)
  })
})
