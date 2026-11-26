
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ShoppingBag, Star, ArrowLeft } from "lucide-react";
import { useShop } from "../context/useShop";
import Swal from "sweetalert2";

export default function ProductDetails() {
  const { id } = useParams();
  const { products, shopLoading, shopError, addToCart, toggleWishlist, isWishlisted } = useShop();
  const product = products.find(p => p.id === Number(id));

  const [selectedSize, setSelectedSize] = useState(null);
  const size =
    selectedSize?.productId === product?.id
      ? selectedSize.size
      : product?.size[0] || "";
  const [quantity, setQuantity] = useState(1);

  if (shopLoading) {
    return <div className="empty-state"><p>Loading product…</p></div>;
  }

  if (shopError || !product) {
    return (
      <div className="empty-state">
        <h2>{shopError || "Product not found!"}</h2>
        <Link to="/shop" className="primary-btn">Back to Shop</Link>
      </div>
    );
  }

  const handleAdd = async () => {
    try {
      await addToCart(product, size, quantity);
    } catch (error) {
      await Swal.fire("Could not add item", error.message, "error");
    }
  };

  const handleWishlist = async () => {
    try {
      await toggleWishlist(product);
    } catch (error) {
      await Swal.fire("Wishlist update failed", error.message, "error");
    }
  };

  return (
    <main className="details-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / {product.name}
      </div>

      <section className="details-layout">
        <div className="details-image">
          <img src={product.image} alt={product.name} />
          <span className="product-badge">{product.badge}</span>
        </div>

        <div className="details-info">
          <span className="section-label">{product.category}</span>
          <h1>{product.name}</h1>

          <div className="rating">
            <Star size={17} fill="currentColor" />
            {product.rating} / 5
          </div>

          <div className="details-price">
            Rs. {product.price.toLocaleString("en-PK")}
            <del>Rs. {product.oldPrice.toLocaleString("en-PK")}</del>
          </div>

          <p className="details-description">{product.description}</p>

          <div className="size-selector">
            <h3>Select Size</h3>
            <div className="size-options">
              {product.size.map(item => (
                <button
                  key={item}
                  className={size === item ? "size-btn active" : "size-btn"}
                  onClick={() =>
                    setSelectedSize({ productId: product.id, size: item })
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="quantity-selector">
            <h3>Quantity</h3>
            <div className="quantity-control">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)}>+</button>
            </div>
          </div>

          <div className="details-actions">
            <button className="primary-btn" onClick={handleAdd}>
              <ShoppingBag size={19} /> Add to Cart
            </button>

            <button
              className={`details-wishlist ${isWishlisted(product.id) ? "liked" : ""}`}
              onClick={handleWishlist}
              aria-label="Toggle wishlist"
            >
              <Heart fill={isWishlisted(product.id) ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="product-meta">
            <p>Category: {product.category}</p>
            <p>Color: {product.color}</p>
            <p>Product ID: LP-{product.id}</p>
          </div>

          <Link to="/shop" className="back-link">
            <ArrowLeft size={17} /> Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
