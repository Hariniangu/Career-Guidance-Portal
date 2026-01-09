const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Quiz questions database
const quizDatabase = {
  'career-interest': {
    title: 'Career Interest Assessment',
    description: 'Discover which career paths align with your interests',
    category: 'interest',
    questions: [
      {
        id: 1,
        question: 'What type of work environment do you prefer?',
        options: ['Office/Corporate', 'Remote/Flexible', 'Field/Outdoor', 'Creative Studio', 'Laboratory'],
        weights: { technology: 2, business: 3, healthcare: 1, arts: 1, engineering: 2 }
      },
      {
        id: 2,
        question: 'What activities do you enjoy most?',
        options: ['Problem-solving puzzles', 'Helping others', 'Creating art/design', 'Analyzing data', 'Building things'],
        weights: { technology: 3, healthcare: 2, arts: 3, business: 2, engineering: 3 }
      },
      {
        id: 3,
        question: 'How do you prefer to learn?',
        options: ['Hands-on practice', 'Reading/Research', 'Visual demonstrations', 'Collaborative projects', 'Structured courses'],
        weights: { technology: 3, healthcare: 2, arts: 2, business: 2, engineering: 3 }
      },
      {
        id: 4,
        question: 'What motivates you most?',
        options: ['Innovation and technology', 'Making a difference', 'Creative expression', 'Financial success', 'Solving complex problems'],
        weights: { technology: 3, healthcare: 3, arts: 3, business: 3, engineering: 3 }
      },
      {
        id: 5,
        question: 'What is your ideal work schedule?',
        options: ['9-5 regular hours', 'Flexible hours', 'Project-based deadlines', 'Shift work', 'Freelance/Contract'],
        weights: { technology: 2, healthcare: 1, arts: 2, business: 2, engineering: 2 }
      }
    ]
  },
  'skill-assessment': {
    title: 'Skills Assessment Quiz',
    description: 'Evaluate your current skill levels',
    category: 'skills',
    questions: [
      {
        id: 1,
        question: 'How would you rate your programming skills?',
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        weights: { programming: 1, 'problem solving': 1, logic: 1 }
      },
      {
        id: 2,
        question: 'How comfortable are you with data analysis?',
        options: ['Not comfortable', 'Somewhat comfortable', 'Comfortable', 'Very comfortable'],
        weights: { 'data analysis': 1, statistics: 1, 'problem solving': 1 }
      },
      {
        id: 3,
        question: 'Rate your communication skills',
        options: ['Needs improvement', 'Average', 'Good', 'Excellent'],
        weights: { communication: 1, 'teamwork': 1 }
      },
      {
        id: 4,
        question: 'How would you describe your creativity?',
        options: ['Not creative', 'Somewhat creative', 'Creative', 'Very creative'],
        weights: { creativity: 1, design: 1, innovation: 1 }
      },
      {
        id: 5,
        question: 'Your leadership experience?',
        options: ['None', 'Led small projects', 'Led teams', 'Led departments'],
        weights: { leadership: 1, management: 1, 'teamwork': 1 }
      }
    ]
  }
};

// Get all available quizzes
router.get('/', authenticateToken, (req, res) => {
  const quizzes = Object.keys(quizDatabase).map(key => ({
    id: key,
    title: quizDatabase[key].title,
    description: quizDatabase[key].description,
    category: quizDatabase[key].category,
    questionCount: quizDatabase[key].questions.length
  }));

  res.json({ quizzes });
});

// Get a specific quiz
router.get('/:quizId', authenticateToken, (req, res) => {
  const { quizId } = req.params;
  const quiz = quizDatabase[quizId];

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Store quiz in database if not exists
  db.get('SELECT id FROM quizzes WHERE title = ?', [quiz.title], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!existing) {
      db.run(
        'INSERT INTO quizzes (title, description, category, questions) VALUES (?, ?, ?, ?)',
        [quiz.title, quiz.description, quiz.category, JSON.stringify(quiz.questions)],
        (err) => {
          if (err) {
            console.error('Failed to save quiz:', err);
          }
        }
      );
    }
  });

  res.json(quiz);
});

// Submit quiz answers
router.post('/:quizId/submit', authenticateToken, (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body;

  const quiz = quizDatabase[quizId];
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Calculate score and results
  const categoryScores = {};
  let totalScore = 0;

  answers.forEach((answer, index) => {
    const question = quiz.questions[index];
    if (!question) return;

    const selectedOption = question.options[answer];
    const optionIndex = answer;

    // Calculate scores based on weights
    Object.keys(question.weights || {}).forEach(category => {
      if (!categoryScores[category]) {
        categoryScores[category] = 0;
      }
      categoryScores[category] += question.weights[category] * (optionIndex + 1);
    });

    totalScore += (optionIndex + 1) * 10;
  });

  // Determine top categories
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, score]) => ({ category, score }));

  const result = {
    totalScore,
    categoryScores,
    topCategories: sortedCategories,
    recommendations: generateRecommendations(sortedCategories)
  };

  // Save quiz attempt
  db.get('SELECT id FROM quizzes WHERE title = ?', [quiz.title], (err, quizRecord) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    let quizDbId = quizRecord?.id;
    if (!quizDbId) {
      db.run(
        'INSERT INTO quizzes (title, description, category, questions) VALUES (?, ?, ?, ?)',
        [quiz.title, quiz.description, quiz.category, JSON.stringify(quiz.questions)],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to save quiz' });
          }
          quizDbId = this.lastID;
          saveAttempt();
        }
      );
    } else {
      saveAttempt();
    }

    function saveAttempt() {
      db.run(
        'INSERT INTO quiz_attempts (user_id, quiz_id, answers, score, result) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, quizDbId, JSON.stringify(answers), totalScore, JSON.stringify(result)],
        (err) => {
          if (err) {
            console.error('Failed to save attempt:', err);
          }
        }
      );
    }
  });

  res.json({ result, message: 'Quiz submitted successfully' });
});

// Get user's quiz history
router.get('/user/history', authenticateToken, (req, res) => {
  db.all(
    `SELECT qa.*, q.title as quiz_title, q.category
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     WHERE qa.user_id = ?
     ORDER BY qa.completed_at DESC`,
    [req.user.id],
    (err, attempts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedAttempts = attempts.map(a => ({
        id: a.id,
        quizTitle: a.quiz_title,
        category: a.category,
        score: a.score,
        result: JSON.parse(a.result || '{}'),
        completedAt: a.completed_at
      }));

      res.json({ attempts: formattedAttempts });
    }
  );
});

function generateRecommendations(topCategories) {
  const recommendations = [];
  
  topCategories.forEach(({ category }) => {
    const categoryMap = {
      technology: 'Consider careers in Software Development, Data Science, or Cybersecurity',
      healthcare: 'Explore careers in Medicine, Nursing, or Public Health',
      arts: 'Look into Graphic Design, Content Creation, or Creative Writing',
      business: 'Consider Business Analysis, Marketing, or Finance roles',
      engineering: 'Explore Mechanical, Civil, or Electrical Engineering'
    };

    if (categoryMap[category]) {
      recommendations.push(categoryMap[category]);
    }
  });

  return recommendations;
}

module.exports = router;
