export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
  parentId?: string;
}

export interface MenuService {
  getMenuItems(): MenuItem[];
}