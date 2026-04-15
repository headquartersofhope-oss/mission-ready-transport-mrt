import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Truck, RefreshCw,
  DollarSign, BarChart3, Menu, X, LogOut, ChevronRight,
  UserCheck, Car, AlertTriangle, Navigation, ShieldCheck, Brain, MapPin, Activity
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';

const navSections = [
  {
    label: 'Dispatch',
    items: [
      { path: '/', label: 'Overview', icon: LayoutDashboard },
      { path: '/dispatch-board', label: 'Dispatch Board', icon: Truck },
      { path: '/requests', label: 'Ride Requests', icon: FileText },
    ]
  },
  {
    label: 'Drivers & Fleet',
    items: [
      { path: '/driver-board', label: 'Driver Portal', icon: Navigation },
      { path: '/drivers', label: 'Driver Management', icon: UserCheck },
      { path: '/vehicles', label: 'Vehicle Fleet', icon: Car },
    ]
  },
  {
    label: 'Clients & Programs',
    items: [
      { path: '/participants', label: 'Client Registry', icon: Users },
      { path: '/recurring', label: 'Recurring Plans', icon: RefreshCw },
      { path: '/providers', label: 'Transport Providers', icon: MapPin },
    ]
  },
  {
    label: 'Analytics & Quality',
    items: [
      { path: '/costs', label: 'Cost & Funding', icon: DollarSign },
      { path: '/incidents', label: 'Incidents', icon: AlertTriangle },
      { path: '/diagnostics', label: 'System Health', icon: Activity },
      { path: '/reports', label: 'Reports', icon: BarChart3 },
      { path: '/audit', label: 'Audit & Diagnostics', icon: ShieldCheck },
      { path: '/ai-intelligence', label: 'AI Intelligence', icon: Brain },
    ]
  },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => { if (u) setCurrentUser(u); }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 
        bg-sidebar text-sidebar-foreground
        flex flex-col border-r border-sidebar-border
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-sidebar-primary rounded-md flex items-center justify-center">
                  <Truck className="w-4 h-4 text-sidebar-primary-foreground" />
                </div>
                <h1 className="text-base font-bold tracking-tight text-white">HOH Transport</h1>
              </div>
              <p className="text-xs text-sidebar-foreground/50 mt-0.5 ml-9">Operations Platform</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-foreground/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mb-1.5">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${isActive 
                          ? 'bg-sidebar-accent text-white' 
                          : 'text-sidebar-foreground/65 hover:text-white hover:bg-sidebar-accent/50'}
                      `}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sidebar-primary' : ''}`} />
                      <span>{item.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-sidebar-primary" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          {currentUser && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-medium text-white truncate">{currentUser.full_name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{currentUser.email}</p>
              {currentUser.role && (
                <Badge variant="outline" className="mt-1 text-xs border-sidebar-border text-sidebar-foreground/60 capitalize">
                  {currentUser.role?.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          )}
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50 w-full transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 h-14 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground/60 hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="text-xs text-muted-foreground font-medium hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}