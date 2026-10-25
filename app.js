/* ── Liquid Glass — lumière souris sur les cards ────────────────────────────── */
(function () {
  function bindLight(selector) {
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
        const y = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
        card.style.setProperty('--mouse-x', x + '%');
        card.style.setProperty('--mouse-y', y + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mouse-x', '50%');
        card.style.setProperty('--mouse-y', '0%');
      });
    });
  }
  bindLight('.brother-card');
  bindLight('.feature-card');
})();

/* ── Estimateur de prix devis ──────────────────────────────────────────────── */
function calcDevis() {
  const g   = parseFloat(document.getElementById('dv-grams')?.value) || 0;
  const h   = parseFloat(document.getElementById('dv-hours')?.value) || 0;
  const m   = parseFloat(document.getElementById('dv-mins')?.value)  || 0;
  const mat = document.getElementById('dv-mat')?.value || 'pla';
  if (!g && !h && !m) { document.getElementById('dv-result')?.classList.remove('visible'); return; }
  const hrs      = h + m / 60;
  const filament = g * 1.10 * 0.028;
  const machine  = hrs * 2;
  const petg     = mat === 'petg' ? 3 : 0;
  const total    = filament + machine + petg;
  const fmt = v => v.toFixed(2) + ' $';
  let rows = `
    <div class="dv-result-row"><span class="label">Filament (${g}g × 1,10 × 0,028 $)</span><span class="val">${fmt(filament)}</span></div>
    <div class="dv-result-row"><span class="label">Machine (${hrs.toFixed(2)}h × 2 $)</span><span class="val">${fmt(machine)}</span></div>`;
  if (petg) rows += `<div class="dv-result-row petg-row"><span class="label">Supplément PETG</span><span class="val">${fmt(petg)}</span></div>`;
  document.getElementById('dv-result-rows').innerHTML = rows;
  document.getElementById('dv-total').textContent = fmt(total);
  document.getElementById('dv-result').classList.add('visible');
}

/* ── Scroll reveal ─────────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -52px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up').forEach(el => {
  revealObserver.observe(el);
});

/* ── Statement line-by-line reveal ─────────────────────────────────────────── */
const statementObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('.s-line').forEach(line => {
      const delay = parseInt(line.dataset.delay) || 0;
      setTimeout(() => line.classList.add('in'), delay);
    });
    statementObserver.unobserve(entry.target);
  });
}, { threshold: 0.3 });

const statementEl = document.getElementById('statement');
if (statementEl) statementObserver.observe(statementEl);

/* ── Nav: become opaque after hero ─────────────────────────────────────────── */
const nav  = document.getElementById('nav');
const hero = document.getElementById('hero');

if (nav && hero) {
  const navObserver = new IntersectionObserver((entries) => {
    nav.classList.toggle('scrolled', !entries[0].isIntersecting);
  }, { threshold: 0 });
  navObserver.observe(hero);
}

/* ── Hero parallax ──────────────────────────────────────────────────────────── */
const parallaxImg = document.getElementById('hero-parallax');

if (parallaxImg) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.5) {
        parallaxImg.style.transform = `translateY(${y * 0.32}px)`;
      }
      ticking = false;
    });
  }, { passive: true });
}

/* ── Formulaire de devis ─────────────────────────────────────────────────── */
(function () {
  const form = document.getElementById('devis-form');
  if (!form) return;

  const fileInput = document.getElementById('dv-file');
  const fileZone  = document.getElementById('dv-file-zone');
  const fileLabel = document.getElementById('dv-file-name');
  const errEl     = document.getElementById('dv-error');

  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (f) {
      fileLabel.textContent = f.name;
      fileZone.classList.add('has-file');
    } else {
      fileLabel.textContent = 'Glisse un fichier ici ou clique pour parcourir';
      fileZone.classList.remove('has-file');
    }
  });

  const btn = form.querySelector('[type=submit]');
  const btnHTML = btn.innerHTML;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const nom   = document.getElementById('dv-nom').value.trim();
    const email = document.getElementById('dv-email').value.trim();
    const desc  = document.getElementById('dv-desc').value.trim();
    const file  = fileInput.files[0];

    ['dv-nom', 'dv-email', 'dv-desc'].forEach(id =>
      document.getElementById(id).classList.remove('invalid'));
    errEl.textContent = 'Merci de remplir tous les champs obligatoires.';

    let valid = true;
    if (!nom)  { document.getElementById('dv-nom').classList.add('invalid');  valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('dv-email').classList.add('invalid'); valid = false;
    }
    if (!desc) { document.getElementById('dv-desc').classList.add('invalid'); valid = false; }
    if (!valid) { errEl.hidden = false; return; }
    errEl.hidden = true;

    // Collect estimator values if filled
    const g   = document.getElementById('dv-grams')?.value || '';
    const h   = document.getElementById('dv-hours')?.value || '';
    const m   = document.getElementById('dv-mins')?.value  || '';
    const mat = document.getElementById('dv-mat')?.value   || '';

    btn.disabled = true;
    btn.innerHTML = '⏳ Envoi en cours…';

    let fileName = null;
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        errEl.textContent = 'Le fichier dépasse 3 Mo. Envoie-le séparément à info@2f3d.ca.';
        errEl.hidden = false;
        btn.disabled = false; btn.innerHTML = btnHTML;
        return;
      }
      fileName = file.name;
    }

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
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: 'a63f0ef4-8c97-4683-8af2-7b423b9ee1e4',
          subject:    `Demande de devis 2F3D — ${nom}`,
          from_name:  nom,
          email,
          message,
          botcheck:   false,
        }),
      });
      const json = await r.json();
      if (!json.success) throw new Error(json.message);

      form.reset();
      fileLabel.textContent = 'Glisse un fichier ici ou clique pour parcourir';
      fileZone.classList.remove('has-file');
      document.getElementById('dv-result')?.classList.remove('visible');
      btn.innerHTML = '✅ Demande envoyée !';
      setTimeout(() => { btn.disabled = false; btn.innerHTML = btnHTML; }, 4000);
    } catch (_) {
      errEl.textContent = 'Erreur d\'envoi. Écris-nous directement à info@2f3d.ca.';
      errEl.hidden = false;
      btn.disabled = false; btn.innerHTML = btnHTML;
    }
  });
})();

/* ── Suivi de commande ───────────────────────────────────────────────────── */
(function () {
  const form = document.getElementById('suivi-form');
  if (!form) return;

  const SUPA_URL = 'https://gnpjilwdehxsafdqdtak.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGppbHdkZWh4c2FmZHFkdGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Nzk3NjIsImV4cCI6MjA5NTU1NTc2Mn0.iFYR9r5ZZsKcc9n2N8jPtFTLs0QDTIqR3KMCMhCdSdA';

  const STATUS = {
    en_attente: { label: 'En attente', cls: 'status-attente' },
    en_cours:   { label: 'En cours',   cls: 'status-cours'   },
    pret:       { label: 'Prêt',       cls: 'status-pret'    },
    livre:      { label: 'Livré',      cls: 'status-livre'   },
    annule:     { label: 'Annulé',     cls: 'status-annule'  },
  };

  function badge(statut, lg) {
    const s = STATUS[statut] || { label: statut, cls: 'status-attente' };
    return `<span class="suivi-badge ${lg ? 'suivi-badge-lg ' : ''}${s.cls}">${s.label}</span>`;
  }

  function renderResult(cmd, items) {
    const itemsHtml = items.length ? `
      <div class="suivi-items">
        <div class="suivi-items-title">Pièces (${items.length})</div>
        ${items.map(it => {
          let progHtml = '';
          if (it.en_impression && it.progression != null) {
            progHtml = `
              <div class="suivi-progress-wrap">
                <div class="suivi-progress-bar" style="width:${it.progression}%"></div>
              </div>
              <span class="suivi-progress-pct">${it.progression}%${it.temps_restant ? ' — ' + it.temps_restant : ''}</span>`;
          }
          return `
            <div class="suivi-item">
              <div class="suivi-item-info">
                <span class="suivi-item-name">${it.nom_piece || 'Pièce sans nom'}</span>
                ${progHtml}
              </div>
              ${badge(it.statut, false)}
            </div>`;
        }).join('')}
      </div>` : '';

    const notesHtml = cmd.notes ? `
      <div class="suivi-notes">
        <span class="suivi-notes-label">Notes</span>
        <p>${cmd.notes}</p>
      </div>` : '';

    return `
      <div class="suivi-card">
        <div class="suivi-card-header">
          <div>
            <div class="suivi-titre">${cmd.titre || 'Commande'}</div>
            <div class="suivi-ref">#${cmd.id}</div>
          </div>
          ${badge(cmd.statut, true)}
        </div>
        ${itemsHtml}
        ${notesHtml}
      </div>`;
  }

  const SEARCH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

  // Auto-fill + submit if ?token= is in the URL (lien depuis l'email)
  const urlToken = new URLSearchParams(window.location.search).get('token');
  if (urlToken) {
    const input = document.getElementById('suivi-token');
    input.value = urlToken;
    document.getElementById('suivi').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })), 600);
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const token  = document.getElementById('suivi-token').value.trim();
    if (!token) return;

    const btn    = document.getElementById('suivi-btn');
    const result = document.getElementById('suivi-result');
    const orig   = btn.innerHTML;

    btn.disabled  = true;
    btn.textContent = 'Recherche…';
    result.innerHTML = '';

    try {
      const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

      const r1 = await fetch(
        `${SUPA_URL}/rest/v1/ac3d_commandes?suivi_token=eq.${encodeURIComponent(token)}&select=*`,
        { headers }
      );
      if (!r1.ok) throw new Error('network');

      const commandes = await r1.json();
      if (!commandes.length) {
        result.innerHTML = `<div class="suivi-not-found"><p>Aucune commande trouvée pour ce code.<br>Vérifie le code et réessaie.</p></div>`;
        return;
      }

      const cmd = commandes[0];
      const r2  = await fetch(
        `${SUPA_URL}/rest/v1/ac3d_items?commande_id=eq.${cmd.id}&select=*&order=id.asc`,
        { headers }
      );
      const items = r2.ok ? await r2.json() : [];

      result.innerHTML = renderResult(cmd, items);
    } catch (_) {
      result.innerHTML = `<div class="suivi-not-found"><p>Une erreur est survenue. Vérifie ta connexion et réessaie.</p></div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${SEARCH_SVG} Chercher`;
    }
  });
})();
