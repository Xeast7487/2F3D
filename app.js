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

/* ── Calculateur de prix ─────────────────────────────────────────────────── */
(function () {
  const sliders = {
    g:   document.getElementById('calc-g'),
    h:   document.getElementById('calc-h'),
    min: document.getElementById('calc-min'),
  };
  if (!sliders.g) return;

  function fmt(n) {
    return n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
  }

  function updateFill(el) {
    const pct = ((+el.value - +el.min) / (+el.max - +el.min)) * 100;
    el.style.background =
      `linear-gradient(to right, var(--orange) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
  }

  function update() {
    const g = +sliders.g.value;
    const h = +sliders.h.value;
    const m = +sliders.min.value;
    const matiere = g * 0.03;
    const temps   = (h + m / 60) * 2;
    const total   = matiere + temps;

    document.getElementById('calc-g-badge').textContent = g + ' g';
    document.getElementById('calc-dur-badge').textContent =
      (h > 0 ? h + ' h ' : '') + m + ' min';
    document.getElementById('calc-price').textContent   = fmt(total);
    document.getElementById('calc-b-mat').textContent   = fmt(matiere);
    document.getElementById('calc-b-temps').textContent = fmt(temps);

    Object.values(sliders).forEach(updateFill);
  }

  Object.values(sliders).forEach(s => s.addEventListener('input', update));
  update();
})();

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

  form.addEventListener('submit', e => {
    e.preventDefault();
    const nom   = document.getElementById('dv-nom').value.trim();
    const email = document.getElementById('dv-email').value.trim();
    const desc  = document.getElementById('dv-desc').value.trim();
    const file  = fileInput.files[0];

    ['dv-nom', 'dv-email', 'dv-desc'].forEach(id =>
      document.getElementById(id).classList.remove('invalid'));

    let valid = true;
    if (!nom)  { document.getElementById('dv-nom').classList.add('invalid');  valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('dv-email').classList.add('invalid'); valid = false;
    }
    if (!desc) { document.getElementById('dv-desc').classList.add('invalid'); valid = false; }

    if (!valid) { errEl.hidden = false; return; }
    errEl.hidden = true;

    const subject = `Demande de devis 2F3D — ${nom}`;
    let body = `Bonjour,\n\nJe souhaite obtenir un devis pour le projet suivant :\n\n${desc}`;
    if (file) body += `\n\nFichier à joindre : ${file.name}`;
    body += `\n\n---\nNom : ${nom}\nCourriel de retour : ${email}\n\nEnvoyé depuis 2f3d.ca`;

    window.open(
      `mailto:info@2f3d.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
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
        `${SUPA_URL}/rest/v1/ac3d_commandes?token=eq.${encodeURIComponent(token)}&select=*`,
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
