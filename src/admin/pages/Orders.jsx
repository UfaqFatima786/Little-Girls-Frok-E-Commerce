import { useCallback, useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import Swal from "../../lib/alerts";
import { supabase } from "../../lib/supabase";
import { formatDate, money, ORDER_STATUSES, PAYMENT_STATUSES } from "../utils";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ order_status: "pending", payment_status: "pending" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (order) => {
    setSelected(order);
    setItems([]);
    setDraft({ order_status: order.order_status, payment_status: order.payment_status });
    const { data, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    if (itemsError) Swal.fire("Could not load items", itemsError.message, "error");
    else setItems(data);
  };

  const save = async () => {
    setSaving(true);
    const { error: rpcError } = await supabase.rpc("admin_update_order", {
      p_order_id: selected.id,
      p_order_status: draft.order_status,
      p_payment_status: draft.payment_status,
    });
    setSaving(false);
    if (rpcError) {
      Swal.fire("Update failed", rpcError.message, "error");
      return;
    }
    setSelected(null);
    await load();
  };

  const shown = filter === "all" ? orders : orders.filter((o) => o.order_status === filter);

  return (
    <>
      <h1 className="adm-title">Orders</h1>

      <div className="adm-tabs">
        {["all", ...ORDER_STATUSES].map((s) => (
          <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>
            {s} {s === "all" ? `(${orders.length})` : `(${orders.filter((o) => o.order_status === s).length})`}
          </button>
        ))}
      </div>

      {error && <p className="adm-error">{error}</p>}
      {loading ? (
        <p className="adm-muted">Loading…</p>
      ) : (
        <div className="adm-card adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>City</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id.slice(0, 8)}</td>
                  <td><b>{o.full_name}</b><br /><small className="adm-muted">{o.phone}</small></td>
                  <td>{o.city}</td>
                  <td>{money(o.total_amount)}</td>
                  <td><span className={`adm-badge ${o.payment_status}`}>{o.payment_method} · {o.payment_status}</span></td>
                  <td><span className={`adm-badge ${o.order_status}`}>{o.order_status}</span></td>
                  <td>{formatDate(o.created_at)}</td>
                  <td className="adm-actions">
                    <button className="adm-icon-btn" onClick={() => open(o)} aria-label="View order"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan="8" className="adm-muted">No orders.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="adm-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="adm-modal">
            <div className="adm-card-head">
              <h3>Order #{selected.id.slice(0, 8)}</h3>
              <button className="adm-icon-btn" onClick={() => setSelected(null)} aria-label="Close"><X size={18} /></button>
            </div>

            <p className="adm-muted">{formatDate(selected.created_at)}</p>

            <div className="adm-detail">
              <b>{selected.full_name}</b>
              <span>{selected.phone}{selected.email ? ` · ${selected.email}` : ""}</span>
              <span>
                {[selected.address_line, selected.city, selected.state, selected.postal_code, selected.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
              {selected.notes && <span><i>Note:</i> {selected.notes}</span>}
            </div>

            <table className="adm-table">
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <div className="adm-product">
                        {it.product_image ? <img src={it.product_image} alt="" /> : <div className="adm-noimg" />}
                        {it.product_name}
                      </div>
                    </td>
                    <td>{it.quantity} × {money(it.unit_price)}</td>
                    <td>{money(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="adm-totals">
              <span>Subtotal <b>{money(selected.subtotal)}</b></span>
              <span>Shipping <b>{money(selected.shipping_fee)}</b></span>
              <span>Total <b>{money(selected.total_amount)}</b></span>
            </div>

            <div className="adm-form-grid">
              <label className="adm-field">
                <span>Order status</span>
                <select value={draft.order_status} onChange={(e) => setDraft({ ...draft, order_status: e.target.value })}>
                  {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="adm-field">
                <span>Payment status</span>
                <select value={draft.payment_status} onChange={(e) => setDraft({ ...draft, payment_status: e.target.value })}>
                  {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <p className="adm-muted adm-small">Cancelling an order automatically returns its items to stock.</p>

            <div className="adm-modal-foot">
              <button className="adm-btn ghost" onClick={() => setSelected(null)}>Close</button>
              <button className="adm-btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Update order"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
