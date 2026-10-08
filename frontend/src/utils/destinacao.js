import { formatarMoeda, lerValorMonetario } from "./format";

// Limite de cada fundo: 3% do imposto devido (ECA, art. 260; Estatuto da Pessoa Idosa).
export const PERCENTUAL_POR_FUNDO = 0.03;

export const FUNDOS = {
  fdca: {
    sigla: "FDCA",
    nome: "Fundo dos Direitos da Criança e do Adolescente",
    nomeCurto: "Criança e Adolescente",
    ficha: "Doações Diretamente na Declaração – Criança e Adolescente",
    codigoReceita: "3351",
    cor: "fdca",
  },
  fdi: {
    sigla: "FDI",
    nome: "Fundo dos Direitos da Pessoa Idosa",
    nomeCurto: "Pessoa Idosa",
    ficha: "Doações Diretamente na Declaração – Pessoa Idosa",
    codigoReceita: "3375",
    cor: "fdi",
  },
};

export const ESFERAS = [
  { valor: "municipal", rotulo: "Municipal", descricao: "Fundo de uma cidade específica" },
  { valor: "estadual", rotulo: "Estadual", descricao: "Fundo de um estado" },
  { valor: "nacional", rotulo: "Nacional", descricao: "Fundo do governo federal" },
];

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

// A declaração entregue em um ano se refere ao ano anterior (ano-calendário).
// A partir de junho, o próximo ciclo de declaração passa a ser o do ano seguinte.
export function anosDaDeclaracao(hoje = new Date()) {
  const anoDeclaracao = hoje.getMonth() >= 5 ? hoje.getFullYear() + 1 : hoje.getFullYear();
  return { anoDeclaracao, anoCalendario: anoDeclaracao - 1 };
}

export const DADOS_INICIAIS = {
  modelo: "",
  prazo: "",
  impostoDevido: "",
  valorFdca: "",
  valorFdi: "",
  fdcaEsfera: "municipal",
  fdcaUf: "PR",
  fdcaMunicipio: "",
  fdiEsfera: "municipal",
  fdiUf: "PR",
  fdiMunicipio: "",
};

export function limitePorFundo(dados) {
  const imposto = lerValorMonetario(dados.impostoDevido);
  if (!(imposto > 0)) return 0;
  return Math.floor(imposto * PERCENTUAL_POR_FUNDO * 100) / 100;
}

export function valorDoFundo(dados, fundo) {
  const texto = fundo === "fdca" ? dados.valorFdca : dados.valorFdi;
  if (!texto?.trim()) return 0;
  const valor = lerValorMonetario(texto);
  return Number.isNaN(valor) ? 0 : valor;
}

export function fundosEscolhidos(dados) {
  return Object.keys(FUNDOS).filter((f) => valorDoFundo(dados, f) > 0);
}

// Cada validador devolve { campo: mensagem }. Mensagens dizem o que corrigir e como.
export const validadores = {
  elegibilidade(d) {
    const erros = {};
    if (!d.modelo) {
      erros.modelo = "Escolha o modelo de declaração que você vai usar.";
    } else if (d.modelo === "simplificada") {
      erros.modelo =
        "No desconto simplificado não é possível destinar. Se quiser destinar, use o modelo completo (deduções legais), caso ele também seja possível para você.";
    }
    if (!d.prazo) {
      erros.prazo = "Informe se vai entregar a declaração dentro do prazo.";
    } else if (d.prazo === "nao") {
      erros.prazo =
        "Declarações entregues fora do prazo não permitem a destinação. Para destinar, entregue a declaração até a data limite.";
    }
    return erros;
  },

  valores(d) {
    const erros = {};
    const imposto = lerValorMonetario(d.impostoDevido);

    if (!d.impostoDevido.trim()) {
      erros.impostoDevido =
        "Informe o imposto devido. Ele aparece no resumo da declaração, na linha “Imposto devido”.";
      return erros;
    }
    if (Number.isNaN(imposto)) {
      erros.impostoDevido = "Digite o valor só com números e vírgula, por exemplo: 4.250,00.";
      return erros;
    }
    if (imposto <= 0) {
      erros.impostoDevido =
        "O imposto devido precisa ser maior que zero. Sem imposto devido, não há valor para destinar.";
      return erros;
    }

    const limite = limitePorFundo(d);
    for (const [fundo, campo] of [["fdca", "valorFdca"], ["fdi", "valorFdi"]]) {
      const texto = d[campo].trim();
      if (!texto) continue;
      const valor = lerValorMonetario(texto);
      if (Number.isNaN(valor)) {
        erros[campo] = "Digite o valor só com números e vírgula, por exemplo: 120,00.";
      } else if (valor > limite) {
        erros[campo] = `O máximo para o fundo ${FUNDOS[fundo].nomeCurto} é ${formatarMoeda(limite)} (3% do imposto devido). Diminua o valor.`;
      }
    }

    if (!erros.valorFdca && !erros.valorFdi && fundosEscolhidos(d).length === 0) {
      erros.valorFdca = "Informe um valor maior que zero para pelo menos um dos fundos.";
    }
    return erros;
  },

  fundos(d) {
    const erros = {};
    for (const fundo of fundosEscolhidos(d)) {
      if (d[`${fundo}Esfera`] === "municipal" && !d[`${fundo}Municipio`].trim()) {
        erros[`${fundo}Municipio`] = `Informe o município do fundo ${FUNDOS[fundo].nomeCurto}.`;
      }
    }
    return erros;
  },
};
