import { describe, expect, it, vi } from 'vitest'
import * as Y from 'yjs'

vi.mock('three-bvh-csg', () => ({
  Brush: class {},
  Evaluator: class {},
  SUBTRACTION: 1,
}))

import { compileAssembly } from '~~/shared/domain/assembly'
import { DEFAULT_FURNITURE_CONFIG, normalizePublicStyle } from '~~/shared/domain/defaults'
import { moduleHasHandleHoles, moduleShowsPhysicalHandle, resolveHandleType } from '~~/shared/domain/handles'
import { DESIGN_SCHEMA_VERSION, type FurnitureDoc, type FurnitureModule } from '~~/shared/domain/types'
import {
  ensureInitialized,
  getFurnitureMap,
  insertColumn,
  readFurnitureDoc,
  setModuleHandleOrientation,
  setModuleHandlePosition,
  setModuleHandleMode,
  setModuleType,
} from '~~/shared/yjs/doc'

function furnitureDoc(module: FurnitureModule): FurnitureDoc {
  return {
    schemaVersion: DESIGN_SCHEMA_VERSION,
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

  it('normalizes old Yjs modules to physical handles and contextual orientation', () => {
    const doc = new Y.Doc()
    ensureInitialized(doc)
    insertColumn(doc, 0)
    setModuleType(doc, 0, 0, 'drawer')

    const module = readFurnitureDoc(doc).columns[0]!.modules[0]!
    expect(module.handleMode).toBe('handle')
    expect(module.handlePosition).toBe('top')
    expect(module.handleOrientation).toBe('horizontal')
  })

  it('migrates the legacy disabled boolean to no handle treatment', () => {
    const doc = new Y.Doc()
    ensureInitialized(doc)
    insertColumn(doc, 0)
    setModuleType(doc, 0, 0, 'left-door')

    const columns = getFurnitureMap(doc).get('columns') as Y.Array<Y.Map<unknown>>
    const modules = columns.get(0)!.get('modules') as Y.Array<Y.Map<unknown>>
    const moduleMap = modules.get(0)!
    moduleMap.delete('handleMode')
    moduleMap.set('handlesEnabled', false)

    ensureInitialized(doc)

    expect(readFurnitureDoc(doc).columns[0]!.modules[0]!.handleMode).toBe('none')
    expect(moduleMap.has('handlesEnabled')).toBe(false)
  })

  it('persists module handle controls through the Yjs document', () => {
    const doc = new Y.Doc()
    ensureInitialized(doc)
    insertColumn(doc, 0)
    setModuleType(doc, 0, 0, 'right-door')
    setModuleHandleMode(doc, 0, 0, 'hole')
    setModuleHandlePosition(doc, 0, 0, 'bottom')
    setModuleHandleOrientation(doc, 0, 0, 'horizontal')

    const module = readFurnitureDoc(doc).columns[0]!.modules[0]!
    expect(module).toMatchObject({
      type: 'right-door',
      handleMode: 'hole',
      handlePosition: 'bottom',
      handleOrientation: 'horizontal',
    })
  })

  it('removes pull holes when the module has no handle treatment', () => {
    expect(pullOperations({
      id: 'drawer',
      type: 'drawer',
      height: 0.3,
      drawerCount: 1,
      handleMode: 'none',
      handlePosition: 'top',
      handleOrientation: 'horizontal',
    })).toHaveLength(0)
  })

  it('keeps manufacturing holes without rendering physical hardware in hole mode', () => {
    const module: FurnitureModule = {
      id: 'door',
      type: 'left-door',
      height: 0.3,
      handleMode: 'hole',
      handlePosition: 'top',
      handleOrientation: 'vertical',
    }

    expect(pullOperations(module)).toHaveLength(1)
    expect(moduleHasHandleHoles(module)).toBe(true)
    expect(moduleShowsPhysicalHandle(module)).toBe(false)
  })

  it('places a vertical drawer pair on the selected edge', () => {
    const operations = pullOperations({
      id: 'drawer',
      type: 'drawer',
      height: 0.3,
      drawerCount: 1,
      handleMode: 'handle',
      handlePosition: 'bottom',
      handleOrientation: 'vertical',
    })

    expect(operations).toHaveLength(2)
    expect(operations[0]!.center!.x).toBeCloseTo(operations[1]!.center!.x)
    expect(Math.abs(operations[0]!.center!.y - operations[1]!.center!.y)).toBeCloseTo(DEFAULT_FURNITURE_CONFIG.pullHolePairGap)
    expect((operations[0]!.center!.y + operations[1]!.center!.y) / 2).toBeLessThan(0)
  })
})
