# Contexto do Projeto

> **Estado do documento:** as seções 1 a 11 registram o diagnóstico anterior à refatoração e as seções 12 a 17 preservam o planejamento que a orientou. A seção 18 descreve a arquitetura efetivamente implementada e deve ser usada como referência do estado atual.

## 1. Visão geral

Este projeto é uma API REST simples de autenticação e usuários, construída com Node.js, TypeScript e Express. A persistência utiliza PostgreSQL por meio do Prisma ORM e do adaptador `@prisma/adapter-pg`.

Atualmente, a API permite:

- verificar se o servidor está acessível;
- cadastrar um usuário;
- autenticar um usuário e emitir um token JWT;
- listar todos os usuários mediante autenticação.

O banco também possui o modelo `Tarefa`, relacionado a `User`, mas ainda não existem rotas, controllers ou repositories para tarefas.

## 2. Tecnologias e dependências principais

| Tecnologia | Papel no projeto |
| --- | --- |
| Node.js | Ambiente de execução |
| TypeScript | Tipagem e compilação do código |
| Express 5 | Servidor HTTP e roteamento |
| Prisma 7 | ORM e gerenciamento do schema/migrations |
| PostgreSQL | Banco de dados relacional |
| `@prisma/adapter-pg` | Conexão do Prisma com PostgreSQL |
| `bcryptjs` | Hash e comparação de senhas |
| `jsonwebtoken` | Emissão e validação de JWT |
| `dotenv` | Carregamento de variáveis de ambiente |
| `tsx` | Execução TypeScript em desenvolvimento |

Scripts disponíveis em `package.json`:

```bash
npm run dev    # inicia src/server.ts em modo watch
npm run build  # compila TypeScript para dist/
npm start      # executa dist/server.js
npm test       # executa os testes unitários dos services
```

## 3. Estrutura do projeto

```text
fluxo-autenticacao/
|-- prisma/
|   |-- migrations/            # histórico SQL do banco
|   `-- schema.prisma          # modelos User e Tarefa
|-- src/
|   |-- @types/
|   |   `-- express.d.ts       # acrescenta userId ao Express.Request
|   |-- controllers/
|   |   |-- auth-controller.ts
|   |   `-- user-controller.ts
|   |-- middlewares/
|   |   `-- auth.ts            # valida o token JWT
|   |-- repositories/
|   |   `-- user-repository.ts
|   |-- types/
|   |   `-- http-type.ts
|   |-- utils/
|   |   `-- prisma.ts          # cria e exporta o PrismaClient
|   |-- app.ts                 # configura e inicia o servidor
|   `-- routes.ts              # registra as rotas da API
|-- package.json
|-- prisma.config.ts
`-- tsconfig.json
```

## 4. Arquitetura observada

O projeto segue uma arquitetura em camadas de forma parcial:

```text
Requisição HTTP
      |
      v
Router -> Middleware (quando aplicável) -> Controller -> Repository -> Prisma -> PostgreSQL
                                            |
                                            `-> Prisma diretamente no login
```

### Entrada da aplicação

`src/app.ts`:

- cria a aplicação Express;
- carrega as variáveis de ambiente;
- habilita o parser de JSON com `express.json()`;
- registra o router principal sem prefixo global;
- declara a rota raiz `GET /`;
- inicia o servidor com `app.listen(PORT)`.

### Rotas

`src/routes.ts` instancia `UserController` e `AuthController` e associa seus métodos aos endpoints. Não há prefixo como `/api` ou versionamento como `/v1`.

### Controllers

Os controllers recebem `Request` e `Response` do Express, extraem valores diretamente de `req.body`, coordenam a operação e constroem a resposta HTTP com `res.status(...).json(...)`.

- `UserController` delega o acesso ao banco a `UserRepository`.
- `AuthController` acessa o Prisma diretamente; não existe `AuthRepository` ativo, embora haja um comentário indicando que ele foi considerado.

### Services

Não existe camada de services. Regras como geração/comparação de hash, consulta de usuário e criação do JWT estão distribuídas entre repository e controller.

### Repositories

Existe apenas `UserRepository`, responsável por:

- buscar todos os usuários com `db.user.findMany()`;
- gerar o hash da senha com bcrypt, usando custo `12`;
- criar o usuário por meio de `db.user.create()`.

O método de criação não retorna o registro criado.

### Persistência

`src/utils/prisma.ts` cria uma instância compartilhada de `PrismaClient`, configurada com `PrismaPg` e a string presente em `DATABASE_URL`.

`prisma.config.ts` também usa `DATABASE_URL` para a execução das ferramentas e migrations do Prisma.

## 5. Modelagem do banco

### User

| Campo | Tipo | Restrições/observações |
| --- | --- | --- |
| `id` | `String` | chave primária, UUID, único |
| `name` | `String` | obrigatório |
| `email` | `String` | obrigatório e único |
| `hashPassword` | `String` | obrigatório; armazena o hash da senha |
| `tarefas` | `Tarefa[]` | relação um-para-muitos |

### Tarefa

| Campo | Tipo | Restrições/observações |
| --- | --- | --- |
| `id` | `String` | chave primária, UUID, único |
| `title` | `String` | obrigatório |
| `description` | `String` | obrigatório |
| `status` | `String` | obrigatório, sem enum ou valor padrão |
| `userId` | `String` | chave estrangeira obrigatória |
| `user` | `User` | referência a `User.id` |

A chave estrangeira criada pela migration usa `ON DELETE RESTRICT` e `ON UPDATE CASCADE`.

## 6. Endpoints e contratos HTTP

Como não existe validação de schema, os formatos abaixo representam o que os controllers esperam ou devolvem atualmente, e não uma validação formal da API.

### `GET /`

Objetivo aparente: verificar se a aplicação está ativa.

Autenticação: não exigida.

Resposta pretendida:

```http
200 OK
Content-Type: application/json
```

```json
{
  "message": "Hello, TypeScript!"
}
```

Observação: o handler atual tenta desestruturar `{ req, res }` do primeiro argumento recebido pelo Express. Como o Express fornece `req` e `res` como argumentos separados, essa rota tende a falhar em tempo de execução em vez de produzir a resposta pretendida.

### `POST /users`

Objetivo: cadastrar um usuário.

Autenticação: não exigida.

Corpo esperado:

```json
{
  "name": "Nome do usuário",
  "email": "usuario@exemplo.com",
  "password": "senha em texto puro"
}
```

Fluxo:

1. O controller extrai `name`, `email` e `password` de `req.body`.
2. O repository transforma `password` em hash bcrypt com custo 12.
3. O Prisma grava `name`, `email` e `hashPassword`.

Resposta de sucesso:

```http
201 Created
Content-Type: application/json
```

```json
{
  "message": "Usuário criado com sucesso!"
}
```

Não há respostas de erro definidas explicitamente no controller. Erros como e-mail duplicado, corpo ausente ou falha de banco seguem o comportamento padrão do Express/Prisma, pois não há tratamento global de exceções.

### `POST /auth`

Objetivo: autenticar um usuário.

Autenticação: não exigida.

Corpo esperado:

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha em texto puro"
}
```

Fluxo:

1. Busca um usuário pelo e-mail com `db.user.findUnique()`.
2. Compara a senha recebida com `user.hashPassword` usando bcrypt.
3. Gera um JWT com payload `{ "id": "<id-do-usuario>" }`.
4. Define expiração do token em um dia (`1d`).

Resposta quando o usuário não existe:

```http
404 Not Found
```

```json
{
  "message": "Usuário não encontrado"
}
```

Resposta quando a senha é inválida:

```http
401 Unauthorized
```

```json
{
  "message": "Acesso negado"
}
```

Resposta de sucesso:

```http
200 OK
```

```json
{
  "message": "Login realizado com sucesso!",
  "user": {
    "id": "uuid",
    "name": "Nome do usuário",
    "email": "usuario@exemplo.com",
    "hashPassword": "hash-bcrypt"
  },
  "token": "jwt"
}
```

Observação: o objeto `user` retornado pelo Prisma é enviado integralmente. Portanto, a resposta atual inclui `hashPassword`.

### `GET /users`

Objetivo: listar todos os usuários.

Autenticação: exigida pelo `AuthMiddleware`.

Cabeçalho esperado:

```http
Authorization: Bearer <token-jwt>
```

O middleware separa o valor do cabeçalho pelo primeiro espaço e usa a segunda parte como token. O nome do esquema (`Bearer`) não é validado explicitamente.

Resposta sem cabeçalho de autorização:

```http
401 Unauthorized
```

```json
{
  "error": "Token não fornecido"
}
```

Resposta com token ausente, malformado, expirado ou assinado com outro segredo:

```http
401 Unauthorized
```

```json
{
  "error": "Token inválido"
}
```

Resposta de sucesso:

```http
200 OK
```

```json
[
  {
    "id": "uuid",
    "name": "Nome do usuário",
    "email": "usuario@exemplo.com",
    "hashPassword": "hash-bcrypt"
  }
]
```

Como `findMany()` não usa `select` nem `omit`, cada item retornado inclui todos os campos escalares de `User`, inclusive `hashPassword`. A relação `tarefas` não é incluída automaticamente.

## 7. Fluxo de autenticação

```text
POST /users
  -> recebe a senha
  -> gera hash bcrypt
  -> persiste User

POST /auth
  -> busca User por e-mail
  -> compara a senha com o hash
  -> assina JWT com o id do usuário e validade de 1 dia

GET /users
  -> recebe Authorization
  -> verifica JWT
  -> copia o id do payload para req.userId
  -> executa o controller
```

O tipo global em `src/@types/express.d.ts` acrescenta `userId: string` a `Express.Request`. Embora o middleware preencha esse campo, o controller de listagem não o utiliza; qualquer usuário com token válido recebe a lista completa.

## 8. Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | conexão PostgreSQL no Prisma e em suas ferramentas |
| `PORT` | porta usada por `app.listen()` |
| `URL` | texto exibido no log de inicialização |
| `SECRET` | segredo usado para assinar e verificar JWTs |

O repositório possui um arquivo `.env`, ignorado pelo Git. Seus valores não são documentados aqui para evitar registrar credenciais. Não existe um arquivo de exemplo de ambiente no estado observado.

## 9. Padrões de requisição e resposta

- Os corpos de entrada são JSON e dependem de `Content-Type: application/json`.
- Os dados são lidos diretamente de `req.body`, sem DTOs ou schemas.
- As respostas são JSON.
- Sucessos usam `200` para consulta/login e `201` para criação.
- Falhas de autenticação usam `401`; usuário inexistente no login usa `404`.
- As respostas de controller usam a propriedade `message`; as falhas do middleware usam `error`.
- Não existe envelope padronizado, como `data`, `errors` ou metadados.
- Não há paginação, filtros ou ordenação em `GET /users`.
- Não há middleware global de tratamento de erros.

## 10. Limitações e pontos de atenção do estado atual

Esta seção registra o comportamento observado, sem propor ou aplicar mudanças no código:

- não há validação de entrada para nome, e-mail ou senha;
- não há tratamento explícito para conflitos de e-mail ou erros do banco;
- `hashPassword` é exposto no login e na listagem de usuários;
- `GET /users` exige autenticação, mas não possui regra de autorização por papel ou por proprietário;
- o formato `Bearer` do cabeçalho não é conferido;
- `SECRET` é tratado por asserção de tipo como string, sem validação na inicialização;
- controllers e middleware importam `SECRET` de `app.ts`, criando dependência circular entre inicialização, rotas e autenticação;
- o handler de `GET /` não segue a assinatura `(req, res)` usada pelo Express;
- não existem testes automatizados, documentação OpenAPI/Swagger ou configuração de lint nos arquivos observados;
- o modelo `Tarefa` existe somente na persistência e ainda não possui API;
- não há camada de services e o acesso a dados não é uniforme entre os controllers.

## 11. Resumo dos arquivos e responsabilidades

| Arquivo | Responsabilidade |
| --- | --- |
| `src/app.ts` | bootstrap do Express, configuração JSON, registro de rotas e inicialização do servidor |
| `src/routes.ts` | mapa central dos endpoints |
| `src/controllers/user-controller.ts` | adapta requisições HTTP de usuário e chama o repository |
| `src/controllers/auth-controller.ts` | executa login, compara senha e emite JWT |
| `src/repositories/user-repository.ts` | consulta/cria usuários e gera hash da senha |
| `src/middlewares/auth.ts` | valida JWT e preenche `req.userId` |
| `src/utils/prisma.ts` | configura e exporta o cliente Prisma |
| `src/@types/express.d.ts` | estende o tipo de Request com `userId` |
| `src/types/http-type.ts` | declara `IHttp`; atualmente usado apenas na rota raiz |
| `prisma/schema.prisma` | define os modelos `User` e `Tarefa` |
| `prisma.config.ts` | informa schema, migrations e URL do banco ao Prisma |

## 12. Planejamento da refatoração arquitetural

### Objetivo

Reorganizar a aplicação para que cada camada tenha uma responsabilidade bem definida e para que o fluxo de dependências siga sempre uma única direção:

```text
Rota/Middleware -> Controller -> Service -> Repository -> Prisma -> PostgreSQL
```

A refatoração deve preservar, inicialmente, as rotas e os contratos HTTP existentes. Mudanças de contrato, como a remoção de `hashPassword` das respostas, devem ser feitas de maneira consciente e verificadas separadamente.

### Regras de dependência

- Controllers podem conhecer services, mas não repositories nem Prisma.
- Services podem conhecer repositories e utilitários de domínio, mas não objetos HTTP do Express.
- Repositories podem conhecer o Prisma e tipos relacionados à persistência, mas não `Request`, `Response` ou regras HTTP.
- Repositories não devem importar controllers ou services.
- O Prisma deve ficar restrito à camada de repository e ao módulo que cria sua instância.
- As dependências devem ser fornecidas explicitamente aos construtores sempre que possível, facilitando testes e evitando instâncias globais escondidas.

## 13. Responsabilidades planejadas por camada

### Controller

Responsável exclusivamente pela fronteira HTTP:

- ler `params`, `query`, `body`, headers e dados acrescentados por middlewares;
- chamar o service correspondente;
- transformar o resultado do service em uma resposta HTTP;
- definir o status HTTP adequado;
- encaminhar erros para o tratamento central da aplicação.

O controller não deverá:

- acessar o Prisma;
- consultar ou persistir dados diretamente;
- gerar ou comparar hashes de senha;
- assinar tokens JWT;
- implementar regras de negócio.

Exemplo do fluxo esperado:

```ts
const result = await userService.create({ name, email, password })
return res.status(201).json(result)
```

### Service

Responsável pelos casos de uso e regras de negócio:

- validar regras necessárias para executar o caso de uso;
- coordenar um ou mais repositories;
- decidir quando uma operação pode ou não acontecer;
- gerar e comparar hashes de senha;
- gerar tokens de autenticação;
- selecionar e devolver apenas os dados que podem sair da aplicação;
- lançar erros de aplicação que depois serão convertidos em respostas HTTP.

O service deverá receber e devolver objetos independentes do Express. Ele não deverá receber `Request` ou `Response`, nem escolher status HTTP diretamente.

Services inicialmente necessários:

- `UserService`: criação e listagem de usuários;
- `AuthService`: autenticação, verificação da senha e emissão do JWT.

### Repository

Responsável exclusivamente pelo acesso aos dados:

- executar consultas e mutações com Prisma;
- traduzir as operações solicitadas pelo service para chamadas do ORM;
- devolver entidades ou projeções de dados para o service;
- manter detalhes de persistência fora das demais camadas.

O repository não deverá:

- conhecer `Request`, `Response` ou status HTTP;
- gerar hash de senha;
- emitir JWT;
- decidir regras de autorização;
- formatar mensagens de resposta da API.

O `UserRepository` deverá concentrar todas as operações Prisma relacionadas a usuários, incluindo:

- `findAll()`;
- `findByEmail(email)`;
- `findById(id)`, quando necessário;
- `create(data)`.

## 14. Estrutura de diretórios planejada

Uma organização inicial compatível com o tamanho atual do projeto:

```text
src/
|-- config/
|   `-- env.ts
|-- controllers/
|   |-- auth-controller.ts
|   `-- user-controller.ts
|-- errors/
|   `-- app-error.ts
|-- middlewares/
|   |-- auth.ts
|   `-- error-handler.ts
|-- repositories/
|   `-- user-repository.ts
|-- services/
|   |-- auth-service.ts
|   `-- user-service.ts
|-- types/
|-- utils/
|   `-- prisma.ts
|-- app.ts
|-- routes.ts
`-- server.ts
```

Separar `app.ts` de `server.ts` também permitirá configurar e exportar a aplicação sem iniciar automaticamente a porta, facilitando testes. `server.ts` ficará responsável apenas por chamar `app.listen()`.

## 15. Migração dos fluxos existentes

### Criação de usuário

Estado atual:

```text
UserController -> UserRepository -> bcrypt + Prisma
```

Estado planejado:

```text
UserController
  -> UserService
      -> verifica regras de criação
      -> gera o hash da senha
      -> UserRepository.create()
          -> Prisma
```

O hash deixa o repository e passa para o service. O repository recebe os dados já prontos para persistência.

### Login

Estado atual:

```text
AuthController -> Prisma + bcrypt + JWT
```

Estado planejado:

```text
AuthController
  -> AuthService
      -> UserRepository.findByEmail()
      -> compara a senha
      -> gera o JWT
      -> devolve usuário seguro e token
```

O controller apenas recebe `email` e `password`, chama o caso de uso e monta a resposta.

### Listagem de usuários

Estado atual:

```text
AuthMiddleware -> UserController -> UserRepository -> Prisma
```

Estado planejado:

```text
AuthMiddleware
  -> UserController
      -> UserService.list()
          -> UserRepository.findAll()
              -> Prisma
```

O service será responsável por garantir que campos sensíveis, especialmente `hashPassword`, não sejam devolvidos ao controller.

## 16. Etapas de implementação

### Etapa 1 - Preparar a configuração da aplicação

1. Centralizar e validar as variáveis de ambiente.
2. Remover a importação de `SECRET` a partir de `app.ts`.
3. Separar a configuração Express (`app.ts`) da inicialização do servidor (`server.ts`).
4. Corrigir a assinatura HTTP da rota raiz sem mudar sua finalidade.

### Etapa 2 - Ajustar o repository

1. Manter no `UserRepository` somente operações de banco.
2. Mover a geração do hash para a futura camada de service.
3. Adicionar a consulta `findByEmail()` usada pelo login.
4. Fazer o `AuthController` deixar de acessar `db.user` diretamente.

### Etapa 3 - Criar os services

1. Criar `UserService` e mover para ele os casos de uso de criação e listagem.
2. Criar `AuthService` e mover para ele comparação de senha e emissão de JWT.
3. Definir tipos de entrada e saída dos casos de uso.
4. Garantir que nenhum retorno público contenha `hashPassword`.

### Etapa 4 - Simplificar os controllers

1. Injetar os services nos controllers.
2. Manter nos controllers apenas leitura da requisição, chamada do service e envio da resposta.
3. Remover importações de Prisma, bcrypt e JWT dos controllers.
4. Padronizar o formato das respostas HTTP.

### Etapa 5 - Padronizar erros e validação

1. Criar um erro de aplicação com código ou categoria conhecida.
2. Criar um middleware global de erros.
3. Mapear erros de negócio para status HTTP na fronteira da aplicação.
4. Adicionar validação dos dados de entrada antes da execução dos casos de uso.
5. Padronizar as propriedades usadas nas respostas de erro.

### Etapa 6 - Verificar a refatoração

1. Criar testes unitários dos services com repositories substituídos por doubles/mocks.
2. Criar testes de integração para repositories e endpoints.
3. Verificar cadastro, login, token ausente, token inválido e listagem autenticada.
4. Executar compilação e testes a cada etapa para evitar uma migração extensa e difícil de revisar.

## 17. Critérios de conclusão

A reorganização arquitetural será considerada concluída quando:

- nenhum controller importar Prisma ou repositories;
- todos os controllers interagirem somente com services na execução dos casos de uso;
- nenhum service depender de tipos HTTP do Express;
- somente repositories utilizarem o cliente Prisma para operações de negócio;
- repositories não contiverem hash, JWT ou formatação de resposta;
- cadastro, login e listagem continuarem funcionando;
- `hashPassword` não aparecer em respostas HTTP;
- erros esperados forem tratados de forma consistente;
- cada camada puder ser testada isoladamente;
- o projeto compilar e os testes automatizados passarem.

## 18. Estado após a refatoração

### Arquitetura implementada

O fluxo atual segue a separação planejada:

```text
Rota/Middleware -> Controller -> Service -> Repository -> Prisma -> PostgreSQL
```

- `routes.ts` funciona como ponto de composição e injeta as dependências por construtor.
- Controllers tratam somente a fronteira HTTP e chamam services.
- `UserService` e `AuthService` concentram as regras de negócio.
- `UserRepository` concentra todas as consultas Prisma de usuário.
- `app.ts` configura e exporta o Express sem abrir uma porta.
- `server.ts` inicia o servidor.
- `config/env.ts` carrega e valida a configuração.
- `AppError` representa erros por códigos independentes de HTTP.
- `errorHandler` converte os códigos da aplicação em respostas HTTP.

### Estrutura atual relevante

```text
src/
|-- @types/
|   `-- express.d.ts
|-- config/
|   `-- env.ts
|-- controllers/
|   |-- auth-controller.ts
|   `-- user-controller.ts
|-- errors/
|   `-- app-error.ts
|-- middlewares/
|   |-- auth.ts
|   |-- error-handler.ts
|   `-- validate-request.ts
|-- repositories/
|   `-- user-repository.ts
|-- services/
|   |-- auth-service.ts
|   |-- auth-service.test.ts
|   |-- user-service.ts
|   `-- user-service.test.ts
|-- utils/
|   `-- prisma.ts
|-- app.ts
|-- routes.ts
`-- server.ts
```

O antigo `types/http-type.ts` foi removido porque representava incorretamente a assinatura HTTP do Express e deixou de ter utilidade.

### Fluxos atuais

#### Cadastro

```text
validateCreateUser
  -> UserController.create()
      -> UserService.create()
          -> UserRepository.findByEmail()
          -> bcrypt.hash()
          -> UserRepository.create()
              -> Prisma
```

O service normaliza nome e e-mail, impede e-mail duplicado, gera o hash bcrypt com custo 12 e nunca devolve o hash.

#### Login

```text
validateLogin
  -> AuthController.login()
      -> AuthService.login()
          -> UserRepository.findByEmail()
          -> bcrypt.compare()
          -> jwt.sign()
```

O JWT mantém o `id` no payload e validade de um dia. A resposta contém apenas `id`, `name` e `email` do usuário.

#### Listagem

```text
authMiddleware
  -> UserController.getAll()
      -> UserService.list()
          -> UserRepository.findAll()
              -> Prisma
```

O middleware exige o esquema `Bearer`, valida o JWT e preenche `req.userId`. O service remove `hashPassword` de todos os usuários retornados.

### Validação e erros

- Cadastro exige `name`, e-mail com formato válido e `password` não vazios.
- Login exige e-mail válido e senha não vazia.
- Entrada inválida retorna `400`.
- Usuário ausente no login retorna `404`.
- Credenciais inválidas retornam `401`.
- E-mail já cadastrado retorna `409`.
- Erros inesperados retornam `500` sem expor detalhes internos.
- O middleware de autenticação preserva as respostas `{ "error": "Token não fornecido" }` e `{ "error": "Token inválido" }`.

### Contratos seguros de usuário

Respostas públicas de usuário seguem este formato:

```json
{
  "id": "uuid",
  "name": "Nome do usuário",
  "email": "usuario@exemplo.com"
}
```

`hashPassword` continua armazenado no banco, mas não aparece em `POST /auth` nem em `GET /users`.

### Verificação automatizada

Os testes unitários usam repositories em memória e cobrem:

- criação com normalização e hash;
- conflito de e-mail;
- listagem sem hash;
- login bem-sucedido com JWT;
- usuário inexistente;
- senha inválida.

Os comandos de verificação são `npm run build` e `npm test`.

## 19. CRUD de tarefas

### Arquitetura

O CRUD de tarefas segue o mesmo fluxo das demais funcionalidades:

```text
Rota -> AuthMiddleware -> Validação -> TaskController -> TaskService -> TaskRepository -> Prisma
```

- `TaskController` trata requisições e respostas HTTP.
- `TaskService` normaliza dados e garante que a tarefa pertence ao usuário autenticado.
- `TaskRepository` concentra todas as operações `db.tarefa`.
- O `userId` usado nas operações vem exclusivamente do JWT.
- Tarefas de outros usuários são tratadas como inexistentes.

### Formato da tarefa

```json
{
  "id": "uuid",
  "title": "Estudar TypeScript",
  "description": "Revisar a camada Service",
  "status": "pendente",
  "userId": "uuid-do-usuario"
}
```

O campo `status` permanece uma string livre porque o schema Prisma não define enumeração.

### Endpoints

Todas as rotas exigem `Authorization: Bearer <token-jwt>`.

| Método | Rota | Corpo | Sucesso | Finalidade |
| --- | --- | --- | --- | --- |
| `POST` | `/tasks` | `title`, `description`, `status` | `201` + tarefa | criar uma tarefa para o usuário autenticado |
| `GET` | `/tasks` | nenhum | `200` + lista | listar somente as tarefas do usuário |
| `GET` | `/tasks/:id` | nenhum | `200` + tarefa | consultar uma tarefa do usuário |
| `PUT` | `/tasks/:id` | `title`, `description`, `status` | `200` + tarefa | atualizar integralmente os campos editáveis |
| `DELETE` | `/tasks/:id` | nenhum | `204` | excluir uma tarefa do usuário |

Corpo de criação e atualização:

```json
{
  "title": "Estudar TypeScript",
  "description": "Revisar a camada Service",
  "status": "pendente"
}
```

`title`, `description` e `status` são obrigatórios e não podem ser strings vazias. Um identificador malformado retorna `400`.

Quando a tarefa não existe ou pertence a outro usuário:

```http
404 Not Found
```

```json
{
  "message": "Tarefa não encontrada"
}
```

### Testes

Os testes de `TaskService` cobrem:

- criação e normalização;
- listagem restrita ao proprietário;
- consulta individual;
- atualização;
- exclusão;
- bloqueio de consulta, atualização e exclusão por outro usuário.

---

Este documento combina o diagnóstico histórico, o plano de refatoração e o estado implementado do projeto, incluindo o CRUD autenticado de tarefas.
