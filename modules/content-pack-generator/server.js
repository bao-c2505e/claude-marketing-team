import http from 'http';

const PORT = process.env.PORT || 8191;
const MODULE_ID = 'content_pack_generator';

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
        const channels = payload.channels || ["facebook", "instagram"];
        
        const posts = channels.map((channel, index) => ({
          post_id: `post_${index + 1}_${Math.floor(Math.random() * 100000)}`,
          channel: channel,
          caption: `Mock post caption for ${channel} about ${payload.campaign_theme || 'our product'}.`,
          hook: "Unlock your team's true potential today!",
          cta: "Learn More",
          safety_status: "draft_only"
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request_id: requestId,
          module_id: MODULE_ID,
          status: "mock_completed",
          output: {
            content_pack_id: `content_pack_${Math.floor(Math.random() * 1000000)}`,
            channels: channels,
            posts: posts
          },
          source: "local_mock_stub",
          notes: "Mock output only. No real API used."
        }));
        return;
      }
      
      if (parsedUrl.pathname === '/simulate-callback') {
        const payload = reqJson.payload || {};
        const channels = payload.channels || ["facebook", "instagram"];
        const posts = channels.map((channel, index) => ({
          post_id: `post_${index + 1}_${Math.floor(Math.random() * 100000)}`,
          channel: channel,
          caption: `Mock post caption for ${channel} about ${payload.campaign_theme || 'our product'}.`,
          hook: "Unlock your team's true potential today!",
          cta: "Learn More",
          safety_status: "draft_only"
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request_id: requestId,
          module_id: MODULE_ID,
          callback_preview: {
            request_id: requestId,
            event_type: "content_pack.requested",
            module_id: MODULE_ID,
            status: "mock_completed",
            output: {
              content_pack_id: `content_pack_${Math.floor(Math.random() * 1000000)}`,
              channels: channels,
              posts: posts
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
  console.log(`Content Pack Generator Mock Stub successfully started on port ${PORT}`);
});
