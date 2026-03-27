import { useMemo } from 'react'
import { useMarketplace } from '../../state/useMarketplace'
import type { UserRole } from '../../data/types'

export default function RoleSwitcher() {
  const { session, setSession, currentUser, users, cartCount } = useMarketplace()

  const role: UserRole = session.role

  const candidates = useMemo(() => users.filter((u) => u.role === role), [role, users])
  const adminId = useMemo(() => users.find((u) => u.role === 'admin')?.id, [users])

  const effectiveUserId = currentUser.id

  function setRole(nextRole: UserRole) {
    const nextUserId =
      nextRole === 'admin'
        ? adminId ?? users[0]?.id
        : users.find((u) => u.role === nextRole)?.id ?? effectiveUserId

    if (!nextUserId) return
    setSession({ role: nextRole, userId: nextUserId })
  }

  function setUserId(nextUserId: string) {
    setSession({ role: session.role, userId: nextUserId })
  }

  return (
    <div className="role-switcher" aria-label="Demo session">
      <div className="role-switcher__row">
        <label className="label" htmlFor="role-select">
          Role
        </label>
        <select
          id="role-select"
          value={session.role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="buyer">Buyer</option>
          <option value="farmer">Farmer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {session.role !== 'admin' ? (
        <div className="role-switcher__row">
          <label className="label" htmlFor="user-select">
            User
          </label>
          <select
            id="user-select"
            value={session.userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="role-switcher__meta">
        <span className="muted">Cart:</span> <strong>{cartCount}</strong>
      </div>
    </div>
  )
}

