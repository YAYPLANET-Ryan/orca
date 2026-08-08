import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  buildReleaseTagHrefPattern,
  getLatestReleaseDownloadUrl,
  getReleasesAtomFeedUrl,
  getReleasesDownloadBase,
  getUpdateRepository,
  resetUpdateRepositoryCacheForTest
} from './updater-repository'

const originalResourcesPath = process.resourcesPath

function useResourcesDir(contents: string | null): string {
  const dir = mkdtempSync(join(tmpdir(), 'orca-update-repo-'))
  if (contents !== null) {
    writeFileSync(join(dir, 'app-update.yml'), contents, 'utf-8')
  }
  Object.defineProperty(process, 'resourcesPath', { value: dir, configurable: true })
  return dir
}

let created: string[] = []

beforeEach(() => {
  resetUpdateRepositoryCacheForTest()
  created = []
})

afterEach(() => {
  Object.defineProperty(process, 'resourcesPath', {
    value: originalResourcesPath,
    configurable: true
  })
  for (const dir of created) {
    rmSync(dir, { recursive: true, force: true })
  }
  resetUpdateRepositoryCacheForTest()
  vi.restoreAllMocks()
})

describe('getUpdateRepository', () => {
  // The failure this guards: the repository was a constant, so a custom build
  // polled upstream regardless of its own app-update.yml, offered the next
  // upstream release, and replaced itself with stock Orca when installed.
  it('takes owner and repo from app-update.yml', () => {
    created.push(useResourcesDir('owner: YAYPLANET-Ryan\nrepo: orca\nprovider: github\n'))
    expect(getUpdateRepository()).toEqual({ owner: 'YAYPLANET-Ryan', repo: 'orca' })
    expect(getLatestReleaseDownloadUrl()).toBe(
      'https://github.com/YAYPLANET-Ryan/orca/releases/latest/download'
    )
    expect(getReleasesDownloadBase()).toBe(
      'https://github.com/YAYPLANET-Ryan/orca/releases/download'
    )
    expect(getReleasesAtomFeedUrl()).toBe('https://github.com/YAYPLANET-Ryan/orca/releases.atom')
  })

  it.each([
    { name: 'no config file', contents: null },
    { name: 'missing owner', contents: 'repo: orca\n' },
    { name: 'missing repo', contents: 'owner: someone\n' },
    { name: 'blank values', contents: 'owner: "   "\nrepo: ""\n' },
    { name: 'malformed yaml', contents: 'owner: [unclosed\n' }
  ])('falls back to upstream when the config is unusable: $name', ({ contents }) => {
    created.push(useResourcesDir(contents))
    expect(getUpdateRepository()).toEqual({ owner: 'stablyai', repo: 'orca' })
    expect(getLatestReleaseDownloadUrl()).toBe(
      'https://github.com/stablyai/orca/releases/latest/download'
    )
  })
})

describe('buildReleaseTagHrefPattern', () => {
  it('matches tag links for the configured repository only', () => {
    created.push(useResourcesDir('owner: YAYPLANET-Ryan\nrepo: orca\n'))
    const body = [
      '<a href="https://github.com/YAYPLANET-Ryan/orca/releases/tag/v1.4.176-ceo.20260808.10">',
      '<a href="https://github.com/stablyai/orca/releases/tag/v1.4.177-rc.1">'
    ].join('\n')
    const tags = [...body.matchAll(buildReleaseTagHrefPattern())].map((m) => m[1])
    expect(tags).toEqual(['v1.4.176-ceo.20260808.10'])
  })

  it('escapes regex metacharacters in the repository name', () => {
    created.push(useResourcesDir('owner: a.b\nrepo: c+d\n'))
    const body = '<a href="https://github.com/a.b/c+d/releases/tag/v1.0.0"><a href="https://github.com/axb/cxd/releases/tag/v2.0.0">'
    const tags = [...body.matchAll(buildReleaseTagHrefPattern())].map((m) => m[1])
    expect(tags).toEqual(['v1.0.0'])
  })
})
