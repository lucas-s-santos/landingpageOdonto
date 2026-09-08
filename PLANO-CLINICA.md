# PLANO — o lado da clínica

Saída da pergunta "o sistema tem backend?". A resposta é não, e este arquivo
diz o que seria preciso para ter, em que ordem, e o que cada peça custa de
verdade.

**Estado: só a fase A foi construída**, e ela nasceu desligada — ver seção 3.
B, C e D são plano, zero código, e continuam esperando as decisões da seção
6. É o passo 1 do `CLAUDE.md` aplicado a um produto novo: plano primeiro,
aprovação depois, código por último.

---

## 0. Onde estamos hoje

O site é Astro estático puro. Sem adapter, sem rota de API, sem `fetch`,
nenhum `<form action>`. Dependências: `astro`, `gsap`, `lenis`, `three`.

O "lado da clínica" hoje é a caixa de entrada do WhatsApp, e ela já recebe
um contato estruturado:

> Olá! Vim pelo Instagram e queria agendar uma avaliação. Meu nome é Ana
> Paula. Motivo: Estou com dor. Melhor horário para retornar: à noite.

Nome, motivo, janela de retorno e canal de origem, sem a recepcionista
perguntar nada. Não é pouco. O que falta é contagem, confirmação, histórico
que sobreviva à perda do celular, e agenda.

---

## 1. O problema de pedir os quatro de uma vez

As quatro peças pedidas são:

| # | Peça | O que é de verdade |
|---|------|--------------------|
| A | Relatório de canal | analytics de tráfego |
| B | Confirmação automática | integração com a API oficial do WhatsApp |
| C | Painel de contatos | CRM com dado sensível de saúde |
| D | Agenda completa | software de gestão odontológica |

**D é um mercado maduro.** Dental Office, Simples Dental, Clinicorp e outros
já resolvem agenda, prontuário, financeiro e integração com convênio.
Construir isso do zero é um produto de anos, não um módulo — e prontuário
eletrônico carrega obrigação de guarda e sigilo que muda a exposição da
CalmDev inteira.

**B depende de D (ou de uma integração com o D que a clínica já usa).**
Não existe "confirmar consulta" sem uma consulta registrada em algum lugar
consultável. Essa é a dependência que decide a ordem do projeto todo.

**C é o único que introduz dado sensível.** Ver seção 4.

**A não precisa de backend nenhum.** Foi a única construída, e está
desligada até você escolher a ferramenta.

---

## 2. A pergunta que decide tudo, e que ainda não tem resposta

> Isto é para UMA clínica ou é produto para vender a várias?

Você respondeu que ainda é a demo, não há cliente. Então, hoje, **tudo de B
para baixo é especulação**: estaríamos escolhendo integração, modelo de
dados e mensalidade sem saber o que a primeira clínica usa, quem opera o
balcão, e se ela paga recorrência.

O caminho que não desperdiça trabalho é: entregar A agora, **vender para uma
clínica real**, e deixar essa primeira clínica decidir B e C. O que ela já
usa de agenda é o dado que falta, e ele não se descobre pensando.

---

## 3. As quatro peças, com o custo real

### A — Relatório de canal · sem backend · INSTRUMENTAÇÃO CONSTRUÍDA

**Estado: construída e testada, desligada.** Falta só você escolher a
ferramenta.

O que existe:

- `src/data/medicao.ts` — a configuração. `provedor: 'nenhum'` hoje. Trocar
  para `'plausible'` ou `'umami'` liga tudo. Uma linha
- `src/scripts/medicao.ts` — os três eventos do funil: `visita` (denominador),
  `contato` (clique no WhatsApp, a única conversão da página) e `preparo`
  (abertura de `/primeira-consulta`). Cada um carrega **só a chave do canal**
- `scripts/medicao-check.mjs` — `npm run medicao`, já dentro do
  `npm run verificar`

**Desligada, não custa nada.** Conferido no build: `dist/index.html` não tem
uma referência sequer a `medicao`, `plausible` ou `umami`. O visitante não
baixa um byte, e o Lighthouse segue em 98. (O chunk `medicao.*.js` é emitido
em `dist/_astro/` como arquivo órfão, ~2 KB que ninguém requisita — o Astro
coleta script de componente estaticamente e não vale complicar o build para
eliminá-lo.)

**O que o teste trava para sempre.** O formulário coleta nome e motivo, e o
motivo inclui "Estou com dor". O `npm run medicao` preenche o formulário de
verdade, clica no botão e confere que nada daquilo saiu junto:

```
o NOME digitado nunca e enviado
o MOTIVO ("Estou com dor") nunca e enviado — e dado de saude
o horario escolhido nunca e enviado
todo evento carrega SO a chave canal
clicar numa ancora #agendar NAO conta como contato
com o script bloqueado, nenhum erro e o botao do WhatsApp funciona
```

É a linha que separa "conto de onde vem o paciente" de "guardo o problema de
saúde dele". A primeira não tem consequência de LGPD; a segunda é a seção 4.

**Como:** analytics sem cookie, com evento no clique do CTA. O relatório vira
o funil por canal: *o Instagram trouxe 40 visitas e 6 cliques no WhatsApp; o
Google trouxe 120 e 22.*

**Ferramenta.** Três opções, e a escolha muda o custo:

| | custo | evento de clique | pesa no Lighthouse |
|---|---|---|---|
| Cloudflare Web Analytics | grátis | fraco | quase nada |
| Plausible (hospedado) | mensalidade baixa | sim | ~1 KB |
| Umami (auto-hospedado) | custo do servidor | sim | ~2 KB |

Recomendo **Plausible ou Umami**: o Cloudflare é o mais leve, mas evento
customizado é justamente o que precisamos, e ele é fraco nisso.

**LGPD:** nenhum desses grava dado pessoal nem usa cookie. É contagem de
tráfego, não paciente. Não pede banner de consentimento.

**Atenção ao piso de qualidade:** hoje o Lighthouse mobile está em 98. Um
script de terceiro entra no orçamento. Tem que ser `defer`, medido antes e
depois, e reprovado se derrubar abaixo de 90.

**Prazo:** dias.

---

### B — Confirmação automática · o que ataca a falta · o item caro

O lembrete 24h antes com "confirmo" / "preciso remarcar" é a peça que
realmente devolve horário para a agenda. Também é a mais cara e a que mais
depende de coisa fora do nosso controle.

**Precisa de:**

- **WhatsApp Business Platform (Cloud API)** da Meta. O link `wa.me` que
  usamos hoje é grátis e **não devolve nada** — nem confirmação de entrega.
  Para mandar mensagem ativa é outra coisa: conta business verificada,
  modelos de mensagem (*templates*) aprovados previamente pela Meta, e
  **cobrança por mensagem de utilidade enviada**
- **Um servidor de verdade**, com endereço fixo, para receber o webhook das
  respostas. Isso não roda em hospedagem estática
- **Um agendador** que dispare os lembretes na hora certa
- **Uma agenda para ler**, que é a dependência da seção 1

> **Custo: não invento número.** O modelo de cobrança da Meta mudou nos
> últimos anos (de conversa para mensagem, com categorias diferentes para
> utilidade, marketing e serviço) e os valores em real mudam por região e
> por período. **[CONFERIR na tabela oficial da Meta antes de prometer
> qualquer preço ao cliente.]** O que já dá para afirmar: é recorrente,
> escala com o volume de pacientes, e alguém tem que pagar todo mês.

**Consequência comercial:** B só fecha com contrato de recorrência. Vender
como "faço uma vez e te entrego" é assinar prejuízo — a conta da Meta chega
todo mês, com ou sem mensalidade da clínica.

**Prazo:** semanas, e boa parte é espera de aprovação da Meta.

---

### C — Painel de contatos · o que muda a natureza do projeto

Ver cada contato que chegou, de qual canal, e marcar se virou consulta.

**Precisa de:** backend, banco, autenticação, backup, e — o que pesa mais —
tratamento de **dado pessoal sensível**. Ver seção 4.

**Existe uma versão barata que quase ninguém considera:** o painel que conta
mas **não guarda**. Ele registra "chegou um contato do Instagram às 22h14" e
nada mais — sem nome, sem motivo, sem telefone. A conversa continua inteira
no WhatsApp, como hoje. Isso entrega quase todo o relatório gerencial com
zero dado de saúde armazenado, e some com a maior parte da exposição da
seção 4.

Recomendo começar por essa versão e só guardar dado nominal se a clínica
pedir, entendendo o que está pedindo.

**Prazo:** semanas.

---

### D — Agenda completa · recomendo não construir

Horário, profissional, cadeira, prontuário, convênio, financeiro. É um
produto de anos contra concorrentes estabelecidos, e prontuário eletrônico
traz obrigação de guarda e de sigilo que muda a responsabilidade da CalmDev
como empresa.

**A alternativa que entrega o mesmo valor:** integrar com o que a clínica já
usa. Se ela usa um sistema com API, B passa a ler os horários de lá e a
CalmDev nunca vira dona da agenda. Se ela não usa nada, a agenda vira parte
de C — mínima, só o suficiente para o lembrete de B funcionar.

---

## 4. LGPD — o que muda no minuto em que existir um banco

Hoje isto **não se aplica a nós**: a mensagem vai do navegador da visitante
direto para o WhatsApp da clínica, e a CalmDev não toca em nada. Não há
banco, não há coleta, não há retenção.

Com C, muda. `Nome: Ana Paula. Motivo: estou com dor.` é **dado pessoal
sensível** — a LGPD (art. 5º, II) classifica dado referente à saúde como
sensível, com regime mais rígido que dado comum.

O que passa a existir:

- **a clínica vira controladora e a CalmDev vira operadora.** Isso pede
  contrato entre as duas, com as obrigações de cada uma escritas
- **base legal** para tratar dado sensível, que não é "legítimo interesse" —
  para dado de saúde a lista do art. 11 é mais curta, e na prática cai em
  consentimento específico e destacado, ou tutela da saúde
- **política de retenção**: por quanto tempo o contato fica no banco e o que
  apaga
- **direito do titular**: a pessoa pode pedir acesso, correção e eliminação,
  e precisa haver um caminho para isso
- **incidente de segurança** tem que ser comunicado

Nada disso é impeditivo — clínica trata dado de saúde o dia inteiro. O ponto
é que **hoje esse risco é zero e passa a não ser**, e isso é uma decisão de
negócio, não um detalhe técnico. É também um argumento de venda honesto para
o estágio atual: *"seu site não guarda dado nenhum de paciente."*

---

## 5. Sequência recomendada

```
AGORA        A — relatório de canal, sem backend, sem risco legal
             vira argumento de venda imediato: "eu te mostro de onde
             vem seu paciente"

DEPOIS       vender para UMA clínica real
             sem isso, tudo abaixo é especulação sobre um cliente
             que ainda não existe

ENTÃO        descobrir o que ela usa de agenda
             é o dado que decide se B integra ou se B precisa de
             uma agenda mínima nossa

SÓ COM       B — confirmação automática
RECORRÊNCIA  a conta da Meta chega todo mês

SE PEDIREM   C — painel, começando pela versão que conta e não guarda

NÃO          D — agenda completa. Integrar, nunca reconstruir
```

---

## 6. O que eu preciso que você decida

1. ~~Toco o A agora?~~ **Feito** — a instrumentação está construída e
   testada, desligada. Falta a ferramenta: Umami auto-hospedado se você já
   tem onde hospedar, Plausible se prefere não manter servidor. Escolhida a
   ferramenta, é preencher `src/data/medicao.ts` e rodar
   `npm run lighthouse` antes e depois: script de terceiro entra no
   orçamento de performance, e o piso de 90 vale mais que o relatório.

2. **A CalmDev quer ser operadora de dado de saúde?** É a pergunta por trás
   de C, e é sua, não minha. Ela muda contrato, seguro e responsabilidade.

3. **Existe cliente à vista?** Se existe e ele já usa um sistema de gestão,
   me diga qual — isso reordena tudo de B para baixo.

4. **B tem mensalidade?** Se a resposta for "o cliente não vai querer pagar
   mensalidade", B sai do plano hoje, e isso é melhor descobrir agora.
