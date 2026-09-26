# Content Flow

Ferramenta de gerenciamento de produção de conteúdo para marketing de afiliados.

## Stack

- **Next.js 15** com App Router
- **TypeScript**
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS v4**
- **shadcn/ui**
- **Lucide Icons**
- **Recharts** (gráficos)
- **dnd-kit** (drag and drop)

## Configuração

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Aguarde o provisionamento do banco de dados.

### 2. Executar a migration

1. Abra o **SQL Editor** no painel do Supabase.
2. Copie o conteúdo de `supabase/migrations/001_initial_schema.sql`.
3. Execute o SQL no editor.

Isso criará todas as tabelas, triggers, funções e políticas de segurança.

### 3. Configurar Auth

1. No painel do Supabase, vá em **Authentication > Providers**.
2. Certifique-se de que o provider **Email** está habilitado.
3. Em **Authentication > URL Configuration**, configure:
   - Site URL: `http://localhost:3000` (desenvolvimento) ou sua URL de produção
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Variáveis de ambiente

Copie as credenciais do Supabase (Settings > API) e edite o `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 5. Instalar dependências e iniciar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

### 6. Criar os primeiros usuários

1. Acesse `http://localhost:3000/register`.
2. Crie sua conta com nome, e-mail e senha.
3. O sistema criará automaticamente:
   - Perfil do usuário
   - Workspace padrão "Content Flow"
   - Configurações iniciais (meta: 10 vídeos/dia)
4. Para o segundo usuário, repita o processo de registro.

### 7. Adicionar segundo usuário ao mesmo workspace

Para que ambos compartilhem o mesmo workspace:

1. Anote o `workspace_id` do primeiro usuário (visível no Supabase, tabela `workspaces`).
2. No SQL Editor do Supabase, execute:

```sql
-- Substitua os UUIDs pelos valores reais
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES ('workspace-id-do-primeiro-usuario', 'user-id-do-segundo-usuario', 'member');
```

Ou, alternativamente, delete o workspace criado automaticamente para o segundo usuário e adicione-o ao workspace do primeiro.

## Estrutura do Projeto

```
src/
├── app/
│   ├── (app)/                 # Rotas autenticadas
│   │   ├── page.tsx           # Dashboard
│   │   ├── products/          # Módulo de produtos
│   │   ├── production/        # Módulo de produção (Kanban)
│   │   ├── publications/      # Módulo de publicações
│   │   ├── calendar/          # Calendário
│   │   ├── library/           # Biblioteca de vídeos
│   │   └── settings/          # Configurações
│   ├── login/                 # Página de login
│   ├── register/              # Página de registro
│   └── auth/callback/         # Callback de autenticação
├── components/
│   ├── layout/                # Sidebar, header
│   ├── products/              # Componentes de produtos
│   ├── videos/                # Componentes de vídeos
│   └── ui/                    # Componentes shadcn/ui
├── contexts/                  # React contexts
├── lib/
│   ├── supabase/              # Clients Supabase
│   ├── types.ts               # TypeScript types
│   └── utils.ts               # Utilitários
└── middleware.ts               # Auth middleware
```

## Banco de Dados

### Entidades principais

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados do usuário |
| `workspaces` | Espaços de trabalho compartilhados |
| `workspace_members` | Associação usuário-workspace |
| `workspace_settings` | Configurações (meta diária, fuso) |
| `products` | Produtos para divulgação |
| `videos` | Tarefas de produção de vídeo |
| `publications` | Registros de publicação por plataforma |

### Relacionamentos

```
Produto (1) ──── (N) Vídeo (1) ──── (3) Publicação
```

- Um produto pode ter infinitos vídeos
- Cada vídeo tem até 3 publicações (TikTok, Shopee, Instagram)
- Publicações são criadas automaticamente com o vídeo

### Automações (triggers)

- **Novo usuário**: Cria perfil + workspace + settings automaticamente
- **Novo vídeo**: Cria 3 registros de publicação automaticamente
- **Vídeo → "Pronto"**: Registra data de conclusão automaticamente
- **Publicação → "Publicado"**: Registra data de publicação automaticamente
- **Qualquer update**: Atualiza `updated_at` automaticamente

## Deploy

### Vercel (recomendado)

1. Faça push do projeto para um repositório Git.
2. Importe o projeto na [Vercel](https://vercel.com).
3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automático.

Lembre-se de atualizar a **Site URL** e **Redirect URLs** no Supabase para o domínio de produção.

## Funcionalidades

- ✅ Autenticação (login/registro)
- ✅ Dashboard com KPIs reais
- ✅ Cadastro de produtos (catálogo visual + tabela)
- ✅ Checklist de validação de produtos
- ✅ Produção de vídeos (Kanban com drag-and-drop)
- ✅ Publicações por plataforma (TikTok, Shopee, Instagram)
- ✅ Criação automática de publicações
- ✅ Biblioteca de vídeos finalizados
- ✅ Calendário de produção
- ✅ Configurações do workspace
- ✅ Ações rápidas (copiar links, abrir em nova aba)
- ✅ Duplicar vídeos
- ✅ Filtros e pesquisa em todas as áreas
- ✅ Row Level Security completo
- ✅ Interface responsiva (desktop + mobile)
