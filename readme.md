# 🎥 StreamVault

StreamVault is a full-stack web application for **video storage, streaming, and community engagement**.  
Users can create accounts, upload and share videos, subscribe to channels, like/share content, and support creators through donations.

---

## ✨ Features

- **User Accounts & Authentication**
  - Sign up, log in, and manage profiles.
  - Secure authentication with JWT.

- **Video Upload & Streaming**
  - Upload videos with metadata (title, description, tags).
  - Stream videos directly in-browser with adaptive player.

- **Channel System**
  - Create personal channels.
  - Subscribe to other creators.
  - View subscriber counts.

- **Engagement**
  - Like, share, and comment on videos.
  - Track video views and popularity.

- **Donations**
  - Integrated donation system (Stripe/PayPal).
  - Support creators directly.

- **Admin Dashboard**
  - Manage users, videos, and reports.
  - Moderate content.

---

## 🛠️ Tech Stack

**Frontend**
- React (with React Router)
- Redux Toolkit / Context API
- TailwindCSS or Material UI

**Backend**
- Node.js + Express
- MongoDB (Atlas) for data storage
- Multer / Cloudinary / AWS S3 for video storage
- JWT for authentication

**Other Integrations**
- Stripe/PayPal API for donations
- React Player for video streaming

---

## 📂 Project Structure

```
streamvault/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── README.md
├── server/                # Node.js backend
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── uploads/          # File uploads directory
│   ├── server.js         # Server entry point
│   └── package.json
├── .env                  # Environment variables
├── .gitignore           # Git ignore file
└── README.md            # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for video storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/streamvault.git
   cd streamvault
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT
   JWT_SECRET=your_jwt_secret_key
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Payment
   STRIPE_SECRET_KEY=your_stripe_secret_key
   PAYPAL_CLIENT_ID=your_paypal_client_id
   
   # Server
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend (in new terminal)
   cd client
   npm start
   ```

---

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Video Endpoints
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get single video
- `POST /api/videos` - Upload new video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video
- `POST /api/videos/:id/like` - Like/unlike video
- `POST /api/videos/:id/view` - Increment view count

### Channel Endpoints
- `GET /api/channels/:id` - Get channel info
- `POST /api/channels` - Create channel
- `POST /api/channels/:id/subscribe` - Subscribe to channel
- `GET /api/channels/:id/subscribers` - Get subscribers

### Comment Endpoints
- `GET /api/videos/:id/comments` - Get video comments
- `POST /api/videos/:id/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

---

## 🛠️ Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   ```bash
   npm test
   ```

3. **Commit changes**
   ```bash
   git add .
   git commit -m "Add: your feature description"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## 🚀 Deployment

### Production Build
```bash
# Build client
cd client
npm run build

# Start production server
cd ../server
npm start
```

### Environment Variables (Production)
- Set all environment variables in your hosting platform
- Use production MongoDB URI
- Configure proper CORS settings
- Set NODE_ENV=production

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Use ESLint and Prettier for formatting
- Follow React best practices
- Write meaningful commit messages
- Add tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- Your Name - Initial work - [YourGitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the database solution
- Cloudinary for video hosting
- Stripe for payment processing
- All contributors and supporters

---

## 📞 Support

For support, email support@streamvault.com or create an issue on GitHub.