import { useState } from "react";
import { Outlet } from "react-router-dom";
import clsx from "clsx";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
   const [open, setOpen] = useState(false);
   const close = () => setOpen(false);

   return (
      <div className="app-shell">
         <Navbar onMenuClick={() => setOpen((o) => !o)} />
         <div className="app-body">
            <Sidebar open={open} onClose={close} />
            <main className="app-main">
               <div className="app-content">
                  <Outlet />
               </div>
            </main>
         </div>
         <div
            className={clsx("sidebar-backdrop", open && "is-open")}
            onClick={close}
         />
      </div>
   );
}
