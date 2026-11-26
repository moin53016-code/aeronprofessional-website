import type { Role } from '@/generated/prisma/enums';

// ==========================================
// AVAILABLE ADMIN PERMISSIONS
// ==========================================

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',

  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  CATEGORY_VIEW: 'category:view',
  CATEGORY_MANAGE: 'category:manage',

  BANNER_VIEW: 'banner:view',
  BANNER_MANAGE: 'banner:manage',

  DISCOUNT_VIEW: 'discount:view',
  DISCOUNT_MANAGE: 'discount:manage',

  MARKETPLACE_VIEW: 'marketplace:view',
  MARKETPLACE_MANAGE: 'marketplace:manage',

  CONTENT_VIEW: 'content:view',
  CONTENT_MANAGE: 'content:manage',

  FAQ_VIEW: 'faq:view',
  FAQ_MANAGE: 'faq:manage',

  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',

  MEDIA_UPLOAD: 'media:upload',
  MEDIA_DELETE: 'media:delete',

  ADMIN_VIEW: 'admin:view',
  ADMIN_MANAGE: 'admin:manage',

  AUDIT_VIEW: 'audit:view',

  SESSION_MANAGE: 'session:manage',
} as const;

// ==========================================
// PERMISSION TYPE
// ==========================================

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ==========================================
// OWNER PERMISSIONS
// ==========================================

const OWNER_PERMISSIONS: readonly Permission[] =
  Object.values(PERMISSIONS);

// ==========================================
// ADMIN PERMISSIONS
// ==========================================

const ADMIN_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.DASHBOARD_VIEW,

  PERMISSIONS.PRODUCT_VIEW,
  PERMISSIONS.PRODUCT_CREATE,
  PERMISSIONS.PRODUCT_UPDATE,
  PERMISSIONS.PRODUCT_DELETE,

  PERMISSIONS.CATEGORY_VIEW,
  PERMISSIONS.CATEGORY_MANAGE,

  PERMISSIONS.BANNER_VIEW,
  PERMISSIONS.BANNER_MANAGE,

  PERMISSIONS.DISCOUNT_VIEW,
  PERMISSIONS.DISCOUNT_MANAGE,

  PERMISSIONS.MARKETPLACE_VIEW,
  PERMISSIONS.MARKETPLACE_MANAGE,

  PERMISSIONS.CONTENT_VIEW,
  PERMISSIONS.CONTENT_MANAGE,

  PERMISSIONS.FAQ_VIEW,
  PERMISSIONS.FAQ_MANAGE,

  PERMISSIONS.SETTINGS_VIEW,
  PERMISSIONS.SETTINGS_MANAGE,

  PERMISSIONS.MEDIA_UPLOAD,
  PERMISSIONS.MEDIA_DELETE,
];

// ==========================================
// EDITOR PERMISSIONS
// ==========================================

const EDITOR_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.DASHBOARD_VIEW,

  PERMISSIONS.PRODUCT_VIEW,
  PERMISSIONS.PRODUCT_CREATE,
  PERMISSIONS.PRODUCT_UPDATE,

  PERMISSIONS.CATEGORY_VIEW,

  PERMISSIONS.BANNER_VIEW,
  PERMISSIONS.BANNER_MANAGE,

  PERMISSIONS.DISCOUNT_VIEW,

  PERMISSIONS.MARKETPLACE_VIEW,

  PERMISSIONS.CONTENT_VIEW,
  PERMISSIONS.CONTENT_MANAGE,

  PERMISSIONS.FAQ_VIEW,
  PERMISSIONS.FAQ_MANAGE,

  PERMISSIONS.MEDIA_UPLOAD,
];

// ==========================================
// CENTRALIZED ROLE PERMISSION MAP
// ==========================================

const ROLE_PERMISSIONS: Record<
  Role,
  readonly Permission[]
> = {
  OWNER: OWNER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  EDITOR: EDITOR_PERMISSIONS,
};

// ==========================================
// VALIDATE ADMIN ROLE
// ==========================================

export function isValidRole(
  role: unknown
): role is Role {
  return (
    role === 'OWNER' ||
    role === 'ADMIN' ||
    role === 'EDITOR'
  );
}

// ==========================================
// GET ROLE PERMISSIONS
// ==========================================

export function getRolePermissions(
  role: unknown
): readonly Permission[] {
  if (!isValidRole(role)) {
    return [];
  }

  return [...ROLE_PERMISSIONS[role]];
}

// ==========================================
// CHECK INDIVIDUAL PERMISSION
// ==========================================

export function hasPermission(
  role: unknown,
  permission: Permission
): boolean {
  if (!isValidRole(role)) {
    return false;
  }

  return ROLE_PERMISSIONS[role].includes(
    permission
  );
}

// ==========================================
// CHECK ALL REQUIRED PERMISSIONS
// ==========================================

export function hasAllPermissions(
  role: unknown,
  permissions: readonly Permission[]
): boolean {
  if (
    !isValidRole(role) ||
    permissions.length === 0
  ) {
    return false;
  }

  return permissions.every(
    (permission) =>
      hasPermission(role, permission)
  );
}

// ==========================================
// CHECK ANY REQUIRED PERMISSION
// ==========================================

export function hasAnyPermission(
  role: unknown,
  permissions: readonly Permission[]
): boolean {
  if (
    !isValidRole(role) ||
    permissions.length === 0
  ) {
    return false;
  }

  return permissions.some(
    (permission) =>
      hasPermission(role, permission)
  );
}

// ==========================================
// CHECK OWNER ROLE
// ==========================================

export function isOwner(
  role: unknown
): boolean {
  return role === 'OWNER';
}

// ==========================================
// CHECK OWNER OR ADMIN ROLE
// ==========================================

export function isAdminOrOwner(
  role: unknown
): boolean {
  return (
    role === 'OWNER' ||
    role === 'ADMIN'
  );
}