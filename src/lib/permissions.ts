export const MODULE_CODES = [
  'analitica',
  'aprendizaje',
  'contenido',
  'convocatorias',
  'dashboard',
  'formacion_mentores',
  'gestion_formacion_mentores',
  'lideres',
  'mensajes',
  'mentorias',
  'metodologia',
  'networking',
  'perfil',
  'trayectoria',
  'usuarios',
  'workshops',
] as const;

export type ModuleCode = (typeof MODULE_CODES)[number];

export const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete', 'approve', 'moderate', 'manage'] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export interface ModulePermissions {
  moduleCode: ModuleCode;
  moduleName: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canModerate: boolean;
  canManage: boolean;
}

export type ModulePermissionMap = Record<ModuleCode, ModulePermissions>;

function emptyPermission(moduleCode: ModuleCode): ModulePermissions {
  return {
    moduleCode,
    moduleName: moduleCode,
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canModerate: false,
    canManage: false,
  };
}

export function emptyModulePermissionMap(): ModulePermissionMap {
  return MODULE_CODES.reduce((acc, moduleCode) => {
    acc[moduleCode] = emptyPermission(moduleCode);
    return acc;
  }, {} as ModulePermissionMap);
}

export function toModulePermissionMap(permissions: ModulePermissions[]): ModulePermissionMap {
  const map = emptyModulePermissionMap();
  for (const permission of permissions) {
    map[permission.moduleCode] = permission;
  }
  return map;
}

export function canModuleAction(
  map: ModulePermissionMap,
  moduleCode: ModuleCode,
  action: PermissionAction,
): boolean {
  const entry = map[moduleCode];
  if (!entry) return false;

  switch (action) {
    case 'view':
      return entry.canView;
    case 'create':
      return entry.canCreate;
    case 'update':
      return entry.canUpdate;
    case 'delete':
      return entry.canDelete;
    case 'approve':
      return entry.canApprove;
    case 'moderate':
      return entry.canModerate;
    case 'manage':
      return entry.canManage;
    default:
      return false;
  }
}
