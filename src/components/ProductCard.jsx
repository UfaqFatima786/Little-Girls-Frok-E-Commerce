
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useShop } from "../context/useShop";
import Swal from "sweetalert2";

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useShop();

  const handleAddToCart = async () => {
    try {
      await addToCart(product);
    } catch (error) {
      await Swal.fire("Could not add item", error.message, "error");
    }
  };

  const handleToggleWishlist = async () => {
    try {
      await toggleWishlist(product);
    } catch (error) {
      await Swal.fire("Wishlist update failed", error.message, "error");
    }
  };

  return (
    <article className="product-card" data-reveal-card>
      <div className="product-image">
        <Link to={`/product/${product.id}`}>
          <img src={product.image} alt={product.name} />
        </Link>

        <span className="product-badge">{product.badge}</span>

        <button
          className={`wishlist-btn ${isWishlisted(product.id) ? "liked" : ""}`}
          onClick={handleToggleWishlist}
          aria-label="Toggle wishlist"
        >
          <Heart
            fill={isWishlisted(product.id) ? "currentColor" : "none"}
          />
        </button>

        <button
          className="quick-add"
          onClick={handleAddToCart}
        >
          <ShoppingBag size={17} /> Add to Cart
        </button>
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>

        <Link to={`/product/${product.id}`} className="product-name">
          {product.name}
        </Link>

        <div className="rating">
          <Star size={15} fill="currentColor" />
          {product.rating}
        </div>

        <div className="product-price">
          <strong>Rs. {product.price.toLocaleString("en-PK")}</strong>
          <del>Rs. {product.oldPrice.toLocaleString("en-PK")}</del>
        </div>
      </div>
    </article>
  );
}
