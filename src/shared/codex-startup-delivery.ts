import { recognizeAgentProcessFromCommandLine } from './agent-process-recognition'
import type { TuiAgent } from './types'

export type StartupCommandDelivery = 'fast' | 'shell-ready'

/** Agents whose launch command must wait for the shell prompt: slow prompt
 * integrations like Starship can still be initializing past the first output,
 * so an eagerly delivered command is rendered but never executed (STA-3417). */
const SHELL_READY_DELIVERY_AGENTS: ReadonlySet<TuiAgent> = new Set([
  'codex',
  'omp',
  'pi',
  'opencode'
])

/** `bareLaunch` excludes plain Codex: payload-free Codex deliberately keeps the
 * markerless fast startup path (see local-pty-provider / daemon pty-subprocess). */
export function shellReadyDeliveryProps(
  agent: TuiAgent,
  opts?: { bareLaunch?: boolean }
): { startupCommandDelivery?: StartupCommandDelivery } {
  if (opts?.bareLaunch && agent === 'codex') {
    return {}
  }
  return SHELL_READY_DELIVERY_AGENTS.has(agent)
    ? { startupCommandDelivery: 'shell-ready' as const }
    : {}
}

type CommandToken = {
  value: string
  startsQuoted: boolean
}

function tokenizeCommandWithQuoteMetadata(command: string): CommandToken[] {
  const tokens: CommandToken[] = []
  let current = ''
  let inToken = false
  let startsQuoted = false
  let quote: '"' | "'" | null = null
  let escaped = false

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index]
    if (escaped) {
      current += char
      escaped = false
      continue
    }
    if (char === '\\' && quote !== "'") {
      const next = command[index + 1]
      if (next && (/\s/.test(next) || next === '"' || next === "'" || next === '\\')) {
        escaped = true
        inToken = true
        continue
      }
    }
    if ((char === '"' || char === "'") && quote === null) {
      if (!inToken) {
        startsQuoted = true
      }
      quote = char
      inToken = true
      continue
    }
    if (quote === char) {
      quote = null
      continue
    }
    if (/\s/.test(char) && quote === null) {
      if (inToken) {
        tokens.push({ value: current, startsQuoted })
        current = ''
        inToken = false
        startsQuoted = false
      }
      continue
    }
    current += char
    inToken = true
  }

  if (inToken) {
    tokens.push({ value: current, startsQuoted })
  }
  return tokens
}

export function hasCodexNativeDraftFlag(command: string | null | undefined): boolean {
  if (recognizeAgentProcessFromCommandLine(command)?.agent !== 'codex' || !command) {
    return false
  }
  const tokens = tokenizeCommandWithQuoteMetadata(command)
  return tokens.some(
    (token, index) =>
      index > 0 &&
      !token.startsQuoted &&
      (token.value === '--prefill' || token.value.startsWith('--prefill='))
  )
}

export function shouldUseShellReadyStartupDelivery(args: {
  command: string | null | undefined
  startupCommandDelivery?: StartupCommandDelivery
}): boolean {
  return args.startupCommandDelivery === 'shell-ready' || hasCodexNativeDraftFlag(args.command)
}
