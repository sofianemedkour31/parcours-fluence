import assert from 'node:assert/strict';
import test from 'node:test';
import { contenuPourEleve, erreursSemaine, trouverTexteSemaine } from '../src/lib/semaine.js';

function exemple() {
  return {
    texteSemaine: { parcoursId: 2, texteId: 'commun' },
    parcours: [
      { id: 1, textes: [{ id: 'reserve', valide: true }] },
      { id: 2, textes: [{ id: 'ancien', valide: true }, { id: 'commun', valide: true, activites: { lecture: { actif: true } } }] },
    ],
  };
}

test('seul le texte commun est accessible, même si la réserve contient des textes validés', () => {
  const contenu = exemple();
  const eleve = contenuPourEleve(contenu);
  assert.deepEqual(eleve.parcours.map((p) => [p.id, p.textes.map((t) => t.id)]), [[2, ['commun']]]);
  assert.equal(contenu.parcours[1].textes.length, 2);
});

test('un texte modifié et repassé en brouillon est masqué aux élèves et bloque la publication', () => {
  const contenu = exemple();
  trouverTexteSemaine(contenu).texte.valide = false;
  assert.deepEqual(contenuPourEleve(contenu).parcours, []);
  assert.match(erreursSemaine(contenu).join(' '), /Validez/);
  assert.equal(contenuPourEleve(contenu, true).parcours[1].textes.length, 2);
});

test('sans sélection, aucun texte de la réserve ne devient le texte de la semaine par défaut', () => {
  const contenu = exemple();
  contenu.texteSemaine = null;
  assert.equal(trouverTexteSemaine(contenu), null);
  assert.deepEqual(contenuPourEleve(contenu).parcours, []);
});

test('un choix supprimé ou inexistant bloque la publication sans ouvrir un autre texte', () => {
  const contenu = exemple();
  contenu.texteSemaine.texteId = 'supprime';
  assert.match(erreursSemaine(contenu).join(' '), /introuvable/);
  assert.deepEqual(contenuPourEleve(contenu).parcours, []);
});

test('la lecture doit rester active sur le texte de la semaine', () => {
  const contenu = exemple();
  assert.deepEqual(erreursSemaine(contenu), []);
  trouverTexteSemaine(contenu).texte.activites.lecture.actif = false;
  assert.match(erreursSemaine(contenu).join(' '), /Activez la lecture/);
});

test('des identifiants de parcours importés sous forme de chaînes restent utilisables', () => {
  const contenu = exemple();
  contenu.texteSemaine.parcoursId = '2';
  assert.equal(trouverTexteSemaine(contenu).texte.id, 'commun');
});
