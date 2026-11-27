
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useShop } from "../context/useShop";
import Swal from "sweetalert2";

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const isDatabaseProduct =
    typeof product.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      product.id,
    );
  const outOfStock = product.stock !== undefined && Number(product.stock) <= 0;

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
          <img src={product.image} alt={product.name} loading="lazy" />
        </Link>

        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}

        <button
          className={`wishlist-btn ${isWishlisted(product.id) ? "liked" : ""}`}
          onClick={handleToggleWishlist}
          disabled={!isDatabaseProduct}
          title={!isDatabaseProduct ? "Run supabase/seed.sql to enable this product" : "Toggle wishlist"}
          aria-label="Toggle wishlist"
        >
          <Heart
            fill={isWishlisted(product.id) ? "currentColor" : "none"}
          />
        </button>

        <button
          className="quick-add"
          onClick={handleAddToCart}
          disabled={!isDatabaseProduct || outOfStock}
          title={
            !isDatabaseProduct
              ? "Run supabase/seed.sql to enable this product"
              : undefined
          }
        >
          <ShoppingBag size={17} /> {
            !isDatabaseProduct
              ? "Setup Required"
              : outOfStock
                ? "Sold Out"
                : "Add to Cart"
          }
        </button>
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>

        <Link to={`/product/${product.id}`} className="product-name">
          {product.name}
        </Link>

        {product.rating != null && (
          <div className="rating">
            <Star size={15} fill="currentColor" />
            {product.rating}
          </div>
        )}

        <div className="product-price">
          <strong>
            Rs. {Number(product.price).toLocaleString("en-PK")}
          </strong>
          {Number(product.oldPrice) > Number(product.price) && (
            <del>
              Rs. {Number(product.oldPrice).toLocaleString("en-PK")}
            </del>
          )}
        </div>
      </div>
    </article>
  );
}
