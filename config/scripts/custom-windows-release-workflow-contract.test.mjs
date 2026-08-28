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
  assert.match(workflow, /Assets are copied unchanged/)
})

test('gates sidebar and cold-restore regressions before release', () => {
  assert.match(workflow, /worktree-title-derived-agent-rows\.test\.ts/)
  assert.match(workflow, /pty-connection-cold-restore-agent-resume\.test\.ts/)
  assert.match(workflow, /session-restored-banner-pane-state\.test\.tsx/)
})
