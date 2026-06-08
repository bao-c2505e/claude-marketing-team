# CRM Follow-up Generator - Local Mock Stub

This is a local, zero-dependency mock stub server representing the CRM Follow-up Generator module.

## Port Map
- **Local Address:** `http://localhost:8193`

## Endpoints

### 1. `GET /health`
Returns server status.
```bash
curl http://localhost:8193/health
```

### 2. `POST /run`
Mock runs the CRM sequence drafting process.
```bash
curl -X POST -H "Content-Type: application/json" -d @examples/request.json http://localhost:8193/run
```

### 3. `POST /simulate-callback`
Returns callback preview output structure.
```bash
curl -X POST -H "Content-Type: application/json" -d @examples/request.json http://localhost:8193/simulate-callback
```

## Running the Server
```bash
npm install
npm start
```
