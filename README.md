# Layer3 Top Users

A Next.js application displaying Layer3's top users and their on-chain wallet data.

**✨ Features**: Leaderboard view, user profiles, multi-chain wallet data, NFT galleries, transaction history

**📚 Documentation**: See [PROJECT.md](./PROJECT.md) for detailed architecture decisions, trade-offs, and design rationale.

---

## Quick Start

### Environment Variables

Before running the development server, you need to set up your environment variables:

1. Copy the example environment file:
   ```bash
   cp example.env .env
   ```

2. Get your Ankr API key:
   - Visit [https://www.ankr.com/rpc/projects/](https://www.ankr.com/rpc/projects/)
   - Sign in or create an account
   - Copy your API key from the projects page

3. Edit `.env` and replace `INSERT_YOUR_ANKR_TOKEN` with your actual Ankr API key:
   ```
   ANKR_API_KEY=your_actual_api_key_here
   ```

4. Next.js automatically loads environment variables from `.env` files at build time and runtime (no additional configuration needed). Make sure to restart your development server after creating or modifying the `.env` file for changes to take effect.

> **⚠️ CRITICAL SECURITY NOTE:**
> - Never commit your `.env` file to version control. The `.env` file is already included in `.gitignore`.
> - If you accidentally committed API keys, immediately:
>   1. Revoke the exposed key at [Ankr Projects](https://www.ankr.com/rpc/projects/)
>   2. Generate a new API key
>   3. Remove the sensitive data from git history
>   4. Update your `.env` file with the new key

### Running the Development Server

```bash
npm install              # Install dependencies
npm run dev              # Start development server
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## Testing

### Unit Tests (Vitest)

```bash
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
```

Tests cover utility functions in `lib/`:
- `token-utils.ts` - Token classification and formatting
- `explorers.ts` - Blockchain explorer URL generation

### E2E Tests (Playwright)

```bash
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
```

Tests cover critical user flows:
- Homepage rendering
- User navigation
- Error handling

---

## Project Structure

```
layer3-top-users/
├── app/                 # Next.js App Router
│   ├── api/            # API routes (BFF pattern)
│   ├── user/           # User detail pages
│   └── page.tsx        # Homepage
├── components/          # React components
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
├── __tests__/          # Unit tests
├── e2e/                # E2E tests
└── middleware.ts       # Security headers
```

---

## Key Technologies

- **Next.js 16** - App Router, Server Components, ISR
- **React 19** - Latest features and hooks
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Helia** - Decentralized IPFS content fetching
- **Vitest** - Unit testing
- **Playwright** - E2E testing

---

## Architecture Highlights

### 1. Backend-for-Frontend Pattern
API routes proxy external services to protect API keys and enable caching.

### 2. Local Caching Layer
`better-sqlite3` + in-memory maps cache users, wallet payloads, and avatar CIDs (24h TTL) to avoid repeated Layer3/Ankr/IPFS calls and speed up cold starts.

### 3. Component Refactoring
WalletInfo component refactored from 474 → 216 lines following SOLID principles:
- Custom hook for data fetching (`useWalletData`)
- Utility functions extracted to `lib/`
- Sub-components for reusability (`TokenBalanceCard`, `NFTCard`, etc.)

### 4. Security Headers
Middleware implements OWASP recommended headers:
- Content Security Policy (XSS protection)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME-sniffing protection)

### 5. Performance Optimization
- ISR with 60s revalidation
- Parallel API requests with `Promise.all`
- IPFS singleton pattern
- Image optimization with Next.js Image

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Required: ANKR_API_KEY
```

### Environment Variables

- `ANKR_API_KEY` - **Required** - Your Ankr API key
- `NEXT_PUBLIC_BASE_URL` - Optional - Override base URL (auto-detected in most cases)

---

## Code Quality

- ✅ **TypeScript** strict mode enabled
- ✅ **ESLint** configured for Next.js
- ✅ **Comprehensive JSDoc** on all public functions
- ✅ **Security headers** via middleware
- ✅ **Input validation** using `viem.isAddress()` for robust address checking
- ✅ **Error handling** with graceful degradation

---

## Documentation

📖 **[PROJECT.md](./PROJECT.md)** - Detailed architecture documentation including:
- Design decisions and trade-offs
- Security considerations
- Performance optimizations
- Testing strategy
- Future improvements
- Technical debt

---

## Development

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
```

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Layer3 Documentation](https://layer3.xyz)
- [Ankr Advanced API](https://www.ankr.com/docs/advanced-api/)

---

**Author**: @SgtPooki
**License**: MIT
