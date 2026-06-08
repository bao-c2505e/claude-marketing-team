# Analytics Report Generator - Local Mock Stub

This is a local, zero-dependency mock stub server representing the Analytics Report Generator module.

## Port Map
- **Local Address:** `http://localhost:8194`

## Endpoints

### 1. `GET /health`
Returns server status.
```bash
curl http://localhost:8194/health
```

### 2. `POST /run`
Mock runs the performance analytics compilation process.
```bash
curl -X POST -H "Content-Type: application/json" -d @examples/request.json http://localhost:8194/run
```

### 3. `POST /simulate-callback`
Returns callback preview output structure.
```bash
curl -X POST -H "Content-Type: application/json" -d @examples/request.json http://localhost:8194/simulate-callback
```

## Running the Server
```bash
npm install
npm start
```
