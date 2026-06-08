# Content Pack Generator - Local Mock Stub

This is a local, zero-dependency mock stub server representing the Content Pack Generator module.

## Port Map
- **Local Address:** `http://localhost:8191`

## Endpoints

### 1. `GET /health`
Returns server status.
```bash
curl http://localhost:8191/health
```

### 2. `POST /run`
Mock runs the text copy generation process.
```bash
curl -X POST -H "Content-Type: application/json" -d @examples/request.json http://localhost:8191/run
```

### 3. `POST /simulate-callback`
Returns callback preview output structure.
```bash
curl -X POST -H "Content-Type: application/json" -d @examples/request.json http://localhost:8191/simulate-callback
```

## Running the Server
```bash
npm install
npm start
```
