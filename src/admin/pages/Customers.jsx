
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatDate, money } from "../utils";

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      const [profiles, orders] = await Promise.all([
        supabase
          .from("profiless")
          .select("id,full_name,phone,created_at")
          .order("created_at", { ascending: false }),

        supabase
          .from("orders")
          .select("user_id,total_amount,order_status"),
      ]);

      if (!active) return;

      if (profiles.error || orders.error) {
        setError((profiles.error || orders.error).message);
        setLoading(false);
        return;
      }

      const stats = {};

      orders.data
        .filter((o) => o.order_status !== "cancelled")
        .forEach((o) => {
          const s = (stats[o.user_id] ||= { count: 0, spent: 0 });
          s.count++;
          s.spent += Number(o.total_amount);
        });

      setRows(
        profiles.data.map((p) => ({
          ...p,
          ...(stats[p.id] || { count: 0, spent: 0 }),
        }))
      );

      setLoading(false);
    }

    loadCustomers();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <h1 className="adm-title">Customers</h1>

      {error && <p className="adm-error">{error}</p>}

      {loading ? (
        <p className="adm-muted">Loading…</p>
      ) : (
        <div className="adm-card adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Spent</th>
                <th>Joined</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.full_name || "Customer"}</b></td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.count}</td>
                  <td>{money(c.spent)}</td>
                  <td>{formatDate(c.created_at)}</td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" className="adm-muted">
                    No customers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
