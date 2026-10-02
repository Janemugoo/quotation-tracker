import { PDFDocument, StandardFonts, rgb, degrees, PDFFont, PDFPage } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
import type { QuotationWithMeta } from "@/lib/types";

const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Brand palette, pulled from the Panorama Park Hotel logo.
const BROWN = rgb(0.35, 0.17, 0.14);
const BROWN_SOFT = rgb(0.5, 0.3, 0.26);
const GREEN = rgb(0.0, 0.55, 0.2);
const GREEN_SOFT = rgb(0.15, 0.45, 0.25);
const LIGHT_GREEN_BG = rgb(0.92, 0.97, 0.93);
const LIGHT_BROWN_BG = rgb(0.97, 0.94, 0.91);
const LIGHT_BROWN_BORDER = rgb(0.82, 0.72, 0.66);
const LIGHT_GREEN_BORDER = rgb(0.72, 0.86, 0.76);
const CREAM = rgb(0.985, 0.975, 0.96);
const WHITE = rgb(1, 1, 1);
const BLACK = rgb(0.14, 0.12, 0.11);
const GRAY = rgb(0.45, 0.45, 0.45);
const LINE_GRAY = rgb(0.75, 0.75, 0.75);

function ordinal(n: number): string {
  const s = ["TH", "ST", "ND", "RD"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatLetterDate(d: Date): string {
  const day = ordinal(d.getDate());
  const month = d
    .toLocaleDateString("en-GB", { month: "long" })
    .toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// Short form used inside the round stamp, where space is tight —
// "30 SEP 2026" rather than "30TH SEPTEMBER 2026".
function formatStampDate(d: Date): string {
  const day = d.getDate();
  const month = d
    .toLocaleDateString("en-GB", { month: "short" })
    .toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatMoney(value: number | null): string {
  if (value === null || value === undefined) return "TBC";
  return `KSH.${value.toLocaleString("en-KE")}/=`;
}

// The single-rate-line RATE/NO. OF PAX fields are plain numbers going
// forward (the form computes the business value from them), but older
// quotations may still hold free text like "3,800 per pax" — format nicely
// when it's a clean number, otherwise fall back to showing it as typed.
function formatRateCell(raw: string | null): string {
  if (!raw) return "—";
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && String(n) === raw.trim() ? formatMoney(n) : raw;
}

function formatPaxCell(raw: string | null): string {
  if (!raw) return "—";
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && String(n) === raw.trim() ? `${n} PAX` : raw;
}

// Wrap text to fit within maxWidth, returning an array of lines.
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
  logoImage: Awaited<ReturnType<PDFDocument["embedPng"]>>;
}

// A thin brand "ribbon" — green hairline over a brown band — drawn along
// the top and bottom edge of every page.
function drawPageBands(page: PDFPage) {
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 9,
    width: PAGE_WIDTH,
    height: 6,
    color: BROWN,
  });
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 3,
    width: PAGE_WIDTH,
    height: 3,
    color: GREEN,
  });
  page.drawRectangle({ x: 0, y: 3, width: PAGE_WIDTH, height: 6, color: BROWN });
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: 3, color: GREEN });
}

// The logo + contact-details block that runs across the top of every page —
// factored out so it can be redrawn on page 2, 3, etc. by newPage() below,
// instead of only appearing once on page 1 and then disappearing for the
// rest of the letter.
function drawLetterheadBlock(ctx: Ctx) {
  const logoWidth = 100;
  const logoHeight = (ctx.logoImage.height / ctx.logoImage.width) * logoWidth;
  ctx.page.drawImage(ctx.logoImage, {
    x: MARGIN,
    y: ctx.y - logoHeight,
    width: logoWidth,
    height: logoHeight,
  });

  const contactLines = [
    { text: "P: 254 712091777" },
    { text: "E: info@panoramaparkhotel.co.ke" },
    { text: "   panoramalodge07@gmail.com" },
    { text: "W: www.panoramaparkhotel.co.ke" },
  ];
  const contactSize = 10.5;
  const contactColor = rgb(0.15, 0.15, 0.15);
  let contactY = ctx.y - 2;
  for (const line of contactLines) {
    const w = ctx.boldItalic.widthOfTextAtSize(line.text, contactSize);
    ctx.page.drawText(line.text, {
      x: PAGE_WIDTH - MARGIN - w,
      y: contactY - contactSize,
      size: contactSize,
      font: ctx.boldItalic,
      color: contactColor,
    });
    contactY -= contactSize + 3;
  }

  ctx.y -= Math.max(logoHeight, contactLines.length * (contactSize + 3)) + 4;

  // A soft brand rule under the letterhead
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_WIDTH - MARGIN, y: ctx.y },
    thickness: 1.5,
    color: LIGHT_BROWN_BORDER,
  });
  ctx.y -= 6;
}

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageBands(ctx.page);
  ctx.y = PAGE_HEIGHT - MARGIN;
  drawLetterheadBlock(ctx);
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y - needed < MARGIN) {
    newPage(ctx);
  }
}

function drawParagraph(
  ctx: Ctx,
  text: string,
  opts: {
    size?: number;
    font?: PDFFont;
    color?: ReturnType<typeof rgb>;
    lineHeight?: number;
    gapAfter?: number;
    maxWidth?: number;
  } = {}
) {
  const size = opts.size ?? 10.5;
  const font = opts.font ?? ctx.regular;
  const color = opts.color ?? BLACK;
  const lineHeight = opts.lineHeight ?? size * 1.4;
  const maxWidth = opts.maxWidth ?? CONTENT_WIDTH;

  const lines = wrapText(text, font, size, maxWidth);
  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    ctx.page.drawText(line, {
      x: MARGIN,
      y: ctx.y - size,
      size,
      font,
      color,
    });
    ctx.y -= lineHeight;
  }
  ctx.y -= opts.gapAfter ?? 0;
}

// A heading with a small colored tab to its left and a colored underline —
// the letter's recurring "section title" treatment.
function drawSectionHeading(
  ctx: Ctx,
  text: string,
  opts: {
    size?: number;
    gapAfter?: number;
    textColor?: ReturnType<typeof rgb>;
    ruleColor?: ReturnType<typeof rgb>;
  } = {}
) {
  const size = opts.size ?? 12;
  const textColor = opts.textColor ?? BROWN;
  const ruleColor = opts.ruleColor ?? GREEN;
  ensureSpace(ctx, size + 12);

  const tabWidth = 4;
  const tabHeight = size + 2;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - size - 1,
    width: tabWidth,
    height: tabHeight,
    color: ruleColor,
  });

  const textX = MARGIN + tabWidth + 7;
  ctx.page.drawText(text, {
    x: textX,
    y: ctx.y - size,
    size,
    font: ctx.bold,
    color: textColor,
  });
  const textWidth = ctx.bold.widthOfTextAtSize(text, size);
  ctx.page.drawLine({
    start: { x: textX, y: ctx.y - size - 3 },
    end: { x: textX + textWidth, y: ctx.y - size - 3 },
    thickness: 1.25,
    color: ruleColor,
  });
  ctx.y -= size + 6 + (opts.gapAfter ?? 0);
}

function drawBulletList(
  ctx: Ctx,
  items: string[],
  opts: {
    size?: number;
    indent?: number;
    gapAfter?: number;
    bulletColor?: ReturnType<typeof rgb>;
  } = {}
) {
  const size = opts.size ?? 9.5;
  const indent = opts.indent ?? 14;
  const lineHeight = size * 1.15;
  const bulletColor = opts.bulletColor ?? BROWN_SOFT;
  for (const item of items) {
    const lines = wrapText(item, ctx.regular, size, CONTENT_WIDTH - indent);
    lines.forEach((line, i) => {
      ensureSpace(ctx, lineHeight);
      if (i === 0) {
        ctx.page.drawText("•", {
          x: MARGIN,
          y: ctx.y - size,
          size,
          font: ctx.bold,
          color: bulletColor,
        });
      }
      ctx.page.drawText(line, {
        x: MARGIN + indent,
        y: ctx.y - size,
        size,
        font: ctx.regular,
        color: BLACK,
      });
      ctx.y -= lineHeight;
    });
  }
  ctx.y -= opts.gapAfter ?? 0;
}

// Draws `text` curving around a circle, one character at a time — the
// building block for the round "official stamp" seal. `orientation`
// controls which way each character faces: "outward" keeps the tops of the
// letters pointing away from the circle's center (used for the upper arc,
// so it reads normally), "inward" points them toward the center (used for
// the lower arc, so it isn't upside down).
function drawArcText(
  page: PDFPage,
  text: string,
  opts: {
    cx: number;
    cy: number;
    radius: number;
    font: PDFFont;
    size: number;
    color: ReturnType<typeof rgb>;
    centerAngleDeg: number;
    angleStepDeg: number;
    orientation: "outward" | "inward";
  }
) {
  const { cx, cy, radius, font, size, color, centerAngleDeg, angleStepDeg, orientation } = opts;
  const chars = [...text];
  const n = chars.length;
  if (n === 0) return;
  const startAngle = centerAngleDeg - (angleStepDeg * (n - 1)) / 2;
  for (let i = 0; i < n; i++) {
    const ch = chars[i];
    if (ch === " ") continue;
    const angle = startAngle + angleStepDeg * i;
    const rad = (angle * Math.PI) / 180;
    const x = cx + radius * Math.cos(rad);
    const y = cy + radius * Math.sin(rad);
    const rotateDeg = orientation === "outward" ? angle - 90 : angle + 90;
    const rRad = (rotateDeg * Math.PI) / 180;
    const w = font.widthOfTextAtSize(ch, size);
    // pdf-lib rotates text around its own (x, y) origin, so shift that
    // origin back by half the (rotated) character box to keep it centered
    // on the circle at this angle.
    const offX = (w / 2) * Math.cos(rRad) - (size * 0.35) * Math.sin(rRad);
    const offY = (w / 2) * Math.sin(rRad) + (size * 0.35) * Math.cos(rRad);
    page.drawText(ch, {
      x: x - offX,
      y: y - offY,
      size,
      font,
      color,
      rotate: degrees(rotateDeg),
      opacity: 0.9,
    });
  }
}

function rotateAround(px: number, py: number, ox: number, oy: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  const dx = px - ox;
  const dy = py - oy;
  return {
    x: ox + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: oy + dx * Math.sin(rad) + dy * Math.cos(rad),
  };
}

// The round hotel "seal" stamped near the signature — a purely decorative,
// always-the-same graphic (no per-quotation data other than the date), drawn
// as vector shapes/text rather than an image so it stays crisp at any zoom.
function drawOfficialStamp(
  ctx: Ctx,
  opts: { cx: number; cy: number; dateText: string }
) {
  const { cx, cy, dateText } = opts;
  const outerR = 56;
  const innerR = 46;
  const tilt = -8; // slight rotation for an authentic hand-stamped look

  ctx.page.drawEllipse({
    x: cx,
    y: cy,
    xScale: outerR,
    yScale: outerR,
    borderColor: BROWN,
    borderWidth: 2,
    opacity: 0.9,
    borderOpacity: 0.9,
  });
  ctx.page.drawEllipse({
    x: cx,
    y: cy,
    xScale: innerR,
    yScale: innerR,
    borderColor: GREEN,
    borderWidth: 0.75,
    opacity: 0.9,
    borderOpacity: 0.9,
  });

  drawArcText(ctx.page, "PANORAMA PARK HOTEL", {
    cx,
    cy,
    radius: (outerR + innerR) / 2,
    font: ctx.bold,
    size: 7,
    color: BROWN,
    centerAngleDeg: 90 + tilt,
    angleStepDeg: -9,
    orientation: "outward",
  });
  drawArcText(ctx.page, "NAIVASHA • KENYA", {
    cx,
    cy,
    radius: (outerR + innerR) / 2,
    font: ctx.bold,
    size: 6.5,
    color: BROWN,
    centerAngleDeg: 270 + tilt,
    angleStepDeg: 9.5,
    orientation: "inward",
  });

  const centerLines: { text: string; size: number; font: PDFFont; color: ReturnType<typeof rgb> }[] = [
    { text: "OFFICIAL", size: 7.5, font: ctx.bold, color: GREEN },
    { text: "QUOTATION", size: 7.5, font: ctx.bold, color: GREEN },
  ];
  let ty = cy + 12;
  for (const line of centerLines) {
    const w = line.font.widthOfTextAtSize(line.text, line.size);
    const p = rotateAround(cx - w / 2, ty, cx, cy, tilt);
    ctx.page.drawText(line.text, {
      x: p.x,
      y: p.y,
      size: line.size,
      font: line.font,
      color: line.color,
      rotate: degrees(tilt),
      opacity: 0.9,
    });
    ty -= 11;
  }

  const dateSize = 6.5;
  const dw = ctx.regular.widthOfTextAtSize(dateText, dateSize);
  const pDate = rotateAround(cx - dw / 2, cy - 19, cx, cy, tilt);
  ctx.page.drawText(dateText, {
    x: pDate.x,
    y: pDate.y,
    size: dateSize,
    font: ctx.regular,
    color: BROWN,
    rotate: degrees(tilt),
    opacity: 0.9,
  });
}

export async function generateQuotationLetterPdf(
  quotation: QuotationWithMeta,
  preparedByName: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const boldItalic = await doc.embedFont(StandardFonts.HelveticaBoldOblique);

  const logoPath = path.join(process.cwd(), "public", "brand", "panorama-logo.png");
  const logoBytes = fs.readFileSync(logoPath);
  const logoImage = await doc.embedPng(logoBytes);

  const firstPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageBands(firstPage);

  const ctx: Ctx = {
    doc,
    page: firstPage,
    y: PAGE_HEIGHT - MARGIN,
    regular,
    bold,
    italic,
    boldItalic,
    logoImage,
  };

  // ---------- Letterhead ----------
  // Drawn by drawLetterheadBlock() so the same logo + contact-details header
  // also appears on page 2, 3, etc. (via newPage()) instead of only page 1.
  drawLetterheadBlock(ctx);

  // Date, right-aligned, on a small pill
  const dateText = formatLetterDate(new Date());
  const dateSize = 9.5;
  const dateWidth = bold.widthOfTextAtSize(dateText, dateSize);
  const pillPadX = 8;
  const pillW = dateWidth + pillPadX * 2;
  const pillH = dateSize + 9;
  ctx.page.drawRectangle({
    x: PAGE_WIDTH - MARGIN - pillW,
    y: ctx.y - pillH + 6,
    width: pillW,
    height: pillH,
    color: BROWN,
  });
  ctx.page.drawText(dateText, {
    x: PAGE_WIDTH - MARGIN - pillW + pillPadX,
    y: ctx.y - dateSize - 1,
    size: dateSize,
    font: bold,
    color: WHITE,
  });
  ctx.y -= pillH + 1;

  // ---------- TO: ----------
  const toText = quotation.group_name.toUpperCase();
  const toLabelSize = 15;
  const toLabel = "TO: ";
  ensureSpace(ctx, toLabelSize + 14);
  const toLabelWidth = bold.widthOfTextAtSize(toLabel, toLabelSize);
  ctx.page.drawText(toLabel, {
    x: MARGIN,
    y: ctx.y - toLabelSize,
    size: toLabelSize,
    font: bold,
    color: BROWN,
  });
  ctx.page.drawText(toText, {
    x: MARGIN + toLabelWidth,
    y: ctx.y - toLabelSize,
    size: toLabelSize,
    font: bold,
    color: BROWN,
  });
  const toFullWidth = toLabelWidth + bold.widthOfTextAtSize(toText, toLabelSize);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - toLabelSize - 5,
    width: toFullWidth,
    height: 2.5,
    color: GREEN,
  });
  ctx.y -= toLabelSize + 4;

  // ---------- QUOTATION FOR: ----------
  const packageLabel = quotation.package || "ACCOMMODATION";
  const quotationForLabel = "QUOTATION FOR: ";
  const quotationForRest = `${packageLabel.toUpperCase()}${
    quotation.event_dates ? `: ${quotation.event_dates.toUpperCase()}` : ""
  }`;
  const subtitleSize = 11;
  ensureSpace(ctx, subtitleSize + 12);
  const quotationForLabelWidth = bold.widthOfTextAtSize(
    quotationForLabel,
    subtitleSize
  );
  ctx.page.drawText(quotationForLabel, {
    x: MARGIN,
    y: ctx.y - subtitleSize,
    size: subtitleSize,
    font: bold,
    color: GREEN,
  });
  ctx.page.drawText(quotationForRest, {
    x: MARGIN + quotationForLabelWidth + 3,
    y: ctx.y - subtitleSize,
    size: subtitleSize,
    font: bold,
    color: GREEN_SOFT,
  });
  ctx.y -= subtitleSize + 4;

  drawParagraph(ctx, "Att: Sir/Madam,", { gapAfter: 0 });
  drawParagraph(
    ctx,
    "Thank you for choosing to be served by Panorama Park Hotel, Naivasha's most serene paradise, beautifully perched on a natural cliff in the heart of the central business district in Naivasha.",
    { gapAfter: 0 }
  );
  drawParagraph(ctx, "Kindly find the below quotation:", { gapAfter: 0 });

  // ---------- Table ----------
  const colWidths = [95, 75, 55, 175, 95];
  const colLabels = ["PACKAGE", "RATE", "NO. OF PAX", "PROVISIONS", "TOTAL (KSH)"];
  const tableX = MARGIN;
  const cellPad = 5;
  const cellFontSize = 9;

  // A quotation with several rate lines (different room types / nights)
  // gets one table row per line item, each with its own rate x pax x
  // nights total; an ordinary quotation keeps the single row it always had.
  const hasLineItems = !!quotation.line_items && quotation.line_items.length > 0;

  let rowValueSets: string[][];
  let computedGrandTotal: number | null;

  if (hasLineItems) {
    const items = quotation.line_items!;
    rowValueSets = items.map((item) => [
      item.package || quotation.package || "—",
      formatMoney(item.rate),
      `${item.pax} PAX × ${item.nights} NIGHT${item.nights === 1 ? "" : "S"}`,
      item.provisions || "—",
      formatMoney(item.rate * item.pax * item.nights),
    ]);
    computedGrandTotal = items.reduce(
      (sum, item) => sum + item.rate * item.pax * item.nights,
      0
    );
  } else {
    const provisions =
      quotation.provisions ||
      [quotation.package, quotation.number_of_pax && `for ${quotation.number_of_pax}`]
        .filter(Boolean)
        .join(" ") ||
      "—";
    rowValueSets = [
      [
        quotation.package || "—",
        formatRateCell(quotation.rate),
        formatPaxCell(quotation.number_of_pax),
        provisions,
        formatMoney(quotation.business_value),
      ],
    ];
    computedGrandTotal = quotation.business_value ?? null;
  }

  const wrappedHeaders = colLabels.map((label, i) =>
    wrapText(label, bold, 8.5, colWidths[i] - cellPad * 2)
  );
  const headerLines = Math.max(...wrappedHeaders.map((lines) => lines.length));
  const headerRowHeight = Math.max(18, headerLines * 10 + 6);
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  const wrappedRows = rowValueSets.map((values) =>
    values.map((val, i) => wrapText(val, regular, cellFontSize, colWidths[i] - cellPad * 2))
  );
  const rowHeights = wrappedRows.map((cells) => {
    const lines = Math.max(...cells.map((c) => c.length));
    return Math.max(20, lines * (cellFontSize + 3) + 6);
  });
  const totalTableHeight = headerRowHeight + rowHeights.reduce((a, b) => a + b, 0);

  ensureSpace(ctx, totalTableHeight);
  let cursorX = tableX;
  const tableTop = ctx.y;

  // Header row — brown fill, white text
  ctx.page.drawRectangle({
    x: tableX,
    y: tableTop - headerRowHeight,
    width: tableWidth,
    height: headerRowHeight,
    color: BROWN,
  });
  wrappedHeaders.forEach((lines, i) => {
    const blockHeight = lines.length * 10;
    const startY = tableTop - (headerRowHeight - blockHeight) / 2 - 8;
    lines.forEach((line, li) => {
      ctx.page.drawText(line, {
        x: cursorX + cellPad,
        y: startY - li * 10,
        size: 8.5,
        font: bold,
        color: WHITE,
      });
    });
    if (i > 0) {
      ctx.page.drawLine({
        start: { x: cursorX, y: tableTop },
        end: { x: cursorX, y: tableTop - headerRowHeight },
        thickness: 0.75,
        color: rgb(0.55, 0.4, 0.35),
      });
    }
    cursorX += colWidths[i];
  });

  // Data rows — one block per row (several when the quotation has multiple
  // rate lines); last column (TOTAL) gets a light green highlight on each
  const totalColX = tableX + colWidths.slice(0, 4).reduce((a, b) => a + b, 0);
  let rowTop = tableTop - headerRowHeight;
  wrappedRows.forEach((cells, rowIndex) => {
    const rowHeight = rowHeights[rowIndex];
    ctx.page.drawRectangle({
      x: tableX,
      y: rowTop - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: CREAM,
      borderColor: LIGHT_BROWN_BORDER,
      borderWidth: 1,
    });
    ctx.page.drawRectangle({
      x: totalColX,
      y: rowTop - rowHeight,
      width: colWidths[4],
      height: rowHeight,
      color: LIGHT_GREEN_BG,
      borderColor: LIGHT_GREEN_BORDER,
      borderWidth: 1,
    });

    let cx = tableX;
    cells.forEach((lines, i) => {
      lines.forEach((line, li) => {
        ctx.page.drawText(line, {
          x: cx + cellPad,
          y: rowTop - 15 - li * (cellFontSize + 3),
          size: i === 4 ? cellFontSize + 0.5 : cellFontSize,
          font: i === 4 ? bold : regular,
          color: BLACK,
        });
      });
      if (i > 0) {
        ctx.page.drawLine({
          start: { x: cx, y: rowTop },
          end: { x: cx, y: rowTop - rowHeight },
          thickness: 0.75,
          color: LIGHT_BROWN_BORDER,
        });
      }
      cx += colWidths[i];
    });

    rowTop -= rowHeight;
  });

  ctx.y = rowTop - 6;

  drawParagraph(ctx, "The above rates are V.A.T inclusive.", {
    size: 9.5,
    font: italic,
    color: BROWN_SOFT,
    gapAfter: 1,
  });

  // ---------- Payment details + grand total ----------
  const grandTotal = computedGrandTotal;
  const paymentsMade = 0;
  const balance = grandTotal !== null ? grandTotal - paymentsMade : null;

  // The totals box sits directly under the table's PROVISIONS + TOTAL
  // columns; the payment-details box takes the remaining width on the left,
  // under PACKAGE / RATE / NO. OF PAX.
  const payBoxGap = 12;
  const totalsBoxWidth = colWidths[3] + colWidths[4];
  const totalsBoxX = tableX + colWidths[0] + colWidths[1] + colWidths[2];
  const payBoxWidth = totalsBoxX - MARGIN - payBoxGap;
  const payBoxPad = 10;

  const paymentLines = [
    "AC NAME: PANAROMA PARK HOTEL LIMITED",
    "AC NO: 1235955850",
    "BANK: KCB   BRANCH: NAIVASHA",
    "MPESA TILL: 496138 (Buy Goods and Services)",
  ];
  const paymentFontSize = 8.5;
  const wrappedPaymentLines = paymentLines.flatMap((line) =>
    wrapText(line, bold, paymentFontSize, payBoxWidth - payBoxPad * 2)
  );
  const payHeadingSpace = 10;

  const totalsRows: [string, string][] = [
    ["TOTAL", formatMoney(grandTotal)],
    ["PAYMENTS", formatMoney(paymentsMade)],
    ["BALANCE", formatMoney(balance)],
  ];
  const totalsRowHeight = 13;
  const totalsBoxHeight =
    payHeadingSpace + totalsRows.length * totalsRowHeight + payBoxPad * 0.8;

  const payBoxHeight = Math.max(
    payHeadingSpace + wrappedPaymentLines.length * 10 + payBoxPad * 1.1,
    totalsBoxHeight
  );

  ensureSpace(ctx, payBoxHeight + 10);
  const payBoxTop = ctx.y;

  // Left box — payment details (brown), bold text throughout
  ctx.page.drawRectangle({
    x: MARGIN,
    y: payBoxTop - payBoxHeight,
    width: payBoxWidth,
    height: payBoxHeight,
    color: LIGHT_BROWN_BG,
    borderColor: LIGHT_BROWN_BORDER,
    borderWidth: 1,
  });
  ctx.page.drawText("Payment details", {
    x: MARGIN + payBoxPad,
    y: payBoxTop - payBoxPad - 8,
    size: 9.5,
    font: bold,
    color: BROWN,
  });
  let payLeftY = payBoxTop - payBoxPad - payHeadingSpace - 8;
  for (const line of wrappedPaymentLines) {
    ctx.page.drawText(line, {
      x: MARGIN + payBoxPad,
      y: payLeftY,
      size: paymentFontSize,
      font: bold,
      color: BLACK,
    });
    payLeftY -= 10;
  }

  // Right box — grand total / payments / balance (green), directly under
  // the table's PROVISIONS + TOTAL columns
  ctx.page.drawRectangle({
    x: totalsBoxX,
    y: payBoxTop - payBoxHeight,
    width: totalsBoxWidth,
    height: payBoxHeight,
    color: LIGHT_GREEN_BG,
    borderColor: LIGHT_GREEN_BORDER,
    borderWidth: 1,
  });
  let totalsY = payBoxTop - payBoxPad - 8;
  totalsRows.forEach(([label, value], i) => {
    const isBalance = label === "BALANCE";
    ctx.page.drawText(label, {
      x: totalsBoxX + payBoxPad,
      y: totalsY,
      size: isBalance ? 10 : 9,
      font: bold,
      color: isBalance ? GREEN : BROWN,
    });
    const valueWidth = bold.widthOfTextAtSize(value, isBalance ? 10 : 9);
    ctx.page.drawText(value, {
      x: totalsBoxX + totalsBoxWidth - payBoxPad - valueWidth,
      y: totalsY,
      size: isBalance ? 10 : 9,
      font: bold,
      color: BLACK,
    });
    if (i < totalsRows.length - 1) {
      ctx.page.drawLine({
        start: { x: totalsBoxX + payBoxPad, y: totalsY - 5 },
        end: { x: totalsBoxX + totalsBoxWidth - payBoxPad, y: totalsY - 5 },
        thickness: 0.5,
        color: LIGHT_GREEN_BORDER,
      });
    }
    totalsY -= totalsRowHeight;
  });

  ctx.y = payBoxTop - payBoxHeight;

  // ---------- Inclusions ----------
  drawSectionHeading(ctx, "We also provide the following", { gapAfter: 1 });

  const boxGap = 12;
  const boxWidth = (CONTENT_WIDTH - boxGap) / 2;
  const boxPad = 10;
  const noExtra = ["Wi-Fi", "Meeting space", "Swimming & gym services"];
  const extra = ["Sauna & steambath services", "Excursion", "Any other service not listed"];

  const noExtraLines = noExtra.flatMap((item) =>
    wrapText(`- ${item}`, regular, 9, boxWidth - boxPad * 2)
  );
  const extraLines = extra.flatMap((item) =>
    wrapText(`- ${item}`, regular, 9, boxWidth - boxPad * 2)
  );
  const headingSpace = 10;
  const boxHeight =
    Math.max(noExtraLines.length, extraLines.length) * 12 + headingSpace + boxPad;

  ensureSpace(ctx, boxHeight + 4);
  const boxTop = ctx.y;

  // Left box — "at no extra cost" (green)
  ctx.page.drawRectangle({
    x: MARGIN,
    y: boxTop - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: LIGHT_GREEN_BG,
    borderColor: LIGHT_GREEN_BORDER,
    borderWidth: 1,
  });
  ctx.page.drawText("At no extra cost", {
    x: MARGIN + boxPad,
    y: boxTop - boxPad - 8,
    size: 9.5,
    font: bold,
    color: GREEN,
  });
  let leftY = boxTop - boxPad - headingSpace - 8;
  for (const line of noExtraLines) {
    ctx.page.drawText(line, {
      x: MARGIN + boxPad,
      y: leftY,
      size: 9,
      font: regular,
      color: BLACK,
    });
    leftY -= 12;
  }

  // Right box — "at extra cost" (green, matching the left box)
  const rightBoxX = MARGIN + boxWidth + boxGap;
  ctx.page.drawRectangle({
    x: rightBoxX,
    y: boxTop - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: LIGHT_GREEN_BG,
    borderColor: LIGHT_GREEN_BORDER,
    borderWidth: 1,
  });
  ctx.page.drawText("At extra cost", {
    x: rightBoxX + boxPad,
    y: boxTop - boxPad - 8,
    size: 9.5,
    font: bold,
    color: GREEN,
  });
  let rightY = boxTop - boxPad - headingSpace - 8;
  for (const line of extraLines) {
    ctx.page.drawText(line, {
      x: rightBoxX + boxPad,
      y: rightY,
      size: 9,
      font: regular,
      color: BLACK,
    });
    rightY -= 12;
  }

  ctx.y = boxTop - boxHeight - 2;

  // ---------- Terms & conditions ----------
  drawSectionHeading(ctx, "Terms and conditions for accommodation bookings", {
    size: 11,
    gapAfter: 0,
  });

  drawBulletList(
    ctx,
    [
      "Once a booking is confirmed, the company requires the client to pay 75% deposit to our account for commitment. Balance to be cleared before check out.",
      "The company shall invoice payment as per the booking on the first day (when attendance is less than the number booked), or as per attendance (when the turn up is more than the number booked).",
      "Charges for subsequent days will be as per attendance.",
      "Check in starts from noon. Check out from rooms is strictly by 10:00am. The guests can still remain in the premises even after check outs. Late check out will be charged hourly.",
    ],
    { gapAfter: 1 }
  );

  drawParagraph(ctx, "Cancellation policy:", {
    size: 9.5,
    font: bold,
    color: GREEN,
    gapAfter: 0,
  });
  drawBulletList(
    ctx,
    [
      "Confirmed booking cancelled before 30 days of confirmation retention will not be charged.",
      "Confirmed booking cancelled between 30-15 days to arrival day, a one night's rate will be charged.",
      "Confirmed booking cancelled in less than two weeks to arrival day, a 100% of entire booking will be charged.",
    ],
    { gapAfter: 0, bulletColor: GREEN_SOFT }
  );

  // ---------- Footer / signature ----------
  drawParagraph(ctx, "We look forward to hosting you at Panorama Park Hotel.", {
    font: italic,
    color: BROWN,
    size: 11,
    gapAfter: 0,
  });

  ensureSpace(ctx, 112);
  const signatureTopY = ctx.y;
  ctx.page.drawText("Regards,", {
    x: MARGIN,
    y: ctx.y - 10,
    size: 10.5,
    font: regular,
    color: BLACK,
  });
  ctx.y -= 40;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: MARGIN + 140, y: ctx.y },
    thickness: 1,
    color: GREEN,
  });
  ctx.y -= 14;
  ctx.page.drawText(preparedByName, {
    x: MARGIN,
    y: ctx.y - 10,
    size: 10,
    font: bold,
    color: BROWN,
  });
  ctx.y -= 14;
  ctx.page.drawText("Reservations Desk", {
    x: MARGIN,
    y: ctx.y - 10,
    size: 9.5,
    font: regular,
    color: GRAY,
  });
  ctx.y -= 24;
  ctx.page.drawText(`Generated on ${formatLetterDate(new Date())}`, {
    x: MARGIN,
    y: ctx.y - 10,
    size: 8,
    font: italic,
    color: LINE_GRAY,
  });

  // Official stamp, sitting beside the signature block.
  drawOfficialStamp(ctx, {
    cx: PAGE_WIDTH - MARGIN - 65,
    cy: signatureTopY - 50,
    dateText: formatStampDate(new Date()),
  });

  return doc.save();
}
