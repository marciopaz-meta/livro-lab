import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Library, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/books', icon: Library, label: 'Biblioteca' },
];

export const Sidebar: React.FC<Props> = ({ collapsed, onToggle }) => {
  return (
    <aside
      className={`flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 flex-shrink-0 ${
        collapsed ? 'w-14' : 'w-52'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 min-h-[56px]">
        <div className="flex-shrink-0 w-7 h-7 bg-amber-600 rounded-lg flex items-center justify-center shadow-sm">
          <BookOpen size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span
            className="font-bold text-white text-base tracking-tight whitespace-nowrap overflow-hidden"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            UmLivro Lab
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-amber-600/20 text-amber-400 font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={17} className="flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-gray-800 flex items-center justify-end">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </aside>
  );
};
