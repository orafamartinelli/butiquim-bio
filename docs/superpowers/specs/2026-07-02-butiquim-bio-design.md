# Spec: Butiquim Bio — link-in-bio próprio com promoters rotativos

**Data:** 2026-07-02
**Projeto:** `Documents/projetos/butiquim-bio`
**Status:** aprovado em brainstorm com Rafa

## Objetivo

Substituir a página beacons.ai/obutiquim por uma página própria, hospedada em
`bio.obutiquim.com.br`, para ganhar velocidade de ajuste (editar config + deploy em ~1 min),
eliminar o banner do Beacons e adicionar a seção de **promoters rotativos** — botões de
WhatsApp, um por promoter, cuja ordem gira toda semana para revezar quem fica no topo.

Escopo **v1 enxuta**: só o essencial. O Beacons continua no ar até a validação; a troca do
link na bio do Instagram é manual, feita pelo Rafa ao final.

## Stack e deploy

- **HTML/CSS/JS puro, estático, sem build** — mesma receita do projeto `butiquim-lista`.
- Deploy: **Cloudflare Pages**, projeto novo `butiquim-bio` (isolado do `butiquim-lista`
  para que deploy da bio nunca arrisque os formulários de lista).
- Custom domain: `bio.obutiquim.com.br` (DNS do domínio já está no Cloudflare;
  credenciais/fluxo de deploy iguais ao butiquim-lista — ver `reference_cloudflare` e
  `wrangler.toml` do butiquim-lista como modelo).
- Convenção de nomes de recursos compartilhados: prefixo `butiquim-`.

## Estrutura de arquivos

```
butiquim-bio/
├── index.html      # página única
├── styles.css      # visual (réplica do Beacons atual)
├── app.js          # renderização + lógica de rotação
├── config.js       # TODO o conteúdo editável (ver abaixo)
├── assets/         # logo, foto de fundo, avatares se houver
├── wrangler.toml   # deploy CF Pages
└── docs/superpowers/specs/  # este spec
```

## config.js — conteúdo editável centralizado

Único arquivo que se edita no dia a dia. Estrutura:

```js
const CONFIG = {
  promoters: [
    // telefone em formato E.164 sem "+" (ex: "5544XXXXXXXXX")
    { nome: "Gabriel",     telefone: "PENDENTE", ativo: true },
    { nome: "Luana Bido",  telefone: "PENDENTE", ativo: true },
    { nome: "Mari",        telefone: "PENDENTE", ativo: true },
    { nome: "Maria Julia", telefone: "PENDENTE", ativo: true },
    { nome: "Nicolly",     telefone: "PENDENTE", ativo: true },
  ],
  mensagemPromoter: "Oi {nome}! Vim pela bio do Butiquim 🍺",
  blocos: [
    // blocos temporários com janela de visibilidade (horário de Maringá, UTC-3)
    // ex.: Copa — some sozinho depois da data
    { id: "copa", visivelDe: "2026-06-30T00:00:00-03:00", visivelAte: "2026-07-06T05:00:00-03:00", ... },
  ],
  links: { /* listas, reservas, seja promoter, redes sociais */ },
};
```

- Os telefones estão **PENDENTES** — Rafa fornece na implementação; a página deve
  funcionar igualmente se um promoter estiver sem telefone (`ativo: false` o tira da rotação).
- Adicionar/remover promoter = editar uma linha; a rotação se adapta a qualquer quantidade ≥ 1.

## Seções da página (ordem)

Réplica visual do Beacons atual: fundo escuro com foto do bar, logo, verde-limão
**#C8D200**, botões arredondados escuros com texto verde-limão. Mobile-first
(praticamente 100% do tráfego vem da bio do Instagram).

1. **Header** — logo, "O Butiquim - Maringá/PR", ícones sociais (e-mail, TikTok, Instagram, X, Facebook — mesmos destinos de hoje).
2. **Card #NÃOTEMERRO** — "19 anos criando histórias e colocando a culpa no ar condicionado!".
3. **Bloco Copa** *(temporário, auto-esconde por data)* — título "JOGOS DA COPA DO MUNDO NO BUTIQUIM!", card do jogo 05/07 Brasil x Noruega → link Ingresso Nacional. Controlado por `visivelDe`/`visivelAte` no config.
4. **Promoters rotativos** — título tipo "FALE COM UM PROMOTER 👇"; um botão por promoter ativo, abrindo `https://wa.me/{telefone}?text={mensagem com nome}`. Ordem definida pela rotação semanal (abaixo).
5. **Listas** — LISTA DE SEXTA / SÁBADO / DOMINGO, mesmos destinos e UTMs de hoje (`obutiquim.com.br/{dia}/?utm_source=Instagram&utm_medium=BioInsta&utm_campaign={Dia}Organico`).
6. **Reservas de Mesas** — corrigir o typo "Messas" → `https://split.to/ReservasBioButiquim`.
7. **Seja promoter! Queremos você!** → Google Forms atual (`https://forms.gle/vn1Ypk3VLekEuwCU9`).

**Fora da v1** (ficam no Beacons até a migração completa): niver/despedida, cardápios,
trabalhe conosco, endereço, avaliação Google, envio de material de artista, achados e
perdidos, pixel Meta e contagem de cliques por promoter.

## Rotação semanal dos promoters

- **Regra:** round-robin — semana N mostra a ordem `[N%k, N%k+1, ..., N%k-1]` sobre a
  lista de promoters ativos (k = quantidade). Cada semana o primeiro da vez vai pro fim.
- **Virada:** segunda-feira **05:00 horário de Maringá (America/Sao_Paulo, UTC-3)** —
  mesmo padrão de corte usado nas listas e relatórios do Butiquim.
- **Implementação (client-side, determinística):** calcular o número da semana a partir de
  uma época fixa ancorada numa segunda 05:00 -03:00 (ex.: `2026-01-05T05:00:00-03:00`):
  `semana = floor((agora - epoca) / 604800000)`; `offset = ((semana % k) + k) % k`.
  Usar timestamp UTC (`Date.now()`) — a época fixa com offset -03:00 garante que todo
  visitante do Brasil vê a mesma ordem, independente do fuso do aparelho.
- A ordem NÃO é aleatória nem por visitante: todos veem a mesma ordem na mesma semana
  (justo e conferível pelos promoters).
- Promoter `ativo: false` sai da rotação sem quebrar a sequência dos demais (a rotação
  opera sobre a lista filtrada de ativos, na ordem do config).

## Tratamento de erros / bordas

- Bloco temporário com datas malformadas → bloco não aparece (fail-closed) e `console.warn`.
- Lista de promoters ativos vazia → seção de promoters não renderiza (página segue normal).
- `config.js` é carregado como script comum (sem fetch/CORS); se faltar, a página mostra
  header + aviso mínimo em vez de quebrar em branco.

## Testes / verificação

- Teste manual com Playwright (mesmo ferramental já usado na sessão): renderizar em
  viewport mobile, conferir ordem dos promoters em datas simuladas (mock de `Date.now()`
  via query `?debugData=YYYY-MM-DD` que só altera o cálculo da semana — útil também para
  conferir a virada de segunda 5h e o auto-esconder do bloco Copa).
- Conferir todos os links de saída (destinos idênticos aos do Beacons, exceto correção do typo).
- Lighthouse mobile: página deve carregar em < 1s em 4G (estático, sem dependências externas
  além de fontes, se houver).

## Critérios de aceite

1. `bio.obutiquim.com.br` no ar servindo a página com visual equivalente ao Beacons atual.
2. Seção de promoters mostra os 5 botões wa.me com mensagem pré-preenchida com o nome.
3. A ordem gira toda segunda 05:00 (-03:00), round-robin, igual para todos os visitantes.
4. Bloco Copa some sozinho após 06/07/2026 05:00 sem novo deploy.
5. Todos os demais links levam aos mesmos destinos do Beacons de hoje.
6. Editar `config.js` + deploy publica mudança em menos de ~2 minutos.
