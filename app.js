// API Base URL
const API_BASE = '/api';

// Auth token storage
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (authToken && currentUser) {
        showDashboard();
    } else {
        showAuth();
    }

    // Form handlers
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('profile-form').addEventListener('submit', handleProfileSave);
});

// Tab switching
function showTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBtn = document.querySelectorAll('.tab-btn')[0];
    const signupBtn = document.querySelectorAll('.tab-btn')[1];

    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        loginBtn.classList.remove('active');
        signupBtn.classList.add('active');
    }
}

// View switching
function showAuth() {
    document.getElementById('auth-view').classList.add('active');
    document.getElementById('dashboard-view').classList.remove('active');
}

function showDashboard() {
    document.getElementById('auth-view').classList.remove('active');
    document.getElementById('dashboard-view').classList.add('active');
    
    if (currentUser) {
        document.getElementById('user-name').textContent = `Welcome, ${currentUser.name}`;
    }
    
    // Show profile section by default
    showSection('profile');
    loadProfile();
}

// Login handler
async function handleLogin(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = '';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showDashboard();
        } else {
            errorDiv.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
    }
}

// Signup handler
async function handleSignup(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('signup-error');
    errorDiv.textContent = '';

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showDashboard();
        } else {
            errorDiv.textContent = data.error || 'Signup failed';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
    }
}

// Logout handler
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showAuth();
}

// Load profile
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const profile = await response.json();
            if (profile.interests) {
                document.getElementById('interests').value = profile.interests;
            }
            if (profile.skills) {
                document.getElementById('skills').value = profile.skills;
            }
            if (profile.academic_background) {
                document.getElementById('academic-background').value = profile.academic_background;
            }
            if (profile.education_level) {
                document.getElementById('education-level').value = profile.education_level;
            }
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// Save profile
async function handleProfileSave(e) {
    e.preventDefault();

    const interests = document.getElementById('interests').value;
    const skills = document.getElementById('skills').value;
    const academic_background = document.getElementById('academic-background').value;
    const education_level = document.getElementById('education-level').value;

    try {
        const response = await fetch(`${API_BASE}/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                interests,
                skills,
                academic_background,
                education_level
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Profile saved successfully!', 'success');
        } else {
            showMessage(data.error || 'Failed to save profile', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

// Get career suggestions
async function getSuggestions() {
    showSection('suggestions');
    const container = document.getElementById('suggestions-container');
    
    container.innerHTML = '<p>Loading suggestions...</p>';

    try {
        const response = await fetch(`${API_BASE}/career/suggestions`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displaySuggestions(data.suggestions);
        } else {
            container.innerHTML = `<p class="error-message">${data.error || 'Failed to load suggestions'}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

// Display suggestions
function displaySuggestions(suggestions) {
    const container = document.getElementById('suggestions-container');

    if (suggestions.length === 0) {
        container.innerHTML = '<p>No suggestions available. Please update your profile with more details.</p>';
        return;
    }

    container.innerHTML = suggestions.map(career => `
        <div class="career-card">
            <span class="category">${career.category.toUpperCase()}</span>
            <h4>${career.title}</h4>
            <p>${career.description}</p>
            <div class="details">
                <h5>Recommended Courses:</h5>
                <ul>
                    ${career.courses.map(course => `<li>${course}</li>`).join('')}
                </ul>
                <h5>Job Opportunities:</h5>
                <ul>
                    ${career.jobs.map(job => `<li>${job}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');
}

// Show message
function showMessage(message, type) {
    const profileForm = document.getElementById('profile-form');
    let messageDiv = profileForm.querySelector('.form-message');
    
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.className = 'form-message';
        profileForm.appendChild(messageDiv);
    }
    
    messageDiv.className = `form-message ${type === 'success' ? 'success-message' : 'error-message'}`;
    messageDiv.textContent = message;
    
    setTimeout(() => {
        messageDiv.textContent = '';
    }, 5000);
}

// Navigation between sections
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Activate corresponding nav tab
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabMap = {
        'profile': 'Profile',
        'suggestions': 'Career Suggestions',
        'roadmaps': 'Roadmaps',
        'quizzes': 'Quizzes',
        'courses': 'Courses',
        'skills': 'Skills',
        'mentors': 'Mentors'
    };
    
    navTabs.forEach(tab => {
        if (tab.textContent.trim() === tabMap[sectionName]) {
            tab.classList.add('active');
        }
    });
}

// ========== ROADMAPS ==========
async function loadRoadmaps() {
    const container = document.getElementById('roadmaps-container');
    container.innerHTML = '<p>Loading roadmaps...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/roadmaps`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.roadmaps.length === 0) {
                container.innerHTML = '<p>No roadmaps available.</p>';
                return;
            }
            
            container.innerHTML = data.roadmaps.map(roadmap => `
                <div class="roadmap-card">
                    <h4>${roadmap.title}</h4>
                    <p><strong>Duration:</strong> ${roadmap.estimatedTime}</p>
                    <p><strong>Difficulty:</strong> ${roadmap.difficulty}</p>
                    <p><strong>Steps:</strong> ${roadmap.stepsCount}</p>
                    <button onclick="startRoadmap('${roadmap.title}')" class="btn btn-primary">Start Roadmap</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

async function startRoadmap(careerTitle) {
    try {
        const response = await fetch(`${API_BASE}/roadmaps/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ careerTitle })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Roadmap started successfully!', 'success');
            loadMyRoadmaps();
        } else {
            showMessage(data.error || 'Failed to start roadmap', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

async function loadMyRoadmaps() {
    const container = document.getElementById('roadmaps-container');
    container.innerHTML = '<p>Loading your roadmaps...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/roadmaps/user/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.roadmaps.length === 0) {
                container.innerHTML = '<p>You haven\'t started any roadmaps yet. Browse available roadmaps to get started!</p>';
                return;
            }
            
            container.innerHTML = data.roadmaps.map(roadmap => `
                <div class="roadmap-card">
                    <h4>${roadmap.career}</h4>
                    <p><strong>Progress:</strong> Step ${roadmap.currentStep + 1} of ${roadmap.roadmapSteps.length}</p>
                    <p><strong>Duration:</strong> ${roadmap.estimatedTime}</p>
                    <div class="roadmap-steps">
                        ${roadmap.roadmapSteps.map((step, index) => `
                            <div class="roadmap-step ${index <= roadmap.currentStep ? 'completed' : ''}">
                                <strong>Step ${step.step}:</strong> ${step.title}
                                <p>${step.description}</p>
                                <small>Duration: ${step.duration}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

// ========== QUIZZES ==========
let currentQuiz = null;
let currentAnswers = [];

async function loadQuizzes() {
    const container = document.getElementById('quizzes-container');
    const quizContainer = document.getElementById('quiz-container');
    container.innerHTML = '<p>Loading quizzes...</p>';
    quizContainer.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/quizzes`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.quizzes.length === 0) {
                container.innerHTML = '<p>No quizzes available.</p>';
                return;
            }
            
            container.innerHTML = data.quizzes.map(quiz => `
                <div class="quiz-card">
                    <h4>${quiz.title}</h4>
                    <p>${quiz.description}</p>
                    <p><strong>Questions:</strong> ${quiz.questionCount}</p>
                    <button onclick="startQuiz('${quiz.id}')" class="btn btn-primary">Start Quiz</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

async function startQuiz(quizId) {
    try {
        const response = await fetch(`${API_BASE}/quizzes/${quizId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentQuiz = data;
            currentAnswers = [];
            displayQuiz(data);
        } else {
            showMessage(data.error || 'Failed to load quiz', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

function displayQuiz(quiz) {
    const container = document.getElementById('quizzes-container');
    const quizContainer = document.getElementById('quiz-container');
    
    container.style.display = 'none';
    quizContainer.style.display = 'block';
    
    quizContainer.innerHTML = `
        <h4>${quiz.title}</h4>
        <p>${quiz.description}</p>
        <form id="quiz-form">
            ${quiz.questions.map((q, index) => `
                <div class="quiz-question">
                    <h5>${index + 1}. ${q.question}</h5>
                    ${q.options.map((option, optIndex) => `
                        <label class="quiz-option">
                            <input type="radio" name="question-${index}" value="${optIndex}" required>
                            ${option}
                        </label>
                    `).join('')}
                </div>
            `).join('')}
            <button type="submit" class="btn btn-primary">Submit Quiz</button>
            <button type="button" onclick="cancelQuiz()" class="btn btn-secondary">Cancel</button>
        </form>
    `;
    
    document.getElementById('quiz-form').addEventListener('submit', submitQuiz);
}

function cancelQuiz() {
    document.getElementById('quizzes-container').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
    currentQuiz = null;
    currentAnswers = [];
}

async function submitQuiz(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const answers = [];
    
    for (let i = 0; i < currentQuiz.questions.length; i++) {
        answers.push(parseInt(formData.get(`question-${i}`)));
    }
    
    try {
        const response = await fetch(`${API_BASE}/quizzes/${currentQuiz.id || 'career-interest'}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ answers })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayQuizResults(data.result);
        } else {
            showMessage(data.error || 'Failed to submit quiz', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

function displayQuizResults(result) {
    const quizContainer = document.getElementById('quiz-container');
    
    quizContainer.innerHTML = `
        <h4>Quiz Results</h4>
        <div class="quiz-results">
            <p><strong>Total Score:</strong> ${result.totalScore}</p>
            <h5>Top Categories:</h5>
            <ul>
                ${result.topCategories.map(cat => `<li>${cat.category}: ${cat.score} points</li>`).join('')}
            </ul>
            <h5>Recommendations:</h5>
            <ul>
                ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
            <button onclick="loadQuizzes()" class="btn btn-primary">Back to Quizzes</button>
        </div>
    `;
}

async function loadQuizHistory() {
    const container = document.getElementById('quizzes-container');
    const quizContainer = document.getElementById('quiz-container');
    container.innerHTML = '<p>Loading quiz history...</p>';
    quizContainer.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/quizzes/user/history`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.attempts.length === 0) {
                container.innerHTML = '<p>You haven\'t taken any quizzes yet.</p>';
                return;
            }
            
            container.innerHTML = data.attempts.map(attempt => `
                <div class="quiz-card">
                    <h4>${attempt.quizTitle}</h4>
                    <p><strong>Score:</strong> ${attempt.score}</p>
                    <p><strong>Completed:</strong> ${new Date(attempt.completedAt).toLocaleDateString()}</p>
                    <details>
                        <summary>View Results</summary>
                        <div class="quiz-results">
                            <h5>Top Categories:</h5>
                            <ul>
                                ${attempt.result.topCategories.map(cat => `<li>${cat.category}: ${cat.score}</li>`).join('')}
                            </ul>
                        </div>
                    </details>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

// ========== COURSES ==========
async function loadCourseRecommendations() {
    const container = document.getElementById('courses-container');
    container.innerHTML = '<p>Loading recommendations...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/courses/recommendations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayCourses(data.recommendations, container);
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

async function loadAllCourses() {
    const container = document.getElementById('courses-container');
    container.innerHTML = '<p>Loading courses...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/courses`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayCourses(data.courses, container);
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

function displayCourses(courses, container) {
    if (courses.length === 0) {
        container.innerHTML = '<p>No courses available.</p>';
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="course-card">
            <span class="course-type">${course.type.toUpperCase()}</span>
            <h4>${course.title}</h4>
            <p><strong>Provider:</strong> ${course.provider}</p>
            <p><strong>Duration:</strong> ${course.duration}</p>
            <p><strong>Cost:</strong> ${course.cost}</p>
            <p><strong>Skills:</strong> ${course.skillsCovered}</p>
            <p><strong>Difficulty:</strong> ${course.difficultyLevel}</p>
            ${course.link ? `<a href="${course.link}" target="_blank" class="btn btn-secondary">Learn More</a>` : ''}
            <button onclick="enrollCourse(${course.id})" class="btn btn-primary">
                ${course.enrollmentStatus ? 'Update Enrollment' : 'Enroll'}
            </button>
        </div>
    `).join('');
}

async function enrollCourse(courseId) {
    try {
        const response = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: 'interested' })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Enrolled successfully!', 'success');
            loadMyCourses();
        } else {
            showMessage(data.error || 'Failed to enroll', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

async function loadMyCourses() {
    const container = document.getElementById('courses-container');
    container.innerHTML = '<p>Loading your enrollments...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/courses/user/enrollments`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.enrollments.length === 0) {
                container.innerHTML = '<p>You haven\'t enrolled in any courses yet.</p>';
                return;
            }
            
            container.innerHTML = data.enrollments.map(enrollment => `
                <div class="course-card">
                    <span class="course-type">${enrollment.type.toUpperCase()}</span>
                    <h4>${enrollment.title}</h4>
                    <p><strong>Provider:</strong> ${enrollment.provider}</p>
                    <p><strong>Status:</strong> ${enrollment.status}</p>
                    <p><strong>Enrolled:</strong> ${new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                    ${enrollment.link ? `<a href="${enrollment.link}" target="_blank" class="btn btn-secondary">Visit Course</a>` : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

// ========== SKILLS ==========
async function loadSkillRecommendations() {
    const container = document.getElementById('skills-container');
    container.innerHTML = '<p>Loading skill recommendations...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/skills/recommendations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.recommendations.length === 0) {
                container.innerHTML = '<p>No skill recommendations available. Please update your profile.</p>';
                return;
            }
            
            container.innerHTML = data.recommendations.map(skill => `
                <div class="skill-card">
                    <h4>${skill.skill}</h4>
                    <p><strong>Current Level:</strong> ${skill.currentLevel}</p>
                    <p><strong>Target Level:</strong> ${skill.targetLevel}</p>
                    <p><strong>Priority:</strong> <span class="priority-${skill.priority}">${skill.priority.toUpperCase()}</span></p>
                    <p>${skill.plan}</p>
                    <h5>Resources:</h5>
                    <ul>
                        ${skill.resources.map(resource => `<li>${resource}</li>`).join('')}
                    </ul>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

// ========== MENTORS ==========
async function loadMentorRecommendations() {
    const container = document.getElementById('mentors-container');
    container.innerHTML = '<p>Loading mentor recommendations...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/mentors/recommendations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayMentors(data.recommendations, container);
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

async function loadAllMentors() {
    const container = document.getElementById('mentors-container');
    container.innerHTML = '<p>Loading mentors...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/mentors`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayMentors(data.mentors, container);
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}

function displayMentors(mentors, container) {
    if (mentors.length === 0) {
        container.innerHTML = '<p>No mentors available.</p>';
        return;
    }
    
    container.innerHTML = mentors.map(mentor => `
        <div class="mentor-card">
            <h4>${mentor.name}</h4>
            <p><strong>Expertise:</strong> ${mentor.expertiseArea}</p>
            <p><strong>Experience:</strong> ${mentor.experienceYears} years</p>
            <p><strong>Rating:</strong> ${mentor.rating} ⭐</p>
            <p><strong>Status:</strong> ${mentor.availabilityStatus}</p>
            <p>${mentor.bio}</p>
            ${mentor.connectionStatus ? 
                `<p class="connection-status">Status: ${mentor.connectionStatus}</p>` :
                `<button onclick="requestMentorConnection(${mentor.id})" class="btn btn-primary">Request Connection</button>`
            }
        </div>
    `).join('');
}

async function requestMentorConnection(mentorId) {
    const message = prompt('Add a message to your connection request (optional):');
    
    try {
        const response = await fetch(`${API_BASE}/mentors/${mentorId}/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ message: message || '' })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Connection request sent successfully!', 'success');
            loadMyConnections();
        } else {
            showMessage(data.error || 'Failed to send request', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

async function loadMyConnections() {
    const container = document.getElementById('mentors-container');
    container.innerHTML = '<p>Loading your connections...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/mentors/user/connections`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.connections.length === 0) {
                container.innerHTML = '<p>You haven\'t connected with any mentors yet.</p>';
                return;
            }
            
            container.innerHTML = data.connections.map(connection => `
                <div class="mentor-card">
                    <h4>${connection.mentorName}</h4>
                    <p><strong>Expertise:</strong> ${connection.expertiseArea}</p>
                    <p><strong>Experience:</strong> ${connection.experienceYears} years</p>
                    <p><strong>Rating:</strong> ${connection.rating} ⭐</p>
                    <p><strong>Status:</strong> <span class="connection-status-${connection.status}">${connection.status.toUpperCase()}</span></p>
                    <p>${connection.bio}</p>
                    ${connection.message ? `<p><em>Your message: ${connection.message}</em></p>` : ''}
                    <p><small>Requested: ${new Date(connection.requestedAt).toLocaleDateString()}</small></p>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Network error. Please try again.</p>';
    }
}