const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Courses and certifications database
const coursesDatabase = [
  {
    title: 'Full Stack Web Development Bootcamp',
    type: 'course',
    provider: 'freeCodeCamp',
    career_category: 'technology',
    skills_covered: 'HTML, CSS, JavaScript, React, Node.js, MongoDB',
    duration: '6-12 months',
    cost: 'Free',
    link: 'https://www.freecodecamp.org',
    difficulty_level: 'Intermediate'
  },
  {
    title: 'Google Data Analytics Professional Certificate',
    type: 'certification',
    provider: 'Google (Coursera)',
    career_category: 'technology',
    skills_covered: 'Data Analysis, SQL, R, Tableau, Spreadsheets',
    duration: '6 months',
    cost: '$39/month',
    link: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    difficulty_level: 'Beginner'
  },
  {
    title: 'AWS Certified Solutions Architect',
    type: 'certification',
    provider: 'Amazon Web Services',
    career_category: 'technology',
    skills_covered: 'Cloud Architecture, AWS Services, Security, Networking',
    duration: '3-6 months',
    cost: '$150 exam fee',
    link: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
    difficulty_level: 'Advanced'
  },
  {
    title: 'Python for Data Science',
    type: 'course',
    provider: 'DataCamp',
    career_category: 'technology',
    skills_covered: 'Python, Pandas, NumPy, Data Visualization',
    duration: '2-3 months',
    cost: '$25/month',
    link: 'https://www.datacamp.com',
    difficulty_level: 'Beginner'
  },
  {
    title: 'Machine Learning Specialization',
    type: 'course',
    provider: 'Stanford (Coursera)',
    career_category: 'technology',
    skills_covered: 'Machine Learning, Neural Networks, Deep Learning',
    duration: '3-4 months',
    cost: '$49/month',
    link: 'https://www.coursera.org/specializations/machine-learning',
    difficulty_level: 'Advanced'
  },
  {
    title: 'Certified Business Analysis Professional (CBAP)',
    type: 'certification',
    provider: 'IIBA',
    career_category: 'business',
    skills_covered: 'Business Analysis, Requirements Analysis, Process Modeling',
    duration: '3-6 months',
    cost: '$575 exam fee',
    link: 'https://www.iiba.org/certification/core-business-analysis-certifications/cbap/',
    difficulty_level: 'Advanced'
  },
  {
    title: 'Digital Marketing Certificate',
    type: 'certification',
    provider: 'Google Digital Garage',
    career_category: 'business',
    skills_covered: 'SEO, SEM, Social Media Marketing, Analytics',
    duration: '2-3 months',
    cost: 'Free',
    link: 'https://learndigital.withgoogle.com/digitalgarage',
    difficulty_level: 'Beginner'
  },
  {
    title: 'Project Management Professional (PMP)',
    type: 'certification',
    provider: 'PMI',
    career_category: 'business',
    skills_covered: 'Project Management, Agile, Risk Management',
    duration: '3-6 months',
    cost: '$405-$555 exam fee',
    link: 'https://www.pmi.org/certifications/project-management-pmp',
    difficulty_level: 'Advanced'
  },
  {
    title: 'Adobe Creative Suite Masterclass',
    type: 'course',
    provider: 'Adobe',
    career_category: 'arts',
    skills_covered: 'Photoshop, Illustrator, InDesign, Premiere Pro',
    duration: '2-3 months',
    cost: '$20.99/month',
    link: 'https://www.adobe.com/creativecloud.html',
    difficulty_level: 'Intermediate'
  },
  {
    title: 'UI/UX Design Bootcamp',
    type: 'course',
    provider: 'General Assembly',
    career_category: 'arts',
    skills_covered: 'User Research, Wireframing, Prototyping, Figma',
    duration: '3 months',
    cost: '$14,950',
    link: 'https://generalassemb.ly',
    difficulty_level: 'Intermediate'
  },
  {
    title: 'Medical Coding Certification (CPC)',
    type: 'certification',
    provider: 'AAPC',
    career_category: 'healthcare',
    skills_covered: 'Medical Coding, Healthcare Billing, ICD-10',
    duration: '4-6 months',
    cost: '$399 exam fee',
    link: 'https://www.aapc.com/certification/cpc/',
    difficulty_level: 'Intermediate'
  },
  {
    title: 'Certified Nursing Assistant (CNA)',
    type: 'certification',
    provider: 'State Board',
    career_category: 'healthcare',
    skills_covered: 'Patient Care, Medical Terminology, Basic Nursing Skills',
    duration: '4-12 weeks',
    cost: '$1,000-$2,000',
    link: 'Varies by state',
    difficulty_level: 'Beginner'
  }
];

// Initialize courses in database
db.serialize(() => {
  coursesDatabase.forEach(course => {
    db.run(
      `INSERT OR IGNORE INTO courses_certifications 
       (title, type, provider, career_category, skills_covered, duration, cost, link, difficulty_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course.title, course.type, course.provider, course.career_category, 
       course.skills_covered, course.duration, course.cost, course.link, course.difficulty_level]
    );
  });
});

// Get courses/certifications with filters
router.get('/', authenticateToken, (req, res) => {
  const { category, type, difficulty } = req.query;

  let query = 'SELECT * FROM courses_certifications WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND career_category = ?';
    params.push(category);
  }

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (difficulty) {
    query += ' AND difficulty_level = ?';
    params.push(difficulty);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, courses) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get user enrollments
    db.all(
      'SELECT course_id, status FROM user_course_enrollments WHERE user_id = ?',
      [req.user.id],
      (err, enrollments) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const enrollmentMap = {};
        enrollments.forEach(e => {
          enrollmentMap[e.course_id] = e.status;
        });

        const formattedCourses = courses.map(c => ({
          id: c.id,
          title: c.title,
          type: c.type,
          provider: c.provider,
          careerCategory: c.career_category,
          skillsCovered: c.skills_covered,
          duration: c.duration,
          cost: c.cost,
          link: c.link,
          difficultyLevel: c.difficulty_level,
          enrollmentStatus: enrollmentMap[c.id] || null
        }));

        res.json({ courses: formattedCourses });
      }
    );
  });
});

// Get personalized course recommendations
router.get('/recommendations', authenticateToken, (req, res) => {
  // Get user profile
  db.get(
    'SELECT * FROM profiles WHERE user_id = ?',
    [req.user.id],
    (err, profile) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found. Please complete your profile first.' });
      }

      const interests = profile.interests ? profile.interests.toLowerCase().split(',') : [];
      const skills = profile.skills ? profile.skills.toLowerCase().split(',') : [];
      const academicBg = profile.academic_background ? profile.academic_background.toLowerCase() : '';

      // Determine category based on profile
      let category = null;
      const allText = [...interests, ...skills, academicBg].join(' ');

      if (allText.includes('programming') || allText.includes('tech') || allText.includes('software') || 
          allText.includes('data') || allText.includes('computer')) {
        category = 'technology';
      } else if (allText.includes('business') || allText.includes('marketing') || allText.includes('finance')) {
        category = 'business';
      } else if (allText.includes('design') || allText.includes('art') || allText.includes('creative')) {
        category = 'arts';
      } else if (allText.includes('medical') || allText.includes('health') || allText.includes('nursing')) {
        category = 'healthcare';
      }

      // Get recommended courses
      let query = 'SELECT * FROM courses_certifications WHERE 1=1';
      const params = [];

      if (category) {
        query += ' AND career_category = ?';
        params.push(category);
      }

      query += ' ORDER BY created_at DESC LIMIT 10';

      db.all(query, params, (err, courses) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const formattedCourses = courses.map(c => ({
          id: c.id,
          title: c.title,
          type: c.type,
          provider: c.provider,
          careerCategory: c.career_category,
          skillsCovered: c.skills_covered,
          duration: c.duration,
          cost: c.cost,
          link: c.link,
          difficultyLevel: c.difficulty_level
        }));

        res.json({ recommendations: formattedCourses, category });
      });
    }
  );
});

// Enroll in a course
router.post('/:courseId/enroll', authenticateToken, (req, res) => {
  const { courseId } = req.params;
  const { status } = req.body;

  // Check if already enrolled
  db.get(
    'SELECT * FROM user_course_enrollments WHERE user_id = ? AND course_id = ?',
    [req.user.id, courseId],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing) {
        // Update status
        db.run(
          'UPDATE user_course_enrollments SET status = ? WHERE user_id = ? AND course_id = ?',
          [status || 'enrolled', req.user.id, courseId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to update enrollment' });
            }
            res.json({ message: 'Enrollment updated successfully' });
          }
        );
      } else {
        // Create new enrollment
        db.run(
          'INSERT INTO user_course_enrollments (user_id, course_id, status) VALUES (?, ?, ?)',
          [req.user.id, courseId, status || 'interested'],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to enroll' });
            }
            res.json({ message: 'Enrolled successfully', enrollmentId: this.lastID });
          }
        );
      }
    }
  );
});

// Get user's enrolled courses
router.get('/user/enrollments', authenticateToken, (req, res) => {
  db.all(
    `SELECT ue.*, cc.title, cc.type, cc.provider, cc.link, cc.duration, cc.cost
     FROM user_course_enrollments ue
     JOIN courses_certifications cc ON ue.course_id = cc.id
     WHERE ue.user_id = ?
     ORDER BY ue.enrolled_at DESC`,
    [req.user.id],
    (err, enrollments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedEnrollments = enrollments.map(e => ({
        id: e.id,
        courseId: e.course_id,
        title: e.title,
        type: e.type,
        provider: e.provider,
        link: e.link,
        duration: e.duration,
        cost: e.cost,
        status: e.status,
        enrolledAt: e.enrolled_at
      }));

      res.json({ enrollments: formattedEnrollments });
    }
  );
});

module.exports = router;
