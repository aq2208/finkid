import { NavLink } from 'react-router-dom'
import {
  PiHouseFill, PiHouse,
  PiStarFill, PiStar,
  PiCheckSquareFill, PiCheckSquare,
  PiUserCircleFill, PiUserCircle,
} from 'react-icons/pi'

const TABS = [
  { to: '/',        ActiveIcon: PiHouseFill,        Icon: PiHouse,        label: 'Home',    end: true  },
  { to: '/dreams',  ActiveIcon: PiStarFill,          Icon: PiStar,         label: 'Dreams',  end: false },
  { to: '/tasks',   ActiveIcon: PiCheckSquareFill,   Icon: PiCheckSquare,  label: 'Tasks',   end: false },
  { to: '/profile', ActiveIcon: PiUserCircleFill,    Icon: PiUserCircle,   label: 'Profile', end: false },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, ActiveIcon, Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              {isActive
                ? <ActiveIcon className="nav-icon" />
                : <Icon className="nav-icon" />
              }
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
