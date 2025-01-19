import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import TextInputWithDangerScore from "./components/Algorithm/page.tsx";
import Bot from './components/Chatbot/page.tsx';
import Login from './pages/login/page.tsx';
import Signup from './pages/signup/page.tsx';
import ProtectedRoute from './components/ProtectedRoute';
import styles from './styles/App.module.css';
import projectLogo from './assets/project-logo.png';
import { motion } from 'framer-motion';
import HomePage from './pages/homePage/homePage';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
      setLoading(false);

      // Set up auth state listener
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    };

    fetchSession();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const isHomePage = location.pathname === "/";

  const mainClassName = isHomePage
    ? `${styles.main} ${styles.homePageMain}`
    : `${styles.main} ${styles.nonHomePageMain}`;

  return (
    <div className={styles.app}>
      {!isHomePage && (
        <header className={styles.appHeader}>
          <img src={projectLogo} alt="Logo" className={styles.appLogo} />
          <nav className={styles.appNav}>
            {!user ? (
              <h1 className={styles.appName}>SafeSpace</h1>
            ) : (
              <div className={styles.navLinks}>
                <Link to="/algorithm" className={styles.appLink}>Algorithm</Link>
                <Link to="/chatbot" className={styles.appLink}>Chatbot</Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                  }}
                  className={styles.logoutButton}
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        </header>
      )}

      <main className={mainClassName}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" /> : <Signup />}
          />

          {/* Protected Routes */}
          <Route
            path="/algorithm"
            element={
              <ProtectedRoute>
                <TextInputWithDangerScore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute>
                <Bot />
              </ProtectedRoute>
            }
          />

          {/* Home Page (Protected) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Route */}
          <Route
            path="*"
            element={user ? <Navigate to="/" /> : <Navigate to="/login" />}
          />
        </Routes>
      </main>

      {!isHomePage && (
        <motion.footer
          className={styles.footer}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1,
          }}
        >
          <div className={styles.footerContent}>
            <p>&copy; Safety Checker App</p>
            <motion.button
              onClick={() =>
                window.open(
                  '/BeSafe Hackathon 2025/MyProject.html',
                  '_blank',
                  'noopener,noreferrer'
                )
              }
              className={styles.portalButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Learning Portal
            </motion.button>
          </div>
        </motion.footer>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
