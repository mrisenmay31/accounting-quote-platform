# Ledgerly Quote Calculator - Vercel Deployment Guide

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier is sufficient)
- Your project code in a Git repository (GitHub, GitLab, or Bitbucket)
- All environment variables ready (Airtable API keys, Zapier webhook URL, Supabase credentials)

## Quick Start Deployment

### Step 1: Connect Your Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository containing this project
4. Vercel will automatically detect that this is a Vite project

### Step 2: Configure Build Settings

Vercel should auto-detect these settings, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables

In the Vercel project settings, add the following environment variables:

**Required Variables:**

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AIRTABLE_PRICING_BASE_ID=your_pricing_base_id
VITE_AIRTABLE_PRICING_API_KEY=your_pricing_api_key
VITE_AIRTABLE_SERVICES_BASE_ID=your_services_base_id
VITE_AIRTABLE_SERVICES_API_KEY=your_services_api_key
VITE_ZAPIER_WEBHOOK_URL=your_zapier_webhook_url
```

**How to add environment variables:**

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add each variable one by one:
   - Enter the **Key** (e.g., `VITE_SUPABASE_URL`)
   - Enter the **Value** (your actual URL/key)
   - Select which environments to apply it to (Production, Preview, Development)
3. Click **"Save"**

### Step 4: Deploy

1. Click **"Deploy"** button
2. Vercel will:
   - Install dependencies
   - Build your project
   - Deploy to a production URL
3. Wait 1-2 minutes for the deployment to complete

### Step 5: Verify Deployment

Once deployed, Vercel will provide you with a URL (e.g., `your-project.vercel.app`). Test the following:

- ✅ Quote calculator loads correctly
- ✅ All form steps work properly
- ✅ Airtable pricing data loads
- ✅ Zapier webhook receives submissions
- ✅ No console errors

## Custom Domain Setup (Optional)

### Adding Your Own Domain

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Enter your domain (e.g., `quotes.ledgerly.com`)
3. Follow Vercel's DNS configuration instructions:
   - Add an A record or CNAME record to your DNS provider
   - Wait for DNS propagation (usually 5-60 minutes)
4. SSL certificate will be automatically provisioned

## Continuous Deployment

Vercel automatically sets up continuous deployment:

- **Production Deployments**: Triggered on push to your main/master branch
- **Preview Deployments**: Created for every pull request
- **Automatic Builds**: Every commit triggers a new build

### Branch Protection

For production safety:

1. Set your main branch as the production branch in Vercel settings
2. Use pull requests for all changes
3. Review preview deployments before merging

## Environment Variables Management

### Production vs Preview vs Development

Vercel allows different environment variables for each environment:

- **Production**: Values used in production deployments
- **Preview**: Values used for PR preview deployments
- **Development**: Values used when running `vercel dev` locally

**Recommendation**: Use the same values for all environments during initial setup, then create separate test accounts for Preview/Development later.

## Monitoring and Logs

### Viewing Deployment Logs

1. Go to your project dashboard on Vercel
2. Click on any deployment
3. View **Build Logs** and **Function Logs** tabs

### Common Issues and Solutions

**Issue**: Build fails with "Module not found"
- **Solution**: Ensure all dependencies are in `package.json` and committed to Git

**Issue**: Environment variables not working
- **Solution**: Verify they are prefixed with `VITE_` and added in Vercel settings

**Issue**: 404 errors on page refresh
- **Solution**: Vercel.json is configured with proper rewrites (already included in this project)

**Issue**: API calls failing
- **Solution**: Check that environment variables are set for the correct environment (Production/Preview)

## Rollback Procedure

If a deployment has issues:

1. Go to **Deployments** in Vercel dashboard
2. Find a previous working deployment
3. Click the **"..."** menu → **"Promote to Production"**
4. Previous version is instantly restored

## Performance Optimization

The project includes:

- ✅ Automatic code splitting
- ✅ Asset optimization
- ✅ Static asset caching (configured in vercel.json)
- ✅ Global CDN distribution
- ✅ Automatic compression (gzip/brotli)

## Security Best Practices

- ✅ All environment variables are encrypted by Vercel
- ✅ HTTPS is automatically enabled
- ✅ API keys are never exposed in client code
- ✅ Supabase credentials are properly protected

## Cost Considerations

**Vercel Free Tier includes:**

- 100 GB bandwidth per month
- Unlimited deployments
- Automatic SSL certificates
- Preview deployments for every PR
- Sufficient for most small to medium business applications

**When you might need to upgrade:**

- High traffic (>100 GB bandwidth/month)
- Team collaboration features
- Advanced analytics
- Priority support

## Updating the Application

### Making Changes

1. Make changes locally and test thoroughly
2. Commit changes to your Git repository
3. Push to your main branch
4. Vercel automatically deploys the new version
5. Monitor the deployment for any issues

### Testing Before Production

1. Create a feature branch
2. Open a pull request
3. Vercel creates a preview deployment
4. Test the preview URL
5. Merge to main when ready

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)

## Troubleshooting Commands

If you need to test locally with production environment variables:

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull

# Run development server with production env vars
vercel dev
```

## Next Steps After Deployment

1. ✅ Set up custom domain (if applicable)
2. ✅ Configure monitoring/analytics (Vercel Analytics available)
3. ✅ Test all functionality in production
4. ✅ Set up error tracking (optional: Sentry integration)
5. ✅ Share production URL with stakeholders
6. ✅ Document any production-specific configurations

---

**Deployment Date**: Ready for immediate deployment
**Last Updated**: 2025-10-03
