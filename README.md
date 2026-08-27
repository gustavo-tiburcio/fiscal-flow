# Fiscal Flow

Papel: Você é um Desenvolvedor Fullstack Sênior e Especialista em UI/UX, focado na criação de interfaces modernas, performáticas e arquiteturas limpas para aplicações Desktop.

Objetivo: Construir o frontend e a estrutura de integração de um aplicativo desktop para gestão fiscal. O aplicativo será empacotado via Electron, usará SQLite com Drizzle ORM no processo principal, e o frontend DEVE SER OBRIGATORIAMENTE EM REACT + TYPESCRIPT. O design deve ser limpo, extremamente profissional e não pode ter "cara de IA" ou de template genérico.

Stack Tecnológica Obrigatória (Não use tecnologias antigas)

Desktop Engine: Electron

Frontend: React + TypeScript (Strict Mode)

Estilização: Tailwind CSS (com componentes customizados e design system limpo)

Animações: GSAP (GreenSock) para todas as transições de onboarding e feedback de UI

Persistência de Dados (Local): SQLite + Drizzle ORM (Estruture os schemas e chamadas via IPC/Bridge do Electron para salvar localmente)

Contexto e Arquitetura do App

O sistema é uma ferramenta de gestão de Notas Fiscais voltada para contadores. Os dados do contador e das empresas devem ser persistidos localmente via Drizzle ORM (SQLite).

Detalhamento do Fluxo e Telas

1. Onboarding Interativo (GSAP + React)

Visual: Começa em uma tela inteiramente branca e minimalista.

Animações (GSAP): Os elementos (textos e inputs) devem surgir sequencialmente com animações sutis e fluidas de fade-in e slide-up. Ao avançar, a pergunta anterior faz um fade-out suave.

Sequência de Passos:

Texto: "Olá. Vamos começar?" (GSAP fade-in).

Pergunta: "Qual é o seu nome completo?" + Input de texto elegante. (Dá Enter ou clica em Próximo).

Transição GSAP.

Pergunta: "E o seu melhor e-mail?" + Input de e-mail.

Transição GSAP.

Pergunta final: "Para finalizar, qual é o seu CPF?" + Input com máscara de CPF.

Persistência Inicial: Ao concluir, grave os dados do usuário no SQLite via Drizzle e execute uma transição suave para o Dashboard.

2. Dashboard Principal (Gestão de Notas Fiscais)

Estilo Visual: Design de nível enterprise, sóbrio, com tipografia nítida e espaçamento moderno.

Estrutura da Tela:

Sidebar (Esquerda): Menu de navegação minimalista. Exibe a lista de empresas cadastradas no SQLite (buscadas via Drizzle) e um botão proeminente "+ Adicionar Empresa".

Área Central: Dashboard com métricas gerais de notas fiscais quando nenhuma empresa estiver selecionada. Quando uma empresa for clicada na sidebar, exibe as notas e detalhes dessa empresa.

Modal/Formulário: Adicionar Nova Empresa

Campos obrigatórios:

CNPJ da Empresa (com máscara formatada).

Upload de Certificado Digital (Área drag-and-drop para arquivos .pfx ou .p12).

Senha do Certificado Digital (Input tipo password com ícone de alternar visibilidade).

Ação: Ao salvar, persista os dados da empresa no SQLite (via Drizzle ORM) e atualize o estado no React sem precisar recarregar a tela.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c0623c83-8b97-41ae-a489-63155dbd1d22).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
