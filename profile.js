const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM profiles WHERE user_id = ?',
    [req.user.id],
    (err, profile) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(profile || {});
    }
  );
});

// Create or update profile
router.post('/', authenticateToken, (req, res) => {
  const { interests, skills, academic_background, education_level } = req.body;

  db.get(
    'SELECT * FROM profiles WHERE user_id = ?',
    [req.user.id],
    (err, existingProfile) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const interestsStr = Array.isArray(interests) ? interests.join(',') : interests;
      const skillsStr = Array.isArray(skills) ? skills.join(',') : skills;

      if (existingProfile) {
        // Update existing profile
        db.run(
          `UPDATE profiles 
           SET interests = ?, skills = ?, academic_background = ?, 
               education_level = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ?`,
          [interestsStr, skillsStr, academic_background, education_level, req.user.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to update profile' });
            }
            res.json({ message: 'Profile updated successfully' });
          }
        );
      } else {
        // Create new profile
        db.run(
          `INSERT INTO profiles (user_id, interests, skills, academic_background, education_level) 
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.id, interestsStr, skillsStr, academic_background, education_level],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to create profile' });
            }
            res.json({ message: 'Profile created successfully' });
          }
        );
      }
    }
  );
});

module.exports = router;
