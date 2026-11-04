import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import config from '../config/config.js';

// ---- One shared browser, reused for every PDF (launching per PDF is slow) ----
let browserPromise = null;

const getBrowser = () => {
   if (!browserPromise) {
      browserPromise = puppeteer
         .launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
         })
         .then((browser) => {
            // If Chromium crashes or closes, launch a fresh one next time
            browser.on('disconnected', () => {
               browserPromise = null;
            });
            return browser;
         })
         .catch((err) => {
            browserPromise = null;
            throw err;
         });
   }
   return browserPromise;
};

// ---- Helpers ----
// Names and titles are user input, so escape them before they go into HTML
const escapeHtml = (value = '') =>
   String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

// Always format in IST so the printed date doesn't depend on the server's timezone
const formatDate = (date) =>
   new Date(date).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
   });

const buildDateText = (start, end) => {
   const s = formatDate(start);
   const e = formatDate(end);
   return s === e ? `on ${s}` : `from ${s} to ${e}`;
};

const buildHtml = ({ name, title, type, dateText, certificateId, issuedOn, qrDataUrl }) => `
   <!DOCTYPE html>
   <html lang="en">
   <head>
   <meta charset="utf-8" />
   <title>Certificate</title>
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

   <style>
      @page { size: A4 landscape; margin: 0; }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      html, body {
         width: 297mm;
         height: 210mm;
         margin: 0;
         overflow: hidden;
         background: #ffffff;
         font-family: 'Plus Jakarta Sans', Arial, sans-serif;
         color: #1e293b;
         -webkit-font-smoothing: antialiased;
         -webkit-print-color-adjust: exact;
         print-color-adjust: exact;
      }

      :root {
         --navy: #0f2142;
         --gold: #b8892b;
         --gold-dark: #7a5a14;
         --ink: #1e293b;
         --muted: #64748b;
         --paper: #fdfbf6;
      }

      .page {
         position: relative;
         width: 297mm;
         height: 210mm;
         padding: 9mm;
         background: radial-gradient(circle at 50% 45%, #ffffff 40%, #f7f3e8 100%);
         overflow: hidden;
      }

      .frame {
         position: relative;
         width: 100%;
         height: 100%;
         border: 2pt solid var(--navy);
         padding: 2.5mm;
      }

      .frame-inner {
         position: relative;
         width: 100%;
         height: 100%;
         border: 0.75pt solid var(--gold);
         padding: 9mm 16mm 7mm;
         display: grid;
         grid-template-rows: auto 1fr auto auto;
         justify-items: center;
         text-align: center;
      }

      .corner {
         position: absolute;
         width: 12mm;
         height: 12mm;
         border: 2.5pt solid var(--gold);
      }
      .corner.tl { top: -1.5pt; left: -1.5pt;  border-right: 0; border-bottom: 0; }
      .corner.tr { top: -1.5pt; right: -1.5pt; border-left: 0;  border-bottom: 0; }
      .corner.bl { bottom: -1.5pt; left: -1.5pt;  border-right: 0; border-top: 0; }
      .corner.br { bottom: -1.5pt; right: -1.5pt; border-left: 0;  border-top: 0; }

      /* Header */
      .header { display: flex; flex-direction: column; align-items: center; }

      .issuer {
         display: flex;
         align-items: center;
         gap: 4mm;
         font-size: 9pt;
         font-weight: 600;
         letter-spacing: 3px;
         text-transform: uppercase;
         color: var(--gold-dark);
      }
      .issuer::before, .issuer::after {
         content: "";
         width: 18mm;
         height: 0.75pt;
         background: var(--gold);
      }

      h1 {
         font-family: 'Cinzel', 'Times New Roman', serif;
         font-size: 40pt;
         font-weight: 700;
         letter-spacing: 8px;
         line-height: 1.1;
         color: var(--navy);
         margin-top: 3mm;
         padding-left: 8px;
      }

      .subtitle {
         margin-top: 1.5mm;
         font-family: 'Playfair Display', Georgia, serif;
         font-style: italic;
         font-size: 13pt;
         color: var(--gold-dark);
      }

      /* Body */
      .body {
         align-self: center;
         width: 100%;
         display: flex;
         flex-direction: column;
         align-items: center;
      }

      .presented {
         font-family: 'Playfair Display', Georgia, serif;
         font-style: italic;
         font-size: 12.5pt;
         color: var(--muted);
         margin-bottom: 3mm;
      }

      .recipient {
         font-family: 'Playfair Display', Georgia, serif;
         font-size: 34pt;
         font-weight: 700;
         line-height: 1.2;
         color: var(--navy);
         min-width: 130mm;
         max-width: 235mm;
         padding: 0 10mm 2mm;
         border-bottom: 1.25pt solid var(--gold);
         overflow-wrap: anywhere;
      }

      .description {
         margin-top: 6mm;
         max-width: 205mm;
         font-size: 12pt;
         line-height: 1.75;
         color: #334155;
      }
      .description .type  { font-weight: 600; color: var(--navy); }
      .description .title {
         font-family: 'Playfair Display', Georgia, serif;
         font-weight: 700;
         font-size: 14pt;
         color: var(--navy);
         overflow-wrap: anywhere;
      }
      .description .dates { font-weight: 600; color: var(--ink); }

      /* Signatures */
      .signatures {
         width: 100%;
         display: flex;
         justify-content: space-between;
         padding: 0 12mm;
         margin-bottom: 4mm;
      }
      .sign { width: 55mm; }
      .sign-line { border-top: 0.75pt solid var(--navy); margin-bottom: 1.5mm; }
      .sign-label { font-size: 8.5pt; font-weight: 600; color: var(--navy); }

      /* Footer */
      .footer {
         width: 100%;
         display: grid;
         grid-template-columns: 1fr auto 1fr;
         align-items: end;
         padding-top: 3mm;
         border-top: 0.5pt solid #e5dfcc;
      }

      .meta {
         text-align: left;
         font-size: 8.5pt;
         line-height: 1.7;
         color: var(--muted);
      }
      .meta-row {
         display: flex;
         align-items: center;
         gap: 1.8mm;
      }
      .meta-icon {
         width: 3.5mm;
         height: 3.5mm;
         stroke: var(--gold-dark);
         stroke-width: 1.75;
         fill: none;
         flex-shrink: 0;
      }
      .meta strong {
         color: var(--navy);
         font-family: 'Courier New', monospace;
         letter-spacing: 0.5px;
      }

      .seal { width: 22mm; height: 22mm; display: block; }

      .verify {
         display: flex;
         align-items: center;
         justify-content: flex-end;
         gap: 3.5mm;
      }
      .verify-text {
         text-align: right;
         font-size: 8pt;
         line-height: 1.4;
         color: var(--muted);
      }
      .verify-header {
         display: flex;
         align-items: center;
         justify-content: flex-end;
         gap: 1.5mm;
         font-size: 9pt;
         font-weight: 700;
         color: var(--navy);
      }
      .shield-icon {
         width: 3.5mm;
         height: 3.5mm;
         stroke: var(--navy);
         stroke-width: 2;
         fill: none;
      }
      .qr {
         background: #ffffff;
         padding: 1.2mm;
         border: 0.75pt solid #d9d2bd;
      }
      .qr img { width: 20mm; height: 20mm; display: block; }
   </style>
   </head>
   <body>
   <div class="page">
      <div class="frame">
         <div class="frame-inner">
         <div class="corner tl"></div>
         <div class="corner tr"></div>
         <div class="corner bl"></div>
         <div class="corner br"></div>

         <!-- Header -->
         <div class="header">
            <div class="issuer">Department of Academic Affairs</div>
            <h1>CERTIFICATE</h1>
            <div class="subtitle">of Participation &amp; Achievement</div>
         </div>

         <!-- Body -->
         <div class="body">
            <div class="presented">This certificate is proudly presented to</div>
            <div class="recipient">${escapeHtml(name)}</div>
            <p class="description">
               for successfully completing all requirements of the
               <span class="type">${escapeHtml(type)}</span> on
               <span class="title">&ldquo;${escapeHtml(title)}&rdquo;</span>,
               conducted <span class="dates">${escapeHtml(dateText)}</span>.
            </p>
         </div>

         <!-- Signatures -->
         <div class="signatures">
            <div class="sign">
               <div class="sign-line"></div>
               <div class="sign-label">Programme Coordinator</div>
            </div>
            <div class="sign">
               <div class="sign-line"></div>
               <div class="sign-label">Head of Department</div>
            </div>
         </div>

         <!-- Footer -->
         <div class="footer">
            <!-- Meta with micro icons -->
            <div class="meta">
               <div class="meta-row">
               <svg class="meta-icon" viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <line x1="7" y1="15" x2="7.01" y2="15" stroke-linecap="round" />
                  <line x1="11" y1="15" x2="17" y2="15" stroke-linecap="round" />
               </svg>
               <span>ID: <strong>${escapeHtml(certificateId)}</strong></span>
               </div>
               <div class="meta-row">
               <svg class="meta-icon" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" stroke-linecap="round" />
                  <line x1="8" y1="2" x2="8" y2="6" stroke-linecap="round" />
                  <line x1="3" y1="10" x2="21" y2="10" />
               </svg>
               <span>Issued: <strong>${escapeHtml(issuedOn)}</strong></span>
               </div>
            </div>

            <!-- Central Seal -->
            <svg class="seal" viewBox="0 0 100 100" aria-hidden="true">
               <circle cx="50" cy="50" r="46" fill="none" stroke="#b8892b" stroke-width="2.5" stroke-dasharray="3 2"/>
               <circle cx="50" cy="50" r="41" fill="#fdfbf6" stroke="#b8892b" stroke-width="1"/>
               <path d="M50 18 L54 31 L67.5 31 L56.5 39 L60.5 52 L50 44 L39.5 52 L43.5 39 L32.5 31 L46 31 Z" fill="#b8892b"/>
               <text x="50" y="66" text-anchor="middle" font-family="Cinzel, serif" font-size="8" font-weight="700" fill="#7a5a14" letter-spacing="1.5">OFFICIAL</text>
               <text x="50" y="75" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="5.5" font-weight="600" fill="#64748b" letter-spacing="0.8">ACCREDITED</text>
            </svg>

            <!-- Verification with Shield Icon -->
            <div class="verify">
               <div class="verify-text">
               <div class="verify-header">
                  <span>Verified</span>
                  <svg class="shield-icon" viewBox="0 0 24 24">
                     <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke-linecap="round" stroke-linejoin="round"/>
                     <polyline points="9 12 11 14 15 10" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
               </div>
               Scan to authenticate
               </div>
               <div class="qr"><img src="${qrDataUrl}" alt="Verification QR code" /></div>
            </div>
         </div>
         </div>
      </div>
   </div>
   </body>
   </html>`;

// ---- Public function ----
// certificate must have `user` and `workshop` populated
export const generateCertificatePDF = async (certificate) => {
   const { user, workshop } = certificate;

   const verifyUrl = `${config.clientUrl}/verify/${certificate.certificateId}`;
   const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1 });

   const html = buildHtml({
      name: user.name,
      title: workshop.title,
      type: workshop.type || 'Workshop',
      dateText: buildDateText(workshop.startDate, workshop.endDate),
      certificateId: certificate.certificateId,
      issuedOn: formatDate(certificate.issuedAt),
      qrDataUrl,
   });

   const browser = await getBrowser();
   const page = await browser.newPage();

   try {
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
         format: 'A4',
         landscape: true,
         printBackground: true, // without this, colours and backgrounds vanish
         preferCSSPageSize: true,
      });
      return Buffer.from(pdf);
   } finally {
      await page.close();
   }
};