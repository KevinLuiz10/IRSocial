import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Printer } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Stepper from "../components/wizard/Stepper";
import DarfPreview from "../components/wizard/DarfPreview";
import { ErrorSummary, RadioGroup, TextField } from "../components/wizard/fields";
import { useRequest } from "../hooks/useRequest";
import { listarMunicipios } from "../services/repasseService";
import { formatarMoeda, formatarNomeMunicipio, lerValorMonetario } from "../utils/format";
import {
  anosDaDeclaracao,
  DADOS_INICIAIS,
  ESFERAS,
  FUNDOS,
  fundosEscolhidos,
  limitePorFundo,
  UFS,
  validadores,
  valorDoFundo,
} from "../utils/destinacao";

const ETAPAS = [
  { id: "elegibilidade", titulo: "Você pode destinar?" },
  { id: "valores", titulo: "Quanto destinar" },
  { id: "fundos", titulo: "Escolha dos fundos" },
  { id: "programa", titulo: "No programa da Receita" },
  { id: "darf", titulo: "Pagamento do DARF" },
  { id: "revisao", titulo: "Revisão" },
];

const ROTULOS_CAMPOS = {
  modelo: "Modelo da declaração",
  prazo: "Entrega no prazo",
  impostoDevido: "Imposto devido",
  valorFdca: "Valor para o fundo da Criança e do Adolescente",
  valorFdi: "Valor para o fundo da Pessoa Idosa",
  fdcaMunicipio: "Município do fundo da Criança e do Adolescente",
  fdiMunicipio: "Município do fundo da Pessoa Idosa",
};

function validarEtapa(indice, dados) {
  const validar = validadores[ETAPAS[indice].id];
  return validar ? validar(dados) : {};
}

export default function HowToDonate() {
  const [etapa, setEtapa] = useState(0);
  const [maxAlcancada, setMaxAlcancada] = useState(0);
  const [dados, setDados] = useState(DADOS_INICIAIS);
  const [erros, setErros] = useState({});
  const [focarErros, setFocarErros] = useState(0);

  const tituloRef = useRef(null);
  const resumoErrosRef = useRef(null);
  const primeiraRenderizacao = useRef(true);
  const anos = anosDaDeclaracao();

  // Ao trocar de etapa, leva o foco ao título (leitores de tela anunciam a nova etapa)
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    tituloRef.current?.focus();
    tituloRef.current?.scrollIntoView({ block: "start" });
  }, [etapa]);

  useEffect(() => {
    if (focarErros) resumoErrosRef.current?.focus();
  }, [focarErros]);

  function atualizar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
    // Some com o erro do campo assim que a pessoa começa a corrigir
    if (erros[campo]) {
      setErros((atuais) => {
        const restantes = { ...atuais };
        delete restantes[campo];
        return restantes;
      });
    }
  }

  // Para avançar (inclusive pulando etapas pelo indicador), todas as anteriores precisam estar válidas
  function irPara(destino) {
    if (destino > etapa) {
      for (let i = etapa; i < destino; i++) {
        const errosEtapa = validarEtapa(i, dados);
        if (Object.keys(errosEtapa).length) {
          setEtapa(i);
          setErros(errosEtapa);
          setFocarErros((n) => n + 1);
          return;
        }
      }
    }
    setErros({});
    setEtapa(destino);
    setMaxAlcancada((m) => Math.max(m, destino));
  }

  function recomecar() {
    setDados(DADOS_INICIAIS);
    setErros({});
    setMaxAlcancada(0);
    setEtapa(0);
  }

  const props = { dados, atualizar, erros, anos };
  const ultima = etapa === ETAPAS.length - 1;

  return (
    <>
      <title>Passo a passo do DARF | IR Social</title>

      <PageHeader eyebrow="Passo a passo" titulo="Destine parte do seu imposto, etapa por etapa">
        Responda algumas perguntas e veja exatamente o que preencher no
        programa da Receita e no DARF. Nada do que você digita aqui é enviado
        ou salvo.
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Stepper etapas={ETAPAS} atual={etapa} maxAlcancada={maxAlcancada} onIr={irPara} />

        <form
          noValidate
          className="mx-auto mt-10 max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ultima) irPara(etapa + 1);
          }}
        >
          <p className="eyebrow">
            Etapa {etapa + 1} de {ETAPAS.length}
          </p>
          <h2 ref={tituloRef} tabIndex={-1} className="mt-1 scroll-mt-24 text-3xl font-bold outline-none">
            {ETAPAS[etapa].titulo}
          </h2>

          <div className="mt-6">
            <ErrorSummary ref={resumoErrosRef} erros={erros} rotulos={ROTULOS_CAMPOS} />
          </div>

          <div className="mt-6 space-y-8">
            {etapa === 0 && <EtapaElegibilidade {...props} />}
            {etapa === 1 && <EtapaValores {...props} />}
            {etapa === 2 && <EtapaFundos {...props} />}
            {etapa === 3 && <EtapaPrograma {...props} />}
            {etapa === 4 && <EtapaDarf {...props} />}
            {etapa === 5 && <EtapaRevisao {...props} onEditar={irPara} />}
          </div>

          <div className="no-print mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            {etapa > 0 ? (
              <button type="button" className="btn btn-secondary" onClick={() => irPara(etapa - 1)}>
                <ArrowLeft size={18} aria-hidden="true" />
                Voltar
              </button>
            ) : (
              <span />
            )}

            {ultima ? (
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn btn-secondary" onClick={recomecar}>
                  Recomeçar
                </button>
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={18} aria-hidden="true" />
                  Imprimir resumo
                </button>
              </div>
            ) : (
              <button type="submit" className="btn btn-primary">
                Continuar
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

/* ---------- Etapa 1 ---------- */

function EtapaElegibilidade({ dados, atualizar, erros }) {
  return (
    <>
      <p className="text-ink-soft">
        A destinação pela declaração tem duas condições. Se você ainda não
        sabe, tudo bem: dá para descobrir no próprio programa da Receita.
      </p>

      <RadioGroup
        nome="modelo"
        legenda="Qual modelo de declaração você vai usar?"
        ajuda="O programa mostra no resumo da declaração qual modelo é mais vantajoso."
        valor={dados.modelo}
        onChange={(v) => atualizar("modelo", v)}
        erro={erros.modelo}
        opcoes={[
          { valor: "completa", rotulo: "Completo (deduções legais)", descricao: "Uso deduções como saúde, educação e dependentes." },
          { valor: "simplificada", rotulo: "Simplificado (desconto padrão)", descricao: "Uso o desconto automático de 20%." },
          { valor: "nao-sei", rotulo: "Ainda não sei", descricao: "Vou conferir no programa antes de entregar." },
        ]}
      />

      {dados.modelo === "nao-sei" && (
        <p className="rounded-md bg-attention-tint p-4 text-[0.9375rem] text-attention">
          Você pode continuar, mas lembre: a destinação só aparece se a
          declaração estiver no <strong>modelo completo</strong>.
        </p>
      )}

      <RadioGroup
        nome="prazo"
        legenda="Você vai entregar a declaração dentro do prazo?"
        valor={dados.prazo}
        onChange={(v) => atualizar("prazo", v)}
        erro={erros.prazo}
        opcoes={[
          { valor: "sim", rotulo: "Sim, dentro do prazo" },
          { valor: "nao", rotulo: "Não, vou entregar em atraso" },
        ]}
      />
    </>
  );
}

/* ---------- Etapa 2 ---------- */

function EtapaValores({ dados, atualizar, erros }) {
  const limite = limitePorFundo(dados);
  const valorMaximo = formatarMoeda(limite).replace("R$", "").trim();

  return (
    <>
      <TextField
        id="impostoDevido"
        rotulo="Qual é o seu imposto devido?"
        ajuda="Está no resumo da declaração, na linha “Imposto devido”. Não é o imposto a pagar nem a restituição."
        prefixo="R$"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        value={dados.impostoDevido}
        onChange={(e) => atualizar("impostoDevido", e.target.value)}
        erro={erros.impostoDevido}
        className="max-w-sm"
      />

      {limite > 0 && (
        <div className="rounded-md border border-line bg-surface p-5">
          <p>
            Você pode destinar até <strong>{formatarMoeda(limite)}</strong> para
            cada fundo, ou <strong>{formatarMoeda(limite * 2)}</strong> no total.
          </p>
          <p className="mt-1 text-[0.9375rem] text-ink-soft">
            Se você fez doações incentivadas durante o ano, o programa pode
            mostrar um limite menor. Nesse caso, vale o do programa.
          </p>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {[
              ["fdca", "valorFdca"],
              ["fdi", "valorFdi"],
            ].map(([fundo, campo]) => (
              <div key={fundo}>
                <TextField
                  id={campo}
                  rotulo={
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`size-2.5 rounded-sm ${fundo === "fdca" ? "bg-fdca" : "bg-fdi"}`}
                      />
                      {FUNDOS[fundo].nomeCurto}
                    </span>
                  }
                  ajuda={`Até ${formatarMoeda(limite)}. Deixe em branco se não quiser.`}
                  prefixo="R$"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  value={dados[campo]}
                  onChange={(e) => atualizar(campo, e.target.value)}
                  erro={erros[campo]}
                />
                <button
                  type="button"
                  className="mt-2 cursor-pointer text-[0.9375rem] font-semibold text-brand underline"
                  onClick={() => atualizar(campo, valorMaximo)}
                >
                  Usar o valor máximo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Etapa 3 ---------- */

function EtapaFundos({ dados, atualizar, erros }) {
  const { data: municipiosPr } = useRequest(listarMunicipios, "municipios");
  const escolhidos = fundosEscolhidos(dados);

  return (
    <>
      <p className="text-ink-soft">
        Você pode escolher fundos de qualquer cidade ou estado. No programa da
        Receita, a lista de fundos disponíveis aparece depois que você escolhe
        a UF e o município.
      </p>

      {municipiosPr && (
        <datalist id="municipios-pr">
          {municipiosPr.map((m) => (
            <option key={m.id} value={formatarNomeMunicipio(m.nome)} />
          ))}
        </datalist>
      )}

      {escolhidos.map((fundo) => {
        const info = FUNDOS[fundo];
        const esfera = dados[`${fundo}Esfera`];
        const uf = dados[`${fundo}Uf`];

        return (
          <section
            key={fundo}
            aria-labelledby={`titulo-${fundo}`}
            className={`space-y-6 border-l-4 pl-5 ${fundo === "fdca" ? "border-fdca" : "border-fdi"}`}
          >
            <div>
              <h3 id={`titulo-${fundo}`} className="text-xl font-bold">{info.nome}</h3>
              <p className="text-ink-soft">Valor: {formatarMoeda(valorDoFundo(dados, fundo))}</p>
            </div>

            <RadioGroup
              nome={`${fundo}Esfera`}
              legenda="Qual fundo vai receber?"
              valor={esfera}
              onChange={(v) => atualizar(`${fundo}Esfera`, v)}
              opcoes={ESFERAS}
            />

            {esfera !== "nacional" && (
              <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                <div>
                  <label htmlFor={`${fundo}Uf`} className="block font-semibold">UF</label>
                  <select
                    id={`${fundo}Uf`}
                    className="field mt-2"
                    value={uf}
                    onChange={(e) => atualizar(`${fundo}Uf`, e.target.value)}
                  >
                    {UFS.map((sigla) => (
                      <option key={sigla}>{sigla}</option>
                    ))}
                  </select>
                </div>

                {esfera === "municipal" && (
                  <TextField
                    id={`${fundo}Municipio`}
                    rotulo="Município"
                    ajuda={uf === "PR" ? "Comece a digitar para ver sugestões." : undefined}
                    list={uf === "PR" ? "municipios-pr" : undefined}
                    autoComplete="off"
                    value={dados[`${fundo}Municipio`]}
                    onChange={(e) => atualizar(`${fundo}Municipio`, e.target.value)}
                    erro={erros[`${fundo}Municipio`]}
                  />
                )}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

/* ---------- Etapa 4 ---------- */

function descreverDestino(dados, fundo) {
  const esfera = dados[`${fundo}Esfera`];
  if (esfera === "nacional") return "Nacional";
  if (esfera === "estadual") return `Estadual – ${dados[`${fundo}Uf`]}`;
  return `Municipal – ${dados[`${fundo}Municipio`].trim()} (${dados[`${fundo}Uf`]})`;
}

function EtapaPrograma({ dados, anos }) {
  const escolhidos = fundosEscolhidos(dados);

  return (
    <>
      <p className="text-ink-soft">
        Com a sua declaração aberta no programa IRPF {anos.anoDeclaracao}, siga
        estes passos. Os nomes das telas podem mudar um pouco de um ano para o outro.
      </p>

      <ol className="space-y-6">
        <Passo n={1} titulo="Confirme o modelo completo">
          No resumo da declaração, verifique se a opção selecionada é a de
          deduções legais. Sem isso, as fichas de doação ficam bloqueadas.
        </Passo>

        {escolhidos.map((fundo, i) => (
          <Passo key={fundo} n={i + 2} titulo={`Preencha a ficha do fundo ${FUNDOS[fundo].nomeCurto}`}>
            <p>
              No menu lateral, abra <strong>“{FUNDOS[fundo].ficha}”</strong> e
              clique em <strong>Novo</strong>. Preencha:
            </p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md bg-paper p-4">
              <dt className="text-ink-soft">Tipo de fundo</dt>
              <dd className="font-semibold">{descreverDestino(dados, fundo)}</dd>
              <dt className="text-ink-soft">Valor</dt>
              <dd className="font-semibold tabular-nums">{formatarMoeda(valorDoFundo(dados, fundo))}</dd>
            </dl>
            <p className="mt-3">
              O programa mostra o valor máximo disponível. Se ele for menor
              que o seu, use o valor do programa.
            </p>
          </Passo>
        ))}

        <Passo n={escolhidos.length + 2} titulo="Transmita a declaração">
          Confira as pendências e transmita normalmente, dentro do prazo.
        </Passo>

        <Passo n={escolhidos.length + 3} titulo="Gere o DARF da doação">
          Depois de transmitir, use a opção de imprimir o DARF no programa.
          {escolhidos.length > 1 && " Cada fundo tem a sua própria guia."} Na
          próxima etapa explicamos cada campo.
        </Passo>
      </ol>
    </>
  );
}

function Passo({ n, titulo, children }) {
  return (
    <li className="grid grid-cols-[2.25rem_1fr] gap-3">
      <span className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface font-semibold">
        {n}
      </span>
      <div className="pt-1">
        <h3 className="font-sans text-lg font-semibold">{titulo}</h3>
        <div className="mt-1 text-ink-soft">{children}</div>
      </div>
    </li>
  );
}

/* ---------- Etapa 5 ---------- */

function EtapaDarf({ dados, anos }) {
  return (
    <>
      <p className="text-ink-soft">
        O programa preenche o DARF para você. Use esta referência para conferir
        a guia antes de pagar. Os campos em destaque são os que mais importam.
      </p>

      {fundosEscolhidos(dados).map((fundo) => (
        <DarfPreview
          key={fundo}
          fundo={FUNDOS[fundo]}
          valor={valorDoFundo(dados, fundo)}
          anoCalendario={anos.anoCalendario}
          anoDeclaracao={anos.anoDeclaracao}
        />
      ))}

      <div className="rounded-md border-l-4 border-attention bg-attention-tint p-5">
        <p className="font-semibold text-attention">Não deixe para depois</p>
        <p className="mt-1 text-ink-soft">
          Pague em cota única até o último dia do prazo de entrega, mesmo que
          parcele o restante do imposto. Se o DARF não for pago, a destinação
          deixa de valer. Você pode pagar pelo aplicativo ou site do seu banco,
          lendo o código de barras.
        </p>
      </div>
    </>
  );
}

/* ---------- Etapa 6 ---------- */

function EtapaRevisao({ dados, anos, onEditar }) {
  const escolhidos = fundosEscolhidos(dados);
  const total = escolhidos.reduce((t, f) => t + valorDoFundo(dados, f), 0);
  const modelo = { completa: "Completo", "nao-sei": "Ainda não sei (conferir no programa)" }[dados.modelo];

  return (
    <>
      <p className="text-ink-soft">
        Confira o resumo. Se algo estiver errado, use “Alterar” para voltar à
        etapa correspondente.
      </p>

      <BlocoRevisao titulo="Situação da declaração" onEditar={() => onEditar(0)}>
        <Linha rotulo="Modelo">{modelo}</Linha>
        <Linha rotulo="Entrega">Dentro do prazo de {anos.anoDeclaracao}</Linha>
      </BlocoRevisao>

      <BlocoRevisao titulo="Valores" onEditar={() => onEditar(1)}>
        <Linha rotulo="Imposto devido">{formatarMoeda(lerValorMonetario(dados.impostoDevido))}</Linha>
        {escolhidos.map((f) => (
          <Linha key={f} rotulo={`Fundo ${FUNDOS[f].nomeCurto}`}>
            {formatarMoeda(valorDoFundo(dados, f))}
          </Linha>
        ))}
        <Linha rotulo="Total destinado" forte>{formatarMoeda(total)}</Linha>
        <Linha rotulo="Custo extra para você">R$ 0,00</Linha>
      </BlocoRevisao>

      <BlocoRevisao titulo="Fundos escolhidos" onEditar={() => onEditar(2)}>
        {escolhidos.map((f) => (
          <Linha key={f} rotulo={FUNDOS[f].nomeCurto}>{descreverDestino(dados, f)}</Linha>
        ))}
      </BlocoRevisao>

      <BlocoRevisao titulo="DARF" onEditar={() => onEditar(4)}>
        {escolhidos.map((f) => (
          <Linha key={f} rotulo={`Código ${FUNDOS[f].nomeCurto}`}>{FUNDOS[f].codigoReceita}</Linha>
        ))}
        <Linha rotulo="Vencimento">Último dia do prazo de entrega de {anos.anoDeclaracao}</Linha>
      </BlocoRevisao>

      <fieldset className="rounded-md border border-line bg-surface p-5">
        <legend className="px-1 font-semibold">Antes de terminar</legend>
        <div className="mt-1 space-y-2">
          {[
            "Preenchi a ficha de doação no programa",
            "Transmiti a declaração dentro do prazo",
            "Paguei o DARF de cada fundo",
            "Guardei os comprovantes junto com o recibo da declaração",
          ].map((item) => (
            <label key={item} className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 size-[1.125rem] shrink-0 accent-brand" />
              {item}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="text-ink-soft">
        Quer ver quanto a sua cidade já recebeu?{" "}
        <Link to="/transparencia">Consulte os repasses por município</Link>.
      </p>
    </>
  );
}

function BlocoRevisao({ titulo, onEditar, children }) {
  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <h3 className="font-sans text-base font-semibold">{titulo}</h3>
        <button
          type="button"
          onClick={onEditar}
          className="no-print cursor-pointer text-[0.9375rem] font-semibold text-brand underline"
        >
          Alterar<span className="sr-only"> {titulo.toLowerCase()}</span>
        </button>
      </div>
      <dl className="divide-y divide-line px-5">{children}</dl>
    </section>
  );
}

function Linha({ rotulo, forte, children }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
      <dt className="text-ink-soft">{rotulo}</dt>
      <dd className={`tabular-nums ${forte ? "font-semibold" : ""}`}>{children}</dd>
    </div>
  );
}
