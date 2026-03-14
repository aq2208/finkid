import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PiHouseFill, PiHouse,
  PiStarFill, PiStar,
  PiCheckSquareFill, PiCheckSquare,
  PiUserCircleFill, PiUserCircle,
} from 'react-icons/pi'

const TABS = [
  { to: '/',        ActiveIcon: PiHouseFill,       Icon: PiHouse,        label: 'Home',    end: true  },
  { to: '/dreams',  ActiveIcon: PiStarFill,         Icon: PiStar,         label: 'Dreams',  end: false },
  { to: '/tasks',   ActiveIcon: PiCheckSquareFill,  Icon: PiCheckSquare,  label: 'Tasks',   end: false },
  { to: '/profile', ActiveIcon: PiUserCircleFill,   Icon: PiUserCircle,   label: 'Profile', end: false },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, ActiveIcon, Icon, label, end }) => {
        const isActive = end
          ? location.pathname === to
          : location.pathname.startsWith(to)

        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            {isActive && (
              <motion.div
                className="nav-pill"
                layoutId="nav-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}

            <motion.span
              className="nav-icon"
              animate={{ scale: isActive ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {isActive ? <ActiveIcon /> : <Icon />}
            </motion.span>

            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
