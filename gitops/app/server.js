const express = require('express');
const client = require('prom-client');
const fs = require('fs');
const app = express();

// --- 1. LOAD CONFIGURATION ---
// We read the file synchronously at startup
let config;
try {
  const rawData = fs.readFileSync('./config.json');
  config = JSON.parse(rawData);
  console.log("✅ Configuration Loaded:", config);
} catch (e) {
  console.error("❌ Failed to load config.json, using defaults.");
  config = { appVersion: "unknown", errorRatePercent: 0, latencyMs: 0 };
}

// --- 2. PROMETHEUS SETUP ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status', 'version']
});
register.registerMetric(httpRequestCounter);

// --- 3. THE APPLICATION ---
app.use(express.static('public'));

app.post('/api/pay', async (req, res) => {
  const { appVersion, latencyMs, errorRatePercent, simulateCpuSpike } = config;

  // A. Simulate CPU Saturation (Layer 3 Metric)
  if (simulateCpuSpike) {
    const start = Date.now();
    while (Date.now() - start < 200) {} // Busy wait 200ms
  }

  // B. Simulate Latency (Layer 1 Metric)
  if (latencyMs > 0) {
    await new Promise(r => setTimeout(r, latencyMs));
  }

  // C. Simulate Errors (Layer 1 & 2 Metric)
  // Roll a dice (0 to 99). If it's less than errorRate, we fail.
  const isError = (Math.random() * 100) < errorRatePercent;

  if (isError) {
    console.log(`[${appVersion}] ❌ 500 Error generated`);
    httpRequestCounter.inc({ method: 'POST', status: '500', version: appVersion });
    return res.status(500).json({ status: 'error', version: appVersion });
  }

  // Success
  httpRequestCounter.inc({ method: 'POST', status: '200', version: appVersion });
  return res.json({ status: 'success', version: appVersion });
});

// --- 4. METRICS ENDPOINT ---
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(8080, () => {
  console.log(`App (${config.appVersion}) listening on port 8080`);
});