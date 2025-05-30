# TradespotVIP Frontend

Tradespot is a professional crypto investment platform web app, built with React, that provides users with a seamless experience for trading, investing, managing funds, and interacting with the platform's features. This README provides a comprehensive guide for users and developers.

## Table of Contents
- [Features](#features)
- [UI Pages Overview](#ui-pages-overview)
- [How to Use the Platform](#how-to-use-the-platform)
- [Theming and Accessibility](#theming-and-accessibility)
- [Chatbot Assistant](#chatbot-assistant)
- [Development & Structure](#development--structure)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- User authentication (signup, login, password reset, face login)
- Dashboard with notifications and account overview
- Investment plans and history
- Funds management (deposit, withdraw, transfer, convert)
- Team management and referral system
- Profile management
- Settings (theme, password, funding password, etc.)
- Contact and support
- Admin and group chat
- AI-powered chatbot for user guidance

## UI Pages Overview

### Dashboard
- View account summary, notifications, and quick actions.
- Sidebar navigation for all main features.

### Contact
- Send messages to admin/support.
- View and manage previous support messages.

### ForgotPasswordAndVerify
- Multi-step password reset and verification process.
- Email, code, and new password entry.

### Funds
- Deposit, withdraw, transfer, and convert funds.
- View transaction history and notifications.

### Homepage
- Landing page for app/web users.
- Download links and getting started info.

### Investment
- Browse and invest in available plans.
- View investment history and earnings.

### Login
- Email/password and face login.
- Email verification and security steps.

### Profile
- View and edit user profile.
- Hide/show sensitive details.

### Settings
- Change password, funding password, name, and theme.
- Lock/unlock funds and access calculator.

### Signup
- Register with email, password, wallet, and face images.
- Referral code support.

### Team
- View and copy referral link.
- Track team members and investments.

### Chatbot (components/Chatbot.js)
- Floating AI assistant for user help and platform guidance.

---

## How to Use the Platform
1. **Sign Up:** Register with your email, password, wallet address, and (optionally) referral code and face images.
2. **Login:** Use your credentials or face login for secure access.
3. **Dashboard:** Access all features from the sidebar.
4. **Invest:** Choose a plan and invest to start earning.
5. **Manage Funds:** Deposit, withdraw, transfer, or convert your funds as needed.
6. **Profile & Settings:** Update your details, change passwords, and customize your experience.
7. **Team:** Grow your network and track referrals.
8. **Contact:** Reach out to support/admin for help.
9. **Chatbot:** Use the AI assistant for instant help on any page.

---

## Theming and Accessibility
- Light and dark themes are supported. Toggle in Settings.
- All UI elements are designed for accessibility and responsiveness.

---

## Chatbot Assistant
- The chatbot is context-aware and can answer questions about any of the main UI pages.
- It provides step-by-step guidance, troubleshooting, and platform tips.
- For best results, ask specific questions about the Dashboard, Funds, Investment, Profile, Settings, Signup, Login, Team, Contact, or general usage.

---

## Development & Structure
- **React** (functional components, hooks, context API)
- **src/** contains all main UI pages and components
- **components/Chatbot.js** is the floating AI assistant
- **ThemeContext** and **BotVisibilityContext** manage theming and chatbot visibility
- **App.js** controls routing and context providers

### Key Files
- `Dashboard.js`, `Contact.js`, `ForgotPasswordAndVerify.js`, `Funds.js`, `Homepage.js`, `Investment.js`, `Login.js`, `Profile.js`, `Settings.js`, `Signup.js`, `Team.js`, `components/Chatbot.js`

---

## FAQ
**Q: How do I reset my password?**
A: Use the Forgot Password link on the login page and follow the steps.

**Q: How do I deposit or withdraw funds?**
A: Go to the Funds page and select Deposit or Withdraw. Follow the on-screen instructions.

**Q: How do I contact support?**
A: Use the Contact page to send a message to the admin/support team.

**Q: How do I use the chatbot?**
A: Click the floating bot icon on any main page and type your question.

---

## Troubleshooting
- If you encounter issues, refresh the page or log out and log in again.
- For persistent problems, contact support via the Contact page.
- The chatbot can help with most platform questions.

---

## Contributing
Pull requests are welcome! Please open an issue first to discuss major changes.

## License
[MIT](LICENSE)
