import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

/**
 * Définition des ressources et actions personnalisées pour l'application GRH
 */
const statement = {
  ...defaultStatements,
  employe: ['create', 'read', 'update', 'delete', 'list'],
  bulletin: ['create', 'read', 'update', 'delete', 'list', 'generate', 'validate'],
  lot: ['create', 'read', 'update', 'delete', 'list', 'calculate', 'close'],
  rubrique: ['create', 'read', 'update', 'delete', 'list'],
  session: ['create', 'read', 'update', 'delete', 'list', 'close'],
  document: ['create', 'read', 'update', 'delete', 'list', 'upload'],
  nomination: ['create', 'read', 'update', 'delete', 'list'],
  attribution: ['create', 'read', 'update', 'delete', 'list'],
  contrat: ['create', 'read', 'update', 'delete', 'list'],
  conge: ['create', 'read', 'update', 'delete', 'list', 'validate'],
  absence: ['create', 'read', 'update', 'delete', 'list', 'validate'],
  workflow: ['create', 'read', 'update', 'delete', 'list'],
  site: ['create', 'read', 'update', 'delete', 'list'],
  poste: ['create', 'read', 'update', 'delete', 'list'],
  fonction: ['create', 'read', 'update', 'delete', 'list'],
  division: ['create', 'read', 'update', 'delete', 'list'],
  categorie: ['create', 'read', 'update', 'delete', 'list'],
  service: ['create', 'read', 'update', 'delete', 'list'],
  typedocument: ['create', 'read', 'update', 'delete', 'list'],
  impot: ['create', 'read', 'update', 'delete', 'list'],
  historique: ['create', 'read', 'update', 'delete', 'list'],
  exclusion: ['create', 'read', 'update', 'delete', 'list'],
  affectation: ['create', 'read', 'update', 'delete', 'list'],
  motifRupture: ['create', 'read', 'update', 'delete', 'list'],
  parametreBulletin: ['create', 'read', 'update', 'delete', 'list'],
  pieceJointe: ['create', 'read', 'update', 'delete', 'list'],
  reporting: ['read', 'list'],
} as const;

export const ac = createAccessControl(statement);

/**
 * Rôle DSI - Accès en lecture seule
 */
export const dsi = ac.newRole({
  employe: ['read', 'list'],
  bulletin: ['read', 'list'],
  lot: ['read', 'list'],
  rubrique: ['read', 'list'],
  session: ['read', 'list'],
  document: ['read', 'list'],
  nomination: ['read', 'list'],
  attribution: ['read', 'list'],
  contrat: ['read', 'list'],
  conge: ['read', 'list'],
  absence: ['read', 'list'],
  workflow: ['read', 'list'],
  site: ['read', 'list'],
  poste: ['read', 'list'],
  fonction: ['read', 'list'],
  division: ['read', 'list'],
  categorie: ['read', 'list'],
  service: ['read', 'list'],
  typedocument: ['read', 'list'],
  impot: ['read', 'list'],
  historique: ['read', 'list'],
  exclusion: ['read', 'list'],
  affectation: ['read', 'list'],
  motifRupture: ['read', 'list'],
  parametreBulletin: ['read', 'list'],
  pieceJointe: ['read', 'list'],
  reporting: ['read', 'list'],
});

/**
 * Rôle ADMIN - Accès complet + gestion des utilisateurs
 */
export const admin = ac.newRole({
  ...adminAc.statements,
  employe: ['create', 'read', 'update', 'delete', 'list'],
  bulletin: ['create', 'read', 'update', 'delete', 'list', 'generate', 'validate'],
  lot: ['create', 'read', 'update', 'delete', 'list', 'calculate', 'close'],
  rubrique: ['create', 'read', 'update', 'delete', 'list'],
  session: ['create', 'read', 'update', 'delete', 'list', 'close'],
  document: ['create', 'read', 'update', 'delete', 'list', 'upload'],
  nomination: ['create', 'read', 'update', 'delete', 'list'],
  attribution: ['create', 'read', 'update', 'delete', 'list'],
  contrat: ['create', 'read', 'update', 'delete', 'list'],
  conge: ['create', 'read', 'update', 'delete', 'list', 'validate'],
  absence: ['create', 'read', 'update', 'delete', 'list', 'validate'],
  workflow: ['create', 'read', 'update', 'delete', 'list'],
  site: ['create', 'read', 'update', 'delete', 'list'],
  poste: ['create', 'read', 'update', 'delete', 'list'],
  fonction: ['create', 'read', 'update', 'delete', 'list'],
  division: ['create', 'read', 'update', 'delete', 'list'],
  categorie: ['create', 'read', 'update', 'delete', 'list'],
  service: ['create', 'read', 'update', 'delete', 'list'],
  typedocument: ['create', 'read', 'update', 'delete', 'list'],
  impot: ['create', 'read', 'update', 'delete', 'list'],
  historique: ['create', 'read', 'update', 'delete', 'list'],
  exclusion: ['create', 'read', 'update', 'delete', 'list'],
  affectation: ['create', 'read', 'update', 'delete', 'list'],
  motifRupture: ['create', 'read', 'update', 'delete', 'list'],
  parametreBulletin: ['create', 'read', 'update', 'delete', 'list'],
  pieceJointe: ['create', 'read', 'update', 'delete', 'list'],
  reporting: ['read', 'list'],
});

/**
 * Rôle RH - Gestion des employés, bulletins, nominations
 */
export const rh = ac.newRole({
  employe: ['create', 'read', 'update', 'delete', 'list'],
  bulletin: ['create', 'read', 'update', 'list', 'generate','validate'],
  lot: ['read', 'list','delete','update','create','calculate','close'],
  rubrique: ['read', 'list'],
  session: ['read', 'list'],
  document: ['create', 'read', 'update', 'delete', 'list', 'upload'],
  nomination: ['create', 'read', 'update', 'delete', 'list'],
  attribution: ['create', 'read', 'update', 'delete', 'list'],
  contrat: ['create', 'read', 'update', 'delete', 'list'],
  conge: ['create', 'read', 'update', 'delete', 'list', 'validate'],
  absence: ['create', 'read', 'update', 'delete', 'list', 'validate'],
  workflow: ['create', 'read', 'update', 'delete', 'list'],
  site: ['read', 'list'],
  poste: ['read', 'list'],
  fonction: ['read', 'list'],
  division: ['read', 'list'],
  categorie: ['read', 'list'],
  service: ['read', 'list'],
  typedocument: ['read', 'list'],
  impot: ['read', 'list'],
  historique: ['create', 'read', 'update', 'delete', 'list'],
  exclusion: ['create', 'read', 'update', 'delete', 'list'],
  affectation: ['create', 'read', 'update', 'delete', 'list'],
  motifRupture: ['read', 'list'],
  parametreBulletin: ['read', 'list'],
  pieceJointe: ['create', 'read', 'update', 'delete', 'list'],
  reporting: ['read', 'list'],
});

/**
 * Rôle CSA - Gestion de la paie (lots, bulletins, rubriques)
 */
export const csa = ac.newRole({
  employe: ['read', 'list'],
  bulletin: ['read', 'list', 'validate'],
  lot: ['read', 'update', 'list', 'calculate', 'close'],
  rubrique: ['read', 'list'],
  session: ['read', 'list'],
  document: ['read', 'list'],
  nomination: ['read', 'list'],
  attribution: ['read', 'list'],
  contrat: ['read', 'list'],
  conge: ['read', 'list'],
  absence: ['read', 'list'],
  workflow: ['read', 'list'],
  site: ['read', 'list'],
  poste: ['read', 'list'],
  fonction: ['read', 'list'],
  division: ['read', 'list'],
  categorie: ['read', 'list'],
  service: ['read', 'list'],
  typedocument: ['read', 'list'],
  impot: ['read', 'list'],
  historique: ['read', 'list'],
  exclusion: ['read', 'list'],
  affectation: ['read', 'list'],
  motifRupture: ['read', 'list'],
  parametreBulletin: ['read', 'list'],
  pieceJointe: ['read', 'list'],
  reporting: ['read', 'list'],
});

export const roles = {
  dsi,
  admin,
  rh,
  csa,
};
