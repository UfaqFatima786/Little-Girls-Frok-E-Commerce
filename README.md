# 🎀 Little Princess – Frock E-Commerce Website

A beautiful, modern, and responsive **Girls' Frock E-Commerce Website** built with React.js. Little Princess brings an elegant boutique shopping experience with a soft pink and white aesthetic, attractive product displays, and a user-friendly interface.

🌸 **Live Demo:** [Little Princess – Visit Website](https://little-frocks.netlify.app/)

---

## ✨ About The Project

**Little Princess Website** is a frontend e-commerce project designed for a girls' clothing boutique. The website focuses on creating a premium and delightful online shopping experience where customers can explore stylish frocks through an elegant and visually appealing interface.

The project is developed using React's component-based architecture, making the application organized, reusable, and easy to maintain.

## 🌟 Key Features

- 🎀 **Elegant Boutique Design:** Beautiful pink and white color palette.
- 👗 **Product Showcase:** Attractive presentation of girls' frocks.
- 🛍️ **Shopping Experience:** E-commerce interface designed for browsing products.
- ❤️ **Wishlist:** Dedicated functionality for managing favorite products.
- 🛒 **Shopping Cart:** Cart interface for managing selected items.
- 🔍 **Product Details:** Dedicated product information experience.
- 📱 **Responsive Layout:** Designed to provide a smooth experience across different screen sizes.
- ⚡ **Reusable Components:** Organized React components for maintainability.
- 🧭 **Page Navigation:** Smooth navigation using React Router DOM.
- ✨ **Modern Icons:** Clean interface icons using Lucide React.
- 🎞️ **GSAP Animations:** Animated home-page hero, scroll reveals, and product/category cards.
- ✨ **tsParticles Background:** Lightweight decorative particles behind the home hero.
- ♿ **Reduced Motion Support:** Animations and moving particles respect the system preference.
- ☁️ **Supabase Backend:** Supabase Auth, product catalog, per-user cart/wishlist, orders, and newsletter subscriptions.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js 19 | Frontend development |
| JavaScript (ES6+) | Application functionality |
| HTML5 | Website structure |
| CSS3 | Styling and responsive layouts |
| Vite | Development server and build tool |
| React Router DOM | Page navigation |
| Lucide React | Modern icons |
| GSAP + @gsap/react | Hero and scroll-triggered animations |
| tsParticles | Decorative hero background |
| Supabase | Authentication and persistent e-commerce data |
| Git & GitHub | Version control |

## ☁️ Supabase Setup

1. Create a Supabase project and open **Project Settings → API** (or **Connect**).
2. Copy the Project URL and the public **Publishable key** (legacy projects may show an `anon` key).
3. Copy `.env.example` to `.env.local` and set:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-publishable-or-anon-key
   ```

4. In the Supabase Dashboard, open **SQL Editor** and run `supabase/migrations/20261126000000_initial_schema.sql`.
5. Run `supabase/seed.sql` in the SQL Editor to load the existing categories and 26 products.
6. In **Authentication → URL Configuration**, add `http://localhost:5173` as a redirect URL. Add your deployed site URL there before production signup.
7. Restart the Vite server with `npm run dev`.

The app stores passwords only in Supabase Auth. The `profiles` table contains account display data (`full_name`, `email`, `phone`, `role`, and `avatar_url`), never passwords; the migration creates profiles for new Auth signups and backfills existing Auth users without changing existing profiles. Cart items, wishlists, orders, catalog, and newsletter subscriptions are stored in Supabase tables. Row Level Security restricts private records to their owner. Only the URL and public publishable/anon key belong in `.env.local`; **never put a `service_role` key in frontend code or `.env` variables prefixed with `VITE_`**.

## 🎨 Design Highlights

- Premium pink and white boutique theme.
- Soft, elegant, and feminine visual identity.
- Clean product presentation.
- User-friendly navigation.
- Modern e-commerce layout.
- Responsive design approach.

## 🌐 Live Preview

Experience the Little Princess boutique website:

**[🎀 Explore Little Princess](https://little-frocks.netlify.app/)**

## 👩‍💻 Developer

**Ufaq Fatima**

Frontend Web Developer | React.js Developer | UI Enthusiast

- 🐙 GitHub: [@UfaqFatima786](https://github.com/UfaqFatima786)
---

⭐ If you like this project, don't forget to give this repository a star!

💗 *Made with creativity, passion, and React.js.*
