import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck, ChevronDown, LogOut, Menu } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import ThemeToggle from "../common/ThemeToggle";
import { getInitials } from "../../utils/getInitials";
import { HOME_BY_ROLE, ROLE_LABELS } from "../../utils/constants";

// <Navbar onMenuClick={toggleSidebar} />  (used inside DashboardLayout)
export default function Navbar({ onMenuClick }) {
   const { user, logout } = useAuth();
   const navigate = useNavigate();
   const [open, setOpen] = useState(false);
   const menuRef = useRef(null);

   // Close the dropdown on outside click or Esc
   useEffect(() => {
      if (!open) return;
      const onDown = (e) =>
         !menuRef.current?.contains(e.target) && setOpen(false);
      const onKey = (e) => e.key === "Escape" && setOpen(false);
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
      return () => {
         document.removeEventListener("mousedown", onDown);
         document.removeEventListener("keydown", onKey);
      };
   }, [open]);

   const handleLogout = () => {
      setOpen(false);
      logout();
      navigate("/login", { replace: true });
   };

   return (
      <header className="navbar">
         <div className="navbar__inner">
            <button
               type="button"
               className="btn btn-ghost btn-icon navbar__menu-btn"
               onClick={onMenuClick}
               aria-label="Open navigation"
            >
               <Menu />
            </button>

            <Link className="brand" to={HOME_BY_ROLE[user.role]}>
               <span className="brand__mark">
                  <CalendarCheck />
               </span>
               Workshop Hub
            </Link>

            <div className="navbar__spacer" />

            <div className="dashboard-toolbar">
               <ThemeToggle />
               <div className="user-menu" ref={menuRef}>
                  <button
                     type="button"
                     className="btn btn-ghost"
                     onClick={() => setOpen((o) => !o)}
                     aria-expanded={open}
                     aria-haspopup="menu"
                  >
                     <span className="avatar">{getInitials(user.name)}</span>
                     <span className="hide-xs">{user.name}</span>
                     <ChevronDown />
                  </button>

                  {open && (
                     <div className="menu" role="menu">
                        <div className="menu__header">
                           <strong>{user.name}</strong>
                           <small>{user.email}</small>
                           <small>{ROLE_LABELS[user.role]}</small>
                        </div>
                        <div className="menu__divider" />
                        <button
                           type="button"
                           className="menu__item menu__item--danger"
                           role="menuitem"
                           onClick={handleLogout}
                        >
                           <LogOut />
                           Log out
                        </button>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </header>
   );
}
