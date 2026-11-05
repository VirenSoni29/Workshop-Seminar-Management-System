import { AlertTriangle, HelpCircle } from "lucide-react";
import clsx from "clsx";
import Modal from "./Modal";
import { Spinner } from "./Loader";

// <ConfirmModal open onClose onConfirm title message danger loading confirmText="Delete" />
// The page owns the API call: onConfirm just runs it. Pass `loading` while it runs.
export default function ConfirmModal({
   open,
   onClose,
   onConfirm,
   title = "Are you sure?",
   message,
   confirmText = "Confirm",
   cancelText = "Cancel",
   danger = false,
   loading = false,
   children,
}) {
   const handleClose = () => !loading && onClose?.();

   return (
      <Modal
         open={open}
         onClose={handleClose}
         size="sm"
         closeOnOverlay={!loading}
         footer={
            <>
               <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={loading}
               >
                  {cancelText}
               </button>
               <button
                  type="button"
                  className={clsx(
                     "btn",
                     danger ? "btn-danger" : "btn-primary",
                     loading && "is-loading",
                  )}
                  onClick={onConfirm}
                  disabled={loading}
               >
                  {loading && <Spinner />}
                  {confirmText}
               </button>
            </>
         }
      >
         <div className="stack">
            <div className={clsx("modal-icon", danger && "modal-icon--danger")}>
               {danger ? <AlertTriangle size={22} /> : <HelpCircle size={22} />}
            </div>
            <h3>{title}</h3>
            {message && <p>{message}</p>}
            {children}
         </div>
      </Modal>
   );
}
