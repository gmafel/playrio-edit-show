import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from "react";

import heroAsset from "@/assets/hero.jpg.asset.json";
import quoteAsset from "@/assets/quote.jpg.asset.json";
import product1Asset from "@/assets/product1.jpg.asset.json";
import product2Asset from "@/assets/product2.jpg.asset.json";
import product3Asset from "@/assets/product3.jpg.asset.json";
import termsAsset from "@/assets/terms.jpg.asset.json";
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

/** Converte "(17) 3305-3929" → "551733053929" (E.164 sem +) */
function phoneToWa(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "5517333053929";
  // se já começa com 55 e tem 12-13 dígitos, usa direto
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
   PRODUCT MODEL
   ================================================================ */
type Product = {
  id: string;
  title: string;
  areaTag: string;
  image: string; // URL or data URL
  priceOld: string;
  priceNew: string;
  tag: string;
  tagColor: string;
  items: string[];
};

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

/* ================================================================
   MATERIAIS - carrossel
   ================================================================ */
const MATERIALS = [
  { icon: "Aç", color: "var(--orange)", title: "Aço estrutural", text: "Perfis de aço com pintura eletrostática epóxi que repele calor e mantém as cores vivas por muito mais tempo." },
  { icon: "Fi", color: "var(--sky)", title: "Fibra de vidro", text: "Escorregadores, telhadinhos e rapel em fibra de alta resistência, próprios para uso intensivo ao ar livre." },
  { icon: "Pl", color: "var(--violet)", title: "Plástico rotomoldado", text: "Peças coloridas, leves e resistentes ao impacto — sem farpas, sem quinas, seguras para as crianças." },
  { icon: "Co", color: "var(--green)", title: "Cordas náuticas", text: "Cordas trançadas com alma de aço, ideais para escaladas, teias e balanços de alto tráfego." },
  { icon: "Ma", color: "var(--yellow)", title: "Madeira plástica", text: "Alternativa ecológica que substitui a madeira tradicional: não racha, não empena e não precisa de manutenção." },
  { icon: "Al", color: "#B14AED", title: "Alumínio anticorrosivo", text: "Componentes de acabamento em alumínio tratado — leve, durável e imune à ferrugem em áreas úmidas." },
  { icon: "In", color: "#00B8A9", title: "Inox 304", text: "Parafusos, fixadores e escadas em aço inox 304 — segurança estrutural e durabilidade máxima." },
];

/* ================================================================
   PAGE
   ================================================================ */
function OrcamentoPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [phone, setPhone] = useState<string>(DEFAULT_PHONE);
  const [editMode, setEditMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    try {
      const t = (localStorage.getItem(THEME_KEY) as "light" | "dark" | null) ?? "light";
      setTheme(t);
      document.documentElement.setAttribute("data-theme", t);
      const raw = localStorage.getItem(PRODUCTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Product[];
        if (Array.isArray(parsed) && parsed.length) setProducts(parsed);
      }
      const p = localStorage.getItem(PHONE_KEY);
      if (p) setPhone(p);
    } catch { /* ignore */ }
  }, []);

  const persistProducts = (list: Product[]) => {
    setProducts(list);
    try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list)); } catch { /* quota */ }
  };
  const persistPhone = (p: string) => {
    setPhone(p);
    try { localStorage.setItem(PHONE_KEY, p); } catch { /* ignore */ }
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
    if (!confirm("Excluir este playground? Esta ação não pode ser desfeita.")) return;
    persistProducts(products.filter((p) => p.id !== id));
  };
  const addProduct = () => {
    const id = "novo_" + Date.now();
    persistProducts([
      ...products,
      {
        id,
        title: "Novo Playground",
        areaTag: "Área: 0x0 metros",
        image: product1Asset.url,
        priceOld: "R$ 0,00",
        priceNew: "R$ 0,00",
        tag: "Frete e instalação grátis",
        tagColor: "var(--green)",
        items: ["Item de exemplo — clique para editar"],
      },
    ]);
    // scroll para o novo card
    setTimeout(() => {
      const el = document.getElementById("prod-" + id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const resetAll = () => {
    if (!confirm("Restaurar todos os playgrounds e telefone para o padrão?")) return;
    persistProducts(DEFAULT_PRODUCTS);
    persistPhone(DEFAULT_PHONE);
  };

  const wa = waLink(phone);

  return (
    <>
      {/* NAV */}
      <div className="nav">
        <div className="nav-inner">
          <a className="brand" href="#" aria-label="Play Rio Playgrounds">
            <img className="brand-logo" src={logoAsset.url} alt="Play Rio Playgrounds" />
          </a>
          <div className="nav-right">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              title="Alternar tema claro ou escuro"
            >
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
          <button onClick={resetAll}>Restaurar padrão</button>
          <button onClick={exitEdit}>Sair</button>
        </div>
      )}

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <span className="eyebrow">Orçamento de Playground</span>
            <h1>
              Fabricando<br />
              <em>alegrias</em> desde 1985
            </h1>
            <p className="hero-sub">
              Mais de 40 anos de tecnologia alemã em fabricação de playgrounds. Estruturas em aço com pintura eletrostática,
              certificadas pela ABNT, prontas para transformar seu espaço em um mundo de diversão.
            </p>
            <div className="hero-badges">
              <span className="badge" style={{ "--badge-color": "var(--orange)" } as CSSProperties}>
                <span className="dot" style={{ background: "var(--orange)" }} />
                Tecnologia alemã
              </span>
              <span className="badge" style={{ "--badge-color": "var(--yellow)" } as CSSProperties}>
                <span className="dot" style={{ background: "var(--yellow)" }} />
                Desde 1985
              </span>
              <span className="badge" style={{ "--badge-color": "var(--green)" } as CSSProperties}>
                <span className="dot" style={{ background: "var(--green)" }} />
                Garantia de 1 ano
              </span>
            </div>
          </div>
          <div className="hero-photo hover-frame">
            <img src={heroAsset.url} alt="Playground Play Rio instalado" />
          </div>
        </div>
      </section>

      <svg className="wave" viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 C 240,60 480,0 720,20 C 960,40 1200,10 1440,35 L1440,60 L0,60 Z" fill="var(--indigo-deep)" />
      </svg>

      {/* TRUST */}
      <section className="trust">
        <div className="trust-inner">
          <div className="trust-item"><div className="num">40+</div><div className="lbl">Anos fabricando playgrounds (desde 1985)</div></div>
          <div className="trust-item"><div className="num">30–40</div><div className="lbl">Dias para entrega após confirmação</div></div>
          <div className="trust-item"><div className="num">01 ano</div><div className="lbl">De garantia de fabricação</div></div>
          <div className="trust-item"><div className="num">ABNT</div><div className="lbl">Conformidade com NBR 16071-2012</div></div>
        </div>
      </section>

      {/* ORÇAMENTO */}
      <section className="section" id="orcamento">
        <div className="wrap">
          <div className="quote-grid">
            <div>
              <span className="section-eyebrow">Condições do orçamento</span>
              <h2 style={{ marginBottom: 28 }}>Tudo o que você precisa saber antes de fechar</h2>
              <div className="quote-cards">
                <div className="quote-card" style={{ background: "var(--violet)" }}>
                  <div className="k">Prazo de entrega</div>
                  <div className="v">30 a 40 dias</div>
                </div>
                <div className="quote-card">
                  <div className="k">Garantia</div>
                  <div className="v">01 ano de fabricação</div>
                </div>
                <div className="quote-card" style={{ background: "#1F2A5C" }}>
                  <div className="k">Frete e instalação</div>
                  <div className="v">Inclusos no valor</div>
                </div>
              </div>
            </div>
            <div className="quote-photo hover-frame">
              <img src={quoteAsset.url} alt="Playground Play Rio em detalhe" />
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="section" style={{ paddingTop: 20 }} id="produtos">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">Modelos disponíveis</span>
              <h2>Escolha o playground ideal</h2>
            </div>
            <p className="section-note">
              Estruturas robustas, com componentes intercambiáveis e preços com desconto exclusivo neste orçamento.
            </p>
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

      {/* MATERIALS CARROUSEL */}
      <section className="section tight" id="materiais">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">Qualidade e durabilidade</span>
              <h2>Materiais e especificações</h2>
            </div>
            <p className="section-note">
              Combinamos materiais premium para garantir segurança, durabilidade e cores vivas por muito mais tempo.
            </p>
          </div>
          <MaterialsCarousel />
          <p className="carousel-hint">
            <span>← Arraste para ver mais →</span>
          </p>
        </div>
      </section>

      {/* LOAD CAPACITY */}
      <section className="load-section" id="capacidade">
        <div className="wrap">
          <span className="section-eyebrow" style={{ color: "var(--yellow)" }}>
            Segurança em números
          </span>
          <h2 style={{ color: "white", fontSize: "clamp(1.8rem,3.4vw,2.5rem)" }}>Capacidade de carga</h2>
          <div className="load-grid">
            <div className="load-item"><div className="n">130kg</div><div className="l">Balanço teen</div><div className="d">Capacidade máxima de carga</div></div>
            <div className="load-item"><div className="n">50kg</div><div className="l">Balanço baby</div><div className="d">Capacidade máxima de carga</div></div>
            <div className="load-item"><div className="n">100kg</div><div className="l">Escorregadores</div><div className="d">Capacidade máxima de carga</div></div>
            <div className="load-item"><div className="n">80kg</div><div className="l">Rapel e corda</div><div className="d">Capacidade máxima de carga</div></div>
          </div>
          <p className="load-foot">
            Público-alvo: faixa etária de 04 a 14 anos. Crianças abaixo de 04 anos devem utilizar sob supervisão de um adulto.
          </p>
        </div>
      </section>

      {/* TERMS */}
      <section className="section" id="condicoes">
        <div className="wrap">
          <div className="terms-grid">
            <div className="terms-photo hover-frame">
              <img src={termsAsset.url} alt="Instalação Play Rio" />
            </div>
            <div>
              <span className="section-eyebrow">Como funciona o pagamento</span>
              <h2 style={{ marginBottom: 8 }}>Condições comerciais</h2>
              <div className="term-step">
                <div className="term-num">01</div>
                <div><h4>Sinal inicial</h4><p>R$ 500,00 para confirmação do pedido.</p></div>
              </div>
              <div className="term-step">
                <div className="term-num">02</div>
                <div><h4>Restante do pagamento</h4><p>À vista, no ato da entrega.</p></div>
              </div>
              <div className="term-step">
                <div className="term-num">03</div>
                <div><h4>Parcelamento disponível</h4><p>Até 10x sem juros (cheque ou boleto bancário com CNPJ).</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REQS */}
      <section className="section tight" id="instalacao">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">Antes da instalação</span>
              <h2>Requisitos de instalação</h2>
            </div>
          </div>
          <div className="req-grid">
            <div className="req-card">
              <h4>Documentação necessária</h4>
              <ul>
                <li>Nome completo</li>
                <li>Endereço completo</li>
                <li>CPF/CNPJ</li>
                <li>Fotos/vídeos do local de instalação</li>
              </ul>
            </div>
            <div className="req-card alt">
              <h4>Tipos de piso aceitos</h4>
              <ul>
                <li>Grama</li>
                <li>Terra</li>
                <li>Areia</li>
                <li>Concreto</li>
                <li>Piso</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <svg className="wave" viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,35 C 240,10 480,60 720,30 C 960,0 1200,45 1440,20 L1440,60 L0,60 Z" fill="var(--indigo-deep)" />
      </svg>

      {/* CONTACT */}
      <section className="contact" id="contato">
        <div className="contact-inner">
          <div className="contact-photo">
            <img src={contactAsset.url} alt="Crianças no playground Play Rio" />
            <div className="tagline">
              <span>Seguro,</span><br />
              <span>Colorido,</span><br />
              <span>Divertido</span>
            </div>
          </div>
          <div className="contact-body">
            <img className="contact-logo" src={logoAsset.url} alt="Play Rio Playgrounds" />
            <h2>Entre em contato</h2>
            <div className="contact-list">
              <div className="contact-row">
                <div className="contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div>
                  <div className="k">Endereço</div>
                  <div className="v">
                    Rua Flavio Bianchini, 8445 — Amoras 2<br />
                    São José do Rio Preto-SP · CEP 15062-610
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
                  <div className="k">Telefone / WhatsApp</div>
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
                  <div className="k">Fale conosco</div>
                  <div className="v">Atendimento de segunda a sexta, 8h às 18h</div>
                </div>
              </div>
            </div>
            <a className="contact-cta" href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              Falar com a Play Rio agora
            </a>
          </div>
        </div>
        <div className="foot-line">
          <span>Play Rio Brinquedos — Fabricando alegrias desde 1985.</span>
          <span>Mais de 40 anos · Tecnologia alemã · Garantia de 01 ano.</span>
        </div>
      </section>

      {/* FLOATING WA */}
      <a className="wa-float" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
        <span className="wa-pulse" aria-hidden="true" />
        <WhatsAppIcon />
      </a>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSubmit={handleLogin} />}
    </>
  );
}

/* ================================================================
   PRODUCT CARD (com edição completa)
   ================================================================ */
function ProductCard({
  product,
  alt,
  editMode,
  onEdit,
  onDelete,
  accentIndex,
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
    if (file.size > 3 * 1024 * 1024) {
      alert("Imagem grande demais (limite 3MB). Escolha uma foto menor.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onEdit(product.id, { image: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  const updateItem = (idx: number, value: string) => {
    const next = [...product.items];
    next[idx] = value;
    onEdit(product.id, { items: next });
  };
  const removeItem = (idx: number) => {
    onEdit(product.id, { items: product.items.filter((_, i) => i !== idx) });
  };
  const addItem = () => {
    onEdit(product.id, { items: [...product.items, "Novo item"] });
  };

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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onPickImage}
          />
        </>
      )}
    </div>
  );

  const body = (
    <div className="product-body">
      <EditableSpan
        as="h3"
        className=""
        value={product.title}
        editMode={editMode}
        onCommit={(v) => onEdit(product.id, { title: v })}
      />
      <div className="price-row">
        <EditableSpan
          className="price-old mono"
          value={product.priceOld}
          editMode={editMode}
          onCommit={(v) => onEdit(product.id, { priceOld: v })}
        />
        <EditableSpan
          className="price-new"
          value={product.priceNew}
          editMode={editMode}
          onCommit={(v) => onEdit(product.id, { priceNew: v })}
        />
      </div>
      <div className="tag-row">
        <EditableSpan
          className="price-tag"
          value={product.tag}
          editMode={editMode}
          onCommit={(v) => onEdit(product.id, { tag: v })}
          style={{ background: product.tagColor }}
        />
        {editMode && (
          <select
            className="tag-color-select"
            value={product.tagColor}
            onChange={(e) => onEdit(product.id, { tagColor: e.target.value })}
            title="Cor da tag"
          >
            {TAG_COLORS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        )}
      </div>
      <ul className="comp-list">
        {product.items.map((it, idx) => (
          <li key={idx}>
            <EditableSpan
              value={it}
              editMode={editMode}
              onCommit={(v) => updateItem(idx, v)}
            />
            {editMode && (
              <button className="item-del" onClick={() => removeItem(idx)} title="Remover item">×</button>
            )}
          </li>
        ))}
      </ul>
      {editMode && (
        <button className="add-item-btn" onClick={addItem}>+ Adicionar item</button>
      )}
    </div>
  );

  return (
    <div
      id={"prod-" + product.id}
      className={`product-card hover-frame${alt ? " alt" : ""}`}
      style={{ "--accent": accent } as CSSProperties}
    >
      {editMode && (
        <button className="delete-product-btn" onClick={() => onDelete(product.id)} title="Excluir playground">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>
      )}
      {alt ? (
        <>
          {body}
          {photo}
        </>
      ) : (
        <>
          {photo}
          {body}
        </>
      )}
    </div>
  );
}

/* ================================================================
   EDITABLE SPAN
   ================================================================ */
function EditableSpan({
  value,
  editMode,
  onCommit,
  className,
  as = "span",
  style,
}: {
  value: string;
  editMode: boolean;
  onCommit: (v: string) => void;
  className?: string;
  as?: "span" | "h3";
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
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
      onBlur={(e) => {
        const v = (e.currentTarget as HTMLElement).textContent?.trim() ?? "";
        if (v && v !== value) onCommit(v);
        else (e.currentTarget as HTMLElement).textContent = value;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && as !== "h3") {
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
function MaterialsCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => {
      state.current.isDown = true;
      state.current.moved = false;
      state.current.startX = e.pageX - el.offsetLeft;
      state.current.scrollLeft = el.scrollLeft;
      el.classList.add("dragging");
    };
    const onLeave = () => { state.current.isDown = false; el.classList.remove("dragging"); };
    const onUp = () => { state.current.isDown = false; el.classList.remove("dragging"); };
    const onMove = (e: MouseEvent) => {
      if (!state.current.isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - state.current.startX) * 1.4;
      if (Math.abs(walk) > 4) state.current.moved = true;
      el.scrollLeft = state.current.scrollLeft - walk;
    };
    el.addEventListener("mousedown", onDown);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("mouseup", onUp);
    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("mouseup", onUp);
      el.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="materials-track" ref={ref}>
      {MATERIALS.map((m) => (
        <div
          key={m.title}
          className="mat-card"
          style={{ "--accent": m.color } as CSSProperties}
        >
          <div className="mat-icon">{m.icon}</div>
          <h4>{m.title}</h4>
          <p>{m.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   LOGIN MODAL
   ================================================================ */
function LoginModal({
  onClose,
  onSubmit,
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
        <p>Digite a senha para liberar a edição dos playgrounds, fotos, preços e telefone.</p>
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
          <button
            className="btn btn-primary"
            onClick={() => { if (!onSubmit(pwd)) setErr(true); }}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   WHATSAPP ICON
   ================================================================ */
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16.003 3C8.82 3 3 8.82 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A12.94 12.94 0 0016.003 29C23.18 29 29 23.18 29 16S23.18 3 16.003 3zm0 23.6c-1.98 0-3.92-.53-5.62-1.53l-.4-.24-3.96 1.04 1.06-3.86-.26-.4A10.55 10.55 0 015.4 16c0-5.85 4.76-10.6 10.6-10.6 5.85 0 10.6 4.75 10.6 10.6 0 5.85-4.75 10.6-10.6 10.6zm5.82-7.94c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.72.16-.21.32-.82 1.03-1.01 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.5.14-.66.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.53-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64 0 1.56 1.14 3.06 1.3 3.27.16.21 2.24 3.42 5.44 4.79.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.37.19-1.51-.08-.13-.29-.21-.61-.37z" />
    </svg>
  );
}
