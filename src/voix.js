// Synthèse vocale française (consignes, mots de dictée, questions).
let voixFr = null;
let depart = null;
let lectureEnCours = null;

function syntheseVocale() {
  try { return window.speechSynthesis || null; } catch { return null; }
}

function chercherVoix() {
  let toutes = [];
  try { toutes = syntheseVocale()?.getVoices?.() || []; } catch { /* API vocale indisponible */ }
  const fr = toutes.filter((v) => /^fr(-|_|$)/i.test(v.lang));
  voixFr = fr.find((v) => /fr-FR/i.test(v.lang) && /google|natural|amélie|audrey|thomas|marie/i.test(v.name))
    || fr.find((v) => /fr-FR/i.test(v.lang))
    || fr[0]
    || null;
}

if (syntheseVocale()) {
  chercherVoix();
  try { syntheseVocale().addEventListener?.('voiceschanged', chercherVoix); } catch { /* navigateur ancien */ }
}

export function voixDisponible() {
  return Boolean(syntheseVocale() && typeof SpeechSynthesisUtterance === 'function');
}

function interrompre() {
  if (depart !== null) { clearTimeout(depart); depart = null; }
  const precedente = lectureEnCours;
  lectureEnCours = null;
  if (precedente) {
    precedente.utterance.onend = null;
    precedente.utterance.onerror = null;
    precedente.resolve();
  }
  try { syntheseVocale()?.cancel(); } catch { /* moteur vocal indisponible */ }
}

/** Lit un texte. Renvoie une promesse résolue à la fin de la lecture. */
export function dire(texte, { vitesse = 0.9, onFin } = {}) {
  return new Promise((resolve) => {
    interrompre();
    if (!voixDisponible() || !texte) { resolve(); return; }
    if (!voixFr) chercherVoix();
    const synthese = syntheseVocale();
    const u = new SpeechSynthesisUtterance(String(texte));
    u.lang = voixFr?.lang || 'fr-FR';
    if (voixFr) u.voice = voixFr;
    u.rate = vitesse;
    const lecture = { utterance: u, resolve };
    lectureEnCours = lecture;
    const terminer = () => {
      if (lectureEnCours !== lecture) return;
      lectureEnCours = null;
      try { onFin?.(); } finally { resolve(); }
    };
    u.onend = terminer;
    u.onerror = terminer;
    // Petit délai : sur Android, cancel() suivi d'un speak() immédiat est parfois ignoré.
    depart = setTimeout(() => {
      depart = null;
      if (lectureEnCours !== lecture) return;
      if (!voixFr) chercherVoix();
      if (voixFr) { u.voice = voixFr; u.lang = voixFr.lang; }
      try { synthese.speak(u); } catch { terminer(); }
    }, 60);
  });
}

export function taire() { interrompre(); }
