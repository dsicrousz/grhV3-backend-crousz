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
} as const;

export const ac = createAccessControl(statement);

/**
 * Rôle USER - Accès en lecture seule
 */
export const user = ac.newRole({
  employe: ['read', 'list'],
  bulletin: ['read', 'list'],
  lot: ['read', 'list'],
  rubrique: ['read', 'list'],
  session: ['read', 'list'],
  document: ['read', 'list'],
  nomination: ['read', 'list'],
  attribution: ['read', 'list'],
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
});

/**
 * Rôle RH - Gestion des employés, bulletins, nominations
 */
export const rh = ac.newRole({
  employe: ['create', 'read', 'update', 'delete', 'list'],
  bulletin: ['create', 'read', 'update', 'list', 'generate'],
  lot: ['read', 'list'],
  rubrique: ['read', 'list'],
  session: ['read', 'list'],
  document: ['create', 'read', 'update', 'delete', 'list', 'upload'],
  nomination: ['create', 'read', 'update', 'delete', 'list'],
  attribution: ['create', 'read', 'update', 'delete', 'list'],
});

/**
 * Rôle CSA - Gestion de la paie (lots, bulletins, rubriques)
 */
export const csa = ac.newRole({
  employe: ['read', 'list'],
  bulletin: ['create', 'read', 'update', 'delete', 'list', 'generate', 'validate'],
  lot: ['create', 'read', 'update', 'delete', 'list', 'calculate', 'close'],
  rubrique: ['create', 'read', 'update', 'delete', 'list'],
  session: ['create', 'read', 'update', 'delete', 'list', 'close'],
  document: ['read', 'list'],
  nomination: ['read', 'list'],
  attribution: ['read', 'list'],
});

export const roles = {
  user,
  admin,
  rh,
  csa,
};
