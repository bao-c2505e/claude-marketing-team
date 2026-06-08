import http from 'http';

const PORT = process.env.PORT || 8194;
const MODULE_ID = 'analytics_report_generator';

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
        const period = payload.reporting_period || "last_30_days";
        
        const metricsSummary = {
          clicks: 14250,
          conversions: 820,
          ctr: 0.058,
          cpa: 12.50,
          roas: 3.4
        };

        const insights = [
          "Click-through-rate (CTR) increased by 15% due to vibrant creative layouts.",
          "Mobile accounts for 72% of total conversions, suggesting design-optimization is working well."
        ];

        const recommendations = [
          "Allocate 20% more budget towards mobile-first ad sets.",
          "Perform A/B test on glassmorphism variations next week."
        ];

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request_id: requestId,
          module_id: MODULE_ID,
          status: "mock_completed",
          output: {
            report_id: `report_${Math.floor(Math.random() * 1000000)}`,
            reporting_period: period,
            metrics_summary: metricsSummary,
            insights: insights,
            recommendations: recommendations,
            data_source: "mock",
            real_data_used: false
          },
          source: "local_mock_stub",
          notes: "Mock output only. No real API used."
        }));
        return;
      }
      
      if (parsedUrl.pathname === '/simulate-callback') {
        const payload = reqJson.payload || {};
        const period = payload.reporting_period || "last_30_days";
        
        const metricsSummary = {
          clicks: 14250,
          conversions: 820,
          ctr: 0.058,
          cpa: 12.50,
          roas: 3.4
        };

        const insights = [
          "Click-through-rate (CTR) increased by 15% due to vibrant creative layouts.",
          "Mobile accounts for 72% of total conversions, suggesting design-optimization is working well."
        ];

        const recommendations = [
          "Allocate 20% more budget towards mobile-first ad sets.",
          "Perform A/B test on glassmorphism variations next week."
        ];

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request_id: requestId,
          module_id: MODULE_ID,
          callback_preview: {
            request_id: requestId,
            event_type: "analytics_report.requested",
            module_id: MODULE_ID,
            status: "mock_completed",
            output: {
              report_id: `report_${Math.floor(Math.random() * 1000000)}`,
              reporting_period: period,
              metrics_summary: metricsSummary,
              insights: insights,
              recommendations: recommendations,
              data_source: "mock",
              real_data_used: false
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
  console.log(`Analytics Report Generator Mock Stub successfully started on port ${PORT}`);
});
