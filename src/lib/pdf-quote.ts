/**
 * Formal quote PDF generator — Play Rio visual identity.
 * Pure jsPDF vector drawing (no html2canvas), so modern CSS colors
 * (oklch, color-mix) can never break the export.
 *
 * Vibrant palette: deep navy + light blue backgrounds, light green details,
 * yellow highlights for prices/attention. White is never the dominant color.
 */

export type PdfProduct = {
  title: string;
  areaTag: string;
  image: string;
  priceOld: string;
  priceNew: string;
  tag: string;
  items: string[];
};

export type PdfData = {
  info: { label: string; value: string }[];
  products: PdfProduct[];
  loads: { n: string; l: string; d: string }[];
  paySteps: { num: string; title: string; desc: string }[];
  docs: string[];
  floors: string[];
  materials: { title: string; text: string }[];
  audience: string;
  delivery: string;
  freight: string;
  phone: string;
  logo?: string;
};

type RGB = [number, number, number];

const NAVY: RGB = [11, 39, 92]; // azul escuro
const NAVY_SOFT: RGB = [30, 60, 140];
const BLUE: RGB = [46, 124, 214]; // azul claro
const BLUE_BG: RGB = [210, 235, 255]; // fundo azul claro das páginas
const BLUE_PANEL: RGB = [120, 195, 255]; // azul claro vibrante
const GREEN: RGB = [126, 217, 160]; // verde claro
const GREEN_DEEP: RGB = [18, 92, 66];
const GREEN_PANEL: RGB = [195, 245, 215]; // verde claro vibrante
const YELLOW: RGB = [255, 199, 44]; // amarelo
const YELLOW_PANEL: RGB = [255, 235, 160]; // amarelo claro vibrante
const PURPLE: RGB = [142, 84, 220]; // roxo
const PURPLE_PANEL: RGB = [225, 210, 255]; // roxo claro vibrante
const DARK: RGB = [18, 26, 45];
const GRAY: RGB = [86, 100, 124];
const WHITE: RGB = [255, 255, 255];

/** Lê o mesmo controle central de tamanho das imagens usado no site (--img-scale). */
function imgScale(): number {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--img-scale");
    const n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 2.2) : 1;
  } catch {
    return 1;
  }
}

/** Load any image (url or data-url) and return a data URL + natural size. */
async function toDataUrl(
  src: string,
  opts?: { keepAlpha?: boolean }
): Promise<{ data: string; w: number; h: number; fmt: "JPEG" | "PNG" } | null> {
  if (!src) return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await new Promise<void>((res, rej) => {
      if (img.complete && img.naturalWidth) return res();
      img.onload = () => res();
      img.onerror = () => rej(new Error("img"));
    });
    const canvas = document.createElement("canvas");
    const maxW = 1400;
    const scale = Math.min(1, maxW / (img.naturalWidth || maxW));
    canvas.width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (!opts?.keepAlpha) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return opts?.keepAlpha
      ? { data: canvas.toDataURL("image/png"), w: canvas.width, h: canvas.height, fmt: "PNG" }
      : {
          data: canvas.toDataURL("image/jpeg", 0.92),
          w: canvas.width,
          h: canvas.height,
          fmt: "JPEG",
        };
  } catch {
    return null;
  }
}

export async function generateQuotePdf(
  data: PdfData,
  opts?: { returnBuffer?: boolean }
): Promise<ArrayBuffer | void> {
  const jspdfMod = await import("jspdf").catch((e) => {
    throw new Error("Falha ao carregar jsPDF: " + (e instanceof Error ? e.message : String(e)));
  });
  const Ctor =
    (jspdfMod as unknown as { jsPDF?: unknown }).jsPDF ??
    (jspdfMod as unknown as { default?: unknown }).default;
  if (typeof Ctor !== "function") throw new Error("jsPDF não expôs o construtor esperado.");

  // Pre-load images live from the current page state (seller edits included).
  const productImages = await Promise.all(data.products.map((p) => toDataUrl(p.image)));
  const logoImage = data.logo ? await toDataUrl(data.logo, { keepAlpha: true }) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = new (Ctor as any)({ unit: "mm", format: "a4", orientation: "portrait" });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 16;
  const CW = PW - M * 2;
  const IMG_SCALE = imgScale();
  let y = M;

  const setFont = (size: number, style: "normal" | "bold" = "normal", color: RGB = DARK) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);

  /** Colored page canvas so no page is predominantly white. */
  const paintPage = () => {
    fill(BLUE_BG);
    doc.rect(0, 0, PW, PH, "F");
    // top band
    fill(NAVY);
    doc.rect(0, 0, PW, 8, "F");
    fill(YELLOW);
    doc.rect(0, 8, PW * 0.30, 2, "F");
    fill(GREEN);
    doc.rect(PW * 0.30, 8, PW * 0.22, 2, "F");
    fill(PURPLE);
    doc.rect(PW * 0.52, 8, PW * 0.18, 2, "F");
    // bottom band
    fill(NAVY);
    doc.rect(0, PH - 14, PW, 14, "F");
    fill(YELLOW);
    doc.rect(0, PH - 16, PW * 0.22, 2, "F");
    fill(PURPLE);
    doc.rect(PW * 0.22, PH - 16, PW * 0.18, 2, "F");
  };

  const newPage = () => {
    doc.addPage();
    paintPage();
    y = M + 6;
  };
  const ensure = (need: number) => {
    if (y + need > PH - 22) newPage();
  };

  /* ---------------- Cover ---------------- */
  fill(NAVY);
  doc.rect(0, 0, PW, PH, "F");
  fill(NAVY_SOFT);
  doc.circle(PW + 10, -10, 70, "F");
  fill(BLUE);
  doc.rect(0, PH * 0.6, PW, 3.5, "F");
  fill(YELLOW);
  doc.rect(0, PH * 0.6 + 3.5, PW * 0.34, 3.5, "F");
  fill(GREEN);
  doc.rect(PW * 0.34, PH * 0.6 + 3.5, PW * 0.18, 3.5, "F");
  fill(PURPLE);
  doc.rect(PW * 0.52, PH * 0.6 + 3.5, PW * 0.16, 3.5, "F");

  if (logoImage) {
    const lw = 56;
    const lh = Math.min((logoImage.h / logoImage.w) * lw, 26);
    doc.addImage(logoImage.data, logoImage.fmt, M, 22, lw, lh);
  }
  fill(YELLOW);
  doc.roundedRect(M, 60, 62, 10, 5, 5, "F");
  setFont(9.5, "bold", NAVY);
  doc.text("PROPOSTA COMERCIAL", M + 7, 66.7);
  setFont(34, "bold", WHITE);
  doc.text("Orçamento de", M, 88);
  setFont(34, "bold", YELLOW);
  doc.text("Playground", M, 102);
  setFont(11.5, "normal", [198, 222, 255]);
  doc.text("Play Rio Playgrounds — fabricando alegrias desde 1985", M, 114);

  const coverFields = [
    ...data.info.filter((f) => f.value).slice(0, 4),
    { label: "Prazo de entrega", value: data.delivery },
    { label: "Contato", value: data.phone },
  ].filter((f) => f.value);
  const cardY = PH * 0.6 + 16;
  const cardH = Math.max(40, coverFields.length * 9 + 16);
  fill(NAVY_SOFT);
  doc.roundedRect(M, cardY, CW, cardH, 6, 6, "F");
  fill(GREEN);
  doc.roundedRect(M, cardY, 3, cardH, 2, 2, "F");
  let cy = cardY + 13;
  for (const f of coverFields) {
    setFont(8.5, "bold", GREEN);
    doc.text(f.label.toUpperCase(), M + 9, cy);
    setFont(11, "bold", WHITE);
    const v: string[] = doc.splitTextToSize(f.value, CW - 78);
    doc.text(v[0] ?? "", M + 74, cy);
    cy += 9;
  }
  setFont(9, "normal", [170, 196, 236]);
  doc.text(
    new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    M,
    PH - 16
  );

  /* ---------------- Content pages ---------------- */
  newPage();

  const sectionTitle = (title: string, keepWith = 30) => {
    ensure(22 + keepWith);
    y += 3;
    fill(NAVY);
    doc.roundedRect(M, y, CW, 12, 4, 4, "F");
    fill(YELLOW);
    doc.roundedRect(M + 5, y + 3, 2.8, 6, 1.4, 1.4, "F");
    setFont(11, "bold", WHITE);
    doc.text(title.toUpperCase(), M + 11, y + 7.8);
    y += 18;
  };

  /** Colored panel with label/value rows. */
  const fieldRows = (rows: { label: string; value: string }[]) => {
    const items = rows.filter((r) => r.value);
    if (!items.length) return;
    const panels: RGB[] = [BLUE_PANEL, GREEN_PANEL, YELLOW_PANEL, PURPLE_PANEL];
    const accents: RGB[] = [BLUE, GREEN_DEEP, [200, 145, 0], PURPLE];
    items.forEach((r, i) => {
      const panel = panels[i % panels.length];
      const accent = accents[i % accents.length];
      setFont(8.5, "bold", NAVY);
      const labelW = Math.max(46, doc.getTextWidth(r.label.toUpperCase()) + 12);
      setFont(10.5, "normal", DARK);
      const valueLines: string[] = doc.splitTextToSize(r.value, (CW - labelW - 10) * 0.9);
      const h = Math.max(11, valueLines.length * 5 + 6);
      ensure(h + 3);
      fill(panel);
      doc.roundedRect(M, y, CW, h, 3.5, 3.5, "F");
      fill(accent);
      doc.roundedRect(M, y, 2.2, h, 1.1, 1.1, "F");
      setFont(8.5, "bold", NAVY);
      doc.text(r.label.toUpperCase(), M + 7, y + 7);
      setFont(10.5, "normal", DARK);
      doc.text(valueLines, M + labelW, y + 7);
      y += h + 2.5;
    });
  };

  const bullets = (list: string[], x = M + 4, width = CW - 8) => {
    setFont(10, "normal", DARK);
    for (const raw of list) {
      const lines: string[] = doc.splitTextToSize(raw, width - 7);
      ensure(lines.length * 5 + 2);
      fill(BLUE);
      doc.circle(x + 1.4, y + 1.9, 1, "F");
      setFont(10, "normal", DARK);
      doc.text(lines, x + 5.5, y + 3);
      y += lines.length * 5 + 1.5;
    }
  };

  /* ---------- Dados do orçamento ---------- */
  sectionTitle("Dados do orçamento");
  fieldRows([
    ...data.info,
    { label: "Telefone de contato", value: data.phone },
    { label: "Prazo de entrega", value: data.delivery },
    { label: "Frete e instalação", value: data.freight },
  ]);

  /* ---------- Produtos ---------- */
  sectionTitle("Playgrounds selecionados");
  data.products.forEach((p, i) => {
    const img = productImages[i];
    const boxW = Math.min(CW * 0.46, 74 * IMG_SCALE);
    let boxH = 0;
    let dw = 0;
    let dh = 0;
    if (img) {
      const maxH = 58 * IMG_SCALE;
      const ratio = img.h / img.w;
      dw = boxW;
      dh = dw * ratio;
      if (dh > maxH) {
        dh = maxH;
        dw = dh / ratio;
      }
      boxH = dh + 6;
    }
    ensure(Math.max(boxH, 46) + 22);

    const cardTop = y;
    // card background (light blue) drawn later would cover content, so draw header now
    fill(NAVY);
    doc.roundedRect(M, y, CW, 12, 4, 4, "F");
    setFont(12.5, "bold", WHITE);
    doc.text(p.title, M + 7, y + 8.2);
    y += 16;

    let textX = M + 6;
    let textW = CW - 12;
    let imgBottom = y;
    if (img) {
      fill(WHITE);
      doc.roundedRect(M + 6, y, boxW, boxH, 3.5, 3.5, "F");
      doc.addImage(img.data, img.fmt, M + 6 + (boxW - dw) / 2, y + 3, dw, dh);
      stroke(BLUE);
      doc.setLineWidth(0.3);
      doc.roundedRect(M + 6, y, boxW, boxH, 3.5, 3.5, "S");
      textX = M + 6 + boxW + 7;
      textW = CW - 12 - boxW - 7;
      imgBottom = y + boxH;
    }

    let ty = y;
    const kv = (label: string, value: string) => {
      if (!value) return;
      setFont(8, "bold", GREEN_DEEP);
      doc.text(label.toUpperCase(), textX, ty + 3.2);
      setFont(10, "normal", DARK);
      const lines: string[] = doc.splitTextToSize(value, textW);
      doc.text(lines, textX, ty + 8.4);
      ty += 8.4 + lines.length * 4.6 + 1.5;
    };
    kv("Área necessária", p.areaTag.replace(/^Área:\s*/i, ""));
    if (p.priceOld) {
      setFont(8, "bold", GRAY);
      doc.text("PREÇO DE TABELA", textX, ty + 3.2);
      setFont(10, "normal", GRAY);
      doc.text(p.priceOld, textX, ty + 8.4);
      const w = doc.getTextWidth(p.priceOld);
      stroke(GRAY);
      doc.setLineWidth(0.4);
      doc.line(textX, ty + 7.2, textX + w, ty + 7.2);
      ty += 13;
    }
    if (p.priceNew) {
      const bh = 17;
      fill(YELLOW);
      doc.roundedRect(textX, ty, Math.min(textW, 64), bh, 4, 4, "F");
      setFont(7.5, "bold", [120, 78, 6]);
      doc.text("NESTA PROPOSTA", textX + 5, ty + 6.2);
      setFont(13.5, "bold", NAVY);
      doc.text(p.priceNew, textX + 5, ty + 13.4);
      ty += bh + 3;
    }
    if (p.tag) {
      fill(GREEN);
      const tw = doc.getTextWidth(p.tag) * 0.42 + 10;
      doc.roundedRect(textX, ty, Math.min(textW, Math.max(30, tw)), 8, 4, 4, "F");
      setFont(8.5, "bold", GREEN_DEEP);
      doc.text(p.tag, textX + 5, ty + 5.4);
      ty += 11;
    }

    y = Math.max(imgBottom, ty) + 4;

    if (p.items.length) {
      ensure(12);
      setFont(9, "bold", NAVY);
      doc.text("ITENS INCLUSOS", M + 6, y + 3);
      y += 7;
      bullets(p.items, M + 6, CW - 12);
    }

    stroke(NAVY);
    doc.setLineWidth(0.4);
    if (cardTop < y) doc.roundedRect(M, cardTop, CW, y - cardTop + 4, 4.5, 4.5, "S");
    y += 10;
  });

  /* ---------- Capacidade de carga ---------- */
  sectionTitle("Capacidade de carga");
  const loadCols = 3;
  const gap = 4;
  const bw = (CW - gap * (loadCols - 1)) / loadCols;
  let col = 0;
  let rowTop = y;
  for (const l of data.loads) {
    if (col === 0) {
      ensure(32);
      rowTop = y;
    }
    const x = M + col * (bw + gap);
    fill(NAVY);
    doc.roundedRect(x, rowTop, bw, 27, 4, 4, "F");
    fill(YELLOW);
    doc.rect(x + 4, rowTop, bw - 8, 1.8, "F");
    setFont(15, "bold", YELLOW);
    doc.text(l.n, x + 5, rowTop + 13);
    setFont(8.5, "bold", GREEN);
    doc.text(doc.splitTextToSize(l.l, bw - 10)[0] ?? "", x + 5, rowTop + 19);
    setFont(8, "normal", [198, 218, 246]);
    doc.text(doc.splitTextToSize(l.d, bw - 10).slice(0, 1), x + 5, rowTop + 24);
    col++;
    if (col === loadCols) {
      col = 0;
      y = rowTop + 31;
    }
  }
  if (col !== 0) y = rowTop + 31;

  fieldRows([{ label: "Público-alvo", value: data.audience }]);

  /* ---------- Materiais ---------- */
  sectionTitle("Materiais e especificações");
  fieldRows(data.materials.map((m) => ({ label: m.title, value: m.text })));

  /* ---------- Pagamento ---------- */
  sectionTitle("Condições de pagamento");
  for (const s of data.paySteps) {
    const lines: string[] = doc.splitTextToSize(s.desc, CW - 30);
    const h = Math.max(18, lines.length * 5 + 13);
    ensure(h + 3);
    fill(BLUE_PANEL);
    doc.roundedRect(M, y, CW, h, 4.5, 4.5, "F");
    fill(NAVY);
    doc.circle(M + 10, y + 10, 5.8, "F");
    setFont(10, "bold", YELLOW);
    doc.text(String(s.num), M + 10, y + 11.5, { align: "center" });
    setFont(10.5, "bold", NAVY);
    doc.text(s.title, M + 20, y + 8);
    setFont(10, "normal", DARK);
    doc.text(lines, M + 20, y + 14);
    y += h + 3;
  }

  /* ---------- Requisitos ---------- */
  sectionTitle("Requisitos de instalação");
  const half = (CW - 6) / 2;
  const docLines = data.docs;
  const floorLines = data.floors;
  const blockH = Math.max(docLines.length, floorLines.length) * 6 + 22;
  ensure(blockH + 4);
  const top = y;
  const drawList = (x: number, title: string, list: string[], color: RGB, bg: RGB) => {
    fill(bg);
    doc.roundedRect(x, top, half, blockH, 4.5, 4.5, "F");
    fill(color);
    doc.roundedRect(x, top, half, 6, 4.5, 4.5, "F");
    doc.rect(x, top + 3, half, 3, "F");
    setFont(9.5, "bold", NAVY);
    doc.text(title.toUpperCase(), x + 6, top + 12.5);
    let ly = top + 17;
    for (const item of list) {
      const ls: string[] = doc.splitTextToSize(item, half - 16);
      fill(color);
      doc.circle(x + 7.4, ly + 1.6, 1, "F");
      setFont(9.5, "normal", DARK);
      doc.text(ls, x + 11, ly + 2.8);
      ly += ls.length * 5 + 1;
    }
  };
  drawList(M, "Documentação necessária", docLines, YELLOW, BLUE_PANEL);
  drawList(M + half + 6, "Pisos compatíveis", floorLines, GREEN, [223, 245, 232]);
  y = top + blockH + 6;

  /* ---------- Closing band ---------- */
  ensure(32);
  fill(NAVY);
  doc.roundedRect(M, y, CW, 26, 6, 6, "F");
  fill(YELLOW);
  doc.roundedRect(M, y, 3, 26, 1.5, 1.5, "F");
  setFont(11.5, "bold", YELLOW);
  doc.text("Vamos construir a alegria do seu espaço?", M + 9, y + 11);
  setFont(10, "normal", [200, 220, 250]);
  doc.text(`Fale com a gente: ${data.phone}`, M + 9, y + 18.5);

  /* ---------- Footer on every page (skip cover) ---------- */
  const pages = doc.getNumberOfPages();
  for (let p = 2; p <= pages; p++) {
    doc.setPage(p);
    setFont(8.5, "normal", [206, 224, 250]);
    doc.text(`Play Rio Playgrounds • ${data.phone}`, M, PH - 5.5);
    doc.text(`Página ${p - 1} de ${pages - 1}`, PW - M, PH - 5.5, { align: "right" });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  if (opts?.returnBuffer) return doc.output("arraybuffer") as ArrayBuffer;
  doc.save(`orcamento-playrio-${stamp}.pdf`);
}
