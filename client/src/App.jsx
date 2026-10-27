import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Nav, Footer, PageLoader, SmoothScroll, ScrollProgress } from './components/Shell.jsx';
import { Translator } from './components/Translator.jsx';
import { useAuth } from './lib/auth.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Explore = lazy(() => import('./pages/Explore.jsx'));
const Monument = lazy(() => import('./pages/Monument.jsx'));
const Walk = lazy(() => import('./pages/Walk.jsx'));
const SharedWalk = lazy(() => import('./pages/SharedWalk.jsx'));
const Quiz = lazy(() => import('./pages/Quiz.jsx'));
const Find = lazy(() => import('./pages/Find.jsx'));
const Hunt = lazy(() => import('./pages/Hunt.jsx'));
const Passport = lazy(() => import('./pages/Passport.jsx'));
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'));
const Auth = lazy(() => import('./pages/Auth.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Credits = lazy(() => import('./pages/Credits.jsx'));
const Verify = lazy(() => import('./pages/Verify.jsx'));
const Forgot = lazy(() => import('./pages/Forgot.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function RequireAuth({ children, admin = false }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <PageLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { pathname } = useLocation();
  const fullBleed = ['/explore', '/find', '/hunt'].some((p) => pathname.startsWith(p));
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <Translator />
      <SmoothScroll enabled={!fullBleed} />
      <ScrollTop />
      <Nav />
      {!fullBleed && <ScrollProgress />}
      <motion.div id="main" key={pathname.split('/')[1] || 'home'} initial={fullBleed ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={fullBleed ? { opacity: 1 } : { opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 0.9, 0.24, 1] }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/m/:slug" element={<Monument />} />
            <Route path="/walk" element={<Walk />} />
            <Route path="/w/:code" element={<SharedWalk />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/find" element={<Find />} />
            <Route path="/hunt" element={<Hunt />} />
            <Route path="/hunt/:code" element={<Hunt />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/passport" element={<RequireAuth><Passport /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/register" element={<Auth mode="register" />} />
            <Route path="/verify" element={<RequireAuth><Verify /></RequireAuth>} />
            <Route path="/forgot" element={<Forgot />} />
            <Route path="/about" element={<About />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
      {!fullBleed && <Footer />}
    </>
  );
}
