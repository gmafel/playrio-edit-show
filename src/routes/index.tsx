import { createFileRoute } from "@tanstack/react-router";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
} from "react";

import heroAsset from "@/assets/hero.jpg.asset.json";
import quoteAsset from "@/assets/quote.jpg.asset.json";
import product1Asset from "@/assets/product1.jpg.asset.json";
import product2Asset from "@/assets/product2.jpg.asset.json";
import product3Asset from "@/assets/product3.jpg.asset.json";
import contactAsset from "@/assets/contact.jpg.asset.json";
import logoAsset from "@/assets/playrio-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: OrcamentoPage,
});

/* ================================================================
   CONFIG
   ================================================================ */
const SELLER_PASSWORD = "260385";
const DEFAULT_PHONE = "(17) 3305-3929";
const WHATSAPP_MSG = encodeURIComponent(
  "Olá! Vim pelo orçamento online da Play Rio e gostaria de mais informações."
);

function phoneToWa(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "5517333053929";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return "55" + digits;
}
function waLink(phone: string): string {
  return `https://wa.me/${phoneToWa(phone)}?text=${WHATSAPP_MSG}`;
}
function telLink(phone: string): string {
  return `tel:+${phoneToWa(phone)}`;
}

/* ================================================================
   MODELS
   ================================================================ */
type Product = {
  id: string;
  title: string;
  areaTag: string;
  image: string;
  priceOld: string;
  priceNew: string;
  tag: string;
  tagColor: string;
  items: string[];
};

type Field = { id: string; label: string; value: string };
type LoadItem = { id: string; n: string; l: string; d: string };
type PayStep = { id: string; num: string; title: string; desc: string };
type Material = { id: string; icon: string; color: string; title: string; text: string };

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "big_steel_master",
    title: "Big Steel Master",
    areaTag: "Área: 6x7 metros",
    image: product1Asset.url,
    priceOld: "R$ 19.990,00",
    priceNew: "R$ 16.990,00",
    tag: "Frete e instalação grátis",
    tagColor: "var(--green)",
    items: [
      "Torre grande coberta com telhadinho pirâmide (1,40x1,40)",
      "02 escorregadores ondulados de fibra (2,50m)",
      "Conjunto de vogais e numerais (0 a 9)",
      "Escada de 06 degraus",
      "Balanço baby e balanço cadeirinha teen",
      "Rapel de fibra",
      "Jogo da velha (09 cubos)",
      "Lousa mágica e alfabeto divertido",
    ],
  },
  {
    id: "master_118",
    title: "Master 118",
    areaTag: "Área: 8x8 metros",
    image: product2Asset.url,
    priceOld: "R$ 25.990,00",
    priceNew: "R$ 22.990,00",
    tag: "Área necessária: 8x8 metros",
    tagColor: "var(--sky)",
    items: [
      "Torre grande coberta com telhadinho pirâmide (1,40x1,40)",
      "Escorregadores ondulados de fibra (2,50m)",
      "Escorregador caracol",
      "Conjunto de vogais e numerais (0 a 9)",
      "Escada de 06 degraus",
      "Rapel de fibra",
      "Jogo da velha (09 cubos) e lousa mágica",
      "Alfabeto divertido (A ao Z)",
      "Balanço baby e balanço cadeirinha teen",
    ],
  },
  {
    id: "master_121",
    title: "Master 121",
    areaTag: "Área: 8x8 metros",
    image: product3Asset.url,
    priceOld: "R$ 25.990,00",
    priceNew: "R$ 22.990,00",
    tag: "Frete e instalação grátis",
    tagColor: "var(--green)",
    items: [
      "Torre grande coberta com telhadinho pirâmide (1,40x1,40)",
      "Escorregadores ondulados de fibra (2,50m)",
      "Escalada de cordas tipo teia",
      "Escorregador de tubo",
      "Conjunto de numerais (0 a 9) e vogais",
      "Escada com 6 degraus",
      "Rapel de fibra",
      "Jogo da velha (9 cubos) e lousa mágica",
      "Alfabeto divertido (A ao Z)",
      "Balanço baby e balanço cadeirinha teen",
    ],
  },
];

const DEFAULT_QUOTE_INFO: Field[] = [
  { id: "vendedora", label: "Vendedora", value: "" },
  { id: "cliente", label: "Cliente", value: "" },
  { id: "documento", label: "CPF / CNPJ", value: "" },
  { id: "data", label: "Data do orçamento", value: "" },
];

const DEFAULT_LOADS: LoadItem[] = [
  { id: "l1", n: "130kg", l: "Balanço teen", d: "Capacidade máxima de carga" },
  { id: "l2", n: "50kg", l: "Balanço baby", d: "Capacidade máxima de carga" },
  { id: "l3", n: "100kg", l: "Escorregadores", d: "Capacidade máxima de carga" },
  { id: "l4", n: "80kg", l: "Rapel e corda", d: "Capacidade máxima de carga" },
];

const DEFAULT_PAY_STEPS: PayStep[] = [
  { id: "p1", num: "01", title: "Sinal inicial", desc: "R$ 500,00 para confirmação do pedido." },
  { id: "p2", num: "02", title: "Restante do pagamento", desc: "À vista, no ato da entrega." },
  { id: "p3", num: "03", title: "Parcelamento disponível", desc: "Até 10x sem juros (cheque ou boleto bancário com CNPJ)." },
];

const DEFAULT_DOCS = ["Nome completo", "Endereço completo", "CPF/CNPJ", "Fotos/vídeos do local de instalação"];
const DEFAULT_FLOORS = ["Grama", "Terra", "Areia", "Concreto", "Piso"];

const DEFAULT_MATERIALS: Material[] = [
  { id: "m-aco", icon: "Aç", color: "var(--orange)", title: "Aço estrutural", text: "Perfis de aço com pintura epóxi que repele calor e mantém as cores vivas por muito mais tempo." },
  { id: "m-fibra", icon: "Fi", color: "var(--sky)", title: "Fibra de vidro", text: "Escorregadores, telhadinhos e rapel em fibra de alta resistência, próprios para uso intensivo ao ar livre." },
  { id: "m-plas", icon: "Pl", color: "var(--violet)", title: "Plástico rotomoldado", text: "Peças coloridas, leves e resistentes ao impacto — sem farpas, sem quinas, seguras para as crianças." },
  { id: "m-mad", icon: "Ma", color: "var(--yellow)", title: "Madeira plástica", text: "Alternativa ecológica que substitui a madeira tradicional: não racha, não empena e não precisa de manutenção." },
  { id: "m-al", icon: "Al", color: "#B14AED", title: "Alumínio anticorrosivo", text: "Componentes de acabamento em alumínio tratado — leve, durável e imune à ferrugem em áreas úmidas." },
];

const TAG_COLORS = [
  { label: "Verde", value: "var(--green)" },
  { label: "Azul", value: "var(--sky)" },
  { label: "Laranja", value: "var(--orange)" },
  { label: "Roxo", value: "var(--violet)" },
  { label: "Amarelo", value: "var(--yellow)" },
];

const PRODUCTS_KEY = "playrio_products_v2";
const PHONE_KEY = "playrio_phone_v1";
const THEME_KEY = "playrio_theme";
const QUOTE_INFO_KEY = "playrio_quote_info_v1";
const LOADS_KEY = "playrio_loads_v1";
const PAY_KEY = "playrio_pay_v1";
const DOCS_KEY = "playrio_docs_v1";
const FLOORS_KEY = "playrio_floors_v1";
const IMAGES_KEY = "playrio_images_v1";
const MATERIALS_KEY = "playrio_materials_v1";
const TEXTS_KEY = "playrio_texts_v1";

/* ================================================================
   TEXT CONTEXT — makes every hardcoded text editable
   ================================================================ */
type TextCtxType = {
  get: (key: string, def: string) => string;
  set: (key: string, v: string) => void;
  editMode: boolean;
};
const TextCtx = createContext<TextCtxType>({
  get: (_k, d) => d,
  set: () => {},
  editMode: false,
});

function T({
  k, children, as = "span", className, style,
}: {
  k: string;
  children: string;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "em" | "div";
  className?: string;
  style?: CSSProperties;
}) {
  const { get, set, editMode } = useContext(TextCtx);
  const value = get(k, children);
  return (
    <EditableSpan
      as={as}
      className={className}
      style={style}
      value={value}
      editMode={editMode}
      onCommit={(v) => set(k, v || children)}
    />
  );
}

/* ================================================================
   PAGE
   ================================================================ */
function OrcamentoPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [phone, setPhone] = useState<string>(DEFAULT_PHONE);
  const [quoteInfo, setQuoteInfo] = useState<Field[]>(DEFAULT_QUOTE_INFO);
  const [loads, setLoads] = useState<LoadItem[]>(DEFAULT_LOADS);
  const [paySteps, setPaySteps] = useState<PayStep[]>(DEFAULT_PAY_STEPS);
  const [docs, setDocs] = useState<string[]>(DEFAULT_DOCS);
  const [floors, setFloors] = useState<string[]>(DEFAULT_FLOORS);
  const [materials, setMaterials] = useState<Material[]>(DEFAULT_MATERIALS);
  const [images, setImages] = useState<Record<string, string>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    try {
      const t = (localStorage.getItem(THEME_KEY) as "light" | "dark" | null) ?? "light";
      setTheme(t);
      document.documentElement.setAttribute("data-theme", t);
      const load = <TV,>(k: string, setter: (v: TV) => void) => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try { setter(JSON.parse(raw) as TV); } catch { /* ignore */ }
        }
      };
      load<Product[]>(PRODUCTS_KEY, (v) => Array.isArray(v) && v.length && setProducts(v));
      load<Field[]>(QUOTE_INFO_KEY, (v) => Array.isArray(v) && setQuoteInfo(v));
      load<LoadItem[]>(LOADS_KEY, (v) => Array.isArray(v) && v.length && setLoads(v));
      load<PayStep[]>(PAY_KEY, (v) => Array.isArray(v) && v.length && setPaySteps(v));
      load<string[]>(DOCS_KEY, (v) => Array.isArray(v) && setDocs(v));
      load<string[]>(FLOORS_KEY, (v) => Array.isArray(v) && setFloors(v));
      load<Material[]>(MATERIALS_KEY, (v) => Array.isArray(v) && v.length && setMaterials(v));
      load<Record<string, string>>(IMAGES_KEY, (v) => v && setImages(v));
      load<Record<string, string>>(TEXTS_KEY, (v) => v && setTexts(v));
      const p = localStorage.getItem(PHONE_KEY);
      if (p) setPhone(p);
    } catch { /* ignore */ }
  }, []);

  const persist = <TV,>(key: string, value: TV, setter: (v: TV) => void) => {
    setter(value);
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  };
  const persistProducts = (list: Product[]) => persist(PRODUCTS_KEY, list, setProducts);
  const persistPhone = (p: string) => { setPhone(p); try { localStorage.setItem(PHONE_KEY, p); } catch { /* ignore */ } };
  const persistQuoteInfo = (v: Field[]) => persist(QUOTE_INFO_KEY, v, setQuoteInfo);
  const persistLoads = (v: LoadItem[]) => persist(LOADS_KEY, v, setLoads);
  const persistPay = (v: PayStep[]) => persist(PAY_KEY, v, setPaySteps);
  const persistDocs = (v: string[]) => persist(DOCS_KEY, v, setDocs);
  const persistFloors = (v: string[]) => persist(FLOORS_KEY, v, setFloors);
  const persistMaterials = (v: Material[]) => persist(MATERIALS_KEY, v, setMaterials);
  const persistImages = (v: Record<string, string>) => persist(IMAGES_KEY, v, setImages);
  const persistTexts = (v: Record<string, string>) => persist(TEXTS_KEY, v, setTexts);

  const setImage = (key: string, dataUrl: string) => {
    persistImages({ ...images, [key]: dataUrl });
  };
  const getImage = (key: string, fallback: string) => images[key] || fallback;

  const textCtx: TextCtxType = {
    get: (k, def) => (texts[k] !== undefined ? texts[k] : def),
    set: (k, v) => persistTexts({ ...texts, [k]: v }),
    editMode,
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  };

  const handleLogin = (pwd: string) => {
    if (pwd === SELLER_PASSWORD) {
      setEditMode(true);
      setShowLogin(false);
      return true;
    }
    return false;
  };
  const exitEdit = () => setEditMode(false);

  const updateProduct = (id: string, patch: Partial<Product>) => {
    persistProducts(products.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };
  const deleteProduct = (id: string) => {
    if (!confirm("Excluir este playground?")) return;
    persistProducts(products.filter((p) => p.id !== id));
  };
  const addProduct = () => {
    const id = "novo_" + Date.now();
    persistProducts([...products, {
      id, title: "Novo Playground", areaTag: "Área: 0x0 metros",
      image: product1Asset.url, priceOld: "R$ 0,00", priceNew: "R$ 0,00",
      tag: "Frete e instalação grátis", tagColor: "var(--green)",
      items: ["Item de exemplo — clique para editar"],
    }]);
    setTimeout(() => document.getElementById("prod-" + id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const resetAll = () => {
    if (!confirm("Restaurar tudo para o padrão? Isso apagará todas as edições.")) return;
    persistProducts(DEFAULT_PRODUCTS);
    persistPhone(DEFAULT_PHONE);
    persistQuoteInfo(DEFAULT_QUOTE_INFO);
    persistLoads(DEFAULT_LOADS);
    persistPay(DEFAULT_PAY_STEPS);
    persistDocs(DEFAULT_DOCS);
    persistFloors(DEFAULT_FLOORS);
    persistMaterials(DEFAULT_MATERIALS);
    persistImages({});
    persistTexts({});
  };

  /* -------- Export helpers -------- */



  const downloadPdf = async () => {
    try {
      const { generateQuotePdf } = await import("@/lib/pdf-quote");
      await generateQuotePdf({
        info: quoteInfo.map((f) => ({ label: f.label, value: f.value })),
        products: products.map((p) => ({
          title: p.title,
          areaTag: p.areaTag,
          image: images[p.id] ?? p.image,
          priceOld: p.priceOld,
          priceNew: p.priceNew,
          tag: p.tag,
          items: p.items,
        })),
        loads: loads.map((l) => ({ n: l.n, l: l.l, d: l.d })),
        paySteps: paySteps.map((s) => ({ num: s.num, title: s.title, desc: s.desc })),
        docs,
        floors,
        materials: materials.map((m) => ({ title: m.title, text: m.text })),
        audience: texts["capacidade.audience"] ??
          "Público-alvo: faixa etária de 0 a 4 anos com acompanhamento dos pais, de 04 a 12 com supervisão de um adulto.",
        delivery: texts["prazo.entrega"] ?? "20 dias úteis",
        freight: texts["frete.info"] ?? "Frete e instalação grátis até 700km da fábrica (SJRP)",
        phone,
        logo: logoAsset.url,
      });
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Não foi possível gerar o PDF: " + (err instanceof Error ? err.message : String(err)));
    }
  };



  const wa = waLink(phone);

  return (
    <TextCtx.Provider value={textCtx}>
      {/* NAV */}
      <div className="nav">
        <div className="nav-inner">
          <a className="brand" href="#" aria-label="Play Rio Playgrounds">
            <img className="brand-logo" src={logoAsset.url} alt="Play Rio Playgrounds" />
          </a>
          <div className="nav-right">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Alternar tema" title="Tema claro/escuro">
              {theme === "light" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
                </svg>
              )}
            </button>
            <button className="icon-btn" onClick={downloadPdf} aria-label="Baixar PDF" title="Baixar orçamento em PDF">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <text x="7.5" y="18" fontSize="6" fontWeight="700" stroke="none" fill="currentColor">PDF</text>
              </svg>
            </button>
            <button
              className="icon-btn"
              onClick={() => (editMode ? exitEdit() : setShowLogin(true))}
              aria-label="Área da vendedora"
              title={editMode ? "Sair do modo edição" : "Área da vendedora"}
            >
              {editMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 018 0v3" />
                </svg>
              )}
            </button>
            <a className="nav-cta" href={telLink(phone)}>
              ☎ <span>{phone}</span>
            </a>
          </div>
        </div>
      </div>

      {editMode && (
        <div className="edit-banner">
          <span>✎ Modo edição ativo — clique em qualquer texto ou foto para alterar</span>
          <button onClick={addProduct}>+ Novo playground</button>
          
          <button onClick={downloadPdf}>⬇ Baixar PDF</button>
          <button onClick={resetAll}>Restaurar padrão</button>
          <button onClick={exitEdit}>Sair</button>
        </div>
      )}

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <T k="hero.eyebrow" as="span" className="eyebrow">Orçamento de Playground</T>
            <h1>
              <T k="hero.h1a">Fabricando</T><br />
              <T k="hero.h1b" as="em">alegrias</T> <T k="hero.h1c">desde 1985</T>
            </h1>
            <T k="hero.sub" as="p" className="hero-sub">
              Mais de 40 anos fabricando brinquedos com tecnologia alemã. Estruturas em aço certificadas pela ABNT, prontas para transformar seu espaço em um mundo de diversão.
            </T>
            <div className="hero-badges">
              <span className="badge" style={{ "--badge-color": "var(--orange)" } as CSSProperties}>
                <span className="dot" style={{ background: "var(--orange)" }} />
                <T k="hero.badge1">Tecnologia alemã</T>
              </span>
              <span className="badge" style={{ "--badge-color": "var(--yellow)" } as CSSProperties}>
                <span className="dot" style={{ background: "var(--yellow)" }} />
                <T k="hero.badge2">Desde 1985</T>
              </span>
              <span className="badge" style={{ "--badge-color": "var(--green)" } as CSSProperties}>
                <span className="dot" style={{ background: "var(--green)" }} />
                <T k="hero.badge3">Entrega em 20 dias úteis</T>
              </span>
            </div>

            <QuoteInfoCard
              info={quoteInfo}
              editMode={editMode}
              onChange={persistQuoteInfo}
            />
          </div>
          <EditableImage
            className="hero-photo hover-frame"
            imgKey="hero"
            src={getImage("hero", heroAsset.url)}
            alt="Playground Play Rio instalado"
            editMode={editMode}
            onPick={setImage}
          />
        </div>
      </section>

      <svg className="wave" viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 C 240,60 480,0 720,20 C 960,40 1200,10 1440,35 L1440,60 L0,60 Z" fill="var(--indigo-deep)" />
      </svg>

      {/* TRUST */}
      <section className="trust">
        <div className="trust-inner">
          <div className="trust-item">
            <T k="trust.n1" as="div" className="num">40+</T>
            <T k="trust.l1" as="div" className="lbl">Anos fabricando playgrounds (desde 1985)</T>
          </div>
          <div className="trust-item">
            <T k="trust.n2" as="div" className="num">20 dias</T>
            <T k="trust.l2" as="div" className="lbl">Úteis para entrega após confirmação</T>
          </div>
          <div className="trust-item">
            <T k="trust.n3" as="div" className="num">700km</T>
            <T k="trust.l3" as="div" className="lbl">Frete e instalação grátis a partir de SJRP</T>
          </div>
          <div className="trust-item">
            <T k="trust.n4" as="div" className="num">ABNT</T>
            <T k="trust.l4" as="div" className="lbl">Conformidade com NBR 16071-2012</T>
          </div>
        </div>
      </section>

      {/* ORÇAMENTO */}
      <section className="section" id="orcamento">
        <div className="wrap">
          <div className="quote-grid">
            <div>
              <T k="quote.eyebrow" as="span" className="section-eyebrow">Condições do orçamento</T>
              <T k="quote.h2" as="h2" style={{ marginBottom: 28 }}>Tudo o que você precisa saber antes de fechar</T>
              <div className="quote-cards">
                <div className="quote-card" style={{ background: "var(--violet)" }}>
                  <T k="quote.card1.k" as="div" className="k">Prazo de entrega</T>
                  <T k="quote.card1.v" as="div" className="v">20 dias úteis</T>
                </div>
                <div className="quote-card" style={{ background: "#1F2A5C" }}>
                  <T k="quote.card2.k" as="div" className="k">Frete e instalação</T>
                  <T k="quote.card2.v" as="div" className="v">Grátis até 700km da fábrica (SJRP)</T>
                </div>
              </div>
            </div>
            <EditableImage
              className="quote-photo hover-frame"
              imgKey="quote"
              src={getImage("quote", quoteAsset.url)}
              alt="Playground Play Rio em detalhe"
              editMode={editMode}
              onPick={setImage}
            />
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="section" style={{ paddingTop: 20 }} id="produtos">
        <div className="wrap">
          <div className="section-head">
            <div>
              <T k="prod.eyebrow" as="span" className="section-eyebrow">Modelos disponíveis</T>
              <T k="prod.h2" as="h2">Escolha o playground ideal</T>
            </div>
            <T k="prod.note" as="p" className="section-note">
              Estruturas robustas e preços com desconto exclusivo neste orçamento.
            </T>
          </div>

          <div className="products">
            {products.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                alt={i % 2 === 1}
                editMode={editMode}
                onEdit={updateProduct}
                onDelete={deleteProduct}
                accentIndex={i}
              />
            ))}
            {editMode && (
              <button className="add-product-btn" onClick={addProduct}>
                <span className="plus">+</span>
                <span>Adicionar novo playground</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* MATERIALS */}
      <section className="section tight" id="materiais">
        <div className="wrap">
          <div className="section-head">
            <div>
              <T k="mat.eyebrow" as="span" className="section-eyebrow">Qualidade e durabilidade</T>
              <T k="mat.h2" as="h2">Materiais e especificações</T>
            </div>
            <T k="mat.note" as="p" className="section-note">
              Combinamos materiais premium para garantir segurança, durabilidade e cores vivas por muito mais tempo.
            </T>
          </div>
          <MaterialsCarousel
            materials={materials}
            editMode={editMode}
            onChange={persistMaterials}
          />
          <p className="carousel-hint">
            <T k="mat.hint">← Arraste ou aguarde a animação →</T>
          </p>
        </div>
      </section>

      {/* LOAD */}
      <section className="load-section" id="capacidade">
        <div className="load-glow" aria-hidden="true" />
        <div className="wrap">
          <T k="load.eyebrow" as="span" className="section-eyebrow" style={{ color: "var(--yellow)" }}>
            Segurança em números
          </T>
          <T k="load.h2" as="h2" style={{ color: "white", fontSize: "clamp(1.8rem,3.4vw,2.5rem)" }}>
            Capacidade de carga
          </T>
          <div className="load-grid shiny">
            {loads.map((it, i) => (
              <div key={it.id} className="load-card" style={{ "--i": i } as CSSProperties}>
                <div className="load-shine" aria-hidden="true" />
                <EditableSpan
                  className="n"
                  value={it.n}
                  editMode={editMode}
                  onCommit={(v) => persistLoads(loads.map((x) => x.id === it.id ? { ...x, n: v } : x))}
                />
                <EditableSpan
                  className="l"
                  value={it.l}
                  editMode={editMode}
                  onCommit={(v) => persistLoads(loads.map((x) => x.id === it.id ? { ...x, l: v } : x))}
                />
                <EditableSpan
                  className="d"
                  value={it.d}
                  editMode={editMode}
                  onCommit={(v) => persistLoads(loads.map((x) => x.id === it.id ? { ...x, d: v } : x))}
                />
                {editMode && (
                  <button className="load-del" onClick={() => persistLoads(loads.filter((x) => x.id !== it.id))} title="Remover">×</button>
                )}
              </div>
            ))}
            {editMode && (
              <button className="load-add" onClick={() => persistLoads([...loads, { id: "l" + Date.now(), n: "0kg", l: "Novo item", d: "Descrição" }])}>
                + Adicionar
              </button>
            )}
          </div>
          <T k="load.foot" as="p" className="load-foot">
            Público-alvo: faixa etária de 0 a 4 anos com acompanhamento dos pais, de 04 a 12 com supervisão de um adulto.
          </T>
        </div>
      </section>

      {/* PAYMENT */}
      <section className="section pay-section" id="condicoes">
        <div className="wrap">
          <div className="pay-head">
            <T k="pay.eyebrow" as="span" className="section-eyebrow">Como funciona o pagamento</T>
            <T k="pay.h2" as="h2">Condições comerciais</T>
            <T k="pay.note" as="p" className="section-note" style={{ maxWidth: "56ch" }}>
              Processo transparente, em três etapas simples. Confirme o pedido com um sinal e escolha a melhor forma de finalizar.
            </T>
          </div>

          <div className="pay-grid">
            {paySteps.map((step, i) => (
              <div key={step.id} className="pay-step" style={{ "--i": i } as CSSProperties}>
                <div className="pay-glow" aria-hidden="true" />
                <div className="pay-num-wrap">
                  <EditableSpan
                    className="pay-num"
                    value={step.num}
                    editMode={editMode}
                    onCommit={(v) => persistPay(paySteps.map((x) => x.id === step.id ? { ...x, num: v } : x))}
                  />
                </div>
                <EditableSpan
                  as="h3"
                  className="pay-title"
                  value={step.title}
                  editMode={editMode}
                  onCommit={(v) => persistPay(paySteps.map((x) => x.id === step.id ? { ...x, title: v } : x))}
                />
                <EditableSpan
                  className="pay-desc"
                  value={step.desc}
                  editMode={editMode}
                  onCommit={(v) => persistPay(paySteps.map((x) => x.id === step.id ? { ...x, desc: v } : x))}
                />
                {editMode && (
                  <button className="pay-del" onClick={() => persistPay(paySteps.filter((x) => x.id !== step.id))} title="Remover">×</button>
                )}
                {i < paySteps.length - 1 && <div className="pay-arrow" aria-hidden="true">→</div>}
              </div>
            ))}
            {editMode && (
              <button className="pay-add" onClick={() => persistPay([...paySteps, { id: "p" + Date.now(), num: String(paySteps.length + 1).padStart(2, "0"), title: "Nova etapa", desc: "Descrição" }])}>
                + Adicionar etapa
              </button>
            )}
          </div>
        </div>
      </section>

      {/* REQS */}
      <section className="section tight reqs-section" id="instalacao">
        <div className="wrap">
          <div className="section-head">
            <div>
              <T k="req.eyebrow" as="span" className="section-eyebrow">Antes da instalação</T>
              <T k="req.h2" as="h2">Requisitos de instalação</T>
            </div>
          </div>
          <div className="req-grid">
            <EditableList
              titleKey="req.docs.title"
              titleDefault="Documentação necessária"
              items={docs}
              onChange={persistDocs}
              editMode={editMode}
              accent="var(--violet)"
              icon={
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              }
            />
            <EditableList
              titleKey="req.floors.title"
              titleDefault="Tipos de piso aceitos"
              items={floors}
              onChange={persistFloors}
              editMode={editMode}
              accent="var(--sky)"
              icon={
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      <svg className="wave" viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,35 C 240,10 480,60 720,30 C 960,0 1200,45 1440,20 L1440,60 L0,60 Z" fill="var(--indigo-deep)" />
      </svg>

      {/* CONTACT */}
      <section className="contact" id="contato">
        <div className="contact-inner">
          <EditableImage
            className="contact-photo"
            imgKey="contact"
            src={getImage("contact", contactAsset.url)}
            alt="Crianças no playground Play Rio"
            editMode={editMode}
            onPick={setImage}
          >
            <div className="tagline">
              <T k="tag.1">Seguro,</T><br />
              <T k="tag.2">Colorido,</T><br />
              <T k="tag.3">Divertido</T>
            </div>
          </EditableImage>
          <div className="contact-body">
            <img className="contact-logo" src={logoAsset.url} alt="Play Rio Playgrounds" />
            <T k="contact.h2" as="h2">Entre em contato</T>
            <div className="contact-list">
              <div className="contact-row">
                <div className="contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div>
                  <T k="contact.addr.k" as="div" className="k">Endereço</T>
                  <div className="v">
                    <T k="contact.addr.line1">Rua Flavio Bianchini, 8445 — Amoras 2</T><br />
                    <T k="contact.addr.line2">São José do Rio Preto-SP · CEP 15062-610</T>
                  </div>
                </div>
              </div>
              <div className="contact-row">
                <div className="contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92V21a1 1 0 01-1.1 1A19 19 0 012 4.1 1 1 0 013 3h4.09a1 1 0 011 .75l1 4a1 1 0 01-.29 1L7 10.29a16 16 0 006.71 6.71l1.54-1.8a1 1 0 011-.29l4 1a1 1 0 01.75 1z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <T k="contact.tel.k" as="div" className="k">Telefone / WhatsApp</T>
                  <div className="v">
                    {editMode ? (
                      <input
                        className="phone-input"
                        type="tel"
                        value={phone}
                        onChange={(e) => persistPhone(e.target.value)}
                        placeholder="(17) 3305-3929"
                      />
                    ) : (
                      phone
                    )}
                  </div>
                </div>
              </div>
              <div className="contact-row">
                <div className="contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </div>
                <div>
                  <T k="contact.hours.k" as="div" className="k">Fale conosco</T>
                  <T k="contact.hours.v" as="div" className="v">Atendimento de segunda a sexta, 8h às 18h</T>
                </div>
              </div>
            </div>
            <a className="contact-cta" href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              <T k="contact.cta">Falar com a Play Rio agora</T>
            </a>
          </div>
        </div>
        <div className="foot-line">
          <T k="foot.1">Play Rio Brinquedos — Fabricando alegrias desde 1985.</T>
          <T k="foot.2">Mais de 40 anos · Tecnologia alemã · Entrega em 20 dias úteis.</T>
        </div>
      </section>

      <a className="wa-float" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
        <span className="wa-pulse" aria-hidden="true" />
        <WhatsAppIcon />
      </a>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSubmit={handleLogin} />}
    </TextCtx.Provider>
  );
}

/* ================================================================
   QUOTE INFO CARD
   ================================================================ */
function QuoteInfoCard({
  info, editMode, onChange,
}: {
  info: Field[];
  editMode: boolean;
  onChange: (v: Field[]) => void;
}) {
  const updateField = (id: string, patch: Partial<Field>) =>
    onChange(info.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const removeField = (id: string) => onChange(info.filter((f) => f.id !== id));
  const addField = () =>
    onChange([...info, { id: "f" + Date.now(), label: "Novo campo", value: "" }]);

  const hasContent = info.some((f) => f.value.trim());
  if (!editMode && !hasContent) return null;

  return (
    <div className="quote-info">
      <div className="quote-info-head">
        <span className="quote-info-eyebrow">Dados do orçamento</span>
        {editMode && (
          <button className="add-field-btn" onClick={addField}>+ Adicionar campo</button>
        )}
      </div>
      <div className="quote-info-grid">
        {info.map((f) => (
          <div key={f.id} className="quote-info-field">
            <EditableSpan
              className="qi-label"
              value={f.label}
              editMode={editMode}
              onCommit={(v) => updateField(f.id, { label: v })}
            />
            <EditableSpan
              className="qi-value"
              value={f.value || (editMode ? "—" : "")}
              editMode={editMode}
              onCommit={(v) => updateField(f.id, { value: v === "—" ? "" : v })}
              placeholder="—"
            />
            {editMode && (
              <button className="field-del" onClick={() => removeField(f.id)} title="Remover campo">×</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   EDITABLE LIST
   ================================================================ */
function EditableList({
  titleKey, titleDefault, items, onChange, editMode, accent, icon,
}: {
  titleKey: string;
  titleDefault: string;
  items: string[];
  onChange: (v: string[]) => void;
  editMode: boolean;
  accent: string;
  icon: ReactNode;
}) {
  return (
    <div className="req-card shiny" style={{ "--accent": accent } as CSSProperties}>
      <div className="req-shine" aria-hidden="true" />
      <div className="req-head">
        <div className="req-icon">{icon}</div>
        <T k={titleKey} as="h4">{titleDefault}</T>
      </div>
      <ul>
        {items.map((it, idx) => (
          <li key={idx}>
            <EditableSpan
              value={it}
              editMode={editMode}
              onCommit={(v) => onChange(items.map((x, i) => (i === idx ? v : x)))}
            />
            {editMode && (
              <button className="item-del" onClick={() => onChange(items.filter((_, i) => i !== idx))} title="Remover">×</button>
            )}
          </li>
        ))}
      </ul>
      {editMode && (
        <button className="add-item-btn" onClick={() => onChange([...items, "Novo item"])}>
          + Adicionar
        </button>
      )}
    </div>
  );
}

/* ================================================================
   EDITABLE IMAGE
   ================================================================ */
function EditableImage({
  className, imgKey, src, alt, editMode, onPick, children,
}: {
  className?: string;
  imgKey: string;
  src: string;
  alt: string;
  editMode: boolean;
  onPick: (key: string, dataUrl: string) => void;
  children?: ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Imagem grande demais (limite 3MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onPick(imgKey, String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <div className={className} style={{ position: "relative" }}>
      <img src={src} alt={alt} />
      {children}
      {editMode && (
        <>
          <button className="photo-edit-btn" onClick={() => fileRef.current?.click()} title="Trocar foto">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Trocar foto
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pick} />
        </>
      )}
    </div>
  );
}

/* ================================================================
   PRODUCT CARD
   ================================================================ */
function ProductCard({
  product, alt, editMode, onEdit, onDelete, accentIndex,
}: {
  product: Product;
  alt: boolean;
  editMode: boolean;
  onEdit: (id: string, patch: Partial<Product>) => void;
  onDelete: (id: string) => void;
  accentIndex: number;
}) {
  const accents = ["var(--orange)", "var(--sky)", "var(--violet)", "var(--green)", "var(--yellow)"];
  const accent = accents[accentIndex % accents.length];
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert("Imagem grande demais (limite 3MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => onEdit(product.id, { image: String(reader.result) });
    reader.readAsDataURL(file);
  };
  const updateItem = (idx: number, value: string) => {
    const next = [...product.items];
    next[idx] = value;
    onEdit(product.id, { items: next });
  };
  const removeItem = (idx: number) => onEdit(product.id, { items: product.items.filter((_, i) => i !== idx) });
  const addItem = () => onEdit(product.id, { items: [...product.items, "Novo item"] });

  const photo = (
    <div className="product-photo">
      <img src={product.image} alt={product.title} />
      <EditableSpan
        className="area-tag"
        value={product.areaTag}
        editMode={editMode}
        onCommit={(v) => onEdit(product.id, { areaTag: v })}
      />
      {editMode && (
        <>
          <button className="photo-edit-btn" onClick={() => fileRef.current?.click()} title="Trocar foto">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Trocar foto
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickImage} />
        </>
      )}
    </div>
  );

  const body = (
    <div className="product-body">
      <EditableSpan as="h3" value={product.title} editMode={editMode} onCommit={(v) => onEdit(product.id, { title: v })} />
      <div className="price-row">
        <EditableSpan className="price-old mono" value={product.priceOld} editMode={editMode} onCommit={(v) => onEdit(product.id, { priceOld: v })} />
        <EditableSpan className="price-new" value={product.priceNew} editMode={editMode} onCommit={(v) => onEdit(product.id, { priceNew: v })} />
      </div>
      <div className="tag-row">
        <EditableSpan className="price-tag" value={product.tag} editMode={editMode} onCommit={(v) => onEdit(product.id, { tag: v })} style={{ background: product.tagColor }} />
        {editMode && (
          <select className="tag-color-select" value={product.tagColor} onChange={(e) => onEdit(product.id, { tagColor: e.target.value })} title="Cor da tag">
            {TAG_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        )}
      </div>
      <ul className="comp-list">
        {product.items.map((it, idx) => (
          <li key={idx}>
            <EditableSpan value={it} editMode={editMode} onCommit={(v) => updateItem(idx, v)} />
            {editMode && <button className="item-del" onClick={() => removeItem(idx)} title="Remover">×</button>}
          </li>
        ))}
      </ul>
      {editMode && <button className="add-item-btn" onClick={addItem}>+ Adicionar item</button>}
    </div>
  );

  return (
    <div
      id={"prod-" + product.id}
      className={`product-card hover-frame${alt ? " alt" : ""}`}
      style={{ "--accent": accent } as CSSProperties}
    >
      {editMode && (
        <button className="delete-product-btn" onClick={() => onDelete(product.id)} title="Excluir">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>
      )}
      {alt ? <>{body}{photo}</> : <>{photo}{body}</>}
    </div>
  );
}

/* ================================================================
   EDITABLE SPAN
   ================================================================ */
function EditableSpan({
  value, editMode, onCommit, className, as = "span", style, placeholder,
}: {
  value: string;
  editMode: boolean;
  onCommit: (v: string) => void;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "em" | "div";
  style?: CSSProperties;
  placeholder?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) ref.current.textContent = value;
  }, [value]);
  const Tag = as as "span";
  return (
    <Tag
      ref={ref as never}
      className={className}
      style={style}
      contentEditable={editMode}
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      onBlur={(e) => {
        const v = (e.currentTarget as HTMLElement).textContent?.trim() ?? "";
        if (v !== value) onCommit(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && as !== "h3" && as !== "p" && as !== "div") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}

/* ================================================================
   MATERIALS CARROUSEL
   ================================================================ */
function MaterialsCarousel({
  materials, editMode, onChange,
}: {
  materials: Material[];
  editMode: boolean;
  onChange: (v: Material[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ isDown: false, startX: 0, startScroll: 0, paused: false });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const wrap = () => {
      const half = el.scrollWidth / 2;
      if (half <= 0) return;
      if (el.scrollLeft >= half) el.scrollLeft -= half;
      else if (el.scrollLeft < 0) el.scrollLeft += half;
    };

    let last = performance.now();
    const SPEED = 30;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!state.current.isDown && !state.current.paused && !editMode) {
        el.scrollLeft += SPEED * dt;
        wrap();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const pause = () => { state.current.paused = true; };
    const resume = () => { state.current.paused = false; };
    const start = (clientX: number) => {
      state.current.isDown = true;
      state.current.startX = clientX;
      state.current.startScroll = el.scrollLeft;
      el.classList.add("dragging");
    };
    const move = (clientX: number) => {
      if (!state.current.isDown) return;
      el.scrollLeft = state.current.startScroll - (clientX - state.current.startX);
      wrap();
    };
    const end = () => {
      state.current.isDown = false;
      el.classList.remove("dragging");
    };

    const onPointerDown = (e: PointerEvent) => {
      pause(); start(e.clientX);
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!state.current.isDown) return;
      e.preventDefault(); move(e.clientX);
    };
    const onPointerUp = (e: PointerEvent) => {
      end();
      try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    const onPointerLeave = () => { end(); resume(); };
    const onPointerEnter = () => { pause(); };
    const onWheel = () => { pause(); };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("pointerenter", onPointerEnter);
    el.addEventListener("wheel", onWheel, { passive: true });
    const onWindowUp = () => end();
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("blur", onWindowUp);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("pointerenter", onPointerEnter);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("blur", onWindowUp);
    };
  }, [editMode]);

  const items = editMode ? materials : [...materials, ...materials];

  const updateMat = (id: string, patch: Partial<Material>) =>
    onChange(materials.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMat = (id: string) => onChange(materials.filter((m) => m.id !== id));
  const addMat = () =>
    onChange([...materials, { id: "m" + Date.now(), icon: "??", color: "var(--sky)", title: "Novo material", text: "Descrição do material." }]);

  return (
    <>
      <div className="materials-track" ref={ref} style={{ touchAction: "pan-y" }}>
        {items.map((m, i) => (
          <div
            key={m.id + "-" + i}
            className="mat-card"
            style={{ "--accent": m.color } as CSSProperties}
          >
            <EditableSpan
              className="mat-icon"
              value={m.icon}
              editMode={editMode}
              onCommit={(v) => updateMat(m.id, { icon: v })}
            />
            <EditableSpan
              as="h4"
              value={m.title}
              editMode={editMode}
              onCommit={(v) => updateMat(m.id, { title: v })}
            />
            <EditableSpan
              as="p"
              value={m.text}
              editMode={editMode}
              onCommit={(v) => updateMat(m.id, { text: v })}
            />
            {editMode && (
              <button className="mat-del" onClick={() => removeMat(m.id)} title="Remover" style={{
                position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%",
                border: "none", background: "rgba(239,68,68,.9)", color: "white", cursor: "pointer", fontWeight: 700,
              }}>×</button>
            )}
          </div>
        ))}
        {editMode && (
          <button className="mat-add" onClick={addMat} style={{
            flex: "0 0 auto", minWidth: 200, borderRadius: 24, border: "2px dashed var(--border)",
            background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: 20,
          }}>+ Adicionar material</button>
        )}
      </div>
    </>
  );
}

/* ================================================================
   LOGIN MODAL
   ================================================================ */
function LoginModal({
  onClose, onSubmit,
}: {
  onClose: () => void;
  onSubmit: (pwd: string) => boolean;
}) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>Área da vendedora</h3>
        <p>Digite a senha para liberar a edição.</p>
        <input
          type="password"
          placeholder="Senha"
          value={pwd}
          autoFocus
          onChange={(e) => { setPwd(e.target.value); setErr(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { if (!onSubmit(pwd)) setErr(true); } }}
        />
        {err && <div className="modal-error">Senha incorreta. Tente novamente.</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { if (!onSubmit(pwd)) setErr(true); }}>Entrar</button>
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M19.1 17.6c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-.9-.8-1.6-1.8-1.8-2.2-.2-.3 0-.5.1-.7.1-.1.3-.4.5-.6.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5-.2 0-.4 0-.6 0s-.5.1-.8.4c-.3.3-1.1 1.1-1.1 2.6 0 1.6 1.1 3.1 1.3 3.3.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.8.3 1.5.2 2 .1.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3zM16.1 3C9 3 3.3 8.7 3.3 15.8c0 2.3.6 4.4 1.7 6.3L3 29l7.1-1.9c1.8 1 3.9 1.5 6 1.5h.1c7 0 12.7-5.7 12.7-12.8C29 8.7 23.3 3 16.1 3zm0 23.5c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.2 1.1 1.1-4.1-.3-.4c-1.1-1.7-1.6-3.7-1.6-5.7 0-5.9 4.8-10.6 10.7-10.6 2.9 0 5.5 1.1 7.5 3.1s3.1 4.7 3.1 7.5c.1 5.9-4.6 10.8-10.5 10.8z" />
    </svg>
  );
}
