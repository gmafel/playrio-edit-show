/**
 * Formal quote PDF generator.
 * Built with pure jsPDF vector drawing (no html2canvas / no page cloning),
 * so modern CSS colors (oklch, color-mix) can never break the export.
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

const ACCENT: [number, number, number] = [30, 64, 175]; // #1e40af
const DARK: [number, number, number] = [17, 17, 17];
const GRAY: [number, number, number] = [102, 102, 102];
const LINE: [number, number, number] = [210, 210, 210];

/** Load any image (url or data-url) and return a JPEG/PNG data URL + ratio. */
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
    const maxW = 1200;
    const scale = Math.min(1, maxW / (img.naturalWidth || maxW));
    canvas.width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL("image/jpeg", 0.9), w: canvas.width, h: canvas.height };
  } catch {
    return null;
  }
}

export async function generateQuotePdf(data: PdfData, opts?: { returnBuffer?: boolean }): Promise<ArrayBuffer | void> {
  const jspdfMod = await import("jspdf").catch((e) => {
    throw new Error("Falha ao carregar jsPDF: " + (e instanceof Error ? e.message : String(e)));
  });
  const Ctor =
    (jspdfMod as unknown as { jsPDF?: unknown }).jsPDF ??
    (jspdfMod as unknown as { default?: unknown }).default;
  if (typeof Ctor !== "function") throw new Error("jsPDF não expôs o construtor esperado.");

  // Pre-load images (product photos + logo), respecting seller edits.
  const productImages = await Promise.all(data.products.map((p) => toDataUrl(p.image)));
  const logoImage = data.logo ? await toDataUrl(data.logo) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = new (Ctor as any)({ unit: "mm", format: "a4", orientation: "portrait" });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 16;
  const CW = PW - M * 2;
  let y = M;

  const setFont = (size: number, style: "normal" | "bold" = "normal", color = DARK) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const ensure = (need: number) => {
    if (y + need > PH - M) {
      doc.addPage();
      y = M;
    }
  };

  const hr = (gap = 3) => {
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.2);
    doc.line(M, y, PW - M, y);
    y += gap;
  };

  const sectionTitle = (title: string) => {
    ensure(16);
    y += 4;
    setFont(12, "bold", ACCENT);
    doc.text(title.toUpperCase(), M, y);
    y += 2.5;
    doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.setLineWidth(0.6);
    doc.line(M, y, PW - M, y);
    y += 5;
  };

  /** Label / value row with a thin separator. */
  const field = (label: string, value: string) => {
    if (!value) return;
    setFont(9.5, "bold", GRAY);
    const labelW = Math.max(45, doc.getTextWidth(label + ":") + 4);
    const valueLines: string[] = doc.splitTextToSize(value, CW - labelW - 4);
    const h = Math.max(5.5, valueLines.length * 5);
    ensure(h + 3);
    doc.text(label + ":", M, y + 4);
    setFont(10.5, "normal", DARK);
    doc.text(valueLines, M + labelW, y + 4);
    y += h + 2;
    hr(2.5);
  };

  const bullets = (list: string[]) => {
    setFont(10, "normal", DARK);
    for (const raw of list) {
      const lines: string[] = doc.splitTextToSize(raw, CW - 6);
      ensure(lines.length * 4.8 + 1);
      doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
      doc.circle(M + 1.2, y + 1.8, 0.8, "F");
      doc.text(lines, M + 5, y + 3);
      y += lines.length * 4.8 + 1;
    }
  };

  /* ---------- Header ---------- */
  if (logoImage) {
    const lw = 42;
    const lh = (logoImage.h / logoImage.w) * lw;
    doc.addImage(logoImage.data, "JPEG", M, y, lw, Math.min(lh, 18));
    y += Math.min(lh, 18) + 4;
  }
  setFont(20, "bold", DARK);
  doc.text("Orçamento de Playground", M, y + 6);
  y += 10;
  setFont(10.5, "normal", GRAY);
  doc.text("Play Rio Playgrounds — fabricando alegrias desde 1985", M, y + 4);
  y += 8;
  doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.setLineWidth(1);
  doc.line(M, y, PW - M, y);
  y += 6;

  /* ---------- Dados do orçamento ---------- */
  sectionTitle("Dados do orçamento");
  for (const f of data.info) field(f.label, f.value);
  field("Telefone de contato", data.phone);
  field("Prazo de entrega", data.delivery);
  field("Frete e instalação", data.freight);

  /* ---------- Produtos ---------- */
  sectionTitle("Playgrounds selecionados");
  data.products.forEach((p, i) => {
    ensure(40);
    setFont(13, "bold", DARK);
    doc.text(p.title, M, y + 4);
    y += 8;

    const img = productImages[i];
    let textX = M;
    let textW = CW;
    let imgBottom = y;
    if (img) {
      const iw = 62;
      const ih = Math.min(45, (img.h / img.w) * iw);
      ensure(ih + 6);
      doc.addImage(img.data, "JPEG", M, y, iw, ih);
      doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
      doc.setLineWidth(0.2);
      doc.rect(M, y, iw, ih);
      textX = M + iw + 5;
      textW = CW - iw - 5;
      imgBottom = y + ih;
    }

    let ty = y;
    const kv = (label: string, value: string, bold = false, color = DARK) => {
      if (!value) return;
      setFont(9, "bold", GRAY);
      const off = Math.max(32, doc.getTextWidth(label + ":") + 3);
      doc.text(label + ":", textX, ty + 3.5);
      setFont(bold ? 12 : 10, bold ? "bold" : "normal", color);
      const lines: string[] = doc.splitTextToSize(value, textW - off);
      doc.text(lines, textX + off, ty + 3.5);
      ty += Math.max(5.5, lines.length * 5);
    };
    kv("Área necessária", p.areaTag.replace(/^Área:\s*/i, ""));
    kv("Preço de tabela", p.priceOld);
    kv("Preço nesta proposta", p.priceNew, true, ACCENT);
    kv("Condição", p.tag);

    y = Math.max(imgBottom, ty) + 4;

    if (p.items.length) {
      ensure(10);
      setFont(9.5, "bold", GRAY);
      doc.text("Itens inclusos:", M, y + 3);
      y += 6;
      bullets(p.items);
    }
    y += 2;
    hr(4);
  });

  /* ---------- Capacidade de carga ---------- */
  sectionTitle("Capacidade de carga");
  for (const l of data.loads) field(l.l, `${l.n} — ${l.d}`);
  field("Público-alvo", data.audience);

  /* ---------- Materiais ---------- */
  sectionTitle("Materiais e especificações");
  for (const m of data.materials) field(m.title, m.text);

  /* ---------- Pagamento ---------- */
  sectionTitle("Condições de pagamento");
  for (const s of data.paySteps) field(`${s.num}. ${s.title}`, s.desc);

  /* ---------- Requisitos ---------- */
  sectionTitle("Requisitos de instalação");
  field("Documentação necessária", data.docs.join(" • "));
  field("Pisos compatíveis", data.floors.join(" • "));

  /* ---------- Footer on every page ---------- */
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.2);
    doc.line(M, PH - 12, PW - M, PH - 12);
    setFont(8.5, "normal", GRAY);
    doc.text(`Play Rio Playgrounds • ${data.phone}`, M, PH - 7);
    doc.text(`Página ${p} de ${pages}`, PW - M, PH - 7, { align: "right" });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  if (opts?.returnBuffer) return doc.output("arraybuffer") as ArrayBuffer;
  doc.save(`orcamento-playrio-${stamp}.pdf`);
}
