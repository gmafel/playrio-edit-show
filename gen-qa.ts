import { generateQuotePdf } from "/dev-server/src/lib/pdf-quote.ts";
import { writeFileSync } from "fs";
// @ts-ignore
globalThis.document = { createElement: () => ({ getContext: () => null }) };
const jspdf = await import("jspdf");
const buf:any = await generateQuotePdf({
  info: [{label:'Vendedora',value:'Maria Souza'},{label:'Cliente',value:'Escola Sol Nascente'},{label:'CPF / CNPJ',value:'12.345.678/0001-99'},{label:'Data do orçamento',value:'01/08/2026'}],
  products: [
    {title:'Big Steel Master',areaTag:'Área: 6x7 metros',image:'',priceOld:'R$ 19.990,00',priceNew:'R$ 16.990,00',tag:'Frete e instalação grátis',items:['Torre grande coberta com telhadinho pirâmide (1,40x1,40)','02 escorregadores ondulados de fibra (2,50m)','Conjunto de vogais e numerais (0 a 9)','Balanço baby e balanço cadeirinha teen']},
    {title:'Master 118',areaTag:'Área: 8x8 metros',image:'',priceOld:'R$ 25.990,00',priceNew:'R$ 22.990,00',tag:'Área necessária: 8x8 metros',items:['Escorregador caracol','Rapel de fibra','Jogo da velha (09 cubos) e lousa mágica']},
  ],
  loads: [{n:'130kg',l:'Balanço teen',d:'Capacidade máxima de carga'},{n:'50kg',l:'Balanço baby',d:'Capacidade máxima de carga'}],
  paySteps: [{num:'01',title:'Sinal inicial',desc:'R$ 500,00 para confirmação do pedido.'},{num:'02',title:'Restante',desc:'À vista, no ato da entrega.'}],
  docs: ['Nome completo','Endereço completo','CPF/CNPJ','Fotos/vídeos do local'],
  floors: ['Grama','Terra','Areia','Concreto','Piso'],
  materials: [{title:'Aço estrutural',text:'Perfis de aço com pintura epóxi que repele calor e mantém as cores vivas.'},{title:'Fibra de vidro',text:'Escorregadores e telhadinhos em fibra de alta resistência.'}],
  audience: 'Público-alvo: faixa etária de 0 a 4 anos com acompanhamento dos pais, de 04 a 12 com supervisão de um adulto.',
  delivery: '20 dias úteis', freight: 'Frete e instalação grátis até 700km da fábrica (SJRP)', phone: '(17) 3305-3929',
}, { returnBuffer: true });
writeFileSync("/tmp/pdfqa/out.pdf", Buffer.from(buf));
console.log("ok");
