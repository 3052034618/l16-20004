import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CheckSquare,
  CalendarDays,
  UtensilsCrossed,
  Wrench,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Bell,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: '运营仪表盘', icon: LayoutDashboard },
  { path: '/customers', label: '客户管理', icon: Users },
  { path: '/care-plans', label: '护理方案', icon: ClipboardList },
  { path: '/tasks', label: '任务中心', icon: CheckSquare },
  { path: '/schedules', label: '排班管理', icon: CalendarDays },
  { path: '/meals', label: '营养餐', icon: UtensilsCrossed },
  { path: '/equipment', label: '设备管理', icon: Wrench },
  { path: '/reports', label: '统计报表', icon: BarChart3 },
];

const breadcrumbMap: Record<string, { parent?: string; label: string }> = {
  '/dashboard': { label: '运营仪表盘' },
  '/customers': { label: '客户管理' },
  '/care-plans': { label: '护理方案' },
  '/tasks': { label: '任务中心' },
  '/schedules': { label: '排班管理' },
  '/meals': { label: '营养餐管理' },
  '/equipment': { label: '设备管理' },
  '/reports': { label: '统计报表' },
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const getBreadcrumbs = () => {
    const pathname = location.pathname;
    const crumbs: { label: string; path?: string }[] = [
      { label: '首页', path: '/dashboard' },
    ];

    const segments = pathname.split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < segments.length; i++) {
      currentPath += '/' + segments[i];
      const mapping = breadcrumbMap[currentPath];
      if (mapping) {
        if (mapping.parent) {
          const parentMapping = breadcrumbMap[mapping.parent];
          if (parentMapping) {
            crumbs.push({ label: parentMapping.label, path: mapping.parent });
          }
        }
        crumbs.push({ label: mapping.label, path: currentPath });
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-800 whitespace-nowrap">母婴护理中心</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto">
              <Home className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-pink-50 text-pink-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${collapsed ? 'justify-center' : ''}`
                    }
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : ''}`} />
                    {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">收起菜单</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <nav className="flex items-center text-sm">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <div key={index} className="flex items-center">
                  {crumb.path && !isLast ? (
                    <NavLink
                      to={crumb.path}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {crumb.label}
                    </NavLink>
                  ) : (
                    <span className={isLast ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <ChevronDown className="w-4 h-4 mx-2 text-gray-400 -rotate-90" />}
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-breathing"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">管</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">管理员</div>
                <div className="text-xs text-gray-500">系统管理员</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
