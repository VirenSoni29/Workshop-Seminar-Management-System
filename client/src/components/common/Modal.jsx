import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

// <Modal open onClose title size="sm|lg" footer={<>buttons</>}>body</Modal>
export default function Modal({
   open,
   onClose,
   title,
   eyebrow,
   size,
   footer,
   children,
   closeOnOverlay = true,
}) {
   // Esc closes, and the page behind stops scrolling while open
   useEffect(() => {
      if (!open) return;
      const onKey = (e) => e.key === "Escape" && onClose?.();
      document.addEventListener("keydown", onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
         document.removeEventListener("keydown", onKey);
         document.body.style.overflow = prev;
      };
   }, [open, onClose]);

   if (!open) return null;

   return createPortal(
      <div
         className="modal-overlay"
         onMouseDown={(e) =>
            closeOnOverlay && e.target === e.currentTarget && onClose?.()
         }
      >
         <div
            className={clsx("modal", size && `modal--${size}`)}
            role="dialog"
            aria-modal="true"
            aria-label={title}
         >
            {title && (
               <div className="modal-header">
                  <div>
                     {eyebrow && <span className="eyebrow">{eyebrow}</span>}
                     <h2>{title}</h2>
                  </div>
                  <button
                     type="button"
                     className="btn btn-ghost btn-icon"
                     onClick={onClose}
                     aria-label="Close"
                  >
                     <X size={18} />
                  </button>
               </div>
            )}
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
         </div>
      </div>,
      document.body,
   );
}
