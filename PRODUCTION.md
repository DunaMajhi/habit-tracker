# Production Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account with repo pushed
- Vercel account (free tier works)
- Supabase project credentials

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your `personal-valuation-tracker` GitHub repo
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
5. Click Deploy

That's it! Your app is live.

---

## 📋 Production Checklist

### Before Going Live

- [ ] Test auth flow (sign up, sign in, sign out)
- [ ] Verify all transactions work (add, view, delete)
- [ ] Test CSV export
- [ ] Test settings page (change password, delete account)
- [ ] Mobile responsive verified on real phone
- [ ] PWA installable (check "Install app" prompt)
- [ ] Check Supabase RLS policies are enforced
- [ ] Verify .env.local is in .gitignore (never commit secrets)

### After Deployment

- [ ] Test production URL end-to-end
- [ ] Check PWA installs from web
- [ ] Verify service worker is registered (DevTools → Application → Service Workers)
- [ ] Test offline mode (DevTools → offline → try adding transaction)
- [ ] Monitor Vercel logs for errors
- [ ] Set up custom domain (optional, in Vercel Settings)

---

## 🔒 Security Checklist

### Environment Variables
✅ `NEXT_PUBLIC_SUPABASE_URL` - Public URL (safe to expose)  
✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (safe to expose)  
⚠️ Never commit `.env.local` to git  
⚠️ Set Supabase RLS policies correctly (already done)

### Supabase RLS
- Verify users can only see their own transactions
- Test delete account cascades properly
- Check auth redirect works after sign out

### HTTPS & Domains
- ✅ Vercel provides free HTTPS
- Custom domain: Set in Vercel project settings
- DNS: Update domain registrar with Vercel nameservers

---

## 🌐 Custom Domain Setup (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your domain (e.g., valuationtracker.com)
3. Follow DNS instructions for your registrar
4. Wait 24-48 hours for DNS propagation

---

## 📊 Monitoring & Analytics

### Vercel Analytics
- Built-in, no setup needed
- View in Vercel dashboard

### Add Better Analytics (Optional)
```bash
npm install @vercel/analytics
```
Then in your main layout:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({children}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 🐛 Troubleshooting

### "Build failed" on Vercel
1. Check env vars are set correctly
2. Verify Supabase is accessible
3. Check build logs in Vercel dashboard

### PWA not installing
1. Check manifest.json is valid
2. Verify HTTPS is active (it is on Vercel)
3. Open Chrome DevTools → Application → Manifest
4. Look for "Install app" banner

### Offline not working
1. Check service worker registered
2. DevTools → Application → Service Workers
3. Check sw.js is in public/ folder
4. Try hard refresh (Ctrl+Shift+R)

---

## 🎯 Launch Checklist

- [ ] Production URL works
- [ ] Can create account
- [ ] Can add transaction
- [ ] Can export CSV
- [ ] Mobile app installs
- [ ] Offline mode works
- [ ] Settings page accessible
- [ ] Share link with beta users!

---

## 📱 Share with Users

Your production URL is ready to share:
```
https://your-domain.com  (or default Vercel subdomain)
```

**Marketing message:**
> Track your personal valuation like a startup. Measure your investments, waste, overhead—and watch inactivity cost you.

---

## 🔄 Future: Email Digest Setup

Once users are on board, add weekly email recap:
1. Install Resend: `npm install resend`
2. Get Resend API key from [resend.com](https://resend.com)
3. Add to Vercel env: `RESEND_API_KEY`
4. Create `/api/email/weekly-digest` route
5. Set up cron job with easycron.com or Vercel Crons

---

For questions or issues, check Vercel docs: https://vercel.com/docs
