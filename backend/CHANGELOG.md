# Sistema de Gestão de Usuários - Hapvida Status Macro

## Últimas Atualizações (2026-06-12)

### ✨ Novas Funcionalidades

#### 1. **Navegação Unificada**
- Adicionada barra de navegação superior com abas "Portfólio" e "Usuários"
- Design consistente em todas as telas
- Logout sempre acessível no canto superior direito

#### 2. **Tela de Gestão de Usuários (Admin)**
- Interface moderna alinhada com o restante do sistema
- Tabela com todos os usuários cadastrados
- Ações disponíveis:
  - ✏️ Editar (nome e permissão admin)
  - 🔄 Resetar Senha (gera nova senha aleatória)
  - 🗑️ Deletar usuário
  - ✅/❌ Ativar/Desativar usuário

#### 3. **Sistema de Permissões**
- **Admin automático**: Primeiro usuário + email `j.alexandre.castro@gmail.com`
- Usuários inativos são bloqueados no login
- Administradores têm acesso exclusivo à tela de Usuários

#### 4. **Segurança**
- Senhas aleatórias de 8 caracteres ao criar usuário
- Troca obrigatória de senha no primeiro acesso
- Modal mostra senha gerada com botão "Copiar"
- Hashing bcrypt (10 rounds)

### 🔄 Persistência de Dados

**IMPORTANTE**: Os dados do banco agora são persistidos entre restarts!

#### Comandos:
```bash
# Restart sem perder dados
docker compose restart

# Rebuild sem perder dados
docker compose down && docker compose up --build -d

# Reset completo (APAGA TUDO)
docker compose down -v && docker compose up --build -d
```

#### Backup e Restore:
```bash
# Backup
docker exec hapvida_db mysqldump -u root -p$MYSQL_ROOT_PASSWORD hapvida_status > backup.sql

# Restore
docker exec -i hapvida_db mysql -u root -p$MYSQL_ROOT_PASSWORD hapvida_status < backup.sql
```

### 📁 Estrutura Atualizada

```
hapvida-status-macro/
├── client/
│   └── src/
│       ├── components/
│       │   ├── UsersScreen.jsx         # ✨ NOVA tela de gestão
│       │   ├── ChangePasswordModal.jsx # ✨ NOVO modal de troca de senha
│       │   └── LoginScreen.jsx
│       └── App.jsx                     # ✨ Navegação com abas
├── server/
│   └── src/
│       ├── routes/
│       │   ├── users.js                # ✨ NOVO CRUD de usuários
│       │   └── auth.js                 # ✨ Endpoint change-password
│       └── middleware/
│           └── adminAuth.js            # ✨ NOVO middleware admin
└── db/
    ├── init.sql                        # ✨ Schema atualizado
    ├── migrations/                     # ✨ NOVO sistema de migrations
    │   └── 001_add_user_management_fields.sql
    └── README-MIGRATIONS.md            # ✨ NOVA documentação

```

### 🎨 Design Consistency

Todas as telas agora seguem o mesmo padrão:
- Background: `#F1F5F9`
- Cards brancos com sombra sutil
- Botões arredondados com hover effects
- Tipografia Archivo (corpo) + Fraunces (títulos)
- Paleta de cores Hapvida

### 🚀 Como Usar

1. **Acesse** `http://172.31.194.135/`
2. **Crie conta** (primeira conta será admin automaticamente)
3. **Navegue** entre "Portfólio" e "Usuários" usando o menu superior
4. **Gerencie usuários** (apenas admin vê esta aba)
5. **Logout** sempre disponível no canto superior direito

### 🔐 Fluxo de Primeiro Acesso (Usuário Criado por Admin)

1. Admin cria usuário → senha gerada é exibida
2. Admin anota/copia senha e repassa ao usuário
3. Usuário faz login com senha gerada
4. Modal força troca de senha antes de acessar sistema
5. Após trocar senha, usuário acessa normalmente

---

**Documentação completa de migrations**: Veja [db/README-MIGRATIONS.md](db/README-MIGRATIONS.md)
