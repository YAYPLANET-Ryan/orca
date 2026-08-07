/** What clicking a CEO Office catalog entry should do.
 *
 *  Kept separate from the component so the decision is testable without a render:
 *  the branch used to end in a throw for every local workspace, which meant a
 *  click did nothing at all and nothing caught it.
 */
export type CeoOfficeNavigationAction =
  /** An SSH terminal is already live on the right host — move it rather than
   *  spawning a second remote shell. */
  | { kind: 'ssh-cd'; ptyId: string; command: string }
  /** Local workspace: open a terminal at the entry's folder. */
  | { kind: 'new-tab'; worktreeId: string; startupCwd: string }

export function resolveCeoOfficeNavigation(args: {
  itemPath: string
  worktreeId: string
  connectionId?: string | null
  activePtyId?: string | null
}): CeoOfficeNavigationAction {
  const { itemPath, worktreeId, connectionId, activePtyId } = args
  if (connectionId && activePtyId?.startsWith(`ssh:${connectionId}@@`)) {
    // Single quotes are the PowerShell literal-string escape, doubled to embed one.
    const escapedPath = itemPath.replaceAll("'", "''")
    return {
      kind: 'ssh-cd',
      ptyId: activePtyId,
      command: `Set-Location -LiteralPath '${escapedPath}'\r`
    }
  }
  // Why a tab and not a workspace: catalog entries are folders inside the ORCA
  // git repo, and Orca resolves any such folder back to the repo root, so
  // registering them as projects yields duplicate rows for one repo instead of
  // separate entries. A tab carries the working directory and registers nothing.
  return { kind: 'new-tab', worktreeId, startupCwd: itemPath }
}
