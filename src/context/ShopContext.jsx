import { createContext, useContext, useEffect, useState } from "react";

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem("lp-cart") || "[]");
  });

  const [authUser, setAuthUser] = useState(() =>
    JSON.parse(localStorage.getItem("lp-current-user") || "null"),
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);

  const [wishlist, setWishlist] = useState(() => {
    return JSON.parse(localStorage.getItem("lp-wishlist") || "[]");
  });

  useEffect(() => {
    localStorage.setItem("lp-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("lp-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addProductToCart = (product, size, quantity) => {
    setCart(prev => {
      const existing = prev.find(
        item => item.id === product.id && item.size === size
      );

      if (existing) {
        return prev.map(item =>
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { ...product, size, quantity }];
    });
  };

  const addToCart = (product, size = product.size[0], quantity = 1) => {
    if (!authUser) {
      setPendingCartItem({ product, size, quantity });
      setAuthModalOpen(true);
      return;
    }

    addProductToCart(product, size, quantity);
  };

  const authenticate = (mode, { name, email, password }) => {
    const users = JSON.parse(localStorage.getItem("lp-users") || "[]");
    const normalizedEmail = email.trim().toLowerCase();
    let user;

    if (mode === "signup") {
      if (users.some(item => item.email === normalizedEmail)) {
        return { ok: false, message: "An account with this email already exists." };
      }

      user = { name: name.trim(), email: normalizedEmail, password };
      localStorage.setItem("lp-users", JSON.stringify([...users, user]));
    } else {
      user = users.find(
        item => item.email === normalizedEmail && item.password === password,
      );

      if (!user) {
        return { ok: false, message: "Email or password is incorrect." };
      }
    }

    const sessionUser = { name: user.name, email: user.email };
    localStorage.setItem("lp-current-user", JSON.stringify(sessionUser));
    setAuthUser(sessionUser);
    setAuthModalOpen(false);

    if (pendingCartItem) {
      addProductToCart(
        pendingCartItem.product,
        pendingCartItem.size,
        pendingCartItem.quantity,
      );
      setPendingCartItem(null);
    }

    return { ok: true, user: sessionUser };
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setPendingCartItem(null);
  };

  const removeFromCart = (id, size) => {
    setCart(prev =>
      prev.filter(item => !(item.id === id && item.size === size))
    );
  };

  const updateQuantity = (id, size, quantity) => {
    if (quantity < 1) return;

    setCart(prev =>
      prev.map(item =>
        item.id === id && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const toggleWishlist = product => {
    setWishlist(prev =>
      prev.some(item => item.id === product.id)
        ? prev.filter(item => item.id !== product.id)
        : [...prev, product]
    );
  };

  const isWishlisted = id =>
    wishlist.some(item => item.id === id);

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity, 0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity, 0
  );

  return (
    <ShopContext.Provider
      value={{
        cart,
        wishlist,
        authUser,
        authModalOpen,
        authenticate,
        closeAuthModal,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        isWishlisted,
        cartCount,
        cartTotal
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
