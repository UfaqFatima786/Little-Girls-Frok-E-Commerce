import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, Package, ShoppingCart, Users, TriangleAlert, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { formatDate, money } from "../utils";

const LOW_STOCK = 3;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const [orders, products, customers] = await Promise.all([
        supabase
          .from("orders")
          .select("id,full_name,total_amount,order_status,created_at")
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase.from("products").select("id,name,stock,is_active"),
        supabase.from("profiless").select("id", { count: "exact", head: true }),
      ]);
      if (!active) return;
      const failed = orders.error || products.error || customers.error;
      if (failed) {
        setError(failed.message);
        return;
      }
      setData({
        orders: orders.data,
        products: products.data,
        customers: customers.count || 0,
      });
    })();
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="adm-error">{error}</p>;
  if (!data) return <p className="adm-muted">Loading…</p>;

  const { orders, products, customers } = data;
  const revenue = orders
    .filter((o) => o.order_status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pending = orders.filter((o) => o.order_status === "pending").length;
  const lowStock = products.filter((p) => p.stock <= LOW_STOCK);

  const stats = [
    { label: "Revenue", value: money(revenue), icon: DollarSign },
    { label: "Orders", value: orders.length, icon: ShoppingCart },
    { label: "Pending orders", value: pending, icon: Clock },
    { label: "Products", value: products.length, icon: Package },
    { label: "Customers", value: customers, icon: Users },
    { label: "Low stock", value: lowStock.length, icon: TriangleAlert },
  ];

  return (
    <>
      <h1 className="adm-title">Dashboard</h1>

      <div className="adm-stats">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="adm-stat" key={label}>
            <Icon size={20} />
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head">
            <h3>Recent orders</h3>
            <Link to="/admin/orders" className="adm-link">View all</Link>
          </div>
          {orders.length === 0 ? (
            <p className="adm-muted">No orders yet.</p>
          ) : (
            <table className="adm-table">
              <tbody>
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td>
                      <b>{o.full_name}</b>
                      <br />
                      <small className="adm-muted">{formatDate(o.created_at)}</small>
                    </td>
                    <td>{money(o.total_amount)}</td>
                    <td><span className={`adm-badge ${o.order_status}`}>{o.order_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <h3>Low stock (≤ {LOW_STOCK})</h3>
            <Link to="/admin/products" className="adm-link">Manage</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="adm-muted">All products are well stocked.</p>
          ) : (
            <table className="adm-table">
              <tbody>
                {lowStock.slice(0, 8).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      <span className={`adm-badge ${p.stock === 0 ? "cancelled" : "pending"}`}>
                        {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
