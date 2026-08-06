import { describe, expect, it } from 'vitest'
import { buildAgentDraftLaunchPlan, buildAgentStartupPlan } from './tui-agent-startup'

describe('shell-ready startup delivery (STA-3417)', () => {
  it.each(['omp', 'pi'] as const)('delivers %s argv-prompt launches on shell-ready', (agent) => {
    const plan = buildAgentStartupPlan({
      agent,
      prompt: 'fix it',
      cmdOverrides: {},
      platform: 'darwin'
    })

    expect(plan?.startupCommandDelivery).toBe('shell-ready')
  })

  it('delivers OpenCode flag-prompt launches on shell-ready', () => {
    const plan = buildAgentStartupPlan({
      agent: 'opencode',
      prompt: 'fix it',
      cmdOverrides: {},
      platform: 'darwin'
    })

    expect(plan?.startupCommandDelivery).toBe('shell-ready')
  })

  it.each(['omp', 'pi', 'opencode'] as const)(
    'delivers empty %s launches on shell-ready',
    (agent) => {
      const plan = buildAgentStartupPlan({
        agent,
        prompt: '',
        cmdOverrides: {},
        platform: 'darwin',
        allowEmptyPromptLaunch: true
      })

      expect(plan?.startupCommandDelivery).toBe('shell-ready')
    }
  )

  it('keeps plain empty Codex launches off shell-ready delivery', () => {
    // Why: payload-free Codex deliberately stays on the markerless fast path.
    const plan = buildAgentStartupPlan({
      agent: 'codex',
      prompt: '',
      cmdOverrides: {},
      platform: 'darwin',
      allowEmptyPromptLaunch: true
    })

    expect(plan?.startupCommandDelivery).toBeUndefined()
  })

  it('does not add shell-ready delivery for agents outside the affected set', () => {
    const plan = buildAgentStartupPlan({
      agent: 'claude',
      prompt: 'fix it',
      cmdOverrides: {},
      platform: 'darwin'
    })

    expect(plan?.startupCommandDelivery).toBeUndefined()
  })

  it.each(['omp', 'pi'] as const)('delivers %s env-var draft launches on shell-ready', (agent) => {
    const plan = buildAgentDraftLaunchPlan({
      agent,
      draft: 'prefill text',
      cmdOverrides: {},
      platform: 'darwin'
    })

    expect(plan?.startupCommandDelivery).toBe('shell-ready')
  })
})
