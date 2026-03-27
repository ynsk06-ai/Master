import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

const YAHOO_BASE = 'https://query1.finance.yahoo.com';

const getYahooHeaders = (symbol = '') => ({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': `https://finance.yahoo.com/quote/${symbol}.IS`,
  'Origin': 'https://finance.yahoo.com',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'Sec-Fetch-Dest': 'empty',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-CH-UA': '"Chromium";v="134", "Not;A=Brand";v="99", "Google Chrome";v="134"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"Windows"'
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Master AI Trading Proxy v3.0 Çalışıyor',
    endpoints: ['/yahoo', '/prices', '/xu100'],
    test: '/yahoo?symbol=XU100&interval=60m&range=5d'
  });
});

app.get('/yahoo', async (req, res) => {
  try {
    const { symbol, interval = '60m', range = '2y' } = req.query;
    if (!symbol) return res.status(400).json({ error: 'symbol required' });
    const url = `${YAHOO_BASE}/v8/finance/chart/${symbol}.IS?interval=${interval}&range=${range}`;
    const response = await fetch(url, { headers: getYahooHeaders(symbol) });
    if (!response.ok) {
      const text = await response.text().catch(() => 'No body');
      throw new Error(`Yahoo HTTP ${response.status} → ${text}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ /yahoo hatası:', err.message);
    res.status(500).json({ error: 'Proxy hatası', message: err.message });
  }
});

app.get('/prices', async (req, res) => {
  try {
    const symbols = (req.query.symbols || '').split(',').filter(Boolean);
    const result = {};
    for (const sym of symbols) {
      const url = `${YAHOO_BASE}/v8/finance/chart/${sym}.IS?interval=1d&range=5d`;
      const resp = await fetch(url, { headers: getYahooHeaders(sym) });
      if (resp.ok) {
        const json = await resp.json();
        const quote = json.chart?.result?.[0]?.indicators?.quote?.[0];
        const timestamp = json.chart?.result?.[0]?.timestamp;
        if (quote && timestamp) {
          const idx = timestamp.length - 1;
          result[sym] = {
            price: quote.close[idx],
            change: quote.close[idx] - quote.open[idx],
            change_pct: ((quote.close[idx] - quote.open[idx]) / quote.open[idx]) * 100,
            high: quote.high[idx],
            low: quote.low[idx],
            volume: quote.volume[idx]
          };
        }
      }
    }
    res.json(result);
  } catch (err) {
    console.error('❌ /prices hatası:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/xu100', async (req, res) => {
  try {
    const url = `${YAHOO_BASE}/v8/finance/chart/XU100.IS?interval=1d&range=5d`;
    const response = await fetch(url, { headers: getYahooHeaders('XU100') });
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) throw new Error('No data');
    const idx = result.timestamp.length - 1;
    const quote = result.indicators.quote[0];
    res.json({
      price: quote.close[idx],
      change_pct: ((quote.close[idx] - quote.open[idx]) / quote.open[idx]) * 100
    });
  } catch (err) {
    console.error('❌ /xu100 hatası:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/scan', (req, res) => {
  res.json({ success: true, message: 'Scan endpoint aktif (v3.0)' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Master AI Proxy v3.0 AKTİF → http://localhost:${PORT}`);
});
