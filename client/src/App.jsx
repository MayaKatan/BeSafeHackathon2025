import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import TextInputWithDangerScore from "./components/Algorithm/page.tsx";
import Bot from './components/Chatbot/page.tsx';
import Login from './pages/login/page.tsx';
import Signup from './pages/signup/page.tsx';
import ProtectedRoute from './components/ProtectedRoute';
import styles from './styles/App.module.css';
import projectLogo from './assets/project-logo.png';
import { motion } from 'framer-motion';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <BrowserRouter>
      <div className={styles.app}>
        <header className={styles.appHeader}>
          <img src={projectLogo} alt="Logo" className={styles.appLogo} />
          <nav className={styles.appNav}>
            {!user ? (
              <div className={styles.authLinks}>
              </div>
            ) : (
              <div className={styles.navLinks}>
                <Link to="/algorithm" className={styles.appLink}>Home</Link>
                {' '}
                <Link to="/chatbot" className={styles.appLink}>Chatbot</Link>
                {' '}
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
        <main className={styles.main}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={user ? <Navigate to="/algorithm" /> : <Login />}
            />
            <Route
              path="/signup"
              element={user ? <Navigate to="/algorithm" /> : <Signup />}
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

            {/* Root and Catch-all Routes */}
            <Route
              path="/"
              element={user ? <Navigate to="/algorithm" /> : <Navigate to="/login" />}
            />
            <Route
              path="*"
              element={user ? <Navigate to="/algorithm" /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
        <motion.footer
          className={styles.footer}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1
          }}
        >
          <div className={styles.footerContent}>
            <p>&copy; Safety Checker App</p>
            <div>
              <motion.button
                onClick={() => window.open('/BeSafe Hackathon 2025/MyProject.html', '_blank', 'noopener,noreferrer')}
                className={styles.portalButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Learning Portal
              </motion.button>
            </div>
          </div>
        </motion.footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
