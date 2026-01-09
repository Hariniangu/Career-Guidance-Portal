const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Skill improvement resources
const skillResources = {
  'programming': {
    beginner: ['Codecademy - Learn to Code', 'freeCodeCamp - JavaScript', 'Python.org Tutorial'],
    intermediate: ['LeetCode - Practice Problems', 'Full Stack Open', 'The Odin Project'],
    advanced: ['System Design Interview', 'Clean Code Book', 'Design Patterns']
  },
  'data analysis': {
    beginner: ['Excel Basics Course', 'SQL Tutorial', 'Introduction to Data Analysis'],
    intermediate: ['Pandas Documentation', 'Tableau Training', 'Data Analysis with Python'],
    advanced: ['Advanced SQL', 'Statistical Analysis', 'Machine Learning for Data Analysis']
  },
  'communication': {
    beginner: ['Public Speaking Basics', 'Business Writing Course', 'Active Listening'],
    intermediate: ['Presentation Skills', 'Negotiation Course', 'Cross-Cultural Communication'],
    advanced: ['Executive Communication', 'Crisis Communication', 'Strategic Communication']
  },
  'leadership': {
    beginner: ['Leadership Fundamentals', 'Team Management Basics', 'Delegation Skills'],
    intermediate: ['Project Leadership', 'Change Management', 'Conflict Resolution'],
    advanced: ['Strategic Leadership', 'Organizational Development', 'Executive Leadership']
  },
  'design': {
    beginner: ['Design Principles', 'Adobe Basics', 'Color Theory'],
    intermediate: ['UI/UX Design Course', 'Typography Mastery', 'Design Systems'],
    advanced: ['Advanced Design Patterns', 'Design Leadership', 'Creative Strategy']
  }
};

// Get skill recommendations for user
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

      const userSkills = profile.skills ? profile.skills.toLowerCase().split(',').map(s => s.trim()) : [];
      const interests = profile.interests ? profile.interests.toLowerCase().split(',').map(i => i.trim()) : [];
      
      // Get career suggestions to determine needed skills
      const allKeywords = [...userSkills, ...interests].join(' ');

      // Determine career focus
      let careerFocus = 'general';
      if (allKeywords.includes('programming') || allKeywords.includes('tech') || allKeywords.includes('software')) {
        careerFocus = 'technology';
      } else if (allKeywords.includes('business') || allKeywords.includes('marketing')) {
        careerFocus = 'business';
      } else if (allKeywords.includes('design') || allKeywords.includes('art')) {
        careerFocus = 'arts';
      }

      // Generate skill recommendations
      const recommendations = generateSkillRecommendations(userSkills, careerFocus);

      // Save recommendations to database
      db.run('DELETE FROM skill_recommendations WHERE user_id = ?', [req.user.id], () => {
        recommendations.forEach(rec => {
          db.run(
            'INSERT INTO skill_recommendations (user_id, skill_name, current_level, target_level, improvement_plan, resources) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, rec.skill, rec.currentLevel, rec.targetLevel, rec.plan, JSON.stringify(rec.resources)]
          );
        });

        res.json({ recommendations });
      });
    }
  );
});

// Get saved skill recommendations
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM skill_recommendations WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, recommendations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formatted = recommendations.map(r => ({
        id: r.id,
        skill: r.skill_name,
        currentLevel: r.current_level,
        targetLevel: r.target_level,
        improvementPlan: r.improvement_plan,
        resources: JSON.parse(r.resources || '[]'),
        createdAt: r.created_at
      }));

      res.json({ recommendations: formatted });
    }
  );
});

// Update skill level
router.put('/:skillId', authenticateToken, (req, res) => {
  const { skillId } = req.params;
  const { currentLevel, targetLevel } = req.body;

  db.run(
    'UPDATE skill_recommendations SET current_level = ?, target_level = ? WHERE id = ? AND user_id = ?',
    [currentLevel, targetLevel, skillId, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update skill' });
      }
      res.json({ message: 'Skill updated successfully' });
    }
  );
});

function generateSkillRecommendations(userSkills, careerFocus) {
  const recommendations = [];
  const skillMap = {
    technology: {
      essential: ['programming', 'problem solving', 'data structures', 'algorithms'],
      important: ['version control', 'testing', 'debugging', 'system design'],
      niceToHave: ['cloud computing', 'devops', 'security', 'machine learning']
    },
    business: {
      essential: ['communication', 'analysis', 'project management', 'data analysis'],
      important: ['presentation', 'negotiation', 'strategic thinking', 'financial analysis'],
      niceToHave: ['leadership', 'change management', 'business intelligence', 'consulting']
    },
    arts: {
      essential: ['design', 'creativity', 'visual communication', 'typography'],
      important: ['user experience', 'branding', 'illustration', 'photography'],
      niceToHave: ['animation', '3d modeling', 'video editing', 'art direction']
    }
  };

  const careerSkills = skillMap[careerFocus] || skillMap.technology;
  const allSkills = [...careerSkills.essential, ...careerSkills.important, ...careerSkills.niceToHave];

  // Find skills user doesn't have or needs improvement
  allSkills.forEach(skill => {
    const hasSkill = userSkills.some(us => us.includes(skill) || skill.includes(us));
    
    if (!hasSkill || Math.random() > 0.5) { // Recommend if missing or randomly for improvement
      const currentLevel = hasSkill ? 'intermediate' : 'beginner';
      const targetLevel = hasSkill ? 'advanced' : 'intermediate';
      
      const resources = skillResources[skill] 
        ? skillResources[skill][currentLevel] || skillResources[skill]['beginner']
        : ['Online courses', 'Practice projects', 'Community forums'];

      recommendations.push({
        skill,
        currentLevel,
        targetLevel,
        plan: `Focus on ${skill} to advance your ${careerFocus} career. Start with ${currentLevel} level resources and progress to ${targetLevel}.`,
        resources,
        priority: careerSkills.essential.includes(skill) ? 'high' : 
                  careerSkills.important.includes(skill) ? 'medium' : 'low'
      });
    }
  });

  return recommendations.slice(0, 8); // Return top 8 recommendations
}

module.exports = router;
