import React, { useRef } from "react";
import {
  Shield,
  Bot,
  Brain,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import styles from "./homePage.module.css";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

function App() {
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className={styles.app}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className={styles.logoutButton}
          >
            התנתק
          </button>

          <div>
            <a
              href="/BeSafe Hackathon 2025/page5.html"
              className={styles.sosLink}
            >
              <AlertCircle />
            </a>
          </div>

          <h1>הישארו בטוחים בעולם הדיגיטלי</h1>
          <p>
            אנו נותנים לכם כלים מבוססי בינה מלאכותית ומידע כדי לגלוש בצורה בטוחה
          </p>
          <button className={styles.button} onClick={scrollToFeatures}>
            בואו נתחיל
            <ChevronRight />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} ref={featuresRef}>
        <div className={styles.container}>
          <div className={styles.featuresGrid}>
            {/* Safety Checker */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconBlue}>
                <Shield />
              </div>
              <h3>אלגוריתם חכם לניתוח שיחות</h3>
              <p>ניתוח מתקדם לזיהוי וסימון תוכן מסוכן בזמן אמת.</p>
              <div className={styles.featureLink}>
                <Link to="/algorithm">
                  <span>נסו עכשיו</span>
                </Link>

                <ChevronRight />
              </div>
            </div>

            {/* AI Chatbot */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconPurple}>
                <Bot />
              </div>
              <h3>צ'אטבוט חכם</h3>
              <p>קבלו תשובות מיידיות ועזרה על בטיחות ברשת מהעוזר האישי שלנו.</p>
              <div className={styles.featureLink}>
                <Link to="/chatbot">
                  <span>לצ׳אט</span>
                </Link>
                <ChevronRight />
              </div>
            </div>

            {/* Learning Portal */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconIndigo}>
                <Brain />
              </div>
              <h3>פורטל למידה</h3>
              <p>
                שיעורים אינטראקטיביים ומידע כדי ללמוד איך להישאר בטוחים ברשת.
              </p>
              <div className={styles.featureLink}>
                <a
                  href="/BeSafe Hackathon 2025/MyProject.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>התחילו ללמוד</span>
                </a>
                <ChevronRight />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <AlertTriangle color="#facc15" />
              </div>
              <div className={styles.statNumber}>98%</div>
              <p className={styles.statLabel}>דיוק בזיהוי איומים</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Sparkles color="#60a5fa" />
              </div>
              <div className={styles.statNumber}>50K+</div>
              <p className={styles.statLabel}>משתמשים מוגנים מדי יום</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Shield color="#4ade80" />
              </div>
              <div className={styles.statNumber}>1M+</div>
              <p className={styles.statLabel}>איומים שנמנעו</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
