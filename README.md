# Personalized Career Guidance Web Application

A simple and user-friendly web application that provides personalized career guidance to students based on their interests, skills, and academic background.

## Features

- ✅ Student signup and login system
- ✅ Profile management (interests, skills, academic background)
- ✅ Personalized career suggestions
- ✅ Course recommendations
- ✅ Job opportunity suggestions
- ✅ Clean and intuitive user interface

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Password Security**: bcryptjs

## Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

## Usage

1. **Sign Up**: Create a new account with your name, email, and password
2. **Login**: Use your credentials to access the dashboard
3. **Complete Profile**: Enter your interests, skills, academic background, and education level
4. **Get Suggestions**: Click "Get Career Suggestions" to receive personalized career recommendations
5. **Explore**: View suggested careers, courses, and job opportunities

## Project Structure

```
├── server/
│   ├── index.js           # Main server file
│   ├── database.js        # Database initialization
│   ├── middleware/
│   │   └── auth.js       # Authentication middleware
│   └── routes/
│       ├── auth.js       # Authentication routes
│       ├── profile.js    # Profile management routes
│       └── career.js     # Career suggestions routes
├── public/
│   ├── index.html        # Frontend HTML
│   ├── styles.css        # Styling
│   └── app.js            # Frontend JavaScript
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create a new account
- `POST /api/auth/login` - Login to existing account

### Profile
- `GET /api/profile` - Get user profile (requires authentication)
- `POST /api/profile` - Create or update profile (requires authentication)

### Career Suggestions
- `GET /api/career/suggestions` - Get personalized career suggestions (requires authentication)

## Future Enhancements

- Career roadmaps
- Skill improvement recommendations
- Assessment quizzes
- Course and certification suggestions
- Mentor support system

## Security Notes

- Change the `JWT_SECRET` in production (set via environment variable)
- Use HTTPS in production
- Consider adding rate limiting for API endpoints
- Implement password strength requirements

## License

MIT
