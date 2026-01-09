const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Career suggestion logic
const getCareerSuggestions = (profile) => {
  const suggestions = [];
  const interests = profile.interests ? profile.interests.toLowerCase().split(',') : [];
  const skills = profile.skills ? profile.skills.toLowerCase().split(',') : [];
  const academicBg = profile.academic_background ? profile.academic_background.toLowerCase() : '';
  const educationLevel = profile.education_level ? profile.education_level.toLowerCase() : '';

  // Career database
  const careers = {
    technology: {
      careers: [
        {
          title: 'Software Developer',
          description: 'Design and develop software applications',
          required_skills: ['programming', 'problem solving', 'logic'],
          courses: ['Computer Science Degree', 'Full Stack Web Development Bootcamp', 'Python Certification'],
          jobs: ['Junior Software Developer', 'Frontend Developer', 'Backend Developer']
        },
        {
          title: 'Data Scientist',
          description: 'Analyze complex data to help organizations make decisions',
          required_skills: ['statistics', 'python', 'machine learning', 'data analysis'],
          courses: ['Data Science Master\'s', 'Machine Learning Course', 'Python for Data Science'],
          jobs: ['Junior Data Analyst', 'Data Scientist', 'ML Engineer']
        },
        {
          title: 'Cybersecurity Analyst',
          description: 'Protect organizations from cyber threats',
          required_skills: ['networking', 'security', 'problem solving'],
          courses: ['Cybersecurity Certification', 'Ethical Hacking Course', 'Network Security'],
          jobs: ['Security Analyst', 'Penetration Tester', 'Security Engineer']
        }
      ],
      keywords: ['programming', 'coding', 'technology', 'software', 'computer', 'tech', 'it', 'development', 'data', 'ai', 'machine learning']
    },
    healthcare: {
      careers: [
        {
          title: 'Medical Doctor',
          description: 'Diagnose and treat patients',
          required_skills: ['biology', 'chemistry', 'communication', 'empathy'],
          courses: ['Medical Degree (MBBS)', 'USMLE', 'Medical Residency Program'],
          jobs: ['Resident Doctor', 'General Practitioner', 'Specialist']
        },
        {
          title: 'Nurse',
          description: 'Provide patient care and support',
          required_skills: ['biology', 'communication', 'empathy', 'care'],
          courses: ['Nursing Degree (BSN)', 'NCLEX Certification', 'Clinical Nursing Programs'],
          jobs: ['Registered Nurse', 'Nurse Practitioner', 'Clinical Nurse']
        },
        {
          title: 'Pharmacist',
          description: 'Dispense medications and provide pharmaceutical care',
          required_skills: ['chemistry', 'biology', 'attention to detail'],
          courses: ['Pharmacy Degree', 'Pharmacy License Exam', 'Clinical Pharmacy'],
          jobs: ['Hospital Pharmacist', 'Community Pharmacist', 'Clinical Pharmacist']
        }
      ],
      keywords: ['health', 'medical', 'biology', 'medicine', 'patient', 'care', 'hospital', 'nursing', 'pharmacy']
    },
    business: {
      careers: [
        {
          title: 'Business Analyst',
          description: 'Analyze business processes and recommend improvements',
          required_skills: ['analysis', 'communication', 'problem solving', 'business'],
          courses: ['MBA', 'Business Analysis Certification', 'Project Management'],
          jobs: ['Junior Business Analyst', 'Business Analyst', 'Senior Business Analyst']
        },
        {
          title: 'Marketing Manager',
          description: 'Develop and implement marketing strategies',
          required_skills: ['communication', 'creativity', 'marketing', 'social media'],
          courses: ['Marketing Degree', 'Digital Marketing Course', 'Google Analytics Certification'],
          jobs: ['Marketing Coordinator', 'Marketing Manager', 'Digital Marketing Specialist']
        },
        {
          title: 'Financial Analyst',
          description: 'Analyze financial data and provide investment recommendations',
          required_skills: ['mathematics', 'analysis', 'finance', 'accounting'],
          courses: ['Finance Degree', 'CFA Certification', 'Financial Modeling Course'],
          jobs: ['Junior Financial Analyst', 'Financial Analyst', 'Investment Analyst']
        }
      ],
      keywords: ['business', 'finance', 'marketing', 'management', 'economics', 'accounting', 'entrepreneurship']
    },
    arts: {
      careers: [
        {
          title: 'Graphic Designer',
          description: 'Create visual concepts using computer software',
          required_skills: ['creativity', 'design', 'photoshop', 'illustrator'],
          courses: ['Graphic Design Degree', 'Adobe Creative Suite Course', 'UI/UX Design Bootcamp'],
          jobs: ['Junior Graphic Designer', 'Graphic Designer', 'Creative Director']
        },
        {
          title: 'Writer/Content Creator',
          description: 'Create written content for various media',
          required_skills: ['writing', 'creativity', 'communication', 'research'],
          courses: ['Creative Writing Degree', 'Content Writing Course', 'Copywriting Certification'],
          jobs: ['Content Writer', 'Copywriter', 'Technical Writer']
        }
      ],
      keywords: ['art', 'design', 'creative', 'writing', 'media', 'graphic', 'illustration', 'photography']
    },
    engineering: {
      careers: [
        {
          title: 'Mechanical Engineer',
          description: 'Design and develop mechanical systems',
          required_skills: ['physics', 'mathematics', 'mechanics', 'design'],
          courses: ['Mechanical Engineering Degree', 'CAD Certification', 'Engineering Internship'],
          jobs: ['Junior Mechanical Engineer', 'Mechanical Engineer', 'Senior Engineer']
        },
        {
          title: 'Civil Engineer',
          description: 'Plan, design, and oversee construction projects',
          required_skills: ['mathematics', 'physics', 'construction', 'planning'],
          courses: ['Civil Engineering Degree', 'Structural Engineering Course', 'Project Management'],
          jobs: ['Junior Civil Engineer', 'Site Engineer', 'Project Engineer']
        }
      ],
      keywords: ['engineering', 'mechanical', 'civil', 'electrical', 'physics', 'construction', 'design']
    }
  };

  // Match user profile with careers
  const allKeywords = [...interests, ...skills, academicBg, educationLevel].join(' ').toLowerCase();

  Object.keys(careers).forEach(category => {
    const careerSet = careers[category];
    const matchScore = careerSet.keywords.filter(keyword => 
      allKeywords.includes(keyword)
    ).length;

    if (matchScore > 0) {
      careerSet.careers.forEach(career => {
        const careerMatchScore = career.required_skills.filter(skill =>
          skills.includes(skill) || interests.includes(skill)
        ).length;

        if (careerMatchScore >= 1 || matchScore >= 2) {
          suggestions.push({
            ...career,
            category,
            match_score: careerMatchScore + matchScore
          });
        }
      });
    }
  });

  // Sort by match score and return top 6
  return suggestions
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 6);
};

// Get career suggestions
router.get('/suggestions', authenticateToken, (req, res) => {
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

      const suggestions = getCareerSuggestions(profile);
      res.json({ suggestions });
    }
  );
});

module.exports = router;
