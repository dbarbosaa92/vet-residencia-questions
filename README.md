# Sala de Estudo — Residência em Grandes Animais

App de questões objetivas para treino de prova de residência veterinária,
área de Grandes Animais. React + Vite no front, Supabase como banco de
questões e histórico de respostas.

## Como funciona

- Fluxo contínuo: sempre aparece uma questão nova, sem "fim de rodada".
- A cada 15 questões respondidas, a próxima é uma **revisão** — uma questão
  já respondida antes, priorizando as que ela errou. Vem marcada com a
  etiqueta "🔁 Revisão".
- A aba **Desempenho** mostra o histórico agregado por matéria, ordenado da
  mais fraca pra mais forte.
- Dá pra filtrar por matéria na aba Praticar (a revisão ignora esse filtro
  de propósito, pra reforçar tudo que ela já estudou, não só a matéria atual).

## 1. Criar o projeto no Supabase

1. Crie uma conta/projeto em supabase.com (plano free resolve).
2. No SQL Editor do projeto, rode o conteúdo de `sql/schema.sql` (cria as
   tabelas `questions` e `attempts` com as policies de acesso).
3. Depois rode `sql/seed_questions.sql` — isso já popula o banco com as 50
   questões iniciais (prova UFCG/COMPROV 2014, Grandes Animais).
4. Em Project Settings → API, copie a **Project URL** e a **anon public key**.

## 2. Rodar localmente

```bash
npm install
cp .env.example .env
# cole a URL e a anon key no .env
npm run dev
```

## 3. Deploy (Vercel)

1. Suba esta pasta para um repositório no GitHub.
2. Em vercel.com, importe o repositório (Vercel detecta o Vite sozinho).
3. Em Project Settings → Environment Variables, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. O link fica tipo `seu-projeto.vercel.app`.

## Como adicionar mais questões

Direto pela interface do Supabase (Table Editor → `questions` → Insert row),
sem precisar mexer no código ou fazer novo deploy. Campos:

- `subject`: texto livre — se for uma matéria nova, ela aparece sozinha
  como filtro no app.
- `text`: enunciado.
- `options`: array JSON com as 5 alternativas, ex.
  `["alternativa A", "alternativa B", "alternativa C", "alternativa D", "alternativa E"]`
- `correct`: índice (0 a 4) da alternativa certa.

## Sobre as questões iniciais

O banco já vem com **198 questões** de três fontes públicas oficiais:

- 50 questões da prova de Clínica e Cirurgia de Grandes Animais do Processo
  Seletivo de Residência Médica Veterinária 2014 da UFCG/COMPROV.
- 100 questões da ENARE 2025/2026 (Exame Nacional de Residência, banca FGV/
  Ebserh) — saúde pública/SUS, legislação e ética veterinária, produção
  animal, fisiologia, patologia/diagnóstico, clínica e cirurgia de grandes
  e pequenos animais.
- 48 questões da **UFPR** (Campus Palotina, edital 2023/2024, banca NC-UFPR)
  — uma das provas que ela vai efetivamente prestar.

USP e UNESP usam a banca VUNESP, que não disponibiliza as provas anteriores
de residência veterinária em texto pesquisável publicamente (só PDFs
fechados/escaneados atrás de login) — não deu pra puxar questões de lá
automaticamente. Se ela conseguir esses PDFs por conta própria (ex.
baixando do portal da VUNESP ou de colegas), me manda que eu formato e
incluo no banco.

## Segurança / privacidade

As policies de RLS deixam a tabela `attempts` aberta para leitura e escrita
pela anon key (sem login). Como é um app de uso pessoal e não guarda nenhum
dado sensível (só respostas de quiz), isso é aceitável — mas vale saber que
qualquer pessoa com a URL do projeto Supabase em mãos poderia, em teoria,
inserir ou ler linhas dessa tabela. Se um dia quiser travar mais, dá pra
adicionar autenticação (Supabase Auth) e trocar as policies para checar
`auth.uid()`.
