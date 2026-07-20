import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";

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
   - Senha da vendedora (troque abaixo antes de publicar)
   - WhatsApp: número no formato internacional (Brasil = 55 + DDD + numero)
   ================================================================ */
const SELLER_PASSWORD = "260385";
const WHATSAPP_NUMBER = "551733053929"; // (17) 3305-3929
const WHATSAPP_MSG = encodeURIComponent(
  "Olá! Vim pelo orçamento online da Play Rio e gostaria de mais informações."
);
const WA_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

/* ================================================================
   PRICES (default) - editáveis pela vendedora quando logada
   ================================================================ */
type PriceMap = Record<string, { old: string; new: string }>;
const DEFAULT_PRICES: PriceMap = {
  big_steel_master: { old: "R$ 19.990,00", new: "R$ 16.990,00" },
  master_118: { old: "R$ 25.990,00", new: "R$ 22.990,00" },
  master_121: { old: "R$ 25.990,00", new: "R$ 22.990,00" },
};
const PRICES_KEY = "playrio_prices_v1";
const THEME_KEY = "playrio_theme";

/* ================================================================
   MATERIAIS - carrossel
   ================================================================ */
const MATERIALS = [
  {
    icon: "Aç",
    color: "var(--orange)",
    title: "Aço estrutural",
    text: "Perfis de aço com pintura eletrostática epóxi que repele calor e mantém as cores vivas por muito mais tempo.",
  },
  {
    icon: "Fi",
    color: "var(--sky)",
    title: "Fibra de vidro",
    text: "Escorregadores, telhadinhos e rapel em fibra de alta resistência, próprios para uso intensivo ao ar livre.",
  },
  {
    icon: "Pl",
    color: "var(--violet)",
    title: "Plástico rotomoldado",
    text: "Peças coloridas, leves e resistentes ao impacto — sem farpas, sem quinas, seguras para as crianças.",
  },
  {
    icon: "Co",
    color: "var(--green)",
    title: "Cordas náuticas",
    text: "Cordas trançadas com alma de aço, ideais para escaladas, teias e balanços de alto tráfego.",
  },
  {
    icon: "Ma",
    color: "var(--yellow)",
    title: "Madeira plástica",
    text: "Alternativa ecológica que substitui a madeira tradicional: não racha, não empena e não precisa de manutenção.",
  },
  {
    icon: "Al",
    color: "#B14AED",
    title: "Alumínio anticorrosivo",
    text: "Componentes de acabamento em alumínio tratado — leve, durável e imune à ferrugem em áreas úmidas.",
  },
  {
    icon: "In",
    color: "#00B8A9",
    title: "Inox 304",
    text: "Parafusos, fixadores e escadas em aço inox 304 — segurança estrutural e durabilidade máxima.",
  },
];

/* ================================================================
   PAGE
   ================================================================ */
function OrcamentoPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [prices, setPrices] = useState<PriceMap>(DEFAULT_PRICES);
  const [editMode, setEditMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    try {
      const t = (localStorage.getItem(THEME_KEY) as "light" | "dark" | null) ?? "light";
      setTheme(t);
      document.documentElement.setAttribute("data-theme", t);
      const raw = localStorage.getItem(PRICES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PriceMap;
        setPrices({ ...DEFAULT_PRICES, ...parsed });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
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

  const updatePrice = (key: string, field: "old" | "new", value: string) => {
    setPrices((prev) => {
      const next = { ...prev, [key]: { ...prev[key], [field]: value } };
      try {
        localStorage.setItem(PRICES_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const resetPrices = () => {
    if (!confirm("Restaurar os preços originais?")) return;
    setPrices(DEFAULT_PRICES);
    try {
      localStorage.removeItem(PRICES_KEY);
    } catch {
      /* ignore */
    }
  };

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
            <a className="nav-cta" href="tel:+551733053929">
              ☎ <span>(17) 3305-3929</span>
            </a>
          </div>
        </div>
      </div>

      {editMode && (
        <div className="edit-banner">
          <span>Modo edição ativo — clique nos preços para alterar</span>
          <button onClick={resetPrices}>Restaurar padrão</button>
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
              <em>alegrias</em> desde 1979
            </h1>
            <p className="hero-sub">
              Tecnologia alemã em fabricação de playgrounds. Estruturas em aço com pintura eletrostática,
              certificadas pela ABNT, prontas para transformar seu espaço em um mundo de diversão.
            </p>
            <div className="hero-badges">
              <span className="badge" style={{ "--badge-color": "var(--orange)" } as CSSProperties}>
                <span className="dot" style={{ background: "var(--orange)" }} />
                Tecnologia alemã
              </span>
              <span className="badge" style={{ "--badge-color": "var(--yellow)" } as CSSProperties}>
                <span className="dot" style={{ background: "var(--yellow)" }} />
                Desconto exclusivo
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
          <div className="trust-item"><div className="num">46+</div><div className="lbl">Anos fabricando playgrounds no Brasil</div></div>
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
              Três estruturas robustas, com componentes intercambiáveis e preços com desconto exclusivo neste orçamento.
            </p>
          </div>

          <div className="products">
            <ProductCard
              alt={false}
              image={product1Asset.url}
              areaTag="Área: 6x7 metros"
              title="Big Steel Master"
              priceKey="big_steel_master"
              prices={prices}
              editMode={editMode}
              onEdit={updatePrice}
              tag="Frete e instalação grátis"
              tagColor="var(--green)"
              items={[
                "Torre grande coberta com telhadinho pirâmide (1,40x1,40)",
                "02 escorregadores ondulados de fibra (2,50m)",
                "Conjunto de vogais e numerais (0 a 9)",
                "Escada de 06 degraus",
                "Balanço baby e balanço cadeirinha teen",
                "Rapel de fibra",
                "Jogo da velha (09 cubos)",
                "Lousa mágica e alfabeto divertido",
              ]}
            />
            <ProductCard
              alt
              image={product2Asset.url}
              areaTag="Área: 8x8 metros"
              title="Master 118"
              priceKey="master_118"
              prices={prices}
              editMode={editMode}
              onEdit={updatePrice}
              tag="Área necessária: 8x8 metros"
              tagColor="var(--sky)"
              items={[
                "Torre grande coberta com telhadinho pirâmide (1,40x1,40)",
                "Escorregadores ondulados de fibra (2,50m)",
                "Escorregador caracol",
                "Conjunto de vogais e numerais (0 a 9)",
                "Escada de 06 degraus",
                "Rapel de fibra",
                "Jogo da velha (09 cubos) e lousa mágica",
                "Alfabeto divertido (A ao Z)",
                "Balanço baby e balanço cadeirinha teen",
              ]}
            />
            <ProductCard
              alt={false}
              image={product3Asset.url}
              areaTag="Área: 8x8 metros"
              title="Master 121"
              priceKey="master_121"
              prices={prices}
              editMode={editMode}
              onEdit={updatePrice}
              tag="Frete e instalação grátis"
              tagColor="var(--green)"
              items={[
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
              ]}
            />
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
                <div>
                  <div className="k">Telefone</div>
                  <div className="v">(17) 3305-3929</div>
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
            <a className="contact-cta" href={WA_LINK} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.5 3.5A11.9 11.9 0 003.6 20.3L2 22l1.8-1.6A11.9 11.9 0 1020.5 3.5zM12 21.3a9.3 9.3 0 01-4.7-1.3l-.3-.2-2.8.9.9-2.7-.2-.3A9.3 9.3 0 1121.3 12 9.3 9.3 0 0112 21.3zm5.2-7c-.3-.1-1.7-.8-1.9-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.6 7.6 0 01-3.7-3.2c-.3-.5.3-.5.8-1.5a.5.5 0 000-.5c-.1-.1-.6-1.5-.9-2s-.5-.5-.6-.5h-.6a1.1 1.1 0 00-.8.4A3.3 3.3 0 006 9.7c0 1.9 1.4 3.7 1.6 4s2.8 4.3 6.9 6c1 .4 1.7.7 2.3.9a5.6 5.6 0 002.5.2 4.1 4.1 0 002.7-1.9 3.4 3.4 0 00.2-1.9c-.1-.2-.4-.3-.7-.4z" />
              </svg>
              Falar com a Play Rio agora
            </a>
          </div>
        </div>
        <div className="foot-line">
          <span>Play Rio Brinquedos — Fabricando alegrias desde 1979.</span>
          <span>Tecnologia alemã · Garantia de 01 ano de fabricação.</span>
        </div>
      </section>

      {/* FLOATING WA */}
      <a className="wa-float" href={WA_LINK} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 3.5A11.9 11.9 0 003.6 20.3L2 22l1.8-1.6A11.9 11.9 0 1020.5 3.5zM12 21.3a9.3 9.3 0 01-4.7-1.3l-.3-.2-2.8.9.9-2.7-.2-.3A9.3 9.3 0 1121.3 12 9.3 9.3 0 0112 21.3zm5.2-7c-.3-.1-1.7-.8-1.9-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.6 7.6 0 01-3.7-3.2c-.3-.5.3-.5.8-1.5a.5.5 0 000-.5c-.1-.1-.6-1.5-.9-2s-.5-.5-.6-.5h-.6a1.1 1.1 0 00-.8.4A3.3 3.3 0 006 9.7c0 1.9 1.4 3.7 1.6 4s2.8 4.3 6.9 6c1 .4 1.7.7 2.3.9a5.6 5.6 0 002.5.2 4.1 4.1 0 002.7-1.9 3.4 3.4 0 00.2-1.9c-.1-.2-.4-.3-.7-.4z" />
        </svg>
      </a>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSubmit={handleLogin} />}
    </>
  );
}

/* ================================================================
   PRODUCT CARD
   ================================================================ */
type ProductCardProps = {
  alt: boolean;
  image: string;
  areaTag: string;
  title: string;
  priceKey: string;
  prices: PriceMap;
  editMode: boolean;
  onEdit: (key: string, field: "old" | "new", value: string) => void;
  tag: string;
  tagColor: string;
  items: string[];
};
function ProductCard({
  alt,
  image,
  areaTag,
  title,
  priceKey,
  prices,
  editMode,
  onEdit,
  tag,
  tagColor,
  items,
}: ProductCardProps) {
  const p = prices[priceKey];
  const photo = (
    <div className="product-photo">
      <img src={image} alt={title} />
      <span className="area-tag">{areaTag}</span>
    </div>
  );
  const body = (
    <div className="product-body">
      <h3>{title}</h3>
      <div className="price-row">
        <EditableSpan
          className="price-old mono"
          value={p.old}
          editMode={editMode}
          onCommit={(v) => onEdit(priceKey, "old", v)}
        />
        <EditableSpan
          className="price-new"
          value={p.new}
          editMode={editMode}
          onCommit={(v) => onEdit(priceKey, "new", v)}
        />
      </div>
      <span className="price-tag" style={{ background: tagColor }}>{tag}</span>
      <ul className="comp-list">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className={`product-card hover-frame${alt ? " alt" : ""}`}>
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
   EDITABLE SPAN — mantém fonte/estilo intactos
   ================================================================ */
function EditableSpan({
  value,
  editMode,
  onCommit,
  className,
}: {
  value: string;
  editMode: boolean;
  onCommit: (v: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);
  return (
    <span
      ref={ref}
      className={className}
      contentEditable={editMode}
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => {
        const v = e.currentTarget.textContent?.trim() ?? "";
        if (v && v !== value) onCommit(v);
        else e.currentTarget.textContent = value;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLSpanElement).blur();
        }
      }}
    >
      {value}
    </span>
  );
}

/* ================================================================
   MATERIALS CARROUSEL — drag em mouse + touch nativo
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
    const onLeave = () => {
      state.current.isDown = false;
      el.classList.remove("dragging");
    };
    const onUp = () => {
      state.current.isDown = false;
      el.classList.remove("dragging");
    };
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
        <p>Digite a senha para liberar a edição dos preços dos playgrounds.</p>
        <input
          type="password"
          placeholder="Senha"
          value={pwd}
          autoFocus
          onChange={(e) => {
            setPwd(e.target.value);
            setErr(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (!onSubmit(pwd)) setErr(true);
            }
          }}
        />
        {err && <div className="modal-error">Senha incorreta. Tente novamente.</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!onSubmit(pwd)) setErr(true);
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
