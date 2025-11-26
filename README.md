# LudicoM-front

Front end, to Ludicom system

# API de Jogos - Documentação

Este documento descreve as APIs REST disponíveis para o gerenciamento de jogos no sistema LudicoM.

## Base URL

```
http://localhost:8080/api/jogo
```

## Endpoints

### 1. Criar Jogo (Create)

**Endpoint:** `POST /api/jogo`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
    "nome": "Monopoly",
    "nomeAlternativo": "Banco Imobiliário",
    "anoPublicacao": "2023-01-01",
    "tempoDeJogo": 180,
    "minimoJogadores": 2,
    "maximoJogadores": 6,
    "codigoDeBarras": "789123456",
    "isDisponivel": true
}
```

**Campos:**

-   `nome` (obrigatório): String (1-200 caracteres)
-   `nomeAlternativo`: String (máx 200 caracteres)
-   `anoPublicacao`: Data (YYYY-MM-DD)
-   `tempoDeJogo`: Inteiro (minutos)
-   `minimoJogadores`: Inteiro
-   `maximoJogadores`: Inteiro
-   `codigoDeBarras`: String
-   `isDisponivel`: Boolean (default: true)

**Response:** `201 Created`

```json
{
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "Monopoly",
    "nomeAlternativo": "Banco Imobiliário",
    "anoPublicacao": "2023",
    "tempoDeJogo": 180,
    "minimoJogadores": 2,
    "maximoJogadores": 6,
    "codigoDeBarras": "789123456",
    "isDisponivel": true,
    "criadoQuando": "2025-10-29T10:00:00",
    "atualizadoQuando": "2025-10-29T10:00:00"
}
```

### 2. Listar Jogos (Read - List)

**Endpoint:** `GET /api/jogo`

**Response:** `200 OK`

```json
[
    {
        "uid": "550e8400-e29b-41d4-a716-446655440000",
        "nome": "Monopoly",
        "nomeAlternativo": "Banco Imobiliário",
        "anoPublicacao": "2023",
        "tempoDeJogo": 180,
        "minimoJogadores": 2,
        "maximoJogadores": 6,
        "codigoDeBarras": "789123456",
        "isDisponivel": true,
        "criadoQuando": "2025-10-29T10:00:00",
        "atualizadoQuando": "2025-10-29T10:00:00"
    }
]
```

### 3. Buscar Jogo por ID (Read - Single)

**Endpoint:** `GET /api/jogo/{id}`

**Response:** `200 OK`

```json
{
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "Monopoly",
    "nomeAlternativo": "Banco Imobiliário",
    "anoPublicacao": "2023",
    "tempoDeJogo": 180,
    "minimoJogadores": 2,
    "maximoJogadores": 6,
    "codigoDeBarras": "789123456",
    "isDisponivel": true,
    "criadoQuando": "2025-10-29T10:00:00",
    "atualizadoQuando": "2025-10-29T10:00:00"
}
```

### 4. Atualizar Jogo (Update)

**Endpoint:** `PUT /api/jogo/{id}`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
    "nome": "Monopoly Edição Deluxe",
    "nomeAlternativo": "Banco Imobiliário Deluxe",
    "anoPublicacao": "2023-01-01",
    "tempoDeJogo": 180,
    "minimoJogadores": 2,
    "maximoJogadores": 6,
    "codigoDeBarras": "789123456",
    "isDisponivel": true
}
```

**Response:** `200 OK`

```json
{
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "Monopoly Edição Deluxe",
    "nomeAlternativo": "Banco Imobiliário Deluxe",
    "anoPublicacao": "2023",
    "tempoDeJogo": 180,
    "minimoJogadores": 2,
    "maximoJogadores": 6,
    "codigoDeBarras": "789123456",
    "isDisponivel": true,
    "criadoQuando": "2025-10-29T10:00:00",
    "atualizadoQuando": "2025-10-29T10:30:00"
}
```

### 5. Deletar Jogo (Delete)

**Endpoint:** `DELETE /api/jogo/{id}`

**Response:** `200 OK`

```json
{
    "message": "Jogo deletado com sucesso"
}
```

## Códigos de Erro

-   `400 Bad Request`: Dados inválidos no request
-   `404 Not Found`: Jogo não encontrado
-   `409 Conflict`: Conflito (ex: jogo já existe)
-   `500 Internal Server Error`: Erro interno do servidor

## Exemplos de Uso

### cURL

1. Criar um novo jogo:

```bash
curl -X POST http://localhost:8080/api/jogo \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Monopoly",
    "nomeAlternativo": "Banco Imobiliário",
    "anoPublicacao": "2023-01-01",
    "tempoDeJogo": 180,
    "minimoJogadores": 2,
    "maximoJogadores": 6,
    "codigoDeBarras": "789123456",
    "isDisponivel": true
  }'
```

2. Listar todos os jogos:

```bash
curl http://localhost:8080/api/jogo
```

3. Buscar jogo por ID:

```bash
curl http://localhost:8080/api/jogo/550e8400-e29b-41d4-a716-446655440000
```

4. Atualizar um jogo:

```bash
curl -X PUT http://localhost:8080/api/jogo/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Monopoly Edição Deluxe",
    "nomeAlternativo": "Banco Imobiliário Deluxe",
    "anoPublicacao": "2023-01-01",
    "tempoDeJogo": 180,
    "minimoJogadores": 2,
    "maximoJogadores": 6,
    "codigoDeBarras": "789123456",
    "isDisponivel": true
  }'
```

5. Deletar um jogo:

```bash
curl -X DELETE http://localhost:8080/api/jogo/550e8400-e29b-41d4-a716-446655440000
```
