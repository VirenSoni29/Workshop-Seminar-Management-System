import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import {verifyCertificateApi} from "../../api/certificates.api";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import {notify} from "../../utils/notify";
import { formatLongDate } from "../../utils/formatDate";

const ID_PATTERN = /^[A-Za-z0-9-]{6,32}$/;

export default function VerifyCertificate() {
   const { certificateId } = useParams();
   const navigate = useNavigate();
   const [input, setInput] = useState("");

   const {
      data: cert,
      loading,
      error,
   } = useFetch(() => verifyCertificateApi(certificateId), [certificateId]);

   const handleSubmit = (e) => {
      e.preventDefault();
      const id = input.trim();
      if (!ID_PATTERN.test(id)) {
         notify.error("Enter a valid certificate ID, e.g. CERT-A1B2C3D4E5");
         return;
      }
      navigate(`/verify/${id.toUpperCase()}`);
      setInput("");
   };

   // Field names below are assumptions: adjust to your API response
   const name = cert?.studentName || cert?.student?.name || cert?.user?.name;
   const title = cert?.workshopTitle || cert?.workshop?.title;
   const issuedAt = cert?.issuedAt || cert?.createdAt;
   const organizer =
      cert?.organizer ||
      cert?.workshop?.department ||
      cert?.workshop?.organizer;
   const id = (cert?.certificateId || certificateId || "").toUpperCase();

   const showError = !loading && Boolean(error);
   const showResult = !loading && !error && Boolean(cert);

   return (
      <div className="wrap verify-page">
         <div className="verify-intro">
            <span className="eyebrow">PUBLIC CERTIFICATE CHECK</span>
            <h1>Certificate verification</h1>
            <p>Confirm that a Workshop Hub certificate was genuinely issued.</p>
         </div>

         {loading && <Loader text="Verifying certificate..." />}

         {showError && (
            <section
               className="card verify-result"
               aria-label="Certificate verification result"
            >
               <EmptyState message={error || "Certificate not found"} />
            </section>
         )}

         {showResult && (
            <section
               className="card verify-result"
               aria-label="Certificate verification result"
            >
               <div className="verify-result__head">
                  <span className="verify-result__mark">
                     <BadgeCheck size={20} />
                  </span>
                  <div>
                     <h2>Certificate is authentic</h2>
                     <p>This certificate was issued by Workshop Hub.</p>
                  </div>
                  <span
                     className="badge badge--success"
                     style={{ marginLeft: "auto" }}
                  >
                     Verified
                  </span>
               </div>
               <div className="verify-result__body">
                  <span className="eyebrow">AWARDED TO</span>
                  <h3 className="verify-result__name">{name}</h3>
                  <p className="verify-result__course">
                     For successfully completing <strong>{title}</strong>
                  </p>
                  <dl className="verify-result__facts">
                     <div>
                        <dt>Workshop / Seminar</dt>
                        <dd>{title}</dd>
                     </div>
                     <div>
                        <dt>Issued on</dt>
                        <dd>{formatLongDate(issuedAt, true)}</dd>
                     </div>
                     <div>
                        <dt>Organized by</dt>
                        <dd>{organizer || "-"}</dd>
                     </div>
                     <div>
                        <dt>Issued by</dt>
                        <dd>Workshop Hub</dd>
                     </div>
                  </dl>
                  <div className="verify-result__id">
                     <span className="text-muted">Certificate ID</span>
                     <strong className="mono" id="certificate-id">
                        {id}
                     </strong>
                  </div>
               </div>
            </section>
         )}

         <section className="card verify-again">
            <div className="card-body">
               <h2>Verify another certificate</h2>
               <p
                  className="text-secondary"
                  style={{ fontSize: "var(--fs-sm)" }}
               >
                  Enter the certificate ID printed on the certificate.
               </p>
               <form onSubmit={handleSubmit}>
                  <input
                     className="input mono"
                     name="id"
                     placeholder="CERT-XXXXXXXXXX"
                     aria-label="Certificate ID"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     required
                  />
                  <button className="btn btn-primary" type="submit">
                     Verify ID
                  </button>
               </form>
            </div>
         </section>

         <p
            className="text-muted"
            style={{
               textAlign: "center",
               fontSize: "var(--fs-xs)",
               marginTop: "var(--sp-5)",
            }}
         >
            This is a public verification page. No account is required.
         </p>
      </div>
   );
}
