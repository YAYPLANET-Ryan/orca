import { describe, expect, it } from 'vitest'
import { resolveCeoOfficeNavigation } from './ceo-office-navigation'

const LOCAL = {
  itemPath: 'E:/ORCA/02_BUSINESSES/oildealer',
  worktreeId: 'repo-1::E:/ORCA'
}

describe('resolveCeoOfficeNavigation', () => {
  // The regression this guards: every local workspace fell through to a throw, so
  // clicking a catalog entry did nothing and the failure was swallowed by the
  // caller's .catch(). A local click must produce a terminal.
  it('opens a tab at the entry folder on a local workspace', () => {
    expect(resolveCeoOfficeNavigation(LOCAL)).toEqual({
      kind: 'new-tab',
      worktreeId: 'repo-1::E:/ORCA',
      startupCwd: 'E:/ORCA/02_BUSINESSES/oildealer'
    })
  })

  it.each([
    { name: 'no connection id', connectionId: undefined, activePtyId: 'ssh:host-1@@abc' },
    { name: 'no active pty', connectionId: 'host-1', activePtyId: undefined },
    { name: 'active pty is local', connectionId: 'host-1', activePtyId: 'repo-1::E:/ORCA@@abc' },
    {
      name: 'active pty belongs to another host',
      connectionId: 'host-1',
      activePtyId: 'ssh:host-2@@abc'
    }
  ])('opens a tab when the SSH terminal does not match: $name', ({ connectionId, activePtyId }) => {
    expect(resolveCeoOfficeNavigation({ ...LOCAL, connectionId, activePtyId })).toMatchObject({
      kind: 'new-tab'
    })
  })

  it('moves the matching SSH terminal instead of spawning a second remote shell', () => {
    expect(
      resolveCeoOfficeNavigation({
        ...LOCAL,
        itemPath: '/srv/orca/02_BUSINESSES/oildealer',
        connectionId: 'host-1',
        activePtyId: 'ssh:host-1@@abc'
      })
    ).toEqual({
      kind: 'ssh-cd',
      ptyId: 'ssh:host-1@@abc',
      command: "Set-Location -LiteralPath '/srv/orca/02_BUSINESSES/oildealer'\r"
    })
  })

  it("doubles single quotes so a quote in a path cannot end the literal string", () => {
    const action = resolveCeoOfficeNavigation({
      ...LOCAL,
      itemPath: "/srv/o'rca/biz",
      connectionId: 'host-1',
      activePtyId: 'ssh:host-1@@abc'
    })
    expect(action).toMatchObject({ command: "Set-Location -LiteralPath '/srv/o''rca/biz'\r" })
  })
})
