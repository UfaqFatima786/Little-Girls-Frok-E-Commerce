import { useState } from "react";
import { X } from "lucide-react";
import Swal from "sweetalert2";
import { useShop } from "../context/useShop";

const initialFields = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AuthModal() {
  const { authModalOpen, authenticate, closeAuthModal } = useShop();
  const [mode, setMode] = useState("login");
  const [fields, setFields] = useState(initialFields);

  if (!authModalOpen) return null;

  const isSignup = mode === "signup";

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setFields(initialFields);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = fields.name.trim();
    const email = fields.email.trim().toLowerCase();
    const password = fields.password;

    if (isSignup && !name) {
      await Swal.fire("Name required", "Please enter your name.", "warning");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await Swal.fire("Invalid email", "Please enter a valid email address.", "warning");
      return;
    }

    if (password.length < 6) {
      await Swal.fire(
        "Password too short",
        "Your password must be at least 6 characters.",
        "warning",
      );
      return;
    }

    if (isSignup && password !== fields.confirmPassword) {
      await Swal.fire(
        "Passwords don't match",
        "Please make sure both password fields match.",
        "warning",
      );
      return;
    }

    const result = await authenticate(mode, { name, email, password });

    if (!result.ok) {
      await Swal.fire(
        isSignup ? "Signup failed" : "Login failed",
        result.message,
        "error",
      );
      return;
    }

    if (result.emailConfirmationRequired) {
      await Swal.fire({
        title: "Check your email",
        text: "Confirm your email address, then log in to continue.",
        icon: "info",
        confirmButtonColor: "#d85b91",
      });
      return;
    }

    await Swal.fire({
      title: isSignup ? "Account created!" : "Welcome back!",
      text: result.action === "wishlist"
        ? "You are signed in and the item is saved to your wishlist."
        : result.action === "cart"
          ? "You are signed in and the item has been added to your cart."
          : "You are now signed in.",
      icon: "success",
      confirmButtonColor: "#d85b91",
    });
  };

  return (
    <div
      className="auth-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeAuthModal();
      }}
    >
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          className="auth-modal-close"
          type="button"
          onClick={closeAuthModal}
          aria-label="Close login form"
        >
          <X size={20} />
        </button>

        <span className="section-label">LITTLE PRINCESS CLUB</span>
        <h2 id="auth-modal-title">
          {isSignup ? "Create your account" : "Welcome back"}
        </h2>
        <p className="auth-modal-intro">
          {isSignup
            ? "Sign up to continue adding your favorites to the cart."
            : "Log in to continue adding your favorites to the cart."}
        </p>

        <div className="auth-mode-switch" aria-label="Choose login or signup">
          <button
            type="button"
            className={!isSignup ? "active" : ""}
            onClick={() => changeMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={isSignup ? "active" : ""}
            onClick={() => changeMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <label>
              Full name
              <input
                type="text"
                autoComplete="name"
                value={fields.name}
                onChange={(event) =>
                  setFields({ ...fields, name: event.target.value })
                }
                placeholder="Your name"
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={fields.email}
              onChange={(event) =>
                setFields({ ...fields, email: event.target.value })
              }
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={fields.password}
              onChange={(event) =>
                setFields({ ...fields, password: event.target.value })
              }
              placeholder="At least 6 characters"
            />
          </label>

          {isSignup && (
            <label>
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                value={fields.confirmPassword}
                onChange={(event) =>
                  setFields({ ...fields, confirmPassword: event.target.value })
                }
                placeholder="Enter password again"
              />
            </label>
          )}

          <button className="auth-submit-btn" type="submit">
            {isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="auth-modal-switch">
          {isSignup ? "Already have an account?" : "New to Little Princess?"}{" "}
          <button
            type="button"
            onClick={() => changeMode(isSignup ? "login" : "signup")}
          >
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </section>
    </div>
  );
}
