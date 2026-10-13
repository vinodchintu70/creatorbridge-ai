export interface NavItem {
  label: string;
  href: string;
  description?: string;
  badge?: string;
  isExternal?: boolean;
}

export interface UserRoleOption {
  id: 'brand' | 'creator';
  label: string;
  description: string;
}
