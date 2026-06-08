import http from 'http';

const PORT = process.env.PORT || 8193;
const MODULE_ID = 'crm_followup_generator';

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  
  // GET /health
  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      module_id: MODULE_ID,
      status: "healthy",
      mode: "mock",
      version: "0.1.0"
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
          error: "Invalid JSON format"
        }));
        return;
      }
      
      const requestId = reqJson.request_id || `req_mock_${Math.floor(Math.random() * 1000000)}`;
      
      if (parsedUrl.pathname === '/run') {
        const payload = reqJson.payload || {};
        const scenario = payload.scenario || "abandoned_cart";
        const messageCount = payload.message_count || 2;
        
        const messages = [];
        for (let i = 1; i <= messageCount; i++) {
          messages.push({
            message_id: `msg_${i}_${Math.floor(Math.random() * 100000)}`,
            step: i,
            text: `Mock followup email/sms body for step ${i} under scenario ${scenario}.`,
            safety_status: "draft_only"
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request_id: requestId,
          module_id: MODULE_ID,
          status: "mock_completed",
          output: {
            crm_pack_id: `crm_pack_${Math.floor(Math.random() * 1000000)}`,
            scenario: scenario,
            messages: messages,
            real_messaging_enabled: false
          },
          source: "local_mock_stub",
          notes: "Mock output only. No real API used."
        }));
        return;
      }
      
      if (parsedUrl.pathname === '/simulate-callback') {
        const payload = reqJson.payload || {};
        const scenario = payload.scenario || "abandoned_cart";
        const messageCount = payload.message_count || 2;
        
        const messages = [];
        for (let i = 1; i <= messageCount; i++) {
          messages.push({
            message_id: `msg_${i}_${Math.floor(Math.random() * 100000)}`,
            step: i,
            text: `Mock followup email/sms body for step ${i} under scenario ${scenario}.`,
            safety_status: "draft_only"
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request_id: requestId,
          module_id: MODULE_ID,
          callback_preview: {
            request_id: requestId,
            event_type: "crm_followup.requested",
            module_id: MODULE_ID,
            status: "mock_completed",
            output: {
              crm_pack_id: `crm_pack_${Math.floor(Math.random() * 1000000)}`,
              scenario: scenario,
              messages: messages,
              real_messaging_enabled: false
            },
            errors: [],
            source: "local_mock_stub",
            generated_at: new Date().toISOString(),
            notes: "This is a mock callback preview."
          },
          source: "local_mock_stub",
          notes: "Preview only. Callback not sent."
        }));
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
  console.log(`CRM Follow-up Generator Mock Stub successfully started on port ${PORT}`);
});
