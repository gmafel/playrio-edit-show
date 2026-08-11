/**
 * Formal quote PDF generator — Play Rio visual identity.
 * Pure jsPDF vector drawing (no html2canvas), so modern CSS colors
 * (oklch, color-mix) can never break the export.
 *
 * Layout: colored cover page, colored section bands, tinted panels,
 * highlighted price boxes, aspect-safe (contain) product photos.
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

const NAVY: RGB = [16, 34, 74]; // brand navy
const ACCENT: RGB = [30, 100, 200]; // brand blue
const GREEN: RGB = [21, 106, 76]; // price highlight
const SUN: RGB = [242, 168, 32]; // warm accent
const DARK: RGB = [26, 28, 34];
const GRAY: RGB = [104, 110, 122];
const LINE: RGB = [216, 221, 230];
const TINT: RGB = [243, 246, 251];
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

/** Load any image (url or data-url) and return a JPEG data URL + natural size. */
async function toDataUrl(
  src: string
): Promise<{ data: string; w: number; h: number } | null> {
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
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL("image/jpeg", 0.92), w: canvas.width, h: canvas.height };
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
  const logoImage = data.logo ? await toDataUrl(data.logo) : null;

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

  const newPage = () => {
    doc.addPage();
    y = M + 6;
  };
  const ensure = (need: number) => {
    if (y + need > PH - 18) newPage();
  };

  /* ---------------- Cover ---------------- */
  fill(NAVY);
  doc.rect(0, 0, PW, PH, "F");
  // decorative bands
  fill(ACCENT);
  doc.rect(0, PH * 0.62, PW, 3, "F");
  fill(SUN);
  doc.rect(0, PH * 0.62 + 3, PW * 0.42, 3, "F");

  if (logoImage) {
    const lw = 56;
    const lh = Math.min((logoImage.h / logoImage.w) * lw, 26);
    doc.addImage(logoImage.data, "JPEG", M, 22, lw, lh);
  }
  setFont(11, "bold", SUN);
  doc.text("PROPOSTA COMERCIAL", M, 68);
  setFont(34, "bold", WHITE);
  doc.text("Orçamento de", M, 84);
  doc.text("Playground", M, 98);
  setFont(11.5, "normal", [205, 214, 232]);
  doc.text("Play Rio Playgrounds — fabricando alegrias desde 1985", M, 112);

  // cover highlight card with the first quote info fields
  const coverFields = [
    ...data.info.filter((f) => f.value).slice(0, 4),
    { label: "Prazo de entrega", value: data.delivery },
    { label: "Contato", value: data.phone },
  ].filter((f) => f.value);
  const cardY = PH * 0.62 + 16;
  const cardH = Math.max(40, coverFields.length * 9 + 14);
  fill([25, 48, 96]);
  doc.roundedRect(M, cardY, CW, cardH, 5, 5, "F");
  let cy = cardY + 12;
  for (const f of coverFields) {
    setFont(8.5, "bold", [150, 176, 224]);
    doc.text(f.label.toUpperCase(), M + 8, cy);
    setFont(11, "bold", WHITE);
    const v: string[] = doc.splitTextToSize(f.value, CW - 70);
    doc.text(v[0] ?? "", M + 70, cy);
    cy += 9;
  }
  setFont(9, "normal", [170, 186, 214]);
  doc.text(
    new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    M,
    PH - 16
  );

  /* ---------------- Content pages ---------------- */
  newPage();

  const sectionTitle = (title: string) => {
    ensure(24);
    y += 3;
    fill(NAVY);
    doc.roundedRect(M, y, CW, 11, 3, 3, "F");
    fill(SUN);
    doc.rect(M + 4, y + 3, 2.4, 5, "F");
    setFont(11, "bold", WHITE);
    doc.text(title.toUpperCase(), M + 10, y + 7.4);
    y += 17;
  };

  /** Tinted panel with label/value rows. */
  const fieldRows = (rows: { label: string; value: string }[]) => {
    const items = rows.filter((r) => r.value);
    if (!items.length) return;
    for (const r of items) {
      setFont(9, "bold", GRAY);
      const labelW = Math.max(46, doc.getTextWidth(r.label.toUpperCase()) + 6);
      const valueLines: string[] = doc.splitTextToSize(r.value, CW - labelW - 12);
      const h = Math.max(11, valueLines.length * 5 + 6);
      ensure(h + 3);
      fill(TINT);
      doc.roundedRect(M, y, CW, h, 3, 3, "F");
      setFont(8.5, "bold", GRAY);
      doc.text(r.label.toUpperCase(), M + 6, y + 7);
      setFont(10.5, "normal", DARK);
      doc.text(valueLines, M + labelW, y + 7);
      y += h + 2.5;
    }
  };

  const bullets = (list: string[], x = M + 4, width = CW - 8) => {
    setFont(10, "normal", DARK);
    for (const raw of list) {
      const lines: string[] = doc.splitTextToSize(raw, width - 7);
      ensure(lines.length * 5 + 2);
      fill(ACCENT);
      doc.circle(x + 1.4, y + 1.9, 0.9, "F");
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
    // photo box: keep natural aspect (contain) inside a fixed-width frame
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
    ensure(Math.max(boxH, 46) + 16);

    // card background
    const cardTop = y;
    setFont(13.5, "bold", NAVY);
    doc.text(p.title, M + 6, y + 9);
    y += 14;

    let textX = M + 6;
    let textW = CW - 12;
    let imgBottom = y;
    if (img) {
      fill([250, 251, 253]);
      doc.roundedRect(M + 6, y, boxW, boxH, 3, 3, "F");
      // centered, aspect-preserved
      doc.addImage(img.data, "JPEG", M + 6 + (boxW - dw) / 2, y + 3, dw, dh);
      stroke(LINE);
      doc.setLineWidth(0.2);
      doc.roundedRect(M + 6, y, boxW, boxH, 3, 3, "S");
      textX = M + 6 + boxW + 7;
      textW = CW - 12 - boxW - 7;
      imgBottom = y + boxH;
    }

    let ty = y;
    const kv = (label: string, value: string) => {
      if (!value) return;
      setFont(8, "bold", GRAY);
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
      const bh = 16;
      fill(GREEN);
      doc.roundedRect(textX, ty, Math.min(textW, 62), bh, 3, 3, "F");
      setFont(7.5, "bold", [190, 228, 210]);
      doc.text("NESTA PROPOSTA", textX + 5, ty + 6);
      setFont(13, "bold", WHITE);
      doc.text(p.priceNew, textX + 5, ty + 12.6);
      ty += bh + 3;
    }
    if (p.tag) {
      fill([255, 244, 220]);
      const tw = doc.getTextWidth(p.tag) * 0.42 + 10;
      doc.roundedRect(textX, ty, Math.min(textW, Math.max(30, tw)), 8, 4, 4, "F");
      setFont(8.5, "bold", [150, 96, 10]);
      doc.text(p.tag, textX + 5, ty + 5.4);
      ty += 11;
    }

    y = Math.max(imgBottom, ty) + 4;

    if (p.items.length) {
      ensure(12);
      setFont(9, "bold", GRAY);
      doc.text("ITENS INCLUSOS", M + 6, y + 3);
      y += 7;
      bullets(p.items, M + 6, CW - 12);
    }

    // card outline
    stroke(LINE);
    doc.setLineWidth(0.3);
    if (cardTop < y) doc.roundedRect(M, cardTop, CW, y - cardTop + 4, 4, 4, "S");
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
      ensure(30);
      rowTop = y;
    }
    const x = M + col * (bw + gap);
    fill(TINT);
    doc.roundedRect(x, rowTop, bw, 26, 4, 4, "F");
    fill(ACCENT);
    doc.rect(x, rowTop, bw, 1.6, "F");
    setFont(15, "bold", NAVY);
    doc.text(l.n, x + 5, rowTop + 12);
    setFont(8.5, "bold", GRAY);
    doc.text(doc.splitTextToSize(l.l, bw - 10)[0] ?? "", x + 5, rowTop + 18);
    setFont(8, "normal", GRAY);
    doc.text(doc.splitTextToSize(l.d, bw - 10).slice(0, 1), x + 5, rowTop + 23);
    col++;
    if (col === loadCols) {
      col = 0;
      y = rowTop + 30;
    }
  }
  if (col !== 0) y = rowTop + 30;

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
    fill(TINT);
    doc.roundedRect(M, y, CW, h, 4, 4, "F");
    fill(ACCENT);
    doc.circle(M + 10, y + 10, 5.5, "F");
    setFont(10, "bold", WHITE);
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
  const blockH = Math.max(docLines.length, floorLines.length) * 6 + 20;
  ensure(blockH + 4);
  const top = y;
  const drawList = (x: number, title: string, list: string[], color: RGB) => {
    fill(TINT);
    doc.roundedRect(x, top, half, blockH, 4, 4, "F");
    fill(color);
    doc.rect(x, top, half, 1.8, "F");
    setFont(9.5, "bold", NAVY);
    doc.text(title.toUpperCase(), x + 6, top + 10);
    let ly = top + 15;
    setFont(9.5, "normal", DARK);
    for (const item of list) {
      const ls: string[] = doc.splitTextToSize(item, half - 16);
      fill(color);
      doc.circle(x + 7.4, ly + 1.6, 0.9, "F");
      setFont(9.5, "normal", DARK);
      doc.text(ls, x + 11, ly + 2.8);
      ly += ls.length * 5 + 1;
    }
  };
  drawList(M, "Documentação necessária", docLines, ACCENT);
  drawList(M + half + 6, "Pisos compatíveis", floorLines, SUN);
  y = top + blockH + 6;

  /* ---------- Closing band ---------- */
  ensure(30);
  fill(NAVY);
  doc.roundedRect(M, y, CW, 24, 5, 5, "F");
  setFont(11.5, "bold", WHITE);
  doc.text("Vamos construir a alegria do seu espaço?", M + 8, y + 10);
  setFont(10, "normal", [180, 198, 228]);
  doc.text(`Fale com a gente: ${data.phone}`, M + 8, y + 17.5);

  /* ---------- Footer on every page (skip cover) ---------- */
  const pages = doc.getNumberOfPages();
  for (let p = 2; p <= pages; p++) {
    doc.setPage(p);
    stroke(LINE);
    doc.setLineWidth(0.2);
    doc.line(M, PH - 12, PW - M, PH - 12);
    setFont(8.5, "normal", GRAY);
    doc.text(`Play Rio Playgrounds • ${data.phone}`, M, PH - 7);
    doc.text(`Página ${p - 1} de ${pages - 1}`, PW - M, PH - 7, { align: "right" });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  if (opts?.returnBuffer) return doc.output("arraybuffer") as ArrayBuffer;
  doc.save(`orcamento-playrio-${stamp}.pdf`);
}
