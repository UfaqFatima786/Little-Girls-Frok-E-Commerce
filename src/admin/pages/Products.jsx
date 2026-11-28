import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import Swal from "../../lib/alerts";
import { supabase } from "../../lib/supabase";
import { money } from "../utils";

const BUCKET = "product-images";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "0",
  image_url: "",
  is_active: true,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | product
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products],
  );

  const filtered = products.filter((p) =>
    `${p.name} ${p.category || ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const openNew = () => {
    setForm(emptyForm);
    setEditing("new");
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      category: product.category || "",
      stock: String(product.stock),
      image_url: product.image_url || "",
      is_active: product.is_active !== false,
    });
    setEditing(product);
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire("Invalid file", "Please choose an image file.", "warning");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Too large", "Image must be under 5 MB.", "warning");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });
    setUploading(false);

    if (uploadError) {
      Swal.fire("Upload failed", uploadError.message, "error");
      return;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setField("image_url", data.publicUrl);
  };

  const save = async (event) => {
    event.preventDefault();
    const price = Number(form.price);
    const stock = Number.parseInt(form.stock, 10);

    if (!form.name.trim()) return Swal.fire("Name required", "", "warning");
    if (!(price >= 0)) return Swal.fire("Invalid price", "", "warning");
    if (!(stock >= 0)) return Swal.fire("Invalid stock", "", "warning");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      category: form.category.trim() || null,
      stock,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    const { error: saveError } =
      editing === "new"
        ? await supabase.from("products").insert(payload)
        : await supabase.from("products").update(payload).eq("id", editing.id);
    setSaving(false);

    if (saveError) {
      Swal.fire("Save failed", saveError.message, "error");
      return;
    }
    setEditing(null);
    await load();
  };

  const toggleActive = async (product) => {
    const { error: toggleError } = await supabase
      .from("products")
      .update({ is_active: !product.is_active, updated_at: new Date().toISOString() })
      .eq("id", product.id);
    if (toggleError) Swal.fire("Update failed", toggleError.message, "error");
    else load();
  };

  const remove = async (product) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete product?",
      text: `"${product.name}" will be removed permanently. Past orders keep their details.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    if (!isConfirmed) return;

    const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id);
    if (deleteError) Swal.fire("Delete failed", deleteError.message, "error");
    else load();
  };

  return (
    <>
      <div className="adm-row">
        <h1 className="adm-title">Products</h1>
        <button className="adm-btn" onClick={openNew}><Plus size={16} /> Add product</button>
      </div>

      <div className="adm-search">
        <Search size={16} />
        <input
          placeholder="Search by name or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="adm-error">{error}</p>}
      {loading ? (
        <p className="adm-muted">Loading…</p>
      ) : (
        <div className="adm-card adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="adm-product">
                      {p.image_url ? <img src={p.image_url} alt="" /> : <div className="adm-noimg" />}
                      <b>{p.name}</b>
                    </div>
                  </td>
                  <td>{p.category || "—"}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    <span className={`adm-badge ${p.stock === 0 ? "cancelled" : p.stock <= 3 ? "pending" : "delivered"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    <label className="adm-switch">
                      <input type="checkbox" checked={p.is_active !== false} onChange={() => toggleActive(p)} />
                      <span />
                    </label>
                  </td>
                  <td className="adm-actions">
                    <button className="adm-icon-btn" onClick={() => openEdit(p)} aria-label="Edit"><Pencil size={16} /></button>
                    <button className="adm-icon-btn danger" onClick={() => remove(p)} aria-label="Delete"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="adm-muted">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="adm-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}>
          <form className="adm-modal" onSubmit={save}>
            <div className="adm-card-head">
              <h3>{editing === "new" ? "Add product" : "Edit product"}</h3>
              <button type="button" className="adm-icon-btn" onClick={() => setEditing(null)} aria-label="Close"><X size={18} /></button>
            </div>

            <label className="adm-field">
              <span>Name *</span>
              <input value={form.name} onChange={(e) => setField("name", e.target.value)} required />
            </label>

            <label className="adm-field">
              <span>Description</span>
              <textarea rows="3" value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </label>

            <div className="adm-form-grid">
              <label className="adm-field">
                <span>Price (Rs.) *</span>
                <input type="number" min="0" step="1" value={form.price} onChange={(e) => setField("price", e.target.value)} required />
              </label>
              <label className="adm-field">
                <span>Stock *</span>
                <input type="number" min="0" step="1" value={form.stock} onChange={(e) => setField("stock", e.target.value)} required />
              </label>
            </div>

            <label className="adm-field">
              <span>Category</span>
              <input list="adm-categories" value={form.category} onChange={(e) => setField("category", e.target.value)} />
              <datalist id="adm-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>

            <div className="adm-field">
              <span>Image</span>
              <div className="adm-image-row">
                {form.image_url ? <img src={form.image_url} alt="" /> : <div className="adm-noimg big" />}
                <div className="adm-image-inputs">
                  <input
                    placeholder="Paste image URL…"
                    value={form.image_url}
                    onChange={(e) => setField("image_url", e.target.value)}
                  />
                  <label className="adm-btn ghost">
                    <Upload size={15} /> {uploading ? "Uploading…" : "Upload image"}
                    <input type="file" accept="image/*" hidden onChange={uploadImage} disabled={uploading} />
                  </label>
                </div>
              </div>
            </div>

            <label className="adm-check">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setField("is_active", e.target.checked)} />
              Visible in store
            </label>

            <div className="adm-modal-foot">
              <button type="button" className="adm-btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="adm-btn" disabled={saving || uploading}>{saving ? "Saving…" : "Save product"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
