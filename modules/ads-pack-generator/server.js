import http from 'http';

const PORT = process.env.PORT || 8192;
const MODULE_ID = 'ads_pack_generator';

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
        const platform = payload.platform || "meta";
        const objective = payload.objective || "lead_generation";
        
        const adVariants = [
          {
            ad_id: `ad_var_1_${Math.floor(Math.random() * 100000)}`,
            primary_text: `Attention startup founders! ${payload.offer || 'Check out our trial offer.'}`,
            headline: "Scale Your Operations Easily",
            description: "Limited time offer. Terms apply.",
            cta: "SIGN_UP",
            safety_status: "draft_only"
          },
          {
            ad_id: `ad_var_2_${Math.floor(Math.random() * 100000)}`,
            primary_text: `Are you a marketing manager looking to improve your pipeline? ${payload.offer || 'Try us today.'}`,
            headline: "10x Your Marketing Efficiency",
            description: "No credit card required.",
            cta: "LEARN_MORE",
            safety_status: "draft_only"
          }
        ];

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request_id: requestId,
          module_id: MODULE_ID,
          status: "mock_completed",
          output: {
            ads_pack_id: `ads_pack_${Math.floor(Math.random() * 1000000)}`,
            platform: platform,
            objective: objective,
            ad_variants: adVariants,
            budget_mode: "mock"
          },
          source: "local_mock_stub",
          notes: "Mock output only. No real API used."
        }));
        return;
      }
      
      if (parsedUrl.pathname === '/simulate-callback') {
        const payload = reqJson.payload || {};
        const platform = payload.platform || "meta";
        const objective = payload.objective || "lead_generation";
        
        const adVariants = [
          {
            ad_id: `ad_var_1_${Math.floor(Math.random() * 100000)}`,
            primary_text: `Attention startup founders! ${payload.offer || 'Check out our trial offer.'}`,
            headline: "Scale Your Operations Easily",
            description: "Limited time offer. Terms apply.",
            cta: "SIGN_UP",
            safety_status: "draft_only"
          },
          {
            ad_id: `ad_var_2_${Math.floor(Math.random() * 100000)}`,
            primary_text: `Are you a marketing manager looking to improve your pipeline? ${payload.offer || 'Try us today.'}`,
            headline: "10x Your Marketing Efficiency",
            description: "No credit card required.",
            cta: "LEARN_MORE",
            safety_status: "draft_only"
          }
        ];

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request_id: requestId,
          module_id: MODULE_ID,
          callback_preview: {
            request_id: requestId,
            event_type: "ads_pack.requested",
            module_id: MODULE_ID,
            status: "mock_completed",
            output: {
              ads_pack_id: `ads_pack_${Math.floor(Math.random() * 1000000)}`,
              platform: platform,
              objective: objective,
              ad_variants: adVariants,
              budget_mode: "mock"
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
  console.log(`Ads Pack Generator Mock Stub successfully started on port ${PORT}`);
});
