# IRSocial — Histórico e sincronização automática (Paraná)

## Resumo

A partir desta versão, o IRSocial pode importar relatórios municipais da Receita Federal **desde 2021** e verificar diariamente novas publicações **sem reiniciar o Docker**. Em outubro de 2026, há páginas oficiais para 2021 a 2026. Quando começar um novo ano (por exemplo, 2027), o sincronizador incluirá o respectivo endereço na verificação; **não cria dados para anos ainda não publicados**.

Exemplos de URLs oficiais (somente Paraná):

- https://servicos.receita.fazenda.gov.br/publico/EstatisticaIRPF/doacoesDIRPF_PR_2021.HTML
- https://servicos.receita.fazenda.gov.br/publico/EstatisticaIRPF/doacoesDIRPF_PR_2022.HTML
- https://servicos.receita.fazenda.gov.br/publico/EstatisticaIRPF/doacoesDIRPF_PR_2023.HTML
- https://servicos.receita.fazenda.gov.br/publico/EstatisticaIRPF/doacoesDIRPF_PR_2024.HTML
- https://servicos.receita.fazenda.gov.br/publico/EstatisticaIRPF/doacoesDIRPF_PR_2025.HTML
- https://servicos.receita.fazenda.gov.br/publico/EstatisticaIRPF/doacoesDIRPF_PR_2026.HTML

## Como usar em um projeto já configurado

Preserve a pasta e o `.env` que você já usa. **Não altere nem remova os volumes** do banco. Na raiz do projeto:

```bash
docker compose up -d --build
```

Isso inicia três serviços:

- `db`: PostgreSQL, igual ao anterior;
- `app`: migrações e aplicação React/Express (a importação inicial de 2025 continua compatível com a versão anterior);
- `receita-sync`: espera o aplicativo estar saudável, verifica o histórico faltante e continua acompanhando os novos relatórios **a cada 24 horas** enquanto estiver ligado.

**Não é preciso importar os anos manualmente ou reiniciar o app para detectar os próximos anos.** Na primeira execução, os anos anteriores serão adicionados gradualmente. Atualize o navegador para ver os anos no filtro após concluir a importação.

### Acompanhar a importação

```bash
docker compose logs -f receita-sync
```

Ver quais anos foram importados no banco:

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT ano, valor_total, doacoes_total FROM estatistica_receita_estado_ano ORDER BY ano;"'
```

Visualização da API: http://localhost:8080/api/repasses/anos

Página Transparência: http://localhost:8080/transparencia

### Configuração opcional

Os valores abaixo são **padrões do `docker-compose.yml`**; não é obrigatório adicioná-los ao seu `.env`:

```dotenv
RECEITA_ANO_INICIAL=2021
RECEITA_INTERVALO_HORAS=24
RECEITA_REVISAR_ANOS=2
RECEITA_AUTO_IMPORTAR=true
```

- `RECEITA_ANO_INICIAL`: primeiro ano a considerar na consulta. Anos anteriores a 2021 não foram validados nesta implementação.
- `RECEITA_INTERVALO_HORAS`: frequência de verificação enquanto o contêiner estiver ligado (padrão 24 horas; aceita 1 a 720).
- `RECEITA_REVISAR_ANOS`: quantidade de anos recentes a rever em cada ciclo (padrão 2). Os anos mais antigos com importação concluída são preservados, sem novas consultas desnecessárias.
- `RECEITA_AUTO_IMPORTAR=false`: desativa a importação automática, inclusive a rotina de sincronização.

### Se o governo ainda não publicou o ano

O servidor da Receita pode responder `404` ou `410`. O sincronizador trata esses códigos como **ano ainda não publicado**, e tenta de novo no ciclo seguinte. Problemas de rede e HTML com formato inesperado são registrados como falha, sem apagar os dados anteriores.

A verificação do ano novo começa depois da virada de ano no horário de Brasília. Depois da publicação, o relatório deve ser detectado na próxima checagem do serviço (normalmente em até 24 horas enquanto estiver ligado e conectado). Se o computador estiver desligado, a checagem acontecerá na próxima inicialização.

### Segurança e integridade

- Preserva todas as tabelas, dados do PostgreSQL, views e migrações já existentes. Não há SQL destrutivo.
- A tabela municipal tem chave única por `(municipio_id, ano)` e o importador usa `ON CONFLICT`; uma segunda execução não duplica dados.
- O checksum SHA-256 evita processar novamente um HTML igual ao já importado.
- Mantém os totais originais publicados; não converte percentuais arredondados em valores exatos separados por fundo.
- Continua validando os 399 municípios, a linha ESTADUAL, as quantidades e o total com tolerância de R$ 1,00 apenas na conferência.
- **Novo:** valida o ano presente no cabeçalho da página oficial antes de gravar para evitar misturar períodos por engano.
- Se a Receita mudar a estrutura das páginas, o sistema falhará de forma explícita em vez de gravar dados inválidos. Isso exigirá manutenção do parser.

### Arquivos alterados nesta atualização

- `docker-compose.yml`: reaproveita a mesma imagem do app em um serviço `receita-sync` e verifica quando o app está saudável.
- `backend/scripts/sincronizar-receita.js` (novo): lista os anos importados e agenda verificações automáticas, inclusive quando virarem novos anos.
- `backend/scripts/importar-receita-html.js`: distingue ano não publicado (`404/410`) de erro verdadeiro.
- `backend/scripts/receitaParser.js`: checa que o cabeçalho da página corresponde ao ano solicitado.
- `backend/tests/sincronizarReceita.test.js` (novo) e `backend/tests/receitaParser.test.js`: testes de seleção de anos, continuidade em falhas, calendário e cabeçalho.
- `.env.example` e documentação: parâmetros e instruções.

Nenhum arquivo do frontend foi alterado: a lista de anos da página Transparência é preenchida com base no endpoint `/api/repasses/anos` já existente.

## Testes

Depois do build, com as dependências instaladas:

```bash
docker compose exec app npm test
```

> **Observação:** os testes automatizados verificam a lógica. O download de todos os arquivos oficiais e a inserção no seu PostgreSQL devem ser confirmados nos logs do Docker, na máquina que dispõe de internet e Docker.
