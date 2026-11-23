// Lecture avec effacement : le repère et les lettres partagent la même animation.
import { el, ajouter, iconePixel, formaterDuree } from '../ui.js';
import { jetons } from '../lib/texte.js';
import { creerEffacement, GIF_LECTURE, sourceGif } from '../lib/effacement.js';
import { dire, taire } from '../voix.js';
import { creerPiste, finDeNiveau, gagner, lectureTerminee } from '../jeu.js';

const TAILLES = [24, 28, 32, 38, 44];

export function monterLecture(zone, { texte, parcours, finir }) {
  let aides = {};
  try { aides = JSON.parse(sessionStorage.getItem('ulis-aides-lecture')) || {}; } catch { /* réglages par défaut */ }
  let taille = Number.isInteger(aides.taille) && TAILLES[aides.taille] ? aides.taille : 1;
  let espacement = aides.espacement === true;
  let contenu = texte.texte;
  let gifLocal = null;
  let moteur;
  let piste;
  let detruit = false;
  let personnel = false;
  const lettres = [];
  const corps = el('div', { class: 'effacement-texte' });
  const image = el('img', { src: sourceGif(texte.activites?.lecture?.gif) || GIF_LECTURE, alt: '', draggable: 'false' });
  const personnage = el('div', { class: 'effacement-personnage', 'aria-hidden': 'true' }, image);
  const papier = el('div', {
    class: 'papier lecture-effacement', tabindex: '0', 'aria-label': 'Texte de lecture avec effacement',
    style: { '--taille': `${TAILLES[taille]}px` },
  }, corps, personnage);
  const chrono = el('span', { class: 'chrono', 'aria-label': 'Durée de lecture' }, '0:00');
  const etat = el('p', { class: 'effacement-etat', role: 'status' }, 'Tout le texte est visible.');
  const btnDemarrer = el('button', { class: 'btn-px btn-principal', onclick: () => { taire(); moteur.demarrer(); } }, 'Démarrer');
  const btnPause = el('button', { class: 'btn-px', disabled: true, onclick: () => moteur.pause() }, 'Pause');
  const btnReprendre = el('button', { class: 'btn-px', disabled: true, onclick: () => { taire(); moteur.reprendre(); } }, 'Reprendre');
  const btnAfficher = el('button', { class: 'btn-px', onclick: () => { taire(); moteur.reinitialiser(); } }, 'Tout réafficher');
  const vitesse = el('input', {
    type: 'number', min: 10, max: 300, step: 5,
    value: Math.max(10, Math.min(300, Number(texte.activites?.lecture?.vitesse || parcours.reglages?.vitesse) || 60)),
    onchange: () => {
      vitesse.value = String(Math.max(10, Math.min(300, Number(vitesse.value) || 60)));
      moteur.changerVitesse(Number(vitesse.value));
    },
  });
  const edition = el('textarea', { rows: 6 }, contenu);
  const adresseGif = el('input', { type: 'url', placeholder: 'https://…/personnage.gif', value: texte.activites?.lecture?.gif || '' });
  const erreur = el('p', { class: 'effacement-erreur', role: 'alert', hidden: true });
  const progression = el('div');

  function afficherErreur(message = '') {
    erreur.textContent = message;
    erreur.hidden = !message;
  }

  function remplacerGif(src) {
    moteur.pause(); afficherErreur();
    if (gifLocal) URL.revokeObjectURL(gifLocal);
    gifLocal = src.startsWith('blob:') ? src : null;
    image.src = src;
    moteur.recalculer();
  }

  const reglages = el('details', { class: 'aides-lecture' },
    el('summary', {}, 'Texte et personnage'),
    el('p', {}, 'Ces remplacements servent à cette séance. Le texte de la semaine se modifie dans le studio.'),
    el('label', { class: 'effacement-champ' }, 'Texte à lire', edition),
    el('button', { class: 'btn-px', onclick: () => {
      if (!jetons(edition.value).flat().some((j) => j.type === 'mot')) return afficherErreur('Ajoute au moins un mot à lire.');
      contenu = edition.value;
      personnel = contenu !== texte.texte;
      afficherErreur(); construire();
    } }, 'Utiliser ce texte'),
    el('label', { class: 'effacement-champ' }, 'Adresse du GIF transparent', adresseGif),
    el('div', { class: 'commandes' },
      el('button', { class: 'btn-px', onclick: () => {
        const src = sourceGif(adresseGif.value);
        if (!src) return afficherErreur('Saisis une adresse HTTPS directe vers un GIF, ou choisis un fichier GIF.');
        remplacerGif(src);
      } }, 'Utiliser ce GIF'),
      el('button', { class: 'btn-px', onclick: () => { adresseGif.value = ''; remplacerGif(GIF_LECTURE); } }, 'Personnage Ryu')),
    el('label', { class: 'effacement-champ' }, 'Ou choisir un fichier GIF transparent',
      el('input', { type: 'file', accept: 'image/gif,.gif', onchange: (e) => {
        const fichier = e.target.files?.[0];
        if (!fichier) return;
        if (fichier.type !== 'image/gif') return afficherErreur('Choisis un fichier au format GIF.');
        remplacerGif(URL.createObjectURL(fichier));
      } })),
    el('a', { class: 'effacement-credit', href: 'https://tenor.com/view/street-fighter-ryu-gif-21021314', target: '_blank', rel: 'noopener noreferrer' }, 'Street Fighter Sticker · Tenor'),
    erreur);

  ajouter(zone,
    el('div', { class: 'activite-entete effacement-entete' }, el('h2', {}, texte.titre),
      el('h3', { class: 'effacement-titre' }, 'Lecture avec effacement'),
      el('p', { class: 'consigne' }, 'Lis à voix haute avant le passage du personnage. Les lettres disparaissent derrière lui.')),
    el('div', { class: 'commandes' }, btnDemarrer, btnPause, btnReprendre, btnAfficher, chrono),
    el('div', { class: 'commandes' },
      el('label', { class: 'effacement-vitesse' }, 'Vitesse ', vitesse, ' mots/min'),
      el('button', { class: 'btn-px', 'aria-label': 'Texte plus petit', onclick: () => changerTaille(-1) }, 'a'),
      el('button', { class: 'btn-px grand', 'aria-label': 'Texte plus grand', onclick: () => changerTaille(1) }, 'A'),
      el('button', { class: 'btn-px', 'aria-pressed': String(espacement), onclick: (e) => {
        espacement = !espacement;
        e.currentTarget.setAttribute('aria-pressed', String(espacement));
        papier.classList.toggle('mots-espaces', espacement);
        sauverAides(); moteur.recalculer();
      } }, 'Espacer les mots'),
      el('button', { class: 'btn-px', onclick: () => { moteur.pause(); dire(contenu, { vitesse: 0.85 }); } },
        iconePixel('son', { taille: 18, contour: 'currentColor', fond: 'currentColor' }), ' Écouter le modèle')),
    etat, progression, papier, reglages);

  image.addEventListener('load', () => moteur?.recalculer());
  image.addEventListener('error', () => {
    moteur?.pause();
    afficherErreur('Ce GIF ne peut pas être chargé. Choisis un autre fichier ou le personnage Ryu.');
    reglages.open = true;
  });
  construire();

  function construire() {
    moteur?.detruire(); corps.replaceChildren(); lettres.length = 0;
    let nbMots = 0;
    const decouper = typeof Intl.Segmenter === 'function'
      ? (s) => [...new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(s)].map((g) => g.segment)
      : (s) => Array.from(s.normalize('NFC'));
    for (const paragraphe of jetons(contenu)) {
      const p = el('p');
      for (const jeton of paragraphe) {
        if (jeton.type === 'mot') nbMots++;
        const parent = jeton.type === 'mot' ? el('span', { class: 'effacement-mot' }) : p;
        if (parent !== p) p.append(parent);
        for (const lettre of decouper(jeton.v)) {
          if (/^\s+$/u.test(lettre)) { parent.append(document.createTextNode(lettre)); continue; }
          const span = el('span', { class: 'effacement-lettre' }, lettre);
          lettres.push(span); parent.append(span);
        }
      }
      corps.append(p);
    }
    piste = creerPiste(nbMots); progression.replaceChildren(piste.el);
    papier.classList.toggle('mots-espaces', espacement);
    moteur = creerEffacement({ papier, lettres, personnage, image, nbMots, vitesse: Number(vitesse.value),
      surEtat: (statut) => {
        btnDemarrer.disabled = statut !== 'pret' || !nbMots;
        btnPause.disabled = statut !== 'lecture';
        btnReprendre.disabled = statut !== 'pause';
        papier.dataset.etat = statut;
        etat.textContent = { pret: 'Tout le texte est visible.', lecture: 'Lecture en cours.', pause: 'Lecture en pause.', termine: 'Lecture terminée. Tu peux tout réafficher pour relire.' }[statut];
      },
      surProgression: (fraction, duree) => { piste.avancer(fraction * nbMots); chrono.textContent = formaterDuree(duree); },
      surFin: (duree) => {
        if (personnel) return;
        const lectures = lectureTerminee(texte.id);
        gagner(20, btnAfficher);
        finDeNiveau({ texteId: texte.id, activite: 'lecture', etoiles: Math.min(3, lectures),
          titre: 'Entraînement terminé !',
          lignes: [`Durée de lecture : ${formaterDuree(duree)}.`, 'Relis le texte pour continuer à t’entraîner.'],
          boutons: [{ texte: 'Relire', action: () => moteur.reinitialiser() }, { texte: 'Autre activité', action: finir, principal: true }],
        });
      },
    });
  }

  function changerTaille(delta) {
    taille = Math.min(TAILLES.length - 1, Math.max(0, taille + delta));
    papier.style.setProperty('--taille', `${TAILLES[taille]}px`);
    sauverAides(); moteur.recalculer();
  }
  function sauverAides() {
    try { sessionStorage.setItem('ulis-aides-lecture', JSON.stringify({ ...aides, taille, espacement })); } catch { /* sans stockage */ }
  }
  const surVisibilite = () => { if (document.hidden) moteur.pause(); };
  const surPolices = () => { if (!detruit) moteur.recalculer(); };
  document.addEventListener('visibilitychange', surVisibilite);
  document.fonts?.ready.then(surPolices);
  document.fonts?.addEventListener('loadingdone', surPolices);
  return () => {
    detruit = true; moteur.detruire(); taire();
    if (gifLocal) URL.revokeObjectURL(gifLocal);
    document.removeEventListener('visibilitychange', surVisibilite);
    document.fonts?.removeEventListener('loadingdone', surPolices);
  };
}
