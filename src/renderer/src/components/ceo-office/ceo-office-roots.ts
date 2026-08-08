/** Choosing the root that CEO Office entry paths are relative to.
 *
 *  Entry paths in the manifest are relative to the ORCA repository root, but the
 *  component used to resolve them against whatever workspace happened to be
 *  active. Clicking an entry activates that entry's own workspace, so the very
 *  next click resolved against the wrong root — after opening Personal, OilDealer
 *  pointed at E:/ORCA/02_PERSONAL/02_BUSINESSES/oildealer, and the manifest read
 *  fell back to the built-in default because .orca/ceo-office.json does not exist
 *  down there. The catalog only worked from the root workspace.
 */

/** Windows paths differ in slash direction and case between the repo record and
 *  the worktree path; compare on a single normalized form. */
export function normalizeRootPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
}

/** Roots to try, in the order worth trying.
 *
 *  The active workspace comes first so an unchanged setup reads exactly one file.
 *  Registered projects follow, outermost first: catalog entries are registered as
 *  their own folder projects, so the enclosing ORCA repo is always a shorter path
 *  than any entry opened from it.
 */
export function ceoOfficeManifestRootCandidates(args: {
  activeRoot?: string
  repoPaths: readonly string[]
}): string[] {
  const ordered = [...args.repoPaths].sort(
    (a, b) => normalizeRootPath(a).length - normalizeRootPath(b).length
  )
  const seen = new Set<string>()
  const candidates: string[] = []
  for (const candidate of [...(args.activeRoot ? [args.activeRoot] : []), ...ordered]) {
    const key = normalizeRootPath(candidate)
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    candidates.push(candidate)
  }
  return candidates
}

/** True when `folderPath` is already registered as a project.
 *
 *  Adding a folder activates its workspace, and that activation opens a terminal
 *  on its own. Opening another one there would double up on the first click, so
 *  the extra terminal is only for revisits.
 */
export function isFolderAlreadyRegistered(args: {
  folderPath: string
  repoPaths: readonly string[]
}): boolean {
  const key = normalizeRootPath(args.folderPath)
  return args.repoPaths.some((path) => normalizeRootPath(path) === key)
}
