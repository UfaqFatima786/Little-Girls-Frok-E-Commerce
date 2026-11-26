import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { ShopContext } from "./shopContext.js";
import localCategories from "../data/categories.js";

const loadLocalProducts = async () => (await import("../data/products.js")).default;

const mapProduct = (product) => ({
  ...product,
  oldPrice: Number(product.price),
  image: product.image_url || "",
  badge: product.stock > 0 ? "In Stock" : "Sold Out",
  rating: null,
  size: [],
});

const mapCartRow = (row) => ({
  ...mapProduct(row.products),
  quantity: row.quantity,
});

const isDatabaseProduct = (product) =>
  typeof product?.id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    product.id,
  );

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(localCategories);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [shopLoading, setShopLoading] = useState(isSupabaseConfigured);
  const [shopError, setShopError] = useState(
    isSupabaseConfigured
      ? ""
      : "Supabase is not configured. Add the project URL and publishable key to .env.local.",
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const loadCatalog = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,description,price,category,image_url,stock,is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data?.length) {
      setProducts(await loadLocalProducts());
      setShopError(
        "Supabase products table is empty. Showing the original catalog; run supabase/seed.sql to load all products and images.",
      );
      return;
    }

    setProducts(data.map(mapProduct));
  };

  const loadUserData = async (userId) => {
    const [cartResult, wishlistResult, profileResult] = await Promise.all([
      supabase
        .from("cart_items")
        .select("product_id,quantity,products(*)")
        .eq("user_id", userId),
      supabase
        .from("wishlist")
        .select("product_id,products(*)")
        .eq("user_id", userId),
      supabase
        .from("profiless")
        .select("id,full_name,email,phone,role,avatar_url")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    if (cartResult.error) throw cartResult.error;
    if (wishlistResult.error) throw wishlistResult.error;
    if (profileResult.error) throw profileResult.error;

    setCart((cartResult.data || []).filter((row) => row.products).map(mapCartRow));
    setWishlist(
      (wishlistResult.data || [])
        .filter((row) => row.products)
        .map((row) => mapProduct(row.products)),
    );
    setProfile(profileResult.data);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let active = true;
    let subscription;

    const initialize = async () => {
      try {
        await loadCatalog();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          setAuthUser(data.session.user);
          await loadUserData(data.session.user.id);
        }
      } catch (error) {
        if (active) {
          if (
            error.code === "PGRST205" ||
            error.message?.includes("Could not find the table")
          ) {
            setProducts(await loadLocalProducts());
            setShopError(
              "Supabase products table is not ready. Showing the original catalog; run supabase/seed.sql after creating the tables.",
            );
          } else {
            setShopError(error.message);
          }
        }
      } finally {
        if (active) {
          setShopLoading(false);
          setAuthLoading(false);
        }
      }

      if (!active) return;

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active || event === "INITIAL_SESSION") return;

        const user = session?.user || null;
        setAuthUser(user);
        setCart([]);
        setWishlist([]);
        setProfile(null);

        if (user) {
          window.setTimeout(() => {
            if (active) {
              loadUserData(user.id).catch((error) => {
                if (active) setShopError(error.message);
              });
            }
          }, 0);
        }
      });

      subscription = data.subscription;
    };

    initialize();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

    const persistCartItem = async (product, quantity) => {
      const { error } = await supabase.rpc("add_to_cart", {
        p_product_id: product.id,
        p_quantity: quantity,
      });
    if (error) throw error;
  };

  const executePendingAction = async (userId, action) => {
    if (action.type === "cart") {
        await persistCartItem(action.product, action.quantity);
      return;
    }

    const { error } = await supabase.from("wishlist").upsert(
      { user_id: userId, product_id: action.product.id },
      { onConflict: "user_id,product_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  };

  const addToCart = async (product, _size, quantity = 1) => {
    if (!isDatabaseProduct(product)) {
      throw new Error(
        "This product is not in Supabase yet. Run supabase/seed.sql, then refresh the page.",
      );
    }

    if (!authUser) {
      setPendingAction({ type: "cart", product, quantity });
      setAuthModalOpen(true);
      return false;
    }

    await persistCartItem(product, quantity);
    await loadUserData(authUser.id);
    return true;
  };

  const toggleWishlist = async (product) => {
    if (!isDatabaseProduct(product)) {
      throw new Error(
        "This product is not in Supabase yet. Run supabase/seed.sql, then refresh the page.",
      );
    }

    if (!authUser) {
      setPendingAction({ type: "wishlist", product });
      setAuthModalOpen(true);
      return false;
    }

    const alreadyWishlisted = wishlist.some((item) => item.id === product.id);
    const result = alreadyWishlisted
      ? await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", authUser.id)
          .eq("product_id", product.id)
      : await supabase.from("wishlist").insert({
          user_id: authUser.id,
          product_id: product.id,
        });

    if (result.error) throw result.error;
    await loadUserData(authUser.id);
    return true;
  };

  const authenticate = async (mode, { name, email, password }) => {
    if (!supabase) {
      return {
        ok: false,
        message: "Add your Supabase URL and publishable key to .env.local first.",
      };
    }

    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name.trim() } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) return { ok: false, message: result.error.message };

    if (!result.data.session) {
      return { ok: true, emailConfirmationRequired: true };
    }

    const user = result.data.session.user;
    setAuthUser(user);

    try {
      await loadUserData(user.id);
      if (pendingAction) {
        await executePendingAction(user.id, pendingAction);
        await loadUserData(user.id);
        const action = pendingAction.type;
        setPendingAction(null);
        setAuthModalOpen(false);
        return { ok: true, user, action };
      }
      setAuthModalOpen(false);
      return { ok: true, user, action: null };
    } catch (error) {
      return { ok: false, message: error.message, authenticated: true };
    }
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setPendingAction(null);
  };

  const removeFromCart = async (productId) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", authUser.id)
      .eq("product_id", productId);
    if (error) throw error;
    await loadUserData(authUser.id);
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq("user_id", authUser.id)
      .eq("product_id", productId);
    if (error) throw error;
    await loadUserData(authUser.id);
  };

  const placeOrder = async (form, _paymentMethod, _deliveryFee) => {
    const { data, error } = await supabase.rpc("place_order", {
      p_full_name: form.name,
      p_email: form.email,
      p_phone: form.phone,
      p_address_line: form.address,
      p_city: form.city,
      p_state: form.state || null,
      p_postal_code: form.postalCode || null,
      p_country: form.country || "Pakistan",
      p_notes: form.notes || null,
    });

    if (error) throw error;
    await loadUserData(authUser.id);
    return data;
  };

  const subscribeNewsletter = async (email) => {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email: email.trim().toLowerCase() },
        { onConflict: "email", ignoreDuplicates: true },
      );
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setAuthUser(null);
    setCart([]);
    setWishlist([]);
    setProfile(null);
  };

  const isWishlisted = (id) => wishlist.some((item) => item.id === id);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        cart,
        wishlist,
        authUser,
        profile,
        authLoading,
        authModalOpen,
        shopLoading,
        shopError,
        authenticate,
        closeAuthModal,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        isWishlisted,
        placeOrder,
        subscribeNewsletter,
        signOut,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};
