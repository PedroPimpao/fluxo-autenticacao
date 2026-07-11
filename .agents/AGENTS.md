# AGENTS.md

## Finalidade

Este arquivo orienta agentes de IA que trabalham neste repositório. Leia também o arquivo `CONTEXTO_PROJETO.md` antes de realizar mudanças estruturais, pois ele descreve o estado observado, as limitações atuais e o plano completo de refatoração.

As regras deste documento se aplicam a todo o projeto. Preserve o escopo solicitado pelo usuário e não trate o planejamento documentado como autorização para implementar etapas que não foram pedidas.

## Visão do projeto

Este repositório contém uma API REST simples de autenticação e usuários, implementada com:

- Node.js e TypeScript;
- Express 5;
- Prisma ORM 7;
- PostgreSQL;
- bcryptjs para hash de senhas;
- JSON Web Token para autenticação.

O schema possui os modelos `User` e `Tarefa`. No momento documentado, somente usuários e autenticação possuem endpoints. Não invente uma API para tarefas sem uma solicitação explícita.

## Fonte de verdade

Ao trabalhar neste repositório, use esta ordem de prioridade:

1. pedido atual do usuário;
2. código-fonte e schema Prisma atuais;
3. este `AGENTS.md`;
4. `CONTEXTO_PROJETO.md`;
5. demais documentos do repositório.

Se o código e a documentação divergirem, não suponha silenciosamente qual está correto. Preserve o escopo da tarefa, registre a divergência e atualize a documentação somente quando isso fizer parte do pedido.

## Arquitetura obrigatória

Toda refatoração ou nova funcionalidade deve seguir este fluxo:

```text
Rota/Middleware -> Controller -> Service -> Repository -> Prisma -> PostgreSQL
```

As dependências devem apontar para dentro do fluxo, nunca no sentido inverso.

### Controller

O controller é a fronteira HTTP. Ele deve:

- receber `Request` e `Response` do Express;
- extrair `body`, `params`, `query`, headers e informações fornecidas por middlewares;
- chamar o service correspondente;
- converter o resultado do service em uma resposta HTTP;
- escolher o status HTTP e encaminhar erros ao tratamento central.

O controller não deve:

- importar ou usar o Prisma;
- acessar repositories diretamente;
- consultar ou gravar no banco;
- gerar ou comparar hashes;
- assinar JWTs;
- conter regra de negócio.

### Service

O service representa casos de uso e regras de negócio. Ele deve:

- receber objetos simples, independentes do Express;
- aplicar as regras do caso de uso;
- coordenar um ou mais repositories;
- gerar e comparar hashes de senha quando necessário;
- gerar tokens de autenticação;
- impedir que dados sensíveis sejam devolvidos;
- produzir resultados ou erros de aplicação independentes de HTTP.

O service não deve:

- receber `Request` ou `Response`;
- usar `res.status()` ou `res.json()`;
- escolher códigos HTTP;
- importar o cliente Prisma;
- executar consultas diretamente no banco.

Os services previstos para os fluxos atuais são:

- `UserService`: criação e listagem de usuários;
- `AuthService`: autenticação, comparação de senha e emissão do JWT.

### Repository

O repository é a única camada de negócio autorizada a interagir diretamente com o Prisma. Ele deve:

- executar consultas e mutações no banco;
- esconder detalhes do ORM das camadas superiores;
- receber dados já preparados para persistência;
- devolver entidades ou projeções para o service.

O repository não deve:

- receber ou devolver objetos HTTP;
- escolher status HTTP ou mensagens de resposta;
- gerar hashes de senha;
- emitir ou verificar JWTs;
- aplicar regras de autorização;
- importar controllers ou services.

O `UserRepository` deve concentrar as operações Prisma de usuário, como:

- `findAll()`;
- `findByEmail(email)`;
- `findById(id)`, quando o caso de uso exigir;
- `create(data)`.

### Rotas e middlewares

- Rotas registram o caminho, verbo HTTP, middlewares e controller.
- Rotas não contêm regras de negócio.
- Middlewares cuidam de preocupações da fronteira HTTP, como autenticação, validação de entrada e tratamento de erros.
- O middleware de autenticação deve validar o token e disponibilizar a identidade autenticada na requisição.
- Autorizações dependentes de regra de negócio devem permanecer no service.

### Configuração e inicialização

- Variáveis de ambiente devem ser lidas e validadas em um módulo de configuração.
- Não importe segredos a partir de `app.ts`.
- `app.ts` deve configurar e exportar a aplicação Express.
- `server.ts` deve ser o responsável por executar `app.listen()`.
- Nunca registre no código ou na documentação os valores reais de `.env`.

## Estrutura planejada

Use a seguinte organização como referência durante a refatoração:

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

Adapte essa estrutura somente quando houver uma necessidade real. Não crie abstrações, interfaces ou pastas vazias apenas para antecipar funcionalidades.

## Contratos da API

Durante a refatoração, preserve inicialmente os caminhos, verbos, entradas e status definidos abaixo. A remoção de campos sensíveis das respostas é uma correção obrigatória e não deve ser interpretada como quebra indesejada do contrato.

Não existe prefixo global `/api` nem versionamento `/v1` no estado planejado.

### `GET /`

Finalidade: verificação simples da aplicação.

Autenticação: não exigida.

Resposta de sucesso:

```http
200 OK
Content-Type: application/json
```

```json
{
  "message": "Hello, TypeScript!"
}
```

O handler deve usar a assinatura correta do Express: `(req, res)`.

### `POST /users`

Finalidade: cadastrar um usuário.

Autenticação: não exigida.

Corpo esperado:

```json
{
  "name": "Nome do usuário",
  "email": "usuario@exemplo.com",
  "password": "senha em texto puro"
}
```

Resposta de sucesso:

```http
201 Created
```

```json
{
  "message": "Usuário criado com sucesso!"
}
```

Regras do fluxo:

- o controller recebe e encaminha os dados ao `UserService`;
- o service valida regras, gera o hash e chama o repository;
- o repository persiste `name`, `email` e `hashPassword` com Prisma;
- a senha em texto puro nunca deve ser armazenada nem incluída em respostas.

### `POST /auth`

Finalidade: autenticar um usuário.

Autenticação: não exigida.

Corpo esperado:

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha em texto puro"
}
```

Quando o usuário não existe:

```http
404 Not Found
```

```json
{
  "message": "Usuário não encontrado"
}
```

Quando a senha é inválida:

```http
401 Unauthorized
```

```json
{
  "message": "Acesso negado"
}
```

Resposta de sucesso planejada:

```http
200 OK
```

```json
{
  "message": "Login realizado com sucesso!",
  "user": {
    "id": "uuid",
    "name": "Nome do usuário",
    "email": "usuario@exemplo.com"
  },
  "token": "jwt"
}
```

Regras do fluxo:

- o `AuthController` deve chamar o `AuthService`;
- o `AuthService` deve usar `UserRepository.findByEmail()`;
- a comparação de senha e a emissão do JWT pertencem ao service;
- o JWT deve manter o identificador do usuário no payload e validade de um dia, salvo mudança solicitada;
- `hashPassword` nunca deve aparecer na resposta.

### `GET /users`

Finalidade: listar usuários.

Autenticação: JWT obrigatório.

Cabeçalho esperado:

```http
Authorization: Bearer <token-jwt>
```

Sem token:

```http
401 Unauthorized
```

```json
{
  "error": "Token não fornecido"
}
```

Token malformado, inválido ou expirado:

```http
401 Unauthorized
```

```json
{
  "error": "Token inválido"
}
```

Resposta de sucesso planejada:

```http
200 OK
```

```json
[
  {
    "id": "uuid",
    "name": "Nome do usuário",
    "email": "usuario@exemplo.com"
  }
]
```

Regras do fluxo:

- o middleware valida o JWT antes do controller;
- o controller chama `UserService.list()`;
- o service chama `UserRepository.findAll()` e monta uma saída segura;
- `hashPassword` nunca deve aparecer na listagem;
- não adicione paginação, filtros, papéis ou novas regras de autorização sem solicitação.

## Dados e segurança

- Nunca devolva `hashPassword`, senha em texto puro, `SECRET` ou credenciais do banco.
- Nunca leia ou exiba os valores reais do arquivo `.env` sem necessidade explícita e autorização adequada.
- Use bcrypt para gerar e comparar hashes; a persistência recebe apenas o hash.
- Não use dados enviados pelo cliente como identidade autenticada quando essa identidade deve vir do JWT.
- Valide o esquema `Bearer` do cabeçalho de autorização durante a correção do middleware.
- Mantenha o segredo JWT fora do módulo de inicialização do Express.
- Não exponha detalhes internos do Prisma em respostas de erro.

## Erros e validação

- Valide entradas na fronteira da aplicação antes de executar o caso de uso.
- Services devem lançar erros de aplicação, não respostas HTTP.
- Um middleware global deve converter erros conhecidos em respostas consistentes.
- Erros inesperados não devem expor stack trace ou detalhes internos em produção.
- Trate explicitamente conflitos como e-mail duplicado.
- Ao padronizar erros, atualize testes e documentação dos contratos na mesma tarefa, se o escopo permitir.

## Modelos persistidos

### `User`

- `id`: UUID e chave primária;
- `name`: string obrigatória;
- `email`: string obrigatória e única;
- `hashPassword`: string obrigatória e confidencial;
- `tarefas`: relação um-para-muitos com `Tarefa`.

### `Tarefa`

- `id`: UUID e chave primária;
- `title`: string obrigatória;
- `description`: string obrigatória;
- `status`: string obrigatória;
- `userId`: chave estrangeira obrigatória para `User`.

Não altere o schema ou migrations como efeito colateral de uma refatoração de camadas. Mudanças no banco devem ser pedidas ou justificadas pela funcionalidade em escopo.

## Como executar e verificar

Scripts atuais:

```bash
npm run dev
npm run build
npm start
```

Ao modificar código:

1. inspecione os arquivos relacionados antes de editar;
2. faça a menor mudança coerente com a etapa solicitada;
3. execute `npm run build`;
4. execute testes relacionados, quando existirem;
5. confira o diff e confirme que arquivos fora do escopo não foram alterados;
6. informe com clareza o que foi validado e qualquer verificação bloqueada.

Não apresente a compilação ou os testes como aprovados se eles não foram executados com sucesso.

## Diretrizes para alterações

### Deve ser feito

- preservar o escopo exato do pedido;
- seguir a ordem Controller -> Service -> Repository;
- usar tipos TypeScript claros nas entradas e saídas dos casos de uso;
- preferir injeção de dependências por construtor;
- manter regras de negócio testáveis sem Express ou banco real;
- manter queries Prisma concentradas em repositories;
- atualizar `CONTEXTO_PROJETO.md` e este guia quando uma mudança arquitetural aprovada tornar as instruções obsoletas;
- preservar alterações preexistentes do usuário.

### Não deve ser feito

- não implementar todo o plano de refatoração quando apenas uma etapa foi solicitada;
- não acessar Prisma em controllers ou services;
- não chamar repositories diretamente a partir de controllers;
- não colocar bcrypt ou JWT em repositories;
- não acoplar services ao Express;
- não alterar endpoints ou formatos de entrada sem pedido explícito;
- não criar endpoints de tarefas apenas porque o modelo existe;
- não criar abstrações especulativas ou arquivos sem uso;
- não alterar migrations existentes para representar uma mudança nova;
- não incluir segredos, hashes ou credenciais em logs, respostas, testes ou documentação;
- não corrigir problemas fora do escopo silenciosamente;
- não sobrescrever mudanças do usuário.

## Ordem recomendada da refatoração

Quando o usuário solicitar a implementação do plano, avance incrementalmente:

1. centralizar configuração e separar `app.ts` de `server.ts`;
2. restringir o `UserRepository` a operações de banco;
3. criar `UserService` e `AuthService`;
4. simplificar controllers para depender apenas de services;
5. padronizar validação e tratamento de erros;
6. adicionar e executar testes unitários e de integração.

Ao final de cada etapa, o projeto deve continuar compilando e os fluxos já migrados devem continuar funcionando.

## Critérios arquiteturais de conclusão

Antes de considerar a refatoração concluída, confirme que:

- controllers dependem somente de services para executar casos de uso;
- services não importam Express nem Prisma;
- repositories são os únicos componentes de negócio que executam Prisma;
- repositories não contêm hash, JWT ou formatação HTTP;
- `hashPassword` não aparece em respostas;
- cadastro, login e listagem autenticada continuam funcionando;
- erros conhecidos possuem tratamento consistente;
- as camadas podem ser testadas isoladamente;
- build e testes passam.
