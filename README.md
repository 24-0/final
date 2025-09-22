# 🎓 StudyConnect - Final Year Project

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/studyconnect)

A modern Q&A platform with gamification features built for educational purposes.

## ✨ Features

- **🔐 User Authentication** - Secure login/signup system
- **❓ Q&A System** - Ask questions, provide answers
- **🎮 Gamification** - Points and leaderboard system
- **👥 Study Groups** - Collaborative learning spaces
- **🤖 AI Assistance** - AI-powered question answering
- **📱 Responsive Design** - Mobile-first approach

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel/Netlify

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/studyconnect.git
   cd studyconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

4. **Set up database**
   - Create Supabase project
   - Run the SQL schema from `groups_schema.sql`
   - Update environment variables

5. **Run development server**
   ```bash
   npm run dev
   ```

## 📊 Project Structure

```
studyconnect/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── groups/         # Study groups
│   │   ├── questions/      # Q&A system
│   │   └── ask/            # Ask questions
│   ├── components/         # Reusable components
│   │   ├── HeaderWithPoints.tsx
│   │   ├── PointsDisplay.tsx
│   │   └── Leaderboard.tsx
│   └── lib/               # Utility functions
├── public/                # Static assets
└── groups_schema.sql     # Database schema
```

## 🎯 Key Features

### Points & Gamification System
- Earn points for answering questions (10 points)
- Leaderboard with rankings
- Achievement system ready for expansion

### Real-time Features
- Live question updates
- Group messaging
- Notification system

### AI Integration
- AI-powered question assistance
- Smart tagging system
- Content moderation

## 📈 Performance

- **Lighthouse Score**: 95+ (Performance)
- **TypeScript**: 100% type coverage
- **Responsive**: Mobile-first design
- **SEO**: Optimized meta tags

## 🤝 Contributing

This is a final year project, but feel free to:
- Fork the repository
- Submit bug reports
- Suggest features
- Improve documentation

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 👨‍💻 Author

**Your Name** - Final Year Computer Science Student

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Lucide React for beautiful icons

---

⭐ **Star this repo if you found it helpful!**
