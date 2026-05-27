export type RoleCode = 'lider' | 'mentor' | 'gestor' | 'admin' | 'invitado';

export const ROLE_CODES: RoleCode[] = ['admin', 'gestor', 'lider', 'mentor', 'invitado'];

export const ROLE_LABELS: Record<RoleCode, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  lider: 'Líder',
  mentor: 'Adviser',
  invitado: 'Invitado',
};

export interface ModuleRecord {
  moduleCode: string;
  moduleName: string;
  description: string;
  isCore: boolean;
}

export interface RolePermissionCell {
  roleCode: RoleCode;
  moduleCode: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canModerate: boolean;
  canManage: boolean;
}

export type PermissionField =
  | 'canView'
  | 'canCreate'
  | 'canUpdate'
  | 'canDelete'
  | 'canApprove'
  | 'canModerate'
  | 'canManage';

export const PERMISSION_FIELDS: PermissionField[] = [
  'canView',
  'canCreate',
  'canUpdate',
  'canDelete',
  'canApprove',
  'canModerate',
  'canManage',
];

export const PERMISSION_LABELS: Record<PermissionField, string> = {
  canView: 'Ver',
  canCreate: 'Crear',
  canUpdate: 'Editar',
  canDelete: 'Eliminar',
  canApprove: 'Aprobar',
  canModerate: 'Moderar',
  canManage: 'Administrar',
};

export interface RolePermissionsMatrix {
  roles: RoleCode[];
  modules: ModuleRecord[];
  permissions: RolePermissionCell[];
}

export interface UpdateRolePermissionInput {
  roleCode: RoleCode;
  moduleCode: string;
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  canModerate?: boolean;
  canManage?: boolean;
}
