import React, { createContext, useState, useMemo, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./Homepage";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import Investment from "./Investment";
import Team from "./Team";
import Funds from "./Funds";
import Settings from "./Settings";
import Contact from "./Contact";
import AdminHome from "./AdminHome";
import AdminLogin from "./admin-login";
import AdminSignup from "./admin-signup";
import Admindb from "./admindb";
import Deposits from "./deposits";
import Users from "./users";
import Referrals from "./referrals";
import Investments from "./Investments";
import Withdrawals from "./Withdrawals";
import Notification from "./Notification";
import Slogin from "./Slogin";
import Sregister from "./Sregister";
import Sdb from "./Sdb";
import Chat from "./Chat";
import GroupChat from "./GroupChat";
import Set from "./Set";
import Store from "./Store";
import Adsocial from "./Adsocial";
import AdminContact from "./AdminContact";
import ForgotPasswordAndVerify from "./ForgotPasswordAndVerify.js";
import SocialResetPassword from "./SocialResetPassword";
import Chatbot from "./components/Chatbot";
import TradeSpotAuthenticator from "./components/TradeSpotAuthenticator";

export const ThemeContext = createContext();
export const BotVisibilityContext = createContext();

function App() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );
  const [showBot, setShowBot] = useState(() => {
    const saved = localStorage.getItem('showBot');
    return saved === null ? true : saved === 'true';
  });
  useEffect(() => {
    localStorage.setItem('showBot', showBot);
  }, [showBot]);
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };
  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme]);
  const botValue = useMemo(() => ({ showBot, setShowBot }), [showBot]);

  // Only show Chatbot on these routes
  function ChatbotWithRouteControl() {
    const location = useLocation();
    const visibleRoutes = [
      '/',
      '/dashboard',
      '/investment',
      '/profile',
      '/team',
      '/funds',
      '/settings',
      '/homepage',
      '/contact',
      '/login', // ensure lowercase
      '/signup', // ensure lowercase
      '/forgot-password-and-verify',
    ];
    // Use toLowerCase for pathname and route for robust matching
    const show = visibleRoutes.some(route => location.pathname.toLowerCase() === route.toLowerCase());
    return show ? <Chatbot hidden={!showBot} /> : null;
  }

  return (
      <ThemeContext.Provider value={themeValue}>
        <BotVisibilityContext.Provider value={botValue}>
          <Router>
            <ChatbotWithRouteControl />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/investment" element={<Investment />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/team" element={<Team />} />
              <Route path="/store" element={<Store />} />
              <Route path="/funds" element={<Funds />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admindb" element={<Admindb />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin-home" element={<AdminHome />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin-signup" element={<AdminSignup />} />
              <Route path="/deposits" element={<Deposits />} />
              <Route path="/users" element={<Users />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/withdrawals" element={<Withdrawals />} />
              <Route path="/notifications" element={<Notification />} />
              <Route path="/slogin" element={<Slogin />} />
              <Route path="/sregister" element={<Sregister />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/sdb" element={<Sdb />} />
              <Route path="/GroupChat" element={<GroupChat />} />
              <Route path="/set" element={<Set />} />
              <Route path="/adsocial" element={<Adsocial />} />
              <Route path="/forgot-password-and-verify" element={<ForgotPasswordAndVerify />} />
              <Route path="/admin-contact" element={<AdminContact />} />
              <Route path="/social-reset-password" element={<SocialResetPassword />} />
              <Route path="/authenticator" element={<TradeSpotAuthenticator />} />
            </Routes>
          </Router>
        </BotVisibilityContext.Provider>
      </ThemeContext.Provider>
  );
}
export default App;