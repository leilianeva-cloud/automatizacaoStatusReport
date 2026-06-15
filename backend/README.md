# 📊 Status Semanal — Hapvida

Sistema web para gestão de **Status Report** de projetos, com importação de portfólio via planilha Excel, edição de cronogramas com gráfico de Gantt visual, e geração de apresentações **PPTX** prontas para reuniões de governança.

---

## ✨ Funcionalidades

### 📥 Importação de Portfólio
- Upload de arquivo `.xlsx` com a estrutura do portfólio Hapvida
- Parse automático das linhas da planilha (abas "Portfólio")
- Filtros por SM/PMO, trimestre e compromisso
- Projetos inválidos (cancelados, suspensos, despriorizados) são automaticamente ignorados

### 📋 Edição de Cronogramas (Gantt)
- Visualização interativa do cronograma com barras por fase
- Cores por fase: Planejamento 🟣, Desenvolvimento 🔵, Homologação 🟠, Entrega 🟢, Op. Assistida 🟢
- Suporte a **fases customizadas** e fases **"A definir"**
- **Repactuação de prazos**: possibilidade de alterar a data de fim de uma fase mantendo a data original visível
- **Status por demanda**: A iniciar, Em Andamento, Atrasado, Concluído
- **Linha do hoje** (`📅`) no gráfico indicando a data atual
- **Agrupamento em pacotes**: organize demandas em pacotes com progresso consolidado
- Controle de trimestres passados e futuros na linha do tempo
- **Auto-save** com debounce de 600ms

### 📑 Geração de PPTX
- Geração nativa de slides PowerPoint (OOXML + ZIP montados manualmente, sem dependências externas)
- Um slide por projeto com:
  - Cabeçalho com nome, resumo, equipe e status geral
  - Tabela de cronograma com barras de fase e percentuais
  - Indicador visual de repactuação
  - Pontos de atenção
  - Rodapé com datas e responsável
- **Paginação automática**: projetos com muitas demandas geram múltiplos slides
- Download direto no navegador

### 👥 Gestão de Usuários (Admin)
- CRUD completo de usuários
- Controle de permissões (admin / usuário comum)
- Ativação/desativação de contas
- Geração de senha aleatória na criação
- Reset de senha com nova senha aleatória
- **Troca obrigatória de senha** no primeiro acesso
- Perfil do usuário com edição de nome e senha

### 🔐 Autenticação
- Login com email e senha
- Registro de novos usuários
- JWT com expiração de 7 dias
- Middleware de autenticação em todas as rotas da API
- Middleware específico para rotas administrativas
- Sessão persistida no `localStorage`

---

## 🏗️ Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│   Server     │────▶│     DB       │
│  React +     │     │  Express.js  │     │   MySQL 8    │
│  Vite +      │     │   (API)      │     │              │
│  Nginx       │     │  Porta 3001  │     │  Porta 3307  │
└──────────────┘     └──────────────┘     └──────────────┘
        │                    │
        │                    │
   ┌────▼────┐         ┌────▼────┐
   │  Nginx  │         │  JWT    │
   │  Proxy  │         │  Auth   │
   │  Reverso│         │         │
   └─────────┘         └─────────┘
```

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React 18 + Vite | ^18.3.0 / ^5.3.0 |
| **UI** | CSS Modules + Lucide React (ícones) | ^0.383.0 |
| **HTTP Client** | Axios | ^1.7.2 |
| **Backend** | Node.js + Express | ^4.19.2 |
| **Autenticação** | JWT (jsonwebtoken) + bcryptjs | ^9.0.2 / ^2.4.3 |
| **Banco** | MySQL 8.0 | — |
| **ORM/DB** | mysql2 (pool de conexões) | ^3.9.7 |
| **Planilhas** | xlsx (SheetJS) | ^0.18.5 |
| **Upload** | Multer (memory storage) | ^1.4.5 |
| **Container** | Docker + Docker Compose | — |
| **Proxy** | Nginx (com SSL via Let's Encrypt) | 1.27-alpine |

### Estrutura do Projeto 

```
hapvida-status-macro/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── LoginScreen.jsx      # Tela de login/registro
│   │   │   ├── ChangePasswordModal.jsx  # Modal de troca de senha
│   │   │   ├── ProjectsScreen.jsx   # Tela de listagem de projetos
│   │   │   ├── UsersScreen.jsx      # Tela de gestão de usuários (admin)
│   │   │   ├── NavBar/              # Barra de navegação superior
│   │   │   └── ProfileModal/        # Modal de edição de perfil
│   │   ├── scenes/                  # Cenas (páginas completas)
│   │   │   ├── PortfolioScene/      # Cena de portfólio (importação)
│   │   │   ├── CronogramaScene/     # Cena de cronograma (edição)
│   │   │   ├── ProjectsScene/       # Cena de listagem de projetos
│   │   │   ├── AdminUsersScene/     # Cena de admin de usuários
│   │   │   ├── ImportScreen/        # Tela de importação de portfólio
│   │   │   └── ReportScreen/        # Tela de edição do report
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx       # Contexto de autenticação
│   │   ├── services/
│   │   │   └── api.js               # Cliente HTTP (Axios)
│   │   └── utils/
│   │       ├── reportCore.js        # Core de lógica de relatório
│   │       └── reportWidgetsPptx.jsx # Componentes UI + gerador PPTX
│   ├── nginx/
│   │   └── nginx.conf               # Configuração Nginx (HTTP + HTTPS)
│   ├── Dockerfile                   # Build multi-estágio (Node → Nginx)
│   └── vite.config.js               # Configuração Vite
│
├── server/                          # Backend Express
│   ├── src/
│   │   ├── index.js                 # Entry point (Express app)
│   │   ├── db.js                    # Pool de conexões MySQL
│   │   ├── routes/
│   │   │   ├── auth.js              # Rotas de autenticação
│   │   │   ├── portfolio.js         # CRUD de portfólio
│   │   │   ├── projects.js          # CRUD de projetos
│   │   │   └── users.js             # CRUD de usuários (admin)
│   │   └── middleware/
│   │       ├── auth.js              # Middleware JWT
│   │       ├── adminAuth.js         # Middleware admin
│   │       └── upload.js            # Middleware Multer
│   └── Dockerfile                   # Node 20 Alpine (non-root)
│
├── db/                              # Banco de dados
│   ├── init.sql                     # Schema inicial
│   ├── migrations/                  # Migrations SQL
│   │   └── 001_add_user_management_fields.sql
│   ├── Dockerfile                   # MySQL 8.0
│   └── README-MIGRATIONS.md         # Documentação de migrations
│
├── docker-compose.yml               # Orquestração dos serviços
├── .env                             # Variáveis de ambiente
├── CHANGELOG.md                     # Histórico de alterações
└── README.md                        # Este arquivo
```

---

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados
- Domínio público (opcional, para HTTPS)

### 1. Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
MYSQL_ROOT_PASSWORD=senha_root
MYSQL_DATABASE=hapvida_status
MYSQL_USER=hapvida_user
MYSQL_PASSWORD=senha_usuario

# JWT
JWT_SECRET=uma_chave_secreta_forte_aqui

# HTTPS (opcional)
LETSENCRYPT_DOMAIN=seudominio.com.br
LETSENCRYPT_EMAIL=email@dominio.com
```

### 2. Subir os serviços

```bash
# Build e start
docker compose up --build -d

# Acompanhar logs
docker compose logs -f
```

### 3. Acessar

- **HTTP**: `http://localhost:80` (ou porta 80 do servidor)
- **API**: `http://localhost:3001/api/health`

### 4. HTTPS com Let's Encrypt (opcional)

```bash
# Subir serviços
docker compose up -d --build client certbot

# Emitir certificado
docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$LETSENCRYPT_DOMAIN" \
  --email "$LETSENCRYPT_EMAIL" \
  --agree-tos --no-eff-email --non-interactive

# Recarregar Nginx
docker compose restart client
```

A renovação automática é feita pelo serviço `certbot` a cada 12 horas.

---

## 🗄️ Banco de Dados

### Tabelas

#### `users`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | VARCHAR(36) | UUID |
| name | VARCHAR(120) | Nome do usuário |
| email | VARCHAR(191) | Email (único) |
| password_hash | VARCHAR(255) | Hash bcrypt |
| is_admin | TINYINT(1) | Admin? |
| is_active | TINYINT(1) | Ativo? |
| must_change_password | TINYINT(1) | Troca obrigatória? |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

#### `user_portfolio`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| user_id | VARCHAR(36) | FK → users |
| rows_json | LONGTEXT | JSON array das linhas brutas |
| imported_at | VARCHAR(20) | Data da importação |
| updated_at | TIMESTAMP | Última atualização |

#### `report_projects`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | VARCHAR(255) | ID do projeto (composto) |
| user_id | VARCHAR(36) | FK → users |
| n_futuros | INT | Trimestres futuros |
| n_passados | INT | Trimestres passados |
| usa_pacotes | TINYINT(1) | Usa agrupamento? |
| projeto_json | LONGTEXT | JSON do projeto |
| raias_json | LONGTEXT | JSON das demandas/marcos |
| pacotes_json | LONGTEXT | JSON dos pacotes |
| created_at | TIMESTAMP | Criação |
| updated_at | TIMESTAMP | Atualização |

### Migrations

As migrations ficam em `db/migrations/` e são aplicadas manualmente em bancos existentes:

```bash
docker exec -i hapvida_db mysql -u root -p${MYSQL_ROOT_PASSWORD} \
  hapvida_status < db/migrations/001_add_user_management_fields.sql
```

---

## 🔌 API REST

### Autenticação
- `POST /api/auth/register` — Registrar novo usuário
- `POST /api/auth/login` — Login
- `POST /api/auth/change-password` — Alterar senha (autenticado)
- `PUT /api/auth/profile` — Atualizar perfil (autenticado)

### Portfólio
- `POST /api/portfolio/upload` — Upload de .xlsx (autenticado)
- `GET /api/portfolio` — Obter portfólio (autenticado)
- `PUT /api/portfolio` — Salvar portfólio (autenticado)
- `DELETE /api/portfolio` — Limpar portfólio (autenticado)

### Projetos
- `GET /api/projects` — Listar projetos (autenticado)
- `POST /api/projects` — Salvar projetos (autenticado)
- `DELETE /api/projects/:id` — Remover projeto (autenticado)

### Usuários (Admin)
- `GET /api/users` — Listar usuários
- `POST /api/users` — Criar usuário
- `PUT /api/users/:id` — Atualizar usuário
- `DELETE /api/users/:id` — Deletar usuário
- `POST /api/users/:id/reset-password` — Resetar senha

### Health Check
- `GET /api/health` — `{ "status": "ok" }`

---

## 🎨 Design System

- **Tipografia**: Archivo (corpo) + Fraunces (títulos)
- **Background**: `#F1F5F9`
- **Paleta Hapvida**:
  - Azul primário: `#003B82`
  - Laranja: `#F47B20`
  - Verde: `#00B050`
  - Roxo: `#7030A0`
  - Azul fases: `#0070C0`
- **Componentes**: Cards brancos com sombra, botões arredondados, inputs com borda sutil
- **Responsivo**: Layout adaptável para mobile com menu hamburguer

---

## 🔒 Segurança

- Senhas armazenadas com **bcrypt** (10 rounds)
- Autenticação via **JWT** com expiração de 7 dias
- Middleware de autenticação em todas as rotas da API
- Middleware específico para rotas administrativas
- Usuários inativos são bloqueados no login
- Troca obrigatória de senha no primeiro acesso
- Senhas aleatórias de 8 caracteres na criação de usuários
- Servidor Node roda como **usuário não-root** (appuser)
- Nginx com headers de segurança (HSTS, CSP, X-Frame-Options, etc.)
- Rate limiting implícito via Nginx

---

## 📦 Geração de PPTX

O sistema gera arquivos PowerPoint (.pptx) **nativamente no navegador**, sem dependências de servidor ou bibliotecas externas. O processo:

1. **Montagem do XML** OOXML (PresentationML) manualmente
2. **Compactação ZIP** via implementação própria (store-only)
3. **Download** via Blob URL

Isso permite que a geração seja feita 100% no client, sem sobrecarregar o servidor.

---

## 🐳 Comandos Docker Úteis

```bash
# Restart sem perder dados
docker compose restart

# Rebuild sem perder dados
docker compose down && docker compose up --build -d

# Reset completo (APAGA TUDO)
docker compose down -v && docker compose up --build -d

# Logs
docker compose logs -f

# Backup do banco
docker exec hapvida_db mysqldump -u root -p$MYSQL_ROOT_PASSWORD \
  hapvida_status > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i hapvida_db mysql -u root -p$MYSQL_ROOT_PASSWORD \
  hapvida_status < backup.sql
```

---

## 📄 Licença

Proprietário — Hapvida.
