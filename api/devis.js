module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { nom, email, desc, fileName, g, h, m, mat } = req.body || {};
  if (!nom || !email || !desc) return res.status(400).json({ error: 'missing_fields' });

  // Build estimate text if calculator was filled
  let estimateText = '';
  if (g || h || m) {
    const hrs      = (parseFloat(h) || 0) + (parseFloat(m) || 0) / 60;
    const filament = (parseFloat(g) || 0) * 1.10 * 0.028;
    const machine  = hrs * 2;
    const petg     = mat === 'petg' ? 3 : 0;
    const total    = filament + machine + petg;
    const fmt      = v => v.toFixed(2) + ' $';
    const matLabel = mat === 'petg' ? 'PETG' : mat === 'autre' ? 'Autre' : 'PLA';
    estimateText = `
--- Estimation du client ---
Poids    : ${g || '—'} g
Temps    : ${parseFloat(h) || 0}h ${parseFloat(m) || 0}min
Matériau : ${matLabel}
Filament : ${fmt(filament)}
Machine  : ${fmt(machine)}${petg ? `\nPETG     : ${fmt(petg)}` : ''}
Total    : ${fmt(total)}`;
  }

  const fileNote = fileName ? `\n\n📎 Fichier : ${fileName}` : '';

  const message = `Nom     : ${nom}
Courriel: ${email}

Description :
${desc}${estimateText}${fileNote}`;

  const r = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key:  process.env.WEB3FORMS_KEY,
      subject:     `Demande de devis 2F3D — ${nom}`,
      from_name:   nom,
      email,
      message,
      botcheck:    false,
    }),
  });

  const json = await r.json().catch(() => ({}));
  if (!json.success) {
    console.error('[devis] Web3Forms error:', json);
    return res.status(500).json({ error: 'send_failed' });
  }

  res.status(200).json({ ok: true });
};
