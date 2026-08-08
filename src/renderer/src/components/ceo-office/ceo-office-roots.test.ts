import { describe, expect, it } from 'vitest'
import {
  ceoOfficeManifestRootCandidates,
  isFolderAlreadyRegistered,
  normalizeRootPath
} from './ceo-office-roots'

describe('ceoOfficeManifestRootCandidates', () => {
  it('tries the active workspace first so an unchanged setup reads one file', () => {
    expect(
      ceoOfficeManifestRootCandidates({
        activeRoot: 'E:/ORCA',
        repoPaths: ['E:/ORCA', 'E:/ORCA/02_PERSONAL']
      })
    ).toEqual(['E:/ORCA', 'E:/ORCA/02_PERSONAL'])
  })

  // The failure this guards: opening Personal makes it the active workspace, and
  // resolving entry paths against it pointed OilDealer at
  // E:/ORCA/02_PERSONAL/02_BUSINESSES/oildealer.
  it('falls back to the enclosing repo when a sub-workspace is active', () => {
    expect(
      ceoOfficeManifestRootCandidates({
        activeRoot: 'E:/ORCA/02_PERSONAL',
        repoPaths: ['E:/ORCA/02_PERSONAL', 'E:/ORCA']
      })
    ).toEqual(['E:/ORCA/02_PERSONAL', 'E:/ORCA'])
  })

  it('orders registered projects outermost first', () => {
    expect(
      ceoOfficeManifestRootCandidates({
        repoPaths: ['E:/ORCA/02_BUSINESSES/oildealer', 'E:/ORCA', 'E:/ORCA/02_PERSONAL']
      })
    ).toEqual(['E:/ORCA', 'E:/ORCA/02_PERSONAL', 'E:/ORCA/02_BUSINESSES/oildealer'])
  })

  it('drops duplicates across slash direction and case', () => {
    expect(
      ceoOfficeManifestRootCandidates({
        activeRoot: 'E:\\ORCA',
        repoPaths: ['e:/orca/', 'E:/ORCA']
      })
    ).toEqual(['E:\\ORCA'])
  })

  it('returns an empty list when nothing is registered and nothing is active', () => {
    expect(ceoOfficeManifestRootCandidates({ repoPaths: [] })).toEqual([])
  })
})

describe('isFolderAlreadyRegistered', () => {
  it.each([
    { name: 'exact', folderPath: 'E:/ORCA/02_PERSONAL' },
    { name: 'backslashes', folderPath: 'E:\\ORCA\\02_PERSONAL' },
    { name: 'different case', folderPath: 'e:/orca/02_personal' },
    { name: 'trailing slash', folderPath: 'E:/ORCA/02_PERSONAL/' }
  ])('matches a registered project: $name', ({ folderPath }) => {
    expect(
      isFolderAlreadyRegistered({ folderPath, repoPaths: ['E:/ORCA', 'E:/ORCA/02_PERSONAL'] })
    ).toBe(true)
  })

  it('does not match an unregistered folder', () => {
    expect(
      isFolderAlreadyRegistered({
        folderPath: 'E:/ORCA/02_BUSINESSES/oildealer',
        repoPaths: ['E:/ORCA', 'E:/ORCA/02_PERSONAL']
      })
    ).toBe(false)
  })

  it('does not treat the enclosing repo as a match', () => {
    expect(
      isFolderAlreadyRegistered({ folderPath: 'E:/ORCA/01_CEO_OFFICE', repoPaths: ['E:/ORCA'] })
    ).toBe(false)
  })
})

describe('normalizeRootPath', () => {
  it('collapses slash direction, trailing slashes and case', () => {
    expect(normalizeRootPath('E:\\ORCA\\')).toBe('e:/orca')
  })
})
