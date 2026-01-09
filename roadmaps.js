const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Career roadmap data
const roadmapData = {
  'Software Developer': {
    steps: [
      { step: 1, title: 'Learn Programming Fundamentals', description: 'Master basic programming concepts and a language like Python or JavaScript', duration: '3-6 months', resources: ['Codecademy', 'freeCodeCamp', 'Python.org'] },
      { step: 2, title: 'Build Projects', description: 'Create 3-5 portfolio projects to demonstrate your skills', duration: '2-3 months', resources: ['GitHub', 'Portfolio Website'] },
      { step: 3, title: 'Learn Version Control', description: 'Master Git and GitHub for collaboration', duration: '1 month', resources: ['Git Documentation', 'GitHub Learning Lab'] },
      { step: 4, title: 'Study Data Structures & Algorithms', description: 'Learn fundamental CS concepts for technical interviews', duration: '2-3 months', resources: ['LeetCode', 'Cracking the Coding Interview'] },
      { step: 5, title: 'Apply for Internships/Entry Jobs', description: 'Start applying to junior developer positions', duration: 'Ongoing', resources: ['LinkedIn', 'Indeed', 'AngelList'] }
    ],
    estimatedTime: '8-12 months',
    difficulty: 'Intermediate'
  },
  'Data Scientist': {
    steps: [
      { step: 1, title: 'Master Python & Statistics', description: 'Learn Python programming and statistical analysis', duration: '3-4 months', resources: ['Python for Data Science', 'Statistics Course'] },
      { step: 2, title: 'Learn Data Manipulation', description: 'Master pandas, numpy, and data cleaning techniques', duration: '2-3 months', resources: ['Pandas Documentation', 'DataCamp'] },
      { step: 3, title: 'Study Machine Learning', description: 'Learn ML algorithms and frameworks like scikit-learn', duration: '3-4 months', resources: ['Coursera ML Course', 'Kaggle Learn'] },
      { step: 4, title: 'Build Data Science Projects', description: 'Create projects using real datasets', duration: '2-3 months', resources: ['Kaggle', 'UCI ML Repository'] },
      { step: 5, title: 'Learn Deep Learning (Optional)', description: 'Explore neural networks and TensorFlow/PyTorch', duration: '3-4 months', resources: ['Deep Learning Specialization', 'Fast.ai'] },
      { step: 6, title: 'Apply for Data Science Roles', description: 'Start applying to data analyst and data scientist positions', duration: 'Ongoing', resources: ['LinkedIn', 'Data Science Jobs'] }
    ],
    estimatedTime: '12-18 months',
    difficulty: 'Advanced'
  },
  'Business Analyst': {
    steps: [
      { step: 1, title: 'Learn Business Fundamentals', description: 'Understand business processes and operations', duration: '2-3 months', resources: ['Business Analysis Basics', 'Coursera Business Courses'] },
      { step: 2, title: 'Master Data Analysis Tools', description: 'Learn Excel, SQL, and data visualization tools', duration: '2-3 months', resources: ['SQL Tutorial', 'Tableau Training'] },
      { step: 3, title: 'Get Certified', description: 'Obtain Business Analysis certification (CBAP or similar)', duration: '2-3 months', resources: ['IIBA Certification', 'PMI-PBA'] },
      { step: 4, title: 'Build Portfolio', description: 'Create case studies showcasing your analysis skills', duration: '1-2 months', resources: ['Portfolio Website', 'Case Studies'] },
      { step: 5, title: 'Network & Apply', description: 'Attend industry events and apply for BA positions', duration: 'Ongoing', resources: ['LinkedIn', 'Business Analyst Meetups'] }
    ],
    estimatedTime: '8-12 months',
    difficulty: 'Intermediate'
  }
};

// Get roadmap for a specific career
router.get('/:careerTitle', authenticateToken, (req, res) => {
  const { careerTitle } = req.params;
  const roadmap = roadmapData[careerTitle];

  if (!roadmap) {
    return res.status(404).json({ error: 'Roadmap not found for this career' });
  }

  // Get user's progress if exists
  db.get(
    `SELECT rp.*, cr.career_title 
     FROM user_roadmap_progress rp
     JOIN career_roadmaps cr ON rp.roadmap_id = cr.id
     WHERE rp.user_id = ? AND cr.career_title = ?`,
    [req.user.id, careerTitle],
    (err, progress) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        career: careerTitle,
        steps: roadmap.steps,
        estimatedTime: roadmap.estimatedTime,
        difficulty: roadmap.difficulty,
        progress: progress || null
      });
    }
  );
});

// Get all available roadmaps
router.get('/', authenticateToken, (req, res) => {
  const roadmaps = Object.keys(roadmapData).map(title => ({
    title,
    estimatedTime: roadmapData[title].estimatedTime,
    difficulty: roadmapData[title].difficulty,
    stepsCount: roadmapData[title].steps.length
  }));

  res.json({ roadmaps });
});

// Start a roadmap
router.post('/start', authenticateToken, (req, res) => {
  const { careerTitle } = req.body;

  if (!roadmapData[careerTitle]) {
    return res.status(404).json({ error: 'Roadmap not found' });
  }

  // Check if roadmap exists in DB, create if not
  db.get('SELECT id FROM career_roadmaps WHERE career_title = ?', [careerTitle], (err, roadmap) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    let roadmapId;
    if (!roadmap) {
      // Create roadmap entry
      db.run(
        'INSERT INTO career_roadmaps (career_title, category, steps, estimated_time, difficulty_level) VALUES (?, ?, ?, ?, ?)',
        [careerTitle, 'general', JSON.stringify(roadmapData[careerTitle].steps), roadmapData[careerTitle].estimatedTime, roadmapData[careerTitle].difficulty],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create roadmap' });
          }
          roadmapId = this.lastID;
          createUserProgress();
        }
      );
    } else {
      roadmapId = roadmap.id;
      createUserProgress();
    }

    function createUserProgress() {
      // Check if user already has progress
      db.get(
        'SELECT * FROM user_roadmap_progress WHERE user_id = ? AND roadmap_id = ?',
        [req.user.id, roadmapId],
        (err, existing) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existing) {
            return res.json({ message: 'Roadmap already started', progress: existing });
          }

          // Create new progress
          db.run(
            'INSERT INTO user_roadmap_progress (user_id, roadmap_id, current_step, completed_steps) VALUES (?, ?, 0, ?)',
            [req.user.id, roadmapId, JSON.stringify([])],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to start roadmap' });
              }
              res.json({ message: 'Roadmap started successfully', progressId: this.lastID });
            }
          );
        }
      );
    }
  });
});

// Update roadmap progress
router.put('/progress', authenticateToken, (req, res) => {
  const { roadmapId, currentStep, completedSteps } = req.body;

  db.run(
    'UPDATE user_roadmap_progress SET current_step = ?, completed_steps = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND roadmap_id = ?',
    [currentStep, JSON.stringify(completedSteps), req.user.id, roadmapId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update progress' });
      }
      res.json({ message: 'Progress updated successfully' });
    }
  );
});

// Get user's active roadmaps
router.get('/user/active', authenticateToken, (req, res) => {
  db.all(
    `SELECT rp.*, cr.career_title, cr.steps as roadmap_steps, cr.estimated_time, cr.difficulty_level
     FROM user_roadmap_progress rp
     JOIN career_roadmaps cr ON rp.roadmap_id = cr.id
     WHERE rp.user_id = ?`,
    [req.user.id],
    (err, roadmaps) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedRoadmaps = roadmaps.map(r => ({
        id: r.id,
        career: r.career_title,
        currentStep: r.current_step,
        completedSteps: JSON.parse(r.completed_steps || '[]'),
        roadmapSteps: JSON.parse(r.roadmap_steps || '[]'),
        estimatedTime: r.estimated_time,
        difficulty: r.difficulty_level,
        startedAt: r.started_at
      }));

      res.json({ roadmaps: formattedRoadmaps });
    }
  );
});

module.exports = router;
