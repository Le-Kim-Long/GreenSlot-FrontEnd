export type BackendRole =
  | 'ROLE_ADMIN'
  | 'ROLE_MANAGER'
  | 'ROLE_LOCATION_MANAGER'
  | 'ROLE_GARDEN_STAFF'
  | 'ROLE_CUSTOMER';

export type FrontendRole =
  | 'admin'
  | 'manager'
  | 'location_manager'
  | 'garden_staff'
  | 'customer';

const ROLE_PRIORITY: BackendRole[] = [
  'ROLE_ADMIN',
  'ROLE_MANAGER',
  'ROLE_LOCATION_MANAGER',
  'ROLE_GARDEN_STAFF',
  'ROLE_CUSTOMER',
];

export function mapBackendRolesToFrontend(roles: string[] | undefined): FrontendRole {
  if (!roles?.length) return 'customer';

  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      switch (role) {
        case 'ROLE_ADMIN': return 'admin';
        case 'ROLE_MANAGER': return 'manager';
        case 'ROLE_LOCATION_MANAGER': return 'location_manager';
        case 'ROLE_GARDEN_STAFF': return 'garden_staff';
        default: return 'customer';
      }
    }
  }
  return 'customer';
}

export function getDashboardPath(role: FrontendRole): string {
  switch (role) {
    case 'admin': return '/dashboard/admin';
    case 'manager':
    case 'location_manager': return '/dashboard/staff';
    case 'garden_staff': return '/dashboard/garden-staff';
    default: return '/dashboard/customer';
  }
}

export function roleLabel(role: FrontendRole | string): string {
  const labels: Record<string, string> = {
    admin: 'Quản trị viên',
    manager: 'Quản lý kinh doanh',
    location_manager: 'Quản lý cơ sở',
    garden_staff: 'Nhân viên vườn',
    customer: 'Khách hàng',
    ROLE_ADMIN: 'Admin',
    ROLE_MANAGER: 'Manager',
    ROLE_LOCATION_MANAGER: 'Location Manager',
    ROLE_GARDEN_STAFF: 'Garden Staff',
    ROLE_CUSTOMER: 'Customer',
  };
  return labels[role] || role;
}

/** Staff-area access: manager, location_manager share /dashboard/staff */
export function canAccessStaffDashboard(role: FrontendRole): boolean {
  return role === 'manager' || role === 'location_manager';
}

export function canViewRevenue(role: FrontendRole): boolean {
  return role === 'manager' || role === 'admin';
}
