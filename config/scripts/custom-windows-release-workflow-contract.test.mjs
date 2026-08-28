import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const workflowPath = new URL(
  '../../.github/workflows/custom-windows-release.yml',
  import.meta.url
)
const workflow = readFileSync(workflowPath, 'utf8')

test('keeps the CEO Office repository as the packaged update feed', () => {
  assert.match(workflow, /ORCA_RELEASE_REPOSITORY: YAYPLANET-Ryan\/orca-ceo-office/)
  assert.match(workflow, /ORCA_UPDATE_REPO: orca-ceo-office/)
  assert.match(workflow, /repo:\\s\*orca-ceo-office/)
  assert.match(workflow, /updater-auto-download\.test\.ts/)
  assert.match(workflow, /updater\.startup-scheduling\.test\.ts/)
})

test('versions the build from verified source and the Korea release date', () => {
  assert.match(workflow, /require\('\.\/package\.json'\)\.version/)
  assert.match(workflow, /Source base \$base is older than published custom base/)
  assert.match(workflow, /Korea Standard Time/)
  assert.doesNotMatch(workflow, /repos\/stablyai\/orca\/releases\/latest/)
})

test('separates canonical release and one-time legacy bridge branches', () => {
  assert.match(workflow, /ryan\/ceo-office-sidebar-release-\*/)
  assert.match(workflow, /ryan\/ceo-office-sidebar-bridge-\*/)
  assert.match(workflow, /github\.repository == 'YAYPLANET-Ryan\/orca-ceo-office'/)
  assert.match(workflow, /github\.repository == 'YAYPLANET-Ryan\/orca'/)
})

test('copies only a matching canonical release into the legacy feed', () => {
  assert.match(workflow, /release\.target_commitish -ne \$env:GITHUB_SHA/)
  assert.match(workflow, /gh release download \$env:ORCA_BRIDGE_TAG/)
  assert.match(workflow, /--repo "\$env:ORCA_LEGACY_RELEASE_REPOSITORY"/)
  assert.match(workflow, /ORCA_BRIDGE_ASSET_CONTRACT_B64/)
  assert.match(workflow, /Get-FileHash -LiteralPath \$assetPath -Algorithm SHA256/)
  assert.match(workflow, /Canonical asset digest mismatch/)
  assert.match(workflow, /Legacy asset digest mismatch/)
  assert.match(workflow, /Assets are copied unchanged/)
})

test('gates sidebar, renderer-crash, and cold-restore regressions before release', () => {
  assert.match(workflow, /worktree-title-derived-agent-rows\.test\.ts/)
  assert.match(workflow, /pty-connection-cold-restore-agent-resume\.test\.ts/)
  assert.match(workflow, /session-restored-banner-pane-state\.test\.tsx/)
  assert.match(workflow, /createMainWindow-renderer-crash-recovery\.test\.ts/)
  assert.match(workflow, /daemon-pty-adapter-cold-restore-reanchor\.test\.ts/)
  assert.match(workflow, /attach-main-window-services\.test\.ts/)
})
