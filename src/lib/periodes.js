// Les identifiants restent stables pour conserver les textes, les liens et le choix de la semaine.
export function completerPeriodes(contenu) {
  contenu.parcours ||= [];
  let modifie = false;
  const couleurs = ['vert', 'jaune', 'orange', 'bleu', 'violet'];
  for (let numero = 1; numero <= 5; numero++) {
    let periode = contenu.parcours.find((p) => String(p.id) === String(numero));
    if (!periode) {
      periode = { id: numero, couleur: couleurs[numero - 1], textes: [] };
      contenu.parcours.push(periode);
      modifie = true;
    }
    const nom = `Période ${numero}`;
    if (periode.nom !== nom) { periode.nom = nom; modifie = true; }
  }
  contenu.parcours.sort((a, b) => Number(a.id) - Number(b.id));
  return modifie;
}

export function deplacerTexteVersPeriode(contenu, texte, source, destination) {
  if (!destination || source === destination) return false;
  if (!source.textes.includes(texte) || destination.textes.some((t) => t.id === texte.id)) return false;
  source.textes = source.textes.filter((t) => t !== texte);
  destination.textes.push(texte);
  if (String(contenu.texteSemaine?.parcoursId) === String(source.id) && contenu.texteSemaine?.texteId === texte.id) {
    contenu.texteSemaine.parcoursId = destination.id;
  }
  return true;
}
