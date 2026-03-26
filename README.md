# Estate IQ v1.3 - Real Estate Agent's Daily Operating System

A modern, production-ready SaaS application built with React 19, Tailwind CSS 4, Express, tRPC, and MySQL. Estate IQ streamlines the real estate workflow with a focus on daily habits, urgency triggers, and real-time metrics.

## 🎯 Core Features

### Dashboard
- **Real-time metrics**: Leads Today, Posts Today, Unread Leads, Conversion Rate
- **Urgency alerts**: Color-coded system (🔥 Critical, ⚠️ Warning, ✅ Success)
- **Recent leads feed**: Live updates with timestamps
- **Quick actions**: Add Listing, View Analytics, Brand Studio, Message Leads

### Listings Management
- **Red alert system**: Unposted listings highlighted for immediate action
- **Generate & Post**: One-click AI content generation and social media posting
- **Performance tracking**: Views, leads, and posting metrics per listing
- **Bulk operations**: Edit, view, and manage multiple properties

### Brand Studio
- **AI Content Generator**: Professional property descriptions and marketing copy
- **Brand Templates**: Professional, Modern, Luxury design options
- **Recent designs**: Quick access to previously created content
- **Customization**: Full control over generated content

### Lead Management (CRM)
- **Pipeline stages**: New Leads → In Progress → Qualified
- **Lead actions**: Call Now, Message, Move between stages
- **Deal tracking**: Property address, contact info, follow-up dates
- **Conversion metrics**: Real-time conversion rate and pipeline health

### Security & Authentication
- **Manus OAuth**: Seamless single sign-on integration
- **Profile management**: Edit name, email, and account preferences
- **Password security**: Change password with strength validation
- **Password recovery**: Forgot password flow with email reset links
- **Session management**: Secure logout and activity logging

## 🛠️ Tech Stack

**Frontend**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- Vite for fast development
- tRPC client for type-safe API calls
- React Query for data management
- shadcn/ui for component library

**Backend**
- Express.js for HTTP server
- tRPC for RPC procedures
- Drizzle ORM for database access
- MySQL/TiDB for persistence
- JWT for session management
- bcrypt for password hashing

**Testing & Quality**
- Vitest for unit tests
- 59+ comprehensive tests
- Password reset and auth flow coverage

## 📋 Prerequisites

- Node.js 22.13.0 or higher
- pnpm 9.0.0 or higher
- MySQL 8.0+ or TiDB
- Git

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/estate-iq.git
cd estate-iq
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/estate_iq

# Authentication
JWT_SECRET=your-secret-key-here
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/app-auth

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id

# API Keys
BUILT_IN_FORGE_API_KEY=your-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### 4. Set Up Database
```bash
pnpm db:push
```

This creates all necessary tables and runs migrations.

### 5. Start Development Server
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 6. Run Tests
```bash
pnpm test
```

All 59+ tests should pass.

## 📁 Project Structure

```
estate-iq/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   ├── Profile.tsx         # User profile
│   │   │   ├── Listings.tsx        # Property listings
│   │   │   ├── Leads.tsx           # CRM interface
│   │   │   ├── BrandStudio.tsx     # Content generator
│   │   │   ├── ForgotPassword.tsx  # Password recovery
│   │   │   └── ResetPassword.tsx   # Password reset form
│   │   ├── components/             # Reusable UI components
│   │   ├── _core/hooks/            # Custom React hooks
│   │   ├── lib/trpc.ts             # tRPC client setup
│   │   ├── App.tsx                 # Route definitions
│   │   └── main.tsx                # Entry point
│   └── public/                     # Static files
├── server/                          # Express backend
│   ├── _core/                      # Framework internals
│   │   ├── context.ts              # tRPC context
│   │   ├── oauth.ts                # OAuth handling
│   │   ├── llm.ts                  # LLM integration
│   │   └── ...
│   ├── db.ts                       # Database queries
│   ├── routers.ts                  # tRPC procedures
│   ├── storage.ts                  # S3 file storage
│   └── auth.*.test.ts              # Auth tests
├── drizzle/                         # Database schema
│   ├── schema.ts                   # Table definitions
│   ├── relations.ts                # Foreign keys
│   └── migrations/                 # Migration files
├── shared/                          # Shared types & constants
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                   # Vite config
└── vitest.config.ts                 # Test config
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `server/routers.ts` | All tRPC procedures (auth, listings, leads, etc.) |
| `drizzle/schema.ts` | Database table definitions |
| `server/db.ts` | Database query helpers |
| `client/src/App.tsx` | Route definitions and layout |
| `client/src/lib/trpc.ts` | tRPC client configuration |
| `server/_core/context.ts` | User context and auth state |

## 🔐 Authentication Flow

1. User clicks "Sign In" → Redirected to Manus OAuth
2. User authenticates with Manus account
3. Callback handler creates/updates user in database
4. Session cookie set with JWT token
5. User redirected to dashboard
6. All tRPC calls include session context automatically

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Password Reset Tokens
```sql
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Additional tables for listings, leads, and designs are defined in `drizzle/schema.ts`.

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test server/auth.logout.test.ts
```

**Test Coverage:**
- ✅ Password hashing and validation
- ✅ Password reset flow
- ✅ Token generation and expiration
- ✅ Profile updates
- ✅ Authentication and logout
- ✅ Security validations

## 🚢 Deployment

### Build for Production
```bash
pnpm build
```

This creates:
- `dist/` - Bundled frontend (Vite)
- `dist/index.js` - Backend server (esbuild)

### Environment Variables for Production
Ensure all `.env` variables are set in your production environment:
- Database connection string (use SSL for remote databases)
- JWT secret (strong, random value)
- OAuth credentials
- API keys for external services

### Running in Production
```bash
NODE_ENV=production node dist/index.js
```

## 📊 Performance Metrics

**Dashboard Updates**: Every 5 seconds for real-time metrics
**Lead Capture**: Sub-second response time
**Content Generation**: 5-20 seconds (AI-powered)
**Database Queries**: Optimized with indexes on frequently accessed columns

## 🔧 Development Tips

### Adding a New Feature

1. **Update schema** in `drizzle/schema.ts`
2. **Run migration**: `pnpm db:push`
3. **Add query helper** in `server/db.ts`
4. **Create tRPC procedure** in `server/routers.ts`
5. **Build UI component** in `client/src/pages/`
6. **Call procedure** with `trpc.feature.useQuery/useMutation`
7. **Write tests** in `server/feature.test.ts`
8. **Run tests**: `pnpm test`

### Debugging

**Server logs**: Check console output during development
**Client errors**: Open browser DevTools (F12)
**Database queries**: Use Drizzle Studio: `pnpm drizzle-kit studio`
**API calls**: Check Network tab in DevTools

## 📝 Code Style

- TypeScript for type safety
- Prettier for formatting (run `pnpm format`)
- ESLint for linting
- Tailwind CSS for styling
- shadcn/ui for components

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and write tests
3. Run tests: `pnpm test`
4. Format code: `pnpm format`
5. Commit: `git commit -am 'Add your feature'`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues, questions, or feature requests:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include steps to reproduce for bugs
4. Attach relevant screenshots or logs

## 🗺️ Roadmap

- [ ] Two-factor authentication (2FA)
- [ ] Email service integration (SendGrid)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Webhook support for integrations
- [ ] Bulk import/export features
- [ ] Custom branding options
- [ ] Team collaboration features

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Express.js Guide](https://expressjs.com)

---

**Built with ❤️ for real estate professionals**

Last updated: March 26, 2026
