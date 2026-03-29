import { useMarketplace } from '../../state/useMarketplace'
import type { UserRole } from '../../data/types'

export default function RoleSwitcher() {
  const { session, setSession, cartCount } = useMarketplace()

  function setRole(nextRole: UserRole) {
    setSession({ role: nextRole, userId: `local_${nextRole}` })
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

      <div className="role-switcher__meta">
        <span className="muted">Cart:</span> <strong>{cartCount}</strong>
      </div>
    </div>
  )
}

