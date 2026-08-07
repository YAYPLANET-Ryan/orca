/** Who asked for a project to be removed.
 *
 *  Recorded on the `project.remove` breadcrumb. Removing a project drops the repo
 *  row, its project, its host setup, every worktree meta beneath it, and the
 *  terminal history behind those, so "which caller did this" is the first question
 *  asked afterwards — and before this existed there was no way to answer it.
 *
 *  Closed set so a typo can't silently mint an unattributable reason. */
export type ProjectRemovalReason =
  /** Settings > Repositories, behind the two-click confirm. */
  | 'settings-ui'
  /** `repo.rm` over RPC/CLI. */
  | 'rpc'
  /** Rollback of a project host setup that failed to link. */
  | 'setup-rollback'
  /** Caller did not say. Treat sightings of this in the log as a gap to close. */
  | 'unspecified'
