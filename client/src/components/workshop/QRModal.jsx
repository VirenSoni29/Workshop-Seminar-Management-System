import { CircleAlert, Printer } from "lucide-react";
import Modal from "../common/Modal";
import Loader from "../common/Loader";
import StatusBadge from "../common/StatusBadge";
import { formatDateTime } from "../../utils/formatDate";

// <QRModal open onClose loading error data={{ registrationId, qrImage, status, workshop }} />
export default function QRModal({ open, onClose, loading, error, data }) {
   const w = data?.workshop;

   return (
      <Modal
         open={open}
         onClose={onClose}
         size="sm"
         eyebrow="WORKSHOP ENTRY PASS"
         title="Your registration QR"
         footer={
            <>
               <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
               >
                  Close
               </button>
               {data && (
                  <button
                     type="button"
                     className="btn btn-primary"
                     onClick={() => window.print()}
                  >
                     <Printer /> Print pass
                  </button>
               )}
            </>
         }
      >
         {loading ? (
            <Loader text="Loading your QR..." />
         ) : error ? (
            <div className="alert alert--danger" role="alert">
               <CircleAlert />
               <p>{error}</p>
            </div>
         ) : data ? (
            <div style={{ textAlign: "center" }}>
               {w && (
                  <>
                     <h3
                        style={{
                           color: "var(--ink)",
                           marginBottom: "var(--sp-1)",
                        }}
                     >
                        {w.title}
                     </h3>
                     {w.startDate && (
                        <p style={{ fontSize: "var(--fs-sm)" }}>
                           {formatDateTime(w.startDate)}
                        </p>
                     )}
                  </>
               )}
               <div className="qr-frame" style={{ marginBlock: "var(--sp-4)" }}>
                  <img
                     src={data.qrImage}
                     alt="Entry QR code"
                     width="168"
                     height="168"
                     style={{ width: "100%", height: "auto" }}
                  />
               </div>
               <StatusBadge
                  status={data.status}
                  label={
                     data.status === "registered"
                        ? "Registration confirmed"
                        : undefined
                  }
               />
               <p
                  className="text-muted"
                  style={{ fontSize: "var(--fs-xs)", marginTop: "var(--sp-3)" }}
               >
                  Registration ID: {data.registrationId}
               </p>
               <p className="text-muted" style={{ fontSize: "var(--fs-xs)" }}>
                  Show this pass at the event check-in desk.
               </p>
            </div>
         ) : null}
      </Modal>
   );
}
