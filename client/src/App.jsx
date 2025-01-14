import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/HomePage/HomePage';
import TextInputWithDangerScore from "./components/Algorithm/page.tsx";
import styles from './styles/App.module.css';

import projectLogo from './assets/project-logo.png';

function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <header className={styles.appHeader}>
          <img src={projectLogo} alt="Logo" className={styles.appLogo} />
          <nav className={styles.appNav}>
            <Link to="/" className={styles.appLink}>Home</Link>
            <Link to="/algorithm" className={styles.appLink}>Algorithm</Link>
          </nav>
        </header>
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/algorithm" element={<TextInputWithDangerScore />} />
          </Routes>
        </main>
        <footer className={styles.footer}>
          <p>&copy; Safety Checker App</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
