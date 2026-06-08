import http from 'http';
import { validateRequest } from './validateRequest.js';
import { generateMockCallback } from './comfyuiStub.js';

const PORT = process.env.PORT || 8188;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  
  // GET /health
  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: "OK",
      module_name: "comfyui-pipeline",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // POST /run or POST /simulate-callback
  if (req.method === 'POST' && (parsedUrl.pathname === '/run' || parsedUrl.pathname === '/simulate-callback')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    
    req.on('end', () => {
      let reqJson;
      try {
        reqJson = body ? JSON.parse(body) : {};
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: "INVALID_CONTRACT",
          error: "Invalid JSON format"
        }));
        return;
      }
      
      if (parsedUrl.pathname === '/run') {
        const validation = validateRequest(reqJson);
        if (!validation.valid) {
          const code = validation.status === 'REJECTED_BY_SAFETY' ? 403 : 400;
          res.writeHead(code, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: validation.status,
            error: validation.error
          }));
          return;
        }
        
        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: "QUEUED",
          module_run_id: `run_comfyui_${Math.floor(Math.random() * 1000000000)}`,
          message: "Request validated and task queued successfully."
        }));
        return;
      }
      
      if (parsedUrl.pathname === '/simulate-callback') {
        const simulateStatus = reqJson.simulate_status || 'COMPLETED';
        const callbackPayload = generateMockCallback(reqJson, simulateStatus);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(callbackPayload));
        return;
      }
    });
    return;
  }
  
  // 404 Route
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: "Endpoint not found"
  }));
});

server.listen(PORT, () => {
  console.log(`ComfyUI Local Stub Server successfully started on port ${PORT}`);
});
