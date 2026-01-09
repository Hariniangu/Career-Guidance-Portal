const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Sample mentors database
const mentorsDatabase = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    expertise_area: 'Software Development',
    bio: 'Senior Software Engineer with 10+ years of experience in full-stack development. Specialized in React, Node.js, and cloud technologies.',
    experience_years: 10,
    availability_status: 'available',
    rating: 4.8
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    expertise_area: 'Data Science',
    bio: 'Data Scientist and ML Engineer with expertise in Python, machine learning, and big data analytics. Former Google employee.',
    experience_years: 8,
    availability_status: 'available',
    rating: 4.9
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    expertise_area: 'Business Analysis',
    bio: 'Certified Business Analyst with 12 years of experience helping companies optimize their processes and implement solutions.',
    experience_years: 12,
    availability_status: 'available',
    rating: 4.7
  },
  {
    name: 'David Kim',
    email: 'david.kim@example.com',
    expertise_area: 'UI/UX Design',
    bio: 'Creative Director and UX Designer with a passion for creating intuitive user experiences. Worked with Fortune 500 companies.',
    experience_years: 7,
    availability_status: 'available',
    rating: 4.6
  },
  {
    name: 'Jennifer Martinez',
    email: 'jennifer.martinez@example.com',
    expertise_area: 'Digital Marketing',
    bio: 'Marketing strategist specializing in digital marketing, SEO, and social media. Helped startups grow from 0 to millions in revenue.',
    experience_years: 9,
    availability_status: 'available',
    rating: 4.8
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@example.com',
    expertise_area: 'Cybersecurity',
    bio: 'Cybersecurity expert with 15 years of experience in network security, ethical hacking, and security architecture.',
    experience_years: 15,
    availability_status: 'available',
    rating: 4.9
  }
];

// Initialize mentors in database
db.serialize(() => {
  mentorsDatabase.forEach(mentor => {
    db.run(
      `INSERT OR IGNORE INTO mentors 
       (name, email, expertise_area, bio, experience_years, availability_status, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [mentor.name, mentor.email, mentor.expertise_area, mentor.bio, 
       mentor.experience_years, mentor.availability_status, mentor.rating]
    );
  });
});

// Get all mentors with filters
router.get('/', authenticateToken, (req, res) => {
  const { expertise, availability } = req.query;

  let query = 'SELECT * FROM mentors WHERE 1=1';
  const params = [];

  if (expertise) {
    query += ' AND expertise_area LIKE ?';
    params.push(`%${expertise}%`);
  }

  if (availability) {
    query += ' AND availability_status = ?';
    params.push(availability);
  }

  query += ' ORDER BY rating DESC, experience_years DESC';

  db.all(query, params, (err, mentors) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get user's connections
    db.all(
      'SELECT mentor_id, status FROM mentor_connections WHERE user_id = ?',
      [req.user.id],
      (err, connections) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const connectionMap = {};
        connections.forEach(c => {
          connectionMap[c.mentor_id] = c.status;
        });

        const formattedMentors = mentors.map(m => ({
          id: m.id,
          name: m.name,
          expertiseArea: m.expertise_area,
          bio: m.bio,
          experienceYears: m.experience_years,
          availabilityStatus: m.availability_status,
          rating: m.rating,
          connectionStatus: connectionMap[m.id] || null
        }));

        res.json({ mentors: formattedMentors });
      }
    );
  });
});

// Get recommended mentors based on user profile
router.get('/recommendations', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM profiles WHERE user_id = ?',
    [req.user.id],
    (err, profile) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const interests = profile.interests ? profile.interests.toLowerCase() : '';
      const skills = profile.skills ? profile.skills.toLowerCase() : '';
      const allText = interests + ' ' + skills;

      // Determine expertise area
      let expertiseFilter = null;
      if (allText.includes('programming') || allText.includes('software') || allText.includes('tech')) {
        expertiseFilter = 'Software Development';
      } else if (allText.includes('data') || allText.includes('analytics')) {
        expertiseFilter = 'Data Science';
      } else if (allText.includes('business') || allText.includes('analysis')) {
        expertiseFilter = 'Business Analysis';
      } else if (allText.includes('design') || allText.includes('ui') || allText.includes('ux')) {
        expertiseFilter = 'UI/UX Design';
      } else if (allText.includes('marketing')) {
        expertiseFilter = 'Digital Marketing';
      } else if (allText.includes('security') || allText.includes('cyber')) {
        expertiseFilter = 'Cybersecurity';
      }

      let query = 'SELECT * FROM mentors WHERE availability_status = ?';
      const params = ['available'];

      if (expertiseFilter) {
        query += ' AND expertise_area = ?';
        params.push(expertiseFilter);
      }

      query += ' ORDER BY rating DESC LIMIT 3';

      db.all(query, params, (err, mentors) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const formattedMentors = mentors.map(m => ({
          id: m.id,
          name: m.name,
          expertiseArea: m.expertise_area,
          bio: m.bio,
          experienceYears: m.experience_years,
          rating: m.rating
        }));

        res.json({ recommendations: formattedMentors });
      });
    }
  );
});

// Request mentor connection
router.post('/:mentorId/connect', authenticateToken, (req, res) => {
  const { mentorId } = req.params;
  const { message } = req.body;

  // Check if mentor exists
  db.get('SELECT * FROM mentors WHERE id = ?', [mentorId], (err, mentor) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Check if connection already exists
    db.get(
      'SELECT * FROM mentor_connections WHERE user_id = ? AND mentor_id = ?',
      [req.user.id, mentorId],
      (err, existing) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existing) {
          return res.status(400).json({ error: 'Connection request already exists' });
        }

        // Create connection request
        db.run(
          'INSERT INTO mentor_connections (user_id, mentor_id, status, message) VALUES (?, ?, ?, ?)',
          [req.user.id, mentorId, 'pending', message || ''],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create connection request' });
            }
            res.json({ 
              message: 'Connection request sent successfully',
              connectionId: this.lastID 
            });
          }
        );
      }
    );
  });
});

// Get user's mentor connections
router.get('/user/connections', authenticateToken, (req, res) => {
  db.all(
    `SELECT mc.*, m.name as mentor_name, m.expertise_area, m.bio, m.rating, m.experience_years
     FROM mentor_connections mc
     JOIN mentors m ON mc.mentor_id = m.id
     WHERE mc.user_id = ?
     ORDER BY mc.requested_at DESC`,
    [req.user.id],
    (err, connections) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedConnections = connections.map(c => ({
        id: c.id,
        mentorId: c.mentor_id,
        mentorName: c.mentor_name,
        expertiseArea: c.expertise_area,
        bio: c.bio,
        rating: c.rating,
        experienceYears: c.experience_years,
        status: c.status,
        message: c.message,
        requestedAt: c.requested_at,
        connectedAt: c.connected_at
      }));

      res.json({ connections: formattedConnections });
    }
  );
});

// Update connection status (for mentors to accept/reject)
router.put('/connections/:connectionId', authenticateToken, (req, res) => {
  const { connectionId } = req.params;
  const { status } = req.body;

  if (!['accepted', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    `UPDATE mentor_connections 
     SET status = ?, ${status === 'accepted' ? 'connected_at = CURRENT_TIMESTAMP' : ''}
     WHERE id = ? AND mentor_id IN (SELECT id FROM mentors WHERE email = ?)`,
    [status, connectionId, req.user.email],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update connection' });
      }
      if (this.changes === 0) {
        return res.status(403).json({ error: 'Not authorized or connection not found' });
      }
      res.json({ message: 'Connection status updated successfully' });
    }
  );
});

module.exports = router;
