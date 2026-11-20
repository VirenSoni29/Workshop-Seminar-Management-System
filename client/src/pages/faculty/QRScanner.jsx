import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, Camera, Square } from "lucide-react";
import { getMyWorkshopsApi } from "../../api/workshops.api";
import { getWorkshopAttendeesApi } from "../../api/registrations.api";
import { checkinApi, manualCheckinApi } from "../../api/checkin.api";
import useFetch from "../../hooks/useFetch";
import { notify } from "../../utils/notify";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { getInitials } from "../../utils/getInitials";
import { formatDate, formatTime } from "../../utils/formatDate";

const READER_ID = "qr-reader";
const REPEAT_MS = 4000;

export default function QRScanner() {
   const [params] = useSearchParams();
   const [selected, setSelected] = useState(params.get("workshop") || "");
   const [scanning, setScanning] = useState(false);
   const [result, setResult] = useState(null); // { type: 'success' | 'error', text }
   const [manual, setManual] = useState("");

   const scannerRef = useRef(null);
   const busyRef = useRef(false);
   const lastRef = useRef({ code: "", at: 0 });

   // Only approved workshops can be scanned
   const { data: myWorkshops } = useFetch(
      () => getMyWorkshopsApi({ limit: 100 }),
      [],
   );
   const approved = useMemo(() => {
      const list = Array.isArray(myWorkshops)
         ? myWorkshops
         : (myWorkshops?.workshops ?? []);
      return list.filter((w) => w.status === "approved");
   }, [myWorkshops]);

   const workshopId = selected || approved[0]?._id || approved[0]?.id || "";

   const { data: attendeeData, refetch } = useFetch(
      () => getWorkshopAttendeesApi(workshopId, { limit: 1000 }),
      [workshopId],
      { immediate: Boolean(workshopId) },
   );
   const refetchRef = useRef(refetch);
   refetchRef.current = refetch;

   const registrations = useMemo(
      () =>
         (Array.isArray(attendeeData) ? attendeeData : []).filter(
            (r) => r.status !== "cancelled",
         ),
      [attendeeData],
   );
   const checkedIn = registrations.filter((r) => r.status === "attended");
   const pct = registrations.length
      ? Math.round((checkedIn.length / registrations.length) * 100)
      : 0;
   const recent = [...checkedIn]
      .filter((r) => r.checkedInAt)
      .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt))
      .slice(0, 5);

   const runCheckin = useCallback(async (call) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
         const res = await call();
         const text = res?.data?.message || "Check-in recorded.";
         setResult({ type: "success", text });
         notify.success(text);
         refetchRef.current?.();
      } catch (err) {
         const text = getErrorMessage(err);
         setResult({ type: "error", text });
         notify.error(text);
      } finally {
         busyRef.current = false;
      }
   }, []);

   const onDecode = useCallback(
      (text) => {
         const now = Date.now();
         if (
            lastRef.current.code === text &&
            now - lastRef.current.at < REPEAT_MS
         )
            return;
         lastRef.current = { code: text, at: now };
         runCheckin(() => checkinApi(text));
      },
      [runCheckin],
   );

   const stopScan = useCallback(async () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      setScanning(false);
      if (!s) return;
      try {
         await s.stop();
         s.clear();
      } catch {
         /* already stopped */
      }
   }, []);

   const [starting, setStarting] = useState(false);

   const startScan = async () => {
      if (scanning || starting) return;
      setStarting(true);
      setResult(null);
      try {
         const scanner = new Html5Qrcode(READER_ID);
         scannerRef.current = scanner;
         await scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            onDecode,
            () => {},
         );
         setScanning(true);
      } catch (err) {
         scannerRef.current = null;
         setResult({
            type: "error",
            text: "Could not start the camera. Allow camera access, or use manual check-in below.",
         });
      } finally {
         setStarting(false);
      }
   };

   // Stop the camera on unmount (also covers StrictMode's double mount)
   useEffect(
      () => () => {
         const s = scannerRef.current;
         scannerRef.current = null;
         if (!s) return;
         try {
            s.stop()
               .then(() => s.clear())
               .catch(() => {});
         } catch {
            /* not running */
         }
      },
      [],
   );

   const handleManual = () => {
      const code = manual.trim();
      if (!code) {
         setResult({
            type: "error",
            text: "Enter a registration ID to continue.",
         });
         return;
      }
      runCheckin(() => manualCheckinApi(code)).then(() => setManual(""));
   };

   return (
      <>
         <section className="page-heading row-between">
            <div>
               <span className="eyebrow">FACULTY WORKSPACE</span>
               <h1>QR attendance scanner</h1>
               <p>
                  Scan a student's registration QR code to mark them present.
               </p>
            </div>
            <Link className="btn btn-secondary" to="/faculty/workshops">
               <ArrowLeft size={16} />
               Back to workshops
            </Link>
         </section>

         <div className="scanner-layout">
            <section className="card scanner-card">
               <div className="event-select">
                  <label htmlFor="event-select">Select workshop</label>
                  <select
                     className="input"
                     id="event-select"
                     value={workshopId}
                     onChange={(e) => {
                        setSelected(e.target.value);
                        setResult(null);
                     }}
                  >
                     {approved.length === 0 && (
                        <option value="">No approved workshops</option>
                     )}
                     {approved.map((w) => (
                        <option key={w._id || w.id} value={w._id || w.id}>
                           {w.title}
                           {w.startDate ? ` · ${formatDate(w.startDate)}` : ""}
                        </option>
                     ))}
                  </select>
               </div>

               <div className="scanner-stage" id="scanner-stage">
                  <div
                     className="scanner-placeholder"
                     id="scanner-placeholder"
                     style={{ display: scanning ? "none" : undefined }}
                  >
                     <div className="camera-icon">
                        <Camera style={{ width: "1.6rem", height: "1.6rem" }} />
                     </div>
                     <h2>Camera is not active</h2>
                     <p>
                        Start the scanner and allow camera access to scan
                        student registration QR codes.
                     </p>
                     <div className="scan-frame">
                        <span className="scan-corner tl"></span>
                        <span className="scan-corner tr"></span>
                        <span className="scan-corner bl"></span>
                        <span className="scan-corner br"></span>
                     </div>
                  </div>
                  <div id={READER_ID} style={{ width: "100%" }} />
               </div>

               {/*<div className="scanner-stage" id="scanner-stage">
                  {!scanning && (
                     <div
                        className="scanner-placeholder"
                        id="scanner-placeholder"
                     >
                        
                     </div>
                  )}
                  <div id={READER_ID} />
               </div>*/}

               <div className="scanner-actions">
                  <button
                     className="btn btn-primary"
                     type="button"
                     onClick={startScan}
                     disabled={scanning || starting}
                  >
                     <Camera size={16} />
                     Start camera
                  </button>
                  <button
                     className="btn btn-secondary"
                     type="button"
                     onClick={stopScan}
                     disabled={!scanning}
                  >
                     <Square size={16} />
                     Stop scanning
                  </button>
               </div>
               <p className="scanner-note">
                  Only scan QR codes presented by registered students. Faculty
                  cannot view or download individual attendee QR codes.
               </p>

               <div
                  className={clsx(
                     "scan-result",
                     result && "is-visible",
                     result?.type === "error" && "is-error",
                  )}
                  role="status"
                  aria-live="polite"
               >
                  {result?.text}
               </div>

               <div className="manual-entry">
                  <label htmlFor="manual-code">
                     Manual check-in (registration ID)
                  </label>
                  <div className="manual-row">
                     <input
                        className="input"
                        id="manual-code"
                        type="text"
                        placeholder="e.g. REG-2026-0042"
                        value={manual}
                        onChange={(e) => setManual(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleManual()}
                     />
                     <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={handleManual}
                     >
                        Verify &amp; check in
                     </button>
                  </div>
                  <p className="scanner-note">
                     Use this if a student's QR code cannot be scanned. Enter
                     their registration ID; do not ask for or download their QR
                     image.
                  </p>
               </div>
            </section>

            <aside className="card side-card">
               <h2>Attendance overview</h2>
               <div className="checkin-summary">
                  <div className="summary-box">
                     <span>Registered</span>
                     <strong>{registrations.length}</strong>
                  </div>
                  <div className="summary-box">
                     <span>Checked in</span>
                     <strong>{checkedIn.length}</strong>
                  </div>
               </div>
               <div
                  className="row-between"
                  style={{ marginBottom: "var(--sp-2)" }}
               >
                  <span className="text-sm text-muted">
                     Attendance progress
                  </span>
                  <strong className="text-sm">{pct}%</strong>
               </div>
               <div
                  className="progress"
                  style={{ marginBottom: "var(--sp-5)" }}
               >
                  <span style={{ width: `${pct}%` }} />
               </div>

               <h2>Recent check-ins</h2>
               <ul className="recent-list">
                  {recent.length === 0 && (
                     <li>
                        <span className="text-muted">No check-ins yet.</span>
                     </li>
                  )}
                  {recent.map((r) => (
                     <li key={r._id}>
                        <div className="recent-person">
                           <span className="person__avatar">
                              {getInitials(r.user?.name)}
                           </span>
                           <div>
                              <strong>{r.user?.name}</strong>
                              <small>{r.user?.identifier}</small>
                           </div>
                        </div>
                        <span className="recent-time">
                           {formatTime(r.checkedInAt)}
                        </span>
                     </li>
                  ))}
               </ul>
            </aside>
         </div>
      </>
   );
}
