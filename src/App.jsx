import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ShopProvider } from "./context/ShopContext.jsx";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import AdminApp from "./admin/AdminApp";

function Shell() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>

      {!isAdmin && <AuthModal />}
      {!isAdmin && <Footer />}
    </>
  );
}

function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </ShopProvider>
  );
}

export default App;
