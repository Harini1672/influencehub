# InfluenceHub

A production-ready influencer marketing platform connecting brands with creators. Built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Features

- **Two Roles**: Brands and Influencers with role-specific dashboards
- **Authentication**: Email/password signup, login, forgot/reset password, email verification
- **Campaign Lifecycle**: Requested → Accepted → In Progress → Completed
- **Real-time Updates**: Supabase Realtime for live notes, requests, and status changes
- **Browse & Search**: Brands can search influencers by platform, niche, followers, location
- **Collaboration Requests**: Full request-response workflow with notifications
- **Campaign Notes**: Real-time chat between brand and influencer per campaign
- **File Uploads**: Profile photos and brand logos stored in Supabase Storage
- **Email Notifications**: Supabase Edge Functions + Resend
- **Row Level Security**: All data secured per-user at the database level

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router DOM v6
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, Storage, Edge Functions)
- **Email**: Resend via Supabase Edge Functions

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Storage** and confirm the `avatars` and `brand-logos` buckets exist

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase dashboard under **Settings → API**.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Email Notifications (Optional)

To enable email notifications via Resend:

1. Create an account at [resend.com](https://resend.com) and get an API key
2. Deploy the Edge Function:
   ```bash
   npx supabase functions deploy send-notification-email
   ```
3. Set the secrets:
   ```bash
   npx supabase secrets set RESEND_API_KEY=your_resend_key
   npx supabase secrets set FROM_EMAIL=noreply@yourdomain.com
   npx supabase secrets set APP_URL=https://your-app-url.com
   ```

## Deployment

### Vercel (Recommended)

```bash
npm run build
```

Then deploy the `dist/` folder to Vercel. Set your environment variables in the Vercel dashboard.

### Netlify

```bash
npm run build
```

Deploy `dist/` to Netlify. Add environment variables in **Site Settings → Environment Variables**.

## Project Structure

```
src/
├── components/
│   ├── auth/          # ProtectedRoute, AuthCallback
│   ├── layout/        # Navbar, Sidebar, DashboardLayout, Footer
│   ├── shared/        # InfluencerCard, CampaignCard, StatCard, etc.
│   └── ui/            # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useBrand.ts
│   ├── useCampaigns.ts
│   ├── useInfluencer.ts
│   ├── useNotifications.ts
│   ├── useRealtimeCampaign.ts
│   └── useToast.ts
├── lib/
│   ├── database.types.ts
│   ├── supabase.ts
│   └── utils.ts
├── pages/
│   ├── auth/          # Login, Signup, ForgotPassword, ResetPassword
│   ├── brand/         # Dashboard, Browse, Campaigns, Analytics, Settings
│   ├── campaigns/     # CampaignDetail
│   └── influencer/    # Dashboard, Requests, Campaigns, Profile, Settings
├── services/
│   ├── brand.service.ts
│   ├── campaign.service.ts
│   ├── influencer.service.ts
│   ├── notification.service.ts
│   └── storage.service.ts
└── types/
    └── index.ts

supabase/
├── schema.sql              # Full DB schema + RLS policies
└── functions/
    └── send-notification-email/
        └── index.ts
```

## Database Schema

- **profiles** — linked to auth.users, stores role + name
- **influencers** — influencer-specific data, linked to profiles
- **brands** — brand-specific data, linked to profiles
- **campaigns** — brand campaigns with budget, deadline, status
- **campaign_requests** — collaboration requests between brands and influencers
- **campaign_notes** — real-time messaging per campaign
- **notifications** — in-app notification feed

## Security

- All tables use Supabase Row Level Security (RLS)
- Users can only read/write their own data
- Brands cannot modify influencer profiles and vice versa
- Campaign notes are only visible to campaign participants
- Storage buckets are publicly readable but only writable by the owner
