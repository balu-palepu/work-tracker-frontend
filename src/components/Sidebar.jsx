import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import {
  LayoutDashboard, FolderOpen, Newspaper, History, BarChart3,
  Users, Shield, Settings, LogOut, ChevronLeft, ChevronRight,
  BookOpen, Zap, Activity, Menu, X, Calendar,
  UserCheck, FileText,
} from 'lucide-react';
import TeamSwitcher from './team/TeamSwitcher';
import NotificationBell from './notifications/NotificationBell';
const normalizeRole = (role) => String(role || '').trim().toLowerCase();

// Custom tooltip for collapsed icon labels
const SidebarTooltip = ({ label, show, children }) => {
  const [visible, setVisible] = useState(false);
  const [top, setTop] = useState(0);
  const ref = useRef(null);

  if (!show) return <>{children}</>;

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          setTop(rect.top + rect.height / 2);
        }
        setVisible(true);
      }}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          style={{ position: 'fixed', top, left: 76, transform: 'translateY(-50%)', zIndex: 300 }}
          className="pointer-events-none"
        >
          <div className="relative bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            <span
              className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
              style={{ borderRightColor: '#111827' }}
            />
            {label}
          </div>
        </div>
      )}
    </div>
  );
};

// Single nav item
const NavItem = ({ to, icon: Icon, label, collapsed, activeCheck, badge }) => {
  const active = activeCheck ? activeCheck() : false;

  const inner = (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 w-full ${
        active ? 'bg-gray-900 shadow-sm' : 'hover:bg-gray-100'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 transition-colors ${
          active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
        }`}
      />
      {!collapsed && (
        <>
          <span className={`text-sm font-medium truncate flex-1 ${active ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
            {label}
          </span>
          {badge != null && badge > 0 && (
            <span className={`min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center ${active ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </>
      )}
    </div>
  );

  return (
    <SidebarTooltip label={label} show={collapsed}>
      <Link to={to} className="block w-full">
        {inner}
      </Link>
    </SidebarTooltip>
  );
};

// Section divider
const NavSection = ({ label, collapsed, children }) => (
  <div className="space-y-0.5">
    {!collapsed ? (
      <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 select-none">
        {label}
      </p>
    ) : (
      <div className="pt-3" />
    )}
    {children}
  </div>
);

// Main Sidebar component
const Sidebar = () => {
  const { user, logout } = useAuth();
  const { currentTeam, isAdmin, isSME, teamMembership } = useTeam();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isManagerRole = normalizeRole(teamMembership?.role) === 'manager';
  const expanded = !collapsed;

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeMobile = () => setMobileOpen(false);

  const isExact = (path) => location.pathname === path;
  const isPrefix = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const roleLabel = (role) => {
    const normalizedRole = normalizeRole(role);
    const map = { admin: 'Admin', manager: 'Manager', member: 'Member', viewer: 'Viewer', sme: 'SME' };
    return map[normalizedRole] || role || 'Member';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* Logo row */}
      <div className={`flex items-center h-16 border-b border-gray-100 flex-shrink-0 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {expanded ? (
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight">WorkTracker</span>
          </Link>
        ) : (
          <SidebarTooltip label="WorkTracker" show>
            <Link to="/">
              <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors">
                <Calendar className="w-4 h-4 text-white" />
              </div>
            </Link>
          </SidebarTooltip>
        )}
        {expanded && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Team switcher */}
      {currentTeam && (
        <div className={`border-b border-gray-100 flex-shrink-0 ${expanded ? 'px-4 py-3' : 'flex justify-center py-2'}`}>
          {expanded ? (
            <TeamSwitcher />
          ) : (
            <SidebarTooltip label={currentTeam.name} show>
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center cursor-default">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </SidebarTooltip>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {isSME() ? (
          <NavSection label="Menu" collapsed={collapsed}>
            <NavItem to="/projects" icon={FolderOpen} label="Projects" collapsed={collapsed} activeCheck={() => isPrefix('/projects')} />
            {currentTeam && (
              <NavItem to={`/teams/${currentTeam._id}/newsletters`} icon={Newspaper} label="Newsletters" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/newsletters`)} />
            )}
          </NavSection>
        ) : (
          <>
            <NavSection label="Workspace" collapsed={collapsed}>
              {currentTeam && (
                <NavItem to={`/teams/${currentTeam._id}`} icon={LayoutDashboard} label="Today" collapsed={collapsed} activeCheck={() => isExact(`/teams/${currentTeam._id}`)} />
              )}
              <NavItem to="/projects" icon={FolderOpen} label="Projects SDLC" collapsed={collapsed} activeCheck={() => isPrefix('/projects') || isPrefix(`/teams/${currentTeam?._id}/projects`)} />
              {currentTeam && (
                <NavItem to={`/teams/${currentTeam._id}/catalog`} icon={BookOpen} label="Project Catalog" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/catalog`)} />
              )}
              {currentTeam && (
                <NavItem to={`/teams/${currentTeam._id}/project-intake`} icon={FileText} label="Project Intake Form" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/project-intake`)} />
              )}
              {currentTeam && (
                <NavItem to={`/teams/${currentTeam._id}/newsletters`} icon={Newspaper} label="Newsletters" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/newsletters`)} />
              )}
            </NavSection>

            <NavSection label="Personal" collapsed={collapsed}>
              <NavItem to="/history" icon={History} label="History" collapsed={collapsed} activeCheck={() => isPrefix('/history')} />
              <NavItem to="/statistics" icon={BarChart3} label="Statistics" collapsed={collapsed} activeCheck={() => isPrefix('/statistics')} />
              {currentTeam && !isAdmin() && (
                <NavItem to={`/teams/${currentTeam._id}/bandwidth`} icon={Activity} label="My Bandwidth" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/bandwidth`)} />
              )}
            </NavSection>


            {currentTeam && isManagerRole && !isAdmin() && (
              <NavSection label="Team" collapsed={collapsed}>
                <NavItem to={`/teams/${currentTeam._id}/team-activity`} icon={Users} label="Team Activity" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/team-activity`)} />
                <NavItem to={`/teams/${currentTeam._id}/resources`} icon={Zap} label="Resources" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/resources`)} />
              </NavSection>
            )}

            {currentTeam && isAdmin() && (
              <NavSection label="Team Administration" collapsed={collapsed}>
                <NavItem to={`/teams/${currentTeam._id}/admin`} icon={Shield} label="Admin Dashboard" collapsed={collapsed} activeCheck={() => isExact(`/teams/${currentTeam._id}/admin`)} />
                <NavItem to={`/teams/${currentTeam._id}/bandwidth`} icon={Activity} label="Bandwidth" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/bandwidth`)} />
                <NavItem to={`/teams/${currentTeam._id}/resources`} icon={Zap} label="Resources" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/resources`)} />
                <NavItem to={`/teams/${currentTeam._id}/members`} icon={UserCheck} label="Team Members" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/members`)} />
                <NavItem to={`/teams/${currentTeam._id}/settings`} icon={Settings} label="Team Settings" collapsed={collapsed} activeCheck={() => isPrefix(`/teams/${currentTeam._id}/settings`)} />
              </NavSection>
            )}
          </>
        )}
      </nav>

      {/* Bottom  */}
      <div className="flex-shrink-0 border-t border-gray-100 px-2 pt-1 pb-2 space-y-0.5">
        {/* Notifications – dropdown pops RIGHT of sidebar */}
        {currentTeam && (
          <SidebarTooltip label="Notifications" show={collapsed}>
            <NotificationBell placement="right" sidebarExpanded={expanded} />
          </SidebarTooltip>
        )}

        {/* Profile */}
        <SidebarTooltip label={user?.name || 'Profile'} show={collapsed}>
          <Link
            to="/profile"
            onClick={closeMobile}
            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            {expanded && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate leading-tight">
                  {roleLabel(teamMembership?.role)}
                </p>
              </div>
            )}
          </Link>
        </SidebarTooltip>

        {/* Sign out */}
        <SidebarTooltip label="Sign out" show={collapsed}>
          <button
            onClick={handleLogout}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600 flex-shrink-0" />
            {expanded && (
              <span className="text-sm font-medium text-red-500 group-hover:text-red-600">Sign out</span>
            )}
          </button>
        </SidebarTooltip>

        {/* Expand button when collapsed */}
        {collapsed && (
          <SidebarTooltip label="Expand sidebar" show>
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-center py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </SidebarTooltip>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-white rounded-xl shadow-md border border-gray-200"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 ease-in-out flex-shrink-0 overflow-visible ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
