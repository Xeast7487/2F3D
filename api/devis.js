const https = require('https');

function post(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const u    = new URL(url);
    const req  = https.request({
      hostname: u.hostname,
      path:     u.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.WEB3FORMS_KEY;
  if (!key) return res.status(500).json({ error: 'WEB3FORMS_KEY manquante dans les variables Vercel' });

  const { nom, email, desc, fileName, g, h, m, mat } = req.body || {};
  if (!nom || !email || !desc) return res.status(400).json({ error: 'missing_fields' });

  let estimateText = '';
  if (g || h || m) {
    const hrs      = (parseFloat(h) || 0) + (parseFloat(m) || 0) / 60;
    const filament = (parseFloat(g) || 0) * 1.10 * 0.028;
    const machine  = hrs * 2;
    const petg     = mat === 'petg' ? 3 : 0;
    const total    = filament + machine + petg;
    const fmt      = v => v.toFixed(2) + ' $';
    const matLabel = mat === 'petg' ? 'PETG' : mat === 'autre' ? 'Autre' : 'PLA';
    estimateText   = `\n\n--- Estimation ---\nPoids: ${g || '—'}g | Temps: ${parseFloat(h)||0}h${parseFloat(m)||0}min | Matériau: ${matLabel}\nFilament: ${fmt(filament)} | Machine: ${fmt(machine)}${petg ? ` | PETG: ${fmt(petg)}` : ''}\nTotal estimé: ${fmt(total)}`;
  }

  const message = `Nom     : ${nom}\nCourriel: ${email}\n\nDescription :\n${desc}${estimateText}${fileName ? `\n\n📎 Fichier : ${fileName}` : ''}`;

  try {
    const json = await post('https://api.web3forms.com/submit', {
      access_key: key,
      subject:    `Demande de devis 2F3D — ${nom}`,
      from_name:  nom,
      email,
      message,
      botcheck:   false,
    });

    if (!json.success) {
      console.error('[devis] Web3Forms:', json);
      return res.status(500).json({ error: 'send_failed', detail: json.message });
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[devis] Exception:', e.message);
    res.status(500).json({ error: e.message });
  }
};
