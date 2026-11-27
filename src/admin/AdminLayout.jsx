import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  Crown, LayoutDashboard, Package, ShoppingCart, Users, Mail, LogOut, Store, Menu, X,
} from "lucide-react";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/subscribers", label: "Newsletter", icon: Mail },
];

export default function AdminLayout({ user, onSignOut }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="adm-shell">
      <aside className={open ? "adm-sidebar open" : "adm-sidebar"}>
        <div className="adm-brand">
          <Crown size={24} />
          <span>Little <b>Princess</b></span>
          <small>Admin</small>
        </div>

        <nav className="adm-nav">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          <Link to="/" className="adm-sidebar-link"><Store size={18} /> View store</Link>
          <button className="adm-sidebar-link" onClick={onSignOut}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-icon-btn adm-menu" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="adm-user">{user?.email}</span>
        </header>
        <main className="adm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
