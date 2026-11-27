import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Subscribers from "./pages/Subscribers";
import "./admin.css";

export default function AdminApp() {
  const [state, setState] = useState({ loading: true, user: null, isAdmin: false });

 
const checkRole = useCallback(async (user) => {
  if (!user) {
    setState({ loading: false, user: null, isAdmin: false });
    return;
  }

  const { data, error } = await supabase.rpc("is_admin");

  if (error) {
    console.error("Admin verification error:", error);
    setState({ loading: false, user, isAdmin: false });
    return;
  }

  setState({
    loading: false,
    user,
    isAdmin: data === true,
  });
}, []);


  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) checkRole(data.session?.user || null);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      // defer to avoid calling supabase inside the auth callback
      window.setTimeout(() => {
        if (active) checkRole(session?.user || null);
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [checkRole]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({ loading: false, user: null, isAdmin: false });
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="adm-center">
        <div className="adm-card adm-narrow">
          <h2>Supabase not configured</h2>
          <p>
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to
            your <code>.env.local</code> file and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (state.loading) {
    return <div className="adm-center"><p className="adm-muted">Loading admin…</p></div>;
  }

  return (
    <Routes>
      <Route
        path="login"
        element={
          state.isAdmin ? (
            <Navigate to="/admin" replace />
          ) : (
            <AdminLogin user={state.user} onSignOut={signOut} />
          )
        }
      />
      <Route
        element={
          state.isAdmin ? (
            <AdminLayout user={state.user} onSignOut={signOut} />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="subscribers" element={<Subscribers />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
