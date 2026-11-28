
import { useCallback, useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import Swal from "../../lib/alerts";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../utils";

export default function Subscribers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (row) => {
    const { isConfirmed } = await Swal.fire({
      title: "Remove subscriber?",
      text: row.email,
      icon: "warning",
      showCancelButton: true,
    });

    if (!isConfirmed) return;

    const { error: deleteError } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", row.id);

    if (deleteError) {
      Swal.fire("Failed", deleteError.message, "error");
    } else {
      await Swal.fire("Removed!", "Subscriber removed successfully.", "success");
      load();
    }
  };

  const exportCsv = () => {
    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      "email,subscribed_at",
      ...rows.map((r) =>
        `${escapeCsv(r.email)},${escapeCsv(r.created_at)}`
      ),
    ].join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="adm-row">
        <h1 className="adm-title">Newsletter</h1>

        <button
          className="adm-btn ghost"
          onClick={exportCsv}
          disabled={!rows.length}
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {loading ? (
        <p className="adm-muted">Loading…</p>
      ) : (
        <div className="adm-card adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Subscribed</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td>{formatDate(r.created_at)}</td>
                  <td className="adm-actions">
                    <button
                      className="adm-icon-btn danger"
                      onClick={() => remove(r)}
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan="3" className="adm-muted">
                    No subscribers yet.
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
