import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { ShopContext } from "./shopContext.js";

const loadLocalProducts = async () => (await import("../data/products.js")).default;
const loadLocalCategories = async () =>
  (await import("../data/categories.js")).default;

const mapProduct = (product) => ({
  ...product,
  oldPrice: product.old_price,
  size: product.sizes,
});

const mapCartRow = (row) => ({
  ...mapProduct(row.products),
  size: row.size,
  quantity: row.quantity,
});

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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
    const [productsResult, categoriesResult] = await Promise.all([
      supabase.from("products").select("*").order("id"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);

    if (productsResult.error) throw productsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;

    const catalogProducts = productsResult.data || [];
    const catalogCategories = categoriesResult.data || [];

    if (catalogProducts.length === 0) {
      setProducts(await loadLocalProducts());
      setCategories(
        catalogCategories.length ? catalogCategories : await loadLocalCategories(),
      );
      setShopError(
        "Your Supabase catalog is empty. Showing the saved local products temporarily; run supabase/seed.sql to load them into the database.",
      );
      return;
    }

    setProducts(catalogProducts.map(mapProduct));
    setCategories(
      catalogCategories.length ? catalogCategories : await loadLocalCategories(),
    );
  };

  const loadUserData = async (userId) => {
    const [cartResult, wishlistResult, profileResult] = await Promise.all([
      supabase
        .from("cart_items")
        .select("product_id,size,quantity,products(*)")
        .eq("user_id", userId),
      supabase
        .from("wishlist_items")
        .select("product_id,products(*)")
        .eq("user_id", userId),
      supabase
        .from("profiles")
        .select("id,full_name,email,phone,role,avatar_url")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    if (cartResult.error) throw cartResult.error;
    if (wishlistResult.error) throw wishlistResult.error;
    if (profileResult.error) throw profileResult.error;

    setCart((cartResult.data || []).map(mapCartRow));
    setProfile(profileResult.data);
    setWishlist(
      (wishlistResult.data || [])
        .filter((row) => row.products)
        .map((row) => mapProduct(row.products)),
    );
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

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
            setCategories(await loadLocalCategories());
            setShopError(
              "Supabase tables are not set up yet. Showing the saved local catalog for now; run the schema and seed SQL to enable Supabase data.",
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

  const executePendingAction = async (userId, action) => {
    if (action.type === "cart") {
      const { error } = await supabase.rpc("add_to_cart", {
        p_product_id: action.product.id,
        p_size: action.size,
        p_quantity: action.quantity,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("wishlist_items").upsert(
        { user_id: userId, product_id: action.product.id },
        { onConflict: "user_id,product_id", ignoreDuplicates: true },
      );
      if (error) throw error;
    }
  };

  const addToCart = async (product, size = product.size[0], quantity = 1) => {
    if (!authUser) {
      setPendingAction({ type: "cart", product, size, quantity });
      setAuthModalOpen(true);
      return false;
    }

    const { error } = await supabase.rpc("add_to_cart", {
      p_product_id: product.id,
      p_size: size,
      p_quantity: quantity,
    });
    if (error) throw error;
    await loadUserData(authUser.id);
    return true;
  };

  const toggleWishlist = async (product) => {
    if (!authUser) {
      setPendingAction({ type: "wishlist", product });
      setAuthModalOpen(true);
      return false;
    }

    const alreadyWishlisted = wishlist.some((item) => item.id === product.id);
    const result = alreadyWishlisted
      ? await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", authUser.id)
          .eq("product_id", product.id)
      : await supabase.from("wishlist_items").insert({
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
        setPendingAction(null);
      }
      setAuthModalOpen(false);
      return { ok: true, user, action: pendingAction?.type || null };
    } catch (error) {
      return { ok: false, message: error.message, authenticated: true };
    }
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setPendingAction(null);
  };

  const removeFromCart = async (id, size) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", authUser.id)
      .eq("product_id", id)
      .eq("size", size);
    if (error) throw error;
    await loadUserData(authUser.id);
  };

  const updateQuantity = async (id, size, quantity) => {
    if (quantity < 1) return;

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("user_id", authUser.id)
      .eq("product_id", id)
      .eq("size", size);
    if (error) throw error;
    await loadUserData(authUser.id);
  };

  const placeOrder = async (form, paymentMethod, deliveryFee) => {
    const { data, error } = await supabase.rpc("place_order", {
      p_customer_name: form.name,
      p_customer_email: form.email,
      p_phone: form.phone,
      p_address: form.address,
      p_city: form.city,
      p_payment_method: paymentMethod,
      p_delivery_fee: deliveryFee,
      p_items: cart.map((item) => ({
        product_id: item.id,
        size: item.size,
        quantity: item.quantity,
      })),
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
  };

  const isWishlisted = (id) => wishlist.some((item) => item.id === id);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
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
