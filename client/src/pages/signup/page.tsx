import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import styles from "./page.module.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Validate email and password
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message || "Signup failed.");
      return;
    }

    if (data.user) {
      try {
        // Insert profile into the `profiles` table
        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            email: data.user.email,
          },
        ]);

        if (insertError) {
          setError(
            "Signup successful, but there was an error creating your profile. Please contact support."
          );
          console.error("Error inserting profile:", insertError.message);
          return;
        }

        setMessage("Signup successful! Please verify your email.");
      } catch (err) {
        setError("An unexpected error occurred.");
        console.error("Unexpected error:", err);
        return;
      }
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupBox}>
        <h1 className={styles.title}>הרשמה</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}
        <form onSubmit={handleSignup} className={styles.form}>
          <input
            type="email"
            placeholder="כתובת מייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          <button type="submit" className={styles.submitButton}>
            הרשם
          </button>
        </form>
        <p className={styles.loginText}>
          יש לך כבר משתמש?
          <Link to="/login" className={styles.loginLink}>
            להתחברות
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
