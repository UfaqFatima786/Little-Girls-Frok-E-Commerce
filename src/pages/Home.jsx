import { lazy, Suspense, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import products from "../data/products";
import ProductCard from "../components/ProductCard";
import CategoryCard from "../components/CategoryCard";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ParticleBackground = lazy(
  () => import("../components/ParticleBackground"),
);

const categories = [
  {
    name: "Party Wear",
    subtitle: "For special celebrations",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz7UDLo__ANzfDGbE24ywskRX_heQEeTUZMfSaisQg1g&s=10",
  },
  {
    name: "Casual Wear",
    subtitle: "Comfort meets style",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzrW-G31QS2XjMdahEEEkU62Txq708fWDu6n-QI1J5Fg&s=10",
  },
  {
    name: "Birthday Wear",
    subtitle: "Make her day magical",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdqUbIasb66PBiph0GcwnSe-_tMvsMdA5m6N5tb3_9AA&s=10",
  },
];

export default function Home() {
  const homeRef = useRef(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

        intro
          .from("[data-hero-eyebrow]", { y: 18, opacity: 0, duration: 0.55 })
          .from("[data-hero-title]", { y: 28, opacity: 0, duration: 0.7 }, "-=0.25")
          .from(
            ["[data-hero-description]", "[data-hero-actions]", "[data-hero-note]"],
            { y: 18, opacity: 0, duration: 0.55, stagger: 0.12 },
            "-=0.35",
          )
          .from(
            "[data-hero-image]",
            { x: 34, opacity: 0, scale: 0.97, duration: 0.85 },
            "-=0.65",
          );

        gsap.to("[data-floating-card]", {
          y: -9,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        const revealOnScroll = (
          element,
          { trigger = element, fromY = 26, duration = 0.65, delay = 0, stagger } = {},
        ) => {
          gsap.fromTo(
            element,
            { autoAlpha: 0, y: fromY },
            {
              autoAlpha: 1,
              y: 0,
              duration,
              delay,
              stagger,
              ease: "power2.out",
              immediateRender: false,
              scrollTrigger: {
                trigger,
                start: "top 95%",
                once: true,
              },
            },
          );
        };

        gsap.utils.toArray("[data-reveal]").forEach((element) => {
          revealOnScroll(element);
        });

        gsap.utils.toArray("[data-reveal-card]").forEach((card, index) => {
          revealOnScroll(card, {
            fromY: 20,
            duration: 0.55,
            delay: (index % 4) * 0.08,
          });
        });

        gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
          revealOnScroll(Array.from(group.children), {
            trigger: group,
            fromY: 20,
            duration: 0.55,
            stagger: 0.1,
          });
        });
      });

      return () => media.revert();
    },
    { scope: homeRef },
  );

  return (
    <main ref={homeRef}>
      {/* Hero Section */}
      <section className="hero">
        <Suspense fallback={null}>
          <ParticleBackground />
        </Suspense>
        <div className="hero-content">
          <span className="eyebrow" data-hero-eyebrow>
            <Sparkles size={16} /> A LITTLE WORLD OF MAGIC
          </span>

          <h1 data-hero-title>
            Every Little Girl
            <br />
            Deserves to Feel
            <br />
            <span>Like a Princess!</span>
          </h1>

          <p data-hero-description>
            Discover adorable frocks, dreamy dresses and
            beautiful outfits made for your little one's
            sweetest moments.
          </p>

          <div className="hero-buttons" data-hero-actions>
            <Link to="/shop" className="primary-btn">
              Explore Collection <ArrowRight size={18} />
            </Link>

            <Link to="/shop" className="secondary-btn">
              Shop Now
            </Link>
          </div>

          <div className="hero-note" data-hero-note>
            <span>♡</span> Made with love for little princesses
          </div>
        </div>

        <div className="hero-image" data-hero-image>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRweCfRy-RsD02SI01aYLtfrOiryHEF9frGtPw741SrplO9KVrdzdDK29Vf&s=10"
            alt="Little Princess fashion collection"
          />

          <div className="floating-card" data-floating-card>
            <span>✨ New Collection</span>
            <strong>Dreamy Dresses</strong>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits" data-reveal-group>
        <div>♡ <span>Beautiful Designs</span></div>
        <div>✦ <span>Premium Quality</span></div>
        <div>♧ <span>Comfortable Fits</span></div>
        <div>♡ <span>Made for Memories</span></div>
      </section>

      {/* Categories Section */}
      <section className="section categories-section" id="categories">
        <div className="section-heading" data-reveal>
          <span className="section-label">
            EXPLORE OUR COLLECTION
          </span>

          <h2>
            Shop by <span>Category</span>
          </h2>

          <p>
            Find the perfect outfit for every little occasion.
          </p>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <CategoryCard
              key={category.name}
              category={category}
            />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section featured-section">
        <div className="section-heading" data-reveal>
          <span className="section-label">
            HANDPICKED WITH LOVE
          </span>

          <h2>
            Our <span>Best Sellers</span>
          </h2>

          <p>
            Our most loved styles for your little princess.
          </p>
        </div>

        <div className="product-grid">
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>

        <div className="center-button">
          <Link to="/shop" className="outline-btn">
            View All Products <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* About / Promo Section */}
      <section className="promo-section" id="about" data-reveal>
        <div>
          <span className="section-label">
            A BOUTIQUE FULL OF LOVE
          </span>

          <h2>
            Little Outfits.
            <br />
            Big Happy Memories.
          </h2>

          <p>
            At Little Princess, we believe every childhood
            moment deserves a beautiful outfit. Discover
            styles made to bring smiles and sparkle.
          </p>

          <Link to="/shop" className="primary-btn">
            Discover More <ArrowRight size={18} />
          </Link>
        </div>

        <div className="promo-image">
          <img
            src={products[2].image}
            alt="Lavender princess dress from our collection"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter" id="contact" data-reveal>
        <span className="section-label">
          STAY IN THE LOOP
        </span>

        <h2>
          Join Our Little <span>Princess Club</span>
        </h2>

        <p>
          Be the first to discover new collections and special offers.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Thank you for joining Little Princess!");
            e.target.reset();
          }}
        >
          <input
            type="email"
            placeholder="Enter your email address"
            required
          />

          <button type="submit">
            Subscribe
          </button>
        </form>
      </section>
    </main>
  );
}