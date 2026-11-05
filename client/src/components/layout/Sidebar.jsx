import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
   Award,
   CalendarDays,
   ClipboardCheck,
   Compass,
   LayoutDashboard,
   PlusCircle,
   ScanLine,
   Ticket,
   Users,
   Library,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { getInitials } from "../../utils/getInitials";
import { ROLE_LABELS } from "../../utils/constants";

// `end` = only highlight on the exact path (so /faculty/workshops isn't active on /new)
const browse = { to: "/workshops", label: "Browse workshops", icon: Compass };
const myRegs = {
   to: "/my-registrations",
   label: "My registrations",
   icon: Ticket,
};
const myCerts = { to: "/my-certificates", label: "Certificates", icon: Award };

const facultyTools = [
   {
      to: "/faculty/workshops",
      label: "My workshops",
      icon: CalendarDays,
      end: true,
   },
   { to: "/faculty/workshops/new", label: "Create workshop", icon: PlusCircle },
   { to: "/faculty/scan", label: "QR scanner", icon: ScanLine },
];

const MENUS = {
   student: [
      {
         heading: "Workspace",
         items: [
            {
               to: "/student/dashboard",
               label: "Overview",
               icon: LayoutDashboard,
               end: true,
            },
            browse,
            myRegs,
            myCerts,
         ],
      },
   ],
   faculty: [
      {
         heading: "Workspace",
         items: [
            {
               to: "/faculty/dashboard",
               label: "Overview",
               icon: LayoutDashboard,
               end: true,
            },
            browse,
         ],
      },
      { heading: "Manage", items: facultyTools },
      { heading: "Account", items: [myRegs, myCerts] },
   ],
   admin: [
      {
         heading: "Admin",
         items: [
            {
               to: "/admin/dashboard",
               label: "Overview",
               icon: LayoutDashboard,
               end: true,
            },
            {
               to: "/admin/approvals",
               label: "Pending approvals",
               icon: ClipboardCheck,
            },
            { to: "/admin/workshops", label: "All workshops", icon: Library },
            { to: "/admin/users", label: "Manage users", icon: Users },
         ],
      },
      { heading: "Workspace", items: [browse, ...facultyTools] },
   ],
};

// <Sidebar open={open} onClose={close} />
export default function Sidebar({ open, onClose }) {
   const { user } = useAuth();
   const groups = MENUS[user.role] || [];

   return (
      <aside
         className={clsx("sidebar", open && "is-open")}
         aria-label="Dashboard navigation"
      >
         {groups.map((g) => (
            <div className="sidebar__group" key={g.heading}>
               <span className="sidebar__heading">
                  {g.heading.toUpperCase()}
               </span>
               {g.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                     key={to}
                     to={to}
                     end={end}
                     className="sidebar__link"
                     onClick={onClose}
                  >
                     <Icon />
                     {label}
                  </NavLink>
               ))}
            </div>
         ))}

         <div className="sidebar__footer">
            <span className="avatar">{getInitials(user.name)}</span>
            <div>
               <strong>{user.name}</strong>
               <small>{ROLE_LABELS[user.role]} account</small>
            </div>
         </div>
      </aside>
   );
}
