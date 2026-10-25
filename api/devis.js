export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nom, email, desc, fileName, fileData, g, h, m, mat } = req.body || {};
  if (!nom || !email || !desc) return res.status(400).json({ error: 'missing_fields' });

  // Build estimate block if calculator was filled
  let estimateBlock = '';
  if (g || h || m) {
    const hrs      = (parseFloat(h) || 0) + (parseFloat(m) || 0) / 60;
    const filament = (parseFloat(g) || 0) * 1.10 * 0.028;
    const machine  = hrs * 2;
    const petg     = mat === 'petg' ? 3 : 0;
    const total    = filament + machine + petg;
    const fmt = v => v.toFixed(2) + ' $';
    const matLabel = mat === 'petg' ? 'PETG' : mat === 'autre' ? 'Autre' : 'PLA';
    estimateBlock = `
      <h3 style="margin:24px 0 8px;color:#f97316">Estimation du client</h3>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr><td style="padding:4px 8px;color:#666">Poids</td><td style="padding:4px 8px"><strong>${g || '—'} g</strong></td></tr>
        <tr><td style="padding:4px 8px;color:#666">Temps</td><td style="padding:4px 8px"><strong>${parseFloat(h) || 0}h ${parseFloat(m) || 0}min</strong></td></tr>
        <tr><td style="padding:4px 8px;color:#666">Matériau</td><td style="padding:4px 8px"><strong>${matLabel}</strong></td></tr>
        <tr style="border-top:1px solid #eee"><td style="padding:8px 8px;color:#666">Filament</td><td style="padding:8px 8px">${fmt(filament)}</td></tr>
        <tr><td style="padding:4px 8px;color:#666">Machine</td><td style="padding:4px 8px">${fmt(machine)}</td></tr>
        ${petg ? `<tr><td style="padding:4px 8px;color:#666">Supplément PETG</td><td style="padding:4px 8px">${fmt(petg)}</td></tr>` : ''}
        <tr style="border-top:2px solid #f97316"><td style="padding:8px 8px;font-weight:700">Total estimé</td><td style="padding:8px 8px;font-weight:700;color:#f97316">${fmt(total)}</td></tr>
      </table>`;
  }

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#fafafa;border-radius:8px;overflow:hidden">
      <div style="background:#f97316;padding:24px 32px">
        <h1 style="margin:0;color:#fff;font-size:20px">🖨️ Nouvelle demande de devis</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,.85);font-size:14px">2F3D — Impression 3D</p>
      </div>
      <div style="padding:32px">
        <p><strong>Nom :</strong> ${nom}</p>
        <p><strong>Courriel :</strong> <a href="mailto:${email}" style="color:#f97316">${email}</a></p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0">
        <h3 style="margin:0 0 8px;color:#333">Description du projet</h3>
        <p style="background:#fff;border:1px solid #e5e5e5;border-radius:6px;padding:16px;white-space:pre-wrap;font-size:14px;line-height:1.6">${desc}</p>
        ${estimateBlock}
        ${fileName ? `<p style="margin-top:20px;font-size:13px;color:#666">📎 Fichier joint : <strong>${fileName}</strong></p>` : ''}
      </div>
      <div style="background:#f5f5f5;padding:16px 32px;font-size:12px;color:#999">
        Envoyé depuis 2f3d.ca · Réponds directement à cet email pour contacter le client.
      </div>
    </div>`;

  const attachments = fileData && fileName
    ? [{ filename: fileName, content: fileData }]
    : [];

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Devis 2F3D <devis@2f3d.ca>',
      to: ['info@2f3d.ca'],
      reply_to: email,
      subject: `Demande de devis — ${nom}`,
      html,
      attachments,
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error('[devis] Resend error:', err);
    return res.status(500).json({ error: 'send_failed' });
  }

  res.status(200).json({ ok: true });
}
