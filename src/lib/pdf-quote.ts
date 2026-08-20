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

type Framed = { data: string; w: number; h: number; fmt: "JPEG" | "PNG" };

/**
 * Enquadramento automático das fotos de playground para o PDF.
 *
 * 1) Detecta a área ocupada pelo brinquedo comparando cada pixel com as cores
 *    de fundo amostradas nas bordas da foto (céu, grama, piso, parede).
 * 2) Amplia (zoom) descartando SOMENTE fundo vazio ao redor — a caixa detectada
 *    recebe uma margem de segurança generosa, então nenhuma parte do playground
 *    é cortada.
 * 3) Ajusta a proporção alvo usando pixels reais da foto; se ainda faltar
 *    espaço, completa com a cor sólida do fundo amostrado (nítido, sem blur).
 */
function autoFrameSubject(src: Framed, targetAspect: number): Promise<Framed> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const iw = img.naturalWidth || src.w;
          const ih = img.naturalHeight || src.h;
          const work = document.createElement("canvas");
          const SW = Math.min(320, iw);
          const SH = Math.max(1, Math.round((ih / iw) * SW));
          work.width = SW;
          work.height = SH;
          const wctx = work.getContext("2d", { willReadFrequently: true });
          if (!wctx) return resolve(src);
          wctx.drawImage(img, 0, 0, SW, SH);
          const d = wctx.getImageData(0, 0, SW, SH).data;

          const at = (x: number, y: number) => {
            const i = (y * SW + x) * 4;
            return [d[i]!, d[i + 1]!, d[i + 2]!] as [number, number, number];
          };

          // Cores de fundo: amostras nas 4 bordas (usadas só para a cor de
          // preenchimento nítido quando sobra espaço na moldura).
          const samples: [number, number, number][] = [];
          for (let x = 0; x < SW; x += 4) {
            samples.push(at(x, 0), at(x, SH - 1));
          }
          for (let y = 0; y < SH; y += 4) {
            samples.push(at(0, y), at(SW - 1, y));
          }

          /**
           * Detecção do brinquedo: os playgrounds são pintados com cores muito
           * vivas (vermelho, amarelo, azul, verde forte), diferentes de céu,
           * grama, areia e muros. Contamos pixels "vivos" por coluna/linha e
           * pegamos a faixa onde eles se concentram.
           */
          const vividCol = new Array<number>(SW).fill(0);
          const vividRow = new Array<number>(SH).fill(0);
          let vividTotal = 0;
          for (let y = 0; y < SH; y++) {
            for (let x = 0; x < SW; x++) {
              const [r, g, b] = at(x, y);
              const mx = Math.max(r, g, b);
              const mn = Math.min(r, g, b);
              const sat = mx === 0 ? 0 : (mx - mn) / mx;
              const isSky = b > r + 25 && b > g + 10 && mx > 150; // céu azul claro
              const isFoliage = g >= r && g >= b && g - b > 12 && mx < 200; // grama/árvore
              if (sat > 0.42 && mx > 70 && !isSky && !isFoliage) {
                vividCol[x]!++;
                vividRow[y]!++;
                vividTotal++;
              }
            }
          }

          const rangeOf = (hist: number[]) => {
            const max = Math.max(...hist);
            if (max <= 0) return null;
            const thr = Math.max(1, max * 0.08);
            let a = 0;
            let b = hist.length - 1;
            while (a < hist.length && hist[a]! < thr) a++;
            while (b > a && hist[b]! < thr) b--;
            return a < b ? ([a, b] as [number, number]) : null;
          };
          const rx = rangeOf(vividCol);
          const ry = rangeOf(vividRow);
          const minX = rx ? rx[0] : 0;
          const maxX = rx ? rx[1] : -1;
          const minY = ry ? ry[0] : 0;
          const maxY = ry ? ry[1] : -1;

          // Cor média das bordas (preenchimento nítido, sem blur).
          let br = 0,
            bg = 0,
            bb = 0;
          for (const s of samples) {
            br += s[0];
            bg += s[1];
            bb += s[2];
          }
          const n = Math.max(1, samples.length);
          const fillColor = `rgb(${Math.round(br / n)},${Math.round(bg / n)},${Math.round(bb / n)})`;

          const kx = iw / SW;
          const ky = ih / SH;
          let bx = 0,
            by = 0,
            bw2 = iw,
            bh2 = ih;
          const detected =
            !!rx && !!ry && vividTotal > SW * SH * 0.004 && maxX > minX && maxY > minY;
          if (detected) {
            // Margem de segurança de 12% em cada eixo — garante o brinquedo inteiro.
            const padX = (maxX - minX) * 0.12 + 4;
            const padY = (maxY - minY) * 0.12 + 4;
            const x0 = Math.max(0, minX - padX);
            const y0 = Math.max(0, minY - padY);
            const x1 = Math.min(SW, maxX + padX);
            const y1 = Math.min(SH, maxY + padY);
            bx = x0 * kx;
            by = y0 * ky;
            bw2 = (x1 - x0) * kx;
            bh2 = (y1 - y0) * ky;
          }

          // Proporção final: a do próprio brinquedo, apenas limitada a uma faixa
          // confortável para a moldura do PDF — assim quase não sobra fundo
          // sólido e o playground ocupa o máximo possível do espaço.
          const MIN_A = 0.78;
          const MAX_A = 1.55;
          const subjectA = bw2 / bh2;
          const finalA = Math.min(MAX_A, Math.max(MIN_A, subjectA || targetAspect));

          let cw = bw2;
          let ch = bh2;
          if (cw / ch < finalA) cw = ch * finalA;
          else ch = cw / finalA;
          let cx = bx + bw2 / 2 - cw / 2;
          let cy = by + bh2 / 2 - ch / 2;
          // Limita ao interior da foto quando couber.
          if (cw <= iw) cx = Math.max(0, Math.min(iw - cw, cx));
          if (ch <= ih) cy = Math.max(0, Math.min(ih - ch, cy));

          const OUT_W = Math.round(1400 * Math.min(1, finalA));
          const OUT_H = Math.round(OUT_W / finalA);
          const out = document.createElement("canvas");
          out.width = OUT_W;
          out.height = OUT_H;
          const octx = out.getContext("2d");
          if (!octx) return resolve(src);
          octx.fillStyle = fillColor;
          octx.fillRect(0, 0, OUT_W, OUT_H);
          octx.imageSmoothingEnabled = true;
          octx.imageSmoothingQuality = "high";

          // Desenha a região recortada mantendo a proporção (sem distorção).
          const scale = OUT_W / cw;
          const sx = Math.max(0, cx);
          const sy = Math.max(0, cy);
          const sw = Math.min(iw - sx, cw - (sx - cx));
          const sh = Math.min(ih - sy, ch - (sy - cy));
          const dx = (sx - cx) * scale;
          const dy = (sy - cy) * scale;
          octx.drawImage(img, sx, sy, sw, sh, dx, dy, sw * scale, sh * scale);

          resolve({
            data: out.toDataURL("image/jpeg", 0.94),
            w: OUT_W,
            h: OUT_H,
            fmt: "JPEG",
          });
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src.data;
    } catch {
      resolve(src);
    }
  });
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
  // Cada foto de playground passa pelo ajuste automático de enquadramento
  // (sem recorte e sem distorção) para a proporção usada na moldura do PDF.
  const PRODUCT_ASPECT = 74 / 58;
  const productImages = await Promise.all(
    data.products.map(async (p) => {
      const base = await toDataUrl(p.image);
      return base ? await autoFrameSubject(base, PRODUCT_ASPECT) : null;
    })
  );
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
    fill(GREEN);
    doc.rect(0, 8, PW * 0.30, 2, "F");
    fill(BLUE_PANEL);
    doc.rect(PW * 0.30, 8, PW * 0.22, 2, "F");
    fill(PURPLE);
    doc.rect(PW * 0.52, 8, PW * 0.18, 2, "F");
    // bottom band
    fill(NAVY);
    doc.rect(0, PH - 14, PW, 14, "F");
    fill(GREEN);
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
  fill(GREEN);
  doc.rect(0, PH * 0.6 + 3.5, PW * 0.34, 3.5, "F");
  fill(BLUE_PANEL);
  doc.rect(PW * 0.34, PH * 0.6 + 3.5, PW * 0.18, 3.5, "F");
  fill(PURPLE);
  doc.rect(PW * 0.52, PH * 0.6 + 3.5, PW * 0.16, 3.5, "F");

  if (logoImage) {
    const lw = 56;
    const lh = Math.min((logoImage.h / logoImage.w) * lw, 26);
    doc.addImage(logoImage.data, logoImage.fmt, M, 22, lw, lh);
  }
  fill(BLUE_PANEL);
  doc.roundedRect(M, 60, 62, 10, 5, 5, "F");
  setFont(9.5, "bold", NAVY);
  doc.text("PROPOSTA COMERCIAL", M + 7, 66.7);
  setFont(34, "bold", WHITE);
  doc.text("Orçamento de", M, 88);
  setFont(34, "bold", BLUE_PANEL);
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
  fill(PURPLE);
  doc.roundedRect(M, cardY, 3, cardH, 2, 2, "F");
  let cy = cardY + 13;
  for (const f of coverFields) {
    setFont(8.5, "bold", BLUE_PANEL);

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
    fill(BLUE_PANEL);
    doc.roundedRect(M + 5, y + 3, 2.8, 6, 1.4, 1.4, "F");

    setFont(11, "bold", WHITE);
    doc.text(title.toUpperCase(), M + 11, y + 7.8);
    y += 18;
  };

  /** Colored panel with label/value rows. */
  const fieldRows = (rows: { label: string; value: string }[]) => {
    const items = rows.filter((r) => r.value);
    if (!items.length) return;
    // Neutral data rows: always the SAME light-blue panel + blue accent.
    const panel: RGB = BLUE_PANEL;
    const accent: RGB = NAVY;
    items.forEach((r) => {

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
      fill(GREEN_PANEL);
      doc.roundedRect(M + 6, y, boxW, boxH, 3.5, 3.5, "F");
      doc.addImage(img.data, img.fmt, M + 6 + (boxW - dw) / 2, y + 3, dw, dh);
      stroke(GREEN);
      doc.setLineWidth(0.3);
      doc.roundedRect(M + 6, y, boxW, boxH, 3.5, 3.5, "S");
      textX = M + 6 + boxW + 7;
      textW = CW - 12 - boxW - 7;
      imgBottom = y + boxH;
    }

    let ty = y;
    const kv = (label: string, value: string) => {
      if (!value) return;
      setFont(8, "bold", NAVY);
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
      fill(YELLOW_PANEL);
      doc.roundedRect(textX, ty, Math.min(textW, 64), bh, 4, 4, "F");
      fill(YELLOW);
      doc.roundedRect(textX, ty, 2.4, bh, 1.2, 1.2, "F");
      setFont(7.5, "bold", [120, 78, 6]);
      doc.text("NESTA PROPOSTA", textX + 5, ty + 6.2);
      setFont(13.5, "bold", [120, 78, 6]);
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
    fill(PURPLE);
    doc.rect(x + 4, rowTop, bw - 8, 1.8, "F");
    setFont(15, "bold", BLUE_PANEL);
    doc.text(l.n, x + 5, rowTop + 13);
    setFont(8.5, "bold", WHITE);
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
    fill(PURPLE);
    doc.rect(M, y + 3, 1.6, h - 6, "F");
    fill(NAVY);
    doc.circle(M + 12, y + 10, 5.8, "F");
    setFont(10, "bold", WHITE);
    doc.text(String(s.num), M + 12, y + 11.5, { align: "center" });
    setFont(10.5, "bold", NAVY);
    doc.text(s.title, M + 22, y + 8);
    setFont(10, "normal", DARK);
    doc.text(lines, M + 22, y + 14);

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
    doc.roundedRect(x, top, half, 10, 4.5, 4.5, "F");
    doc.rect(x, top + 5, half, 5, "F");
    setFont(9.5, "bold", WHITE);
    doc.text(title.toUpperCase(), x + 6, top + 6.6);
    let ly = top + 15;

    for (const item of list) {
      const ls: string[] = doc.splitTextToSize(item, half - 16);
      fill(color);
      doc.circle(x + 7.4, ly + 1.6, 1, "F");
      setFont(9.5, "normal", DARK);
      doc.text(ls, x + 11, ly + 2.8);
      ly += ls.length * 5 + 1;
    }
  };
  drawList(M, "Documentação necessária", docLines, NAVY, BLUE_PANEL);
  drawList(M + half + 6, "Pisos compatíveis", floorLines, NAVY, BLUE_PANEL);

  y = top + blockH + 6;

  /* ---------- Closing band ---------- */
  ensure(32);
  fill(NAVY);
  doc.roundedRect(M, y, CW, 26, 6, 6, "F");
  fill(GREEN);
  doc.roundedRect(M, y, 3, 26, 1.5, 1.5, "F");
  setFont(11.5, "bold", GREEN);
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
