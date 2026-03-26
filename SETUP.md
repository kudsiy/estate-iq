# Setup Guide for Estate IQ

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=mysql://user:password@localhost:3306/estate_iq

# Authentication & OAuth
JWT_SECRET=your-secret-key-min-32-characters-long
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/app-auth

# Owner Information
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id

# Manus API Keys
BUILT_IN_FORGE_API_KEY=your-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# Application Settings
VITE_APP_TITLE=Estate IQ
VITE_APP_LOGO=https://your-cdn.com/logo.png
```

## Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up database**
   ```bash
   pnpm db:push
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Run tests**
   ```bash
   pnpm test
   ```

## Database Setup

### MySQL
```bash
mysql -u root -p
CREATE DATABASE estate_iq;
CREATE USER 'estate_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON estate_iq.* TO 'estate_user'@'localhost';
FLUSH PRIVILEGES;
```

Update `DATABASE_URL` in `.env.local`:
```
DATABASE_URL=mysql://estate_user:strong_password@localhost:3306/estate_iq
```

### TiDB Cloud
1. Create a TiDB cluster at https://tidbcloud.com
2. Get connection string from cluster details
3. Update `DATABASE_URL` in `.env.local`

## OAuth Configuration

1. Register your application at https://manus.im/developer
2. Get your `VITE_APP_ID`
3. Set redirect URI to `http://localhost:3000/api/oauth/callback` (development)
4. For production, use your domain: `https://yourdomain.com/api/oauth/callback`

## Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check MySQL/TiDB service is running
- Ensure user has correct permissions

### OAuth Login Fails
- Verify `VITE_APP_ID` is correct
- Check redirect URI matches in OAuth settings
- Clear browser cookies and try again

### Tests Fail
- Run `pnpm install` to ensure all dependencies are installed
- Check database is running and accessible
- Run `pnpm db:push` to ensure schema is up to date

## Production Deployment

1. Build the project:
   ```bash
   pnpm build
   ```

2. Set production environment variables

3. Run migrations:
   ```bash
   pnpm db:push
   ```

4. Start server:
   ```bash
   NODE_ENV=production node dist/index.js
   ```

## Support

For detailed documentation, see README.md
