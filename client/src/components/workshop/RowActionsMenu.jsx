import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import {
   MoreHorizontal,
   Eye,
   Pencil,
   Users,
   ScanLine,
   Send,
   CheckCheck,
   Ban,
   Trash2,
} from "lucide-react";
import {
   submitWorkshopApi,
   completeWorkshopApi,
   cancelWorkshopApi,
   deleteWorkshopApi,
} from "../../api/workshops.api";
import ConfirmModal from "../common/ConfirmModal";
import { notify } from "../../utils/notify";
import { getErrorMessage } from "../../utils/getErrorMessage";

const CONFIRMS = {
   submit: {
      title: "Submit for approval?",
      message: "The workshop will be sent to an admin for review.",
      confirmText: "Submit",
      danger: false,
      run: (id) => submitWorkshopApi(id),
      done: "Workshop submitted for approval",
   },
   complete: {
      title: "Mark as completed?",
      message:
         "Attendees who were checked in become eligible for certificates.",
      confirmText: "Mark complete",
      danger: false,
      run: (id) => completeWorkshopApi(id),
      done: "Workshop marked as completed",
   },
   cancel: {
      title: "Cancel this workshop?",
      message: "Registered students will no longer be able to attend.",
      confirmText: "Cancel workshop",
      danger: true,
      run: (id) => cancelWorkshopApi(id),
      done: "Workshop cancelled",
   },
   delete: {
      title: "Delete this workshop?",
      message: "This cannot be undone.",
      confirmText: "Delete",
      danger: true,
      run: (id) => deleteWorkshopApi(id),
      done: "Workshop deleted",
   },
};

const listCls =
   "tw:fixed tw:z-50 tw:flex tw:min-w-[200px] tw:flex-col tw:rounded-xl tw:border " +
   "tw:border-[color:var(--border,#e5e5e5)] tw:bg-[color:var(--surface,#fff)] " +
   "tw:p-[var(--sp-2)] tw:shadow-[0_8px_24px_rgba(0,0,0,0.12)]";

const itemCls =
   "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-[var(--sp-3)] tw:rounded-lg " +
   "tw:border-0 tw:bg-transparent tw:px-[var(--sp-3)] tw:py-[var(--sp-2)] tw:text-left " +
   "tw:text-[length:var(--fs-sm)] tw:no-underline! tw:font-[inherit] " +
   "tw:hover:bg-[color:var(--surface-2,rgba(0,0,0,0.05))]";

const normalColor = "tw:text-inherit!";
const dangerColor = "tw:text-[color:var(--danger,#b42318)]!";

export default function RowActionsMenu({ workshop, onChanged }) {
   const id = workshop._id || workshop.id;
   const status = workshop.status;
   const [open, setOpen] = useState(false);
   const [pos, setPos] = useState({ top: 0, right: 0 });
   const [pending, setPending] = useState(null); // key of CONFIRMS
   const [busy, setBusy] = useState(false);
   const btnRef = useRef(null);
   const listRef = useRef(null);

   const isDraftLike = ["draft", "rejected"].includes(status);
   const isApproved = status === "approved";
   const hasAttendees = ["approved", "completed"].includes(status);

   const toggle = () => {
      if (!open && btnRef.current) {
         const r = btnRef.current.getBoundingClientRect();
         setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
      }
      setOpen((o) => !o);
   };

   useEffect(() => {
      if (!open) return;
      const close = () => setOpen(false);
      const onDown = (e) => {
         if (
            btnRef.current?.contains(e.target) ||
            listRef.current?.contains(e.target)
         )
            return;
         close();
      };
      const onKey = (e) => e.key === "Escape" && close();
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close);
      return () => {
         document.removeEventListener("mousedown", onDown);
         document.removeEventListener("keydown", onKey);
         window.removeEventListener("scroll", close, true);
         window.removeEventListener("resize", close);
      };
   }, [open]);

   const ask = (key) => {
      setOpen(false);
      setPending(key);
   };

   const confirm = async () => {
      const c = CONFIRMS[pending];
      setBusy(true);
      try {
         await c.run(id);
         notify.success(c.done);
         setPending(null);
         onChanged?.();
      } catch (err) {
         notify.error(getErrorMessage(err));
      } finally {
         setBusy(false);
      }
   };

   const link = (to, Icon, label) => (
      <Link
         role="menuitem"
         className={clsx(itemCls, normalColor)}
         to={to}
         onClick={() => setOpen(false)}
      >
         <Icon size={16} />
         {label}
      </Link>
   );
   const action = (key, Icon, label, danger) => (
      <button
         type="button"
         role="menuitem"
         className={clsx(itemCls, danger ? dangerColor : normalColor)}
         onClick={() => ask(key)}
      >
         <Icon size={16} />
         {label}
      </button>
   );

   const c = pending ? CONFIRMS[pending] : null;

   return (
      <>
         <button
            ref={btnRef}
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={toggle}
         >
            <MoreHorizontal size={16} />
         </button>

         {open && (
            <div
               ref={listRef}
               role="menu"
               className={listCls}
               style={{ top: pos.top, right: pos.right }}
            >
               {link(`/workshops/${id}`, Eye, "View details")}
               {isDraftLike &&
                  link(`/faculty/workshops/${id}/edit`, Pencil, "Edit")}
               {hasAttendees &&
                  link(
                     `/faculty/workshops/${id}/attendees`,
                     Users,
                     "Attendee list",
                  )}
               {isApproved && link("/faculty/scan", ScanLine, "Open scanner")}
               {isDraftLike && action("submit", Send, "Submit for approval")}
               {isApproved && action("complete", CheckCheck, "Mark complete")}
               {isApproved && action("cancel", Ban, "Cancel workshop", true)}
               {isDraftLike && action("delete", Trash2, "Delete", true)}
            </div>
         )}

         {c && (
            <ConfirmModal
               open
               onClose={() => !busy && setPending(null)}
               onConfirm={confirm}
               title={c.title}
               message={c.message}
               confirmText={c.confirmText}
               danger={c.danger}
               loading={busy}
            />
         )}
      </>
   );
}
