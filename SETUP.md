# SETUP — o que instalar antes de chamar o Claude Code

Rode tudo dentro da pasta `landing-odonto/`.

## 1. Projeto

```bash
npm create astro@latest . -- --template minimal --typescript relaxed --no-git
npx astro add tailwind
npm i gsap lenis three
npm i -D @playwright/test
npx playwright install chromium
```

A pasta `public/` já existe com os assets. O `create astro` não apaga — se ele
reclamar que o diretório não está vazio, escolha continuar.

## 2. Fontes

Cabinet Grotesk e Switzer saem do Fontshare, uso comercial livre. Baixe os `.woff2` e
coloque em `public/fonts/`. Não carregue por CDN — fonte por CDN custa uns 300ms de
LCP e a página tem meta de Lighthouse 90.

Se preferir Google Fonts, a alternativa aprovada é Bricolage Grotesque + Instrument
Sans, também locais.

## 3. Skills

```bash
npx skills add emilkowalski/skill
npx skills add greensock/gsap-skills
```

O primeiro é do Emil Kowalski, autor do Sonner e do Vaul — a linguagem de animação dele
é o oposto de template. O segundo é o material do GSAP.

Os outros repositórios da lista original (`impeccable`, `taste-skill`, `img2threejs`,
`claude-skills`) eu não consegui verificar. Abra o README de cada um antes de instalar:
skill mal escrita entra no contexto e piora o resultado em vez de melhorar. Instale
poucas e boas.

## 4. Referência visual — o passo que mais importa

Skill não ensina gosto. Imagem ensina.

Junte 5 a 8 screenshots de sites que você acha bonitos — Awwwards, Godly, Land-book,
Minimal Gallery — e jogue em `refs/`. Sites de arquitetura, de clínica de estética e de
produto de skincare puxam melhor pra este projeto do que sites de dentista, que são
quase todos ruins.

Depois é só dizer ao Claude Code: *"olha as imagens em refs/ — é esse nível de
acabamento e essa densidade de layout que eu quero"*. Ele lê imagem, e isso move o
resultado mais do que qualquer prompt escrito.

## 5. Deploy

Astro estático vai em qualquer lugar. Para a demo comercial:

```bash
npm run build
npx vercel --prod
```

Aponte para um subdomínio da CalmDev — `clinicademo.calmdev.com.br` vende melhor que
uma URL aleatória da Vercel.
