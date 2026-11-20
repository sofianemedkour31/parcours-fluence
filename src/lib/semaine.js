// Un seul texte commun, choisi explicitement par l’enseignant.
export function trouverTexteSemaine(contenu) {
  const choix = contenu?.texteSemaine;
  if (!choix) return null;
  const parcours = contenu.parcours?.find((p) => String(p.id) === String(choix.parcoursId));
  const texte = parcours?.textes?.find((t) => t.id === choix.texteId);
  return texte ? { parcours, texte } : null;
}

export function contenuPourEleve(contenu, apercu = false) {
  const semaine = trouverTexteSemaine(contenu);
  return {
    ...contenu,
    parcours: apercu ? contenu.parcours || []
      : semaine?.texte.valide ? [{ ...semaine.parcours, textes: [semaine.texte] }] : [],
  };
}

export function erreursSemaine(contenu) {
  if (contenu?.texteSemaine == null) return [];
  const semaine = trouverTexteSemaine(contenu);
  if (!semaine) return ['Le texte de la semaine est introuvable. Choisissez-le à nouveau.'];
  if (!semaine.texte.valide) return ['Validez le texte de la semaine avant de publier.'];
  if (semaine.texte.activites?.lecture?.actif === false) return ['Activez la lecture du texte de la semaine.'];
  return [];
}
