// ============================================================================
// printReceiptHelper: Isolated Iframe Thermal Receipt & Sticker Printing Engine
// Renders thermal receipts directly in an isolated 0-margin iframe document
// 100% Reliable for POS-80 (72mm) Thermal Printers & 50x30mm Cup Stickers
// Eliminates Chrome blank-page bugs caused by modals, backdrops & CSS animations
// ============================================================================

export function printReceiptElement(element: HTMLElement | null) {
  if (!element) {
    console.warn("[printReceiptHelper] element is null, fallback to window.print()");
    window.print();
    return;
  }
  printThermalHtml(element.outerHTML);
}

export function printThermalHtml(receiptHtml: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const frameId = "pos-thermal-print-iframe";
  const existingFrame = document.getElementById(frameId);
  if (existingFrame) {
    existingFrame.remove();
  }

  // 1. Create sandbox iframe with concrete 72mm width offscreen (NOT 0x0 or visibility:hidden to avoid Chrome blank preview)
  const iframe = document.createElement("iframe");
  iframe.id = frameId;
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "72mm";
  iframe.style.height = "1000px";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.warn("[printReceiptHelper] iframe document inaccessible, fallback to window.print()");
    window.print();
    return;
  }

  // 2. Clone active stylesheets & link tags from the main document for pixel-perfect font & CSS matching
  const headStyles = Array.from(
    document.querySelectorAll("style, link[rel='stylesheet']")
  )
    .map((el) => el.outerHTML)
    .join("\n");

  // 3. Construct dedicated 80mm / 72mm thermal print document
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="lo">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Receipt Print</title>
        ${headStyles}
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 72mm !important;
            max-width: 72mm !important;
            min-width: 72mm !important;
            color: #000000 !important;
            font-family: 'Noto Sans Lao', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
            overflow: visible !important;
          }
          body * {
            visibility: visible !important;
          }
          /* Receipt 80mm Layout Override for POS-80 Printers */
          .receipt-80mm {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 72mm !important;
            max-width: 72mm !important;
            min-width: 72mm !important;
            margin: 0 auto !important;
            padding: 3mm 2.5mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .receipt-80mm * {
            visibility: visible !important;
            color: #000000 !important;
          }
          .receipt-80mm .border-dashed {
            border-style: dashed !important;
            border-color: #555555 !important;
          }
          /* Cup Sticker Sheet 50x30mm Layout Override */
          .cup-sticker-sheet {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 50mm !important;
            margin: 0 auto !important;
            background: #ffffff !important;
          }
          .cup-sticker-sheet * {
            visibility: visible !important;
          }
          .cup-sticker-item {
            width: 50mm !important;
            height: 30mm !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        </style>
      </head>
      <body>
        ${receiptHtml}
      </body>
    </html>
  `);
  doc.close();

  // 4. Trigger print after fonts & styles compute
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("[printReceiptHelper] iframe print error:", err);
      window.print();
    }
  }, 200);
}
