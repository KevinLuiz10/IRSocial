# IRSocial — Integração oficial da Receita Federal (Paraná)

**Atualização:** o histórico desde 2021 e a verificação automática de novos anos estão documentados em [`SINCRONIZACAO_HISTORICA_RECEITA.md`](SINCRONIZACAO_HISTORICA_RECEITA.md). As instruções de importação única de 2025 abaixo descrevem a primeira versão e continuam válidas como alternativa manual.

## O que foi feito

- **Preservado** o esquema existente do grupo (`fundo`, `municipio`, `municipio_ano`, `repasse`, `stg_repasse`, `importacao` e views antigas).
- **Adicionadas** duas tabelas complementares `estatistica_receita_municipio_ano` e `estatistica_receita_estado_ano` para representar fielmente a publicação HTML.
- **Criado** importador que baixa (ou lê um HTML baixado) da Receita, valida 399 municípios, a linha **ESTADUAL**, totais e percentuais, e salva no PostgreSQL de forma idempotente.
- **Criadas** rotas da API para anos, resumo, listagem com filtros/paginação e histórico por município.
- **Atualizada** a apresentação do React para mostrar **totais exatos**, **quantidade de doações**, **DARFs pagos** e **percentuais divulgados por fundo**; não calcula valores exatos FDCA/FDI a partir de percentuais arredondados.
- **Mantido** o design React/Tailwind e o modo demonstrativo opcional (`VITE_USE_MOCK=true`).

**Fonte:** https://servicos.receita.fazenda.gov.br/publico/EstatisticaIRPF/doacoesDIRPF_PR_2025.HTML

A linha **ESTADUAL** não é município: seu valor e suas doações ficam em campos separados do resumo estadual, e são incluídos na validação do TOTAL oficial. Assim o portal lista **399 municípios**, sem atribuir os valores da linha ESTADUAL a um município fictício.

A tabela distingue `Destinações por localidade` (endereço do declarante) de `Destinado na declaração` (endereço do fundo), além de apresentar os DARFs pagos. A página do IRSocial exibe como total o valor em **"Destinado na declaração"**, não o total dos DARFs, e mostra o pagamento separadamente. Dados de destinação não comprovam aplicação do dinheiro em projetos.

- **Banco novo:** o PostgreSQL usa os scripts `db/init` como antes; as migracoes registradas passam a ser acompanhadas separadamente pelo inicializador.
- **Banco existente:** nao apaga tabelas, senhas nem registros; aplica apenas migracoes pendentes. A migracao `001_estatisticas_receita.sql` usa `IF NOT EXISTS` e e segura mesmo se foi aplicada manualmente antes da automacao.
- **HTML identico ao ja importado:** o importador compara o SHA-256 e verifica se a quantidade de municipios esta completa antes de pular o processamento. Nao gera outro registro de importacao para a mesma fonte inalterada.
- **HTML diferente:** valida os 399 municipios, a linha ESTADUAL, os totais e os percentuais. Se valido, atualiza por municipio/ano com `ON CONFLICT`, sem duplicar registros. Preserva a tolerancia de ate R$ 1,00 na verificacao da soma publicada, sem modificar valores oficiais.
- **Receita fora do ar:** se ja ha dados daquele ano, o aplicativo inicia com os dados anteriores e registra aviso nos logs. Se e a primeira importacao e nao existem dados, o app nao inicia como se estivesse pronto; Docker registra a falha e tenta novamente conforme politica `restart`.

A importacao individual de 2025 no contêiner `app` acontece ao iniciar/recriar esse contêiner. **A partir da atualização histórica, o novo serviço `receita-sync` também verifica os relatórios diariamente**, sem precisar reiniciar o app. Veja `SINCRONIZACAO_HISTORICA_RECEITA.md`. `docker compose up -d --build` inicia o ambiente e constroi quando necessario; se os conteineres ja estiverem ativos e nao forem recriados, o Compose nao repete a inicializacao.

### Configuracoes opcionais

Adicione ao `.env` se quiser substituir os valores padrao (ja descritos no `.env.example`):

```dotenv
RECEITA_ANO=2025
RECEITA_AUTO_IMPORTAR=true
```

O ano da importação inicial do app permanece **2025**, mas o serviço `receita-sync` inclui automaticamente os relatórios históricos a partir de 2021 e os novos anos publicados. Antes de alterar manualmente o ano inicial do aplicativo, confira se a fonte oficial usa o mesmo formato. Para desligar a importacao inicial (por exemplo, ao trabalhar offline), use `RECEITA_AUTO_IMPORTAR=false`. A verificacao das migracoes continua automatica.

### Como acompanhar e conferir

```bash
docker compose logs -f app
```

Apos o inicio, abra:

- Site: http://localhost:8080/transparencia
- Status do backend e banco: http://localhost:8080/api/status
- Anos importados: http://localhost:8080/api/repasses/anos
- Resumo de 2025: http://localhost:8080/api/repasses/resumo?ano=2025

Para forcar uma nova verificacao, mesmo sem uma alteracao de imagem, recrie somente o container da aplicacao (preserva banco e volume):

```bash
docker compose up -d --force-recreate app
```

### Execucao manual do importador (alternativa)

O importador original continua disponivel, especialmente para importar um HTML salvo quando o site oficial estiver indisponivel:

```bash
docker compose cp pagina-receita-2025.html app:/tmp/pagina-receita-2025.html
docker compose exec app node scripts/importar-receita-html.js --arquivo /tmp/pagina-receita-2025.html
```

Salve a **pagina HTML completa** da Receita Federal; nao altere os valores. Se voce ja possui o banco migrado, nao e necessario repetir etapas de migracao ou importacao manual para o inicio normal.

## Como desenvolver frontend separado

Depois de subir o backend (`docker compose up -d db app`), rode o Vite em `frontend`:

```bash
npm install
npm run dev
```

`frontend/vite.config.js` já configura proxy `/api` para `http://localhost:8080`.

Em `.env.development` e `.env.production`, `VITE_USE_MOCK=false`: o site passa a solicitar dados reais. Se você quiser apenas testar o design **sem banco**, pode mudar temporariamente `VITE_USE_MOCK=true`, deixando o aviso de dados fictícios. **Nunca publique esse modo como dados oficiais.**

## Dados oficiais: interpretação

| Campo publicado | Campo no novo banco | Informação |
|---|---|---|
| Potencial — Valor | `potencial` | Capacidade de destinação no endereço do declarante |
| Potencial — Contribuintes | `contribuintes` | Número de contribuintes considerados |
| Destinações por localidade — Valor | `destinacao_pf` | Valor no endereço do declarante |
| Destinações por localidade — Contribuintes | `qtde_pf` | Quantidade no endereço do declarante |
| Destinado na declaração — Valor | `valor_total` | **Total declarado no endereço do fundo** |
| Destinado na declaração — Doações | `doacoes_total` | Doações no endereço do fundo |
| Criança e Adolescente | `percentual_fdca` | Percentual **arredondado**, sem valor exato separado |
| Pessoa Idosa | `percentual_fdi` | Percentual **arredondado**, sem valor exato separado |
| DARFs pagos — Valor | `valor_darf` | DARFs efetivamente pagos |
| DARFs pagos — Doações | `qtde_darf` | Quantidade de DARFs pagos |

O novo modelo permite futuramente importar a planilha detalhada com valor exato separado para cada fundo usando a infraestrutura anterior sem misturar números aproximados com oficiais.

## Segurança, auditoria e limites

- Reimportar o mesmo HTML não cria novos registros de município/ano: a chave primária impede duplicação. O histórico em `importacao` é mantido.
- O script valida contagem de municípios, tipos numéricos, soma dos totais, doações e percentuais **antes de gravar**. A soma monetária pode divergir em até R$ 1,00 do total oficial; divergências maiores e diferenças na quantidade de doações são rejeitadas. Falhas na gravação resultam em rollback.
- A tabela HTTP oficial pode mudar de formato; caso isso ocorra, o importador **falha** em vez de aceitar silenciosamente dados incompletos.
- A alteração só cobre o **Paraná**. O banco original e as views continuam disponíveis para os demais trabalhos do grupo.
- A importação inicial de 2025 ocorre no app; o serviço `receita-sync` executa verificações periódicas enquanto o Docker permanecer ligado (ver guia de sincronização).
- A validação da soma monetária considera uma tolerância de até R$ 1,00 entre as linhas e o total publicado pela Receita, sem alterar os valores oficiais armazenados.

## Testes de parser

```bash
cd backend
npm test
```

São testes locais sobre uma amostra curta de registros publicados; não substituem a validação de ponta a ponta com o HTML completo e o banco PostgreSQL.
