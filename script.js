// Math Buddys - Main JavaScript File
// Interactive learning platform for NYS K-6 Math Standards

// ============================================
// GLOBAL STATE MANAGEMENT
// ============================================

const MathBuddys = {
    currentGrade: null,
    currentLesson: null,
    userProgress: {},
    
    init() {
        this.loadProgress();
        setupEventListeners();
        setupSmoothScroll();
        setupMobileMenu();
    },
    
    loadProgress() {
        const saved = localStorage.getItem('mathBuddysProgress');
        if (saved) {
            this.userProgress = JSON.parse(saved);
        }
    },
    
    saveProgress() {
        localStorage.setItem('mathBuddysProgress', JSON.stringify(this.userProgress));
    }
};

// ============================================
// NAVIGATION & PAGE INTERACTIONS
// ============================================

function setupEventListeners() {
    // Grade card clicks
    document.querySelectorAll('.grade-card').forEach(card => {
        card.addEventListener('click', function() {
            const grade = this.dataset.grade;
            navigateToGrade(grade);
        });
    });
    
    // Lesson navigation
    document.querySelectorAll('.lesson-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const lessonId = this.dataset.lesson;
            loadLesson(lessonId);
        });
    });
    
    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            window.history.back();
        });
    });
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function setupMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
}

// ============================================
// INTERACTIVE PRACTICE PROBLEMS
// ============================================

class PracticeProblem {
    constructor(problemId, question, answer, explanation, hints = []) {
        this.problemId = problemId;
        this.question = question;
        this.answer = answer;
        this.explanation = explanation;
        this.hints = hints;
        this.attempts = 0;
        this.solved = false;
    }
    
    checkAnswer(userAnswer) {
        this.attempts++;
        
        // Normalize answers for comparison
        const normalized = this.normalizeAnswer(userAnswer);
        const correctNormalized = this.normalizeAnswer(this.answer.toString());
        
        if (normalized === correctNormalized) {
            this.solved = true;
            return {
                correct: true,
                message: "Excellent work! That's correct!",
                explanation: this.explanation
            };
        } else {
            return {
                correct: false,
                message: this.attempts === 1 ? "Not quite. Try again!" : "Keep trying! You've got this!",
                hint: this.getHint()
            };
        }
    }
    
    normalizeAnswer(answer) {
        // Remove spaces, convert to lowercase, handle fractions
        return answer.toString().trim().toLowerCase().replace(/\s+/g, '');
    }
    
    getHint() {
        if (this.hints.length > 0 && this.attempts <= this.hints.length) {
            return this.hints[this.attempts - 1];
        }
        return null;
    }
}

// ============================================
// PROBLEM SET MANAGER
// ============================================

class ProblemSet {
    constructor(lessonId, problems) {
        this.lessonId = lessonId;
        this.problems = problems.map(p => new PracticeProblem(
            p.id, p.question, p.answer, p.explanation, p.hints
        ));
        this.currentProblemIndex = 0;
        this.score = 0;
    }
    
    getCurrentProblem() {
        return this.problems[this.currentProblemIndex];
    }
    
    nextProblem() {
        if (this.currentProblemIndex < this.problems.length - 1) {
            this.currentProblemIndex++;
            return this.getCurrentProblem();
        }
        return null;
    }
    
    previousProblem() {
        if (this.currentProblemIndex > 0) {
            this.currentProblemIndex--;
            return this.getCurrentProblem();
        }
        return null;
    }
    
    getProgress() {
        const solved = this.problems.filter(p => p.solved).length;
        return {
            current: this.currentProblemIndex + 1,
            total: this.problems.length,
            solved: solved,
            percentage: Math.round((solved / this.problems.length) * 100)
        };
    }
}

// ============================================
// UI RENDERING FOR PRACTICE PROBLEMS
// ============================================

function renderPracticeProblem(problem, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    container.innerHTML = `
        <div class="practice-problem" data-problem-id="${problem.problemId}">
            <div class="problem-header">
                <h3>Practice Problem</h3>
                <span class="problem-number">#${problem.problemId}</span>
            </div>
            
            <div class="problem-question">
                <p>${problem.question}</p>
            </div>
            
            <div class="problem-input-area">
                <label for="answer-input">Your Answer:</label>
                <input 
                    type="text" 
                    id="answer-input" 
                    class="answer-input" 
                    placeholder="Enter your answer"
                    autocomplete="off"
                >
                <button class="btn btn-primary submit-answer">Submit Answer</button>
                <button class="btn btn-secondary show-hint" style="display: none;">Show Hint</button>
            </div>
            
            <div class="feedback-area" style="display: none;">
                <div class="feedback-message"></div>
                <div class="hint-box" style="display: none;"></div>
                <div class="explanation-box" style="display: none;"></div>
            </div>
            
            <div class="problem-actions">
                <button class="btn btn-outline try-again" style="display: none;">Try Again</button>
                <button class="btn btn-outline reveal-answer">Reveal Answer</button>
            </div>
        </div>
    `;
    
    setupProblemInteractions(problem, container);
}

function setupProblemInteractions(problem, container) {
    const input = container.querySelector('.answer-input');
    const submitBtn = container.querySelector('.submit-answer');
    const hintBtn = container.querySelector('.show-hint');
    const tryAgainBtn = container.querySelector('.try-again');
    const revealBtn = container.querySelector('.reveal-answer');
    const feedbackArea = container.querySelector('.feedback-area');
    const feedbackMessage = container.querySelector('.feedback-message');
    const hintBox = container.querySelector('.hint-box');
    const explanationBox = container.querySelector('.explanation-box');
    
    // Submit answer
    submitBtn.addEventListener('click', () => handleSubmit());
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });
    
    function handleSubmit() {
        const userAnswer = input.value.trim();
        if (!userAnswer) {
            showFeedback('Please enter an answer.', 'warning');
            return;
        }
        
        const result = problem.checkAnswer(userAnswer);
        feedbackArea.style.display = 'block';
        
        if (result.correct) {
            feedbackMessage.className = 'feedback-message correct';
            feedbackMessage.textContent = result.message;
            explanationBox.style.display = 'block';
            explanationBox.innerHTML = `<strong>Explanation:</strong> ${result.explanation}`;
            
            input.disabled = true;
            submitBtn.disabled = true;
            tryAgainBtn.style.display = 'none';
            
            // Celebration animation
            celebrateCorrectAnswer(container);
            
            // Save progress
            updateProgress(problem.problemId, true);
            
        } else {
            feedbackMessage.className = 'feedback-message incorrect';
            feedbackMessage.textContent = result.message;
            
            if (result.hint) {
                hintBtn.style.display = 'inline-block';
                hintBtn.onclick = () => {
                    hintBox.style.display = 'block';
                    hintBox.innerHTML = `<strong>Hint:</strong> ${result.hint}`;
                };
            }
            
            tryAgainBtn.style.display = 'inline-block';
            input.select();
        }
    }
    
    // Try again
    tryAgainBtn.addEventListener('click', () => {
        input.value = '';
        input.disabled = false;
        input.focus();
        feedbackArea.style.display = 'none';
        hintBox.style.display = 'none';
        tryAgainBtn.style.display = 'none';
    });
    
    // Reveal answer
    revealBtn.addEventListener('click', () => {
        feedbackArea.style.display = 'block';
        feedbackMessage.className = 'feedback-message reveal';
        feedbackMessage.innerHTML = `<strong>Answer:</strong> ${problem.answer}`;
        explanationBox.style.display = 'block';
        explanationBox.innerHTML = `<strong>Explanation:</strong> ${problem.explanation}`;
        
        input.value = problem.answer;
        input.disabled = true;
        submitBtn.disabled = true;
        
        updateProgress(problem.problemId, false);
    });
}

function celebrateCorrectAnswer(container) {
    container.classList.add('correct-celebration');
    setTimeout(() => {
        container.classList.remove('correct-celebration');
    }, 1000);
}

// ============================================
// PROBLEM SET NAVIGATION
// ============================================

function renderProblemSet(problemSet, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const progress = problemSet.getProgress();
    
    container.innerHTML = `
        <div class="problem-set-container">
            <div class="problem-set-header">
                <h2>Practice Problems</h2>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                    </div>
                    <span class="progress-text">${progress.solved} / ${progress.total} completed</span>
                </div>
            </div>
            
            <div class="current-problem-container"></div>
            
            <div class="problem-set-navigation">
                <button class="btn btn-outline prev-problem" ${progress.current === 1 ? 'disabled' : ''}>
                    ← Previous
                </button>
                <span class="problem-counter">Problem ${progress.current} of ${progress.total}</span>
                <button class="btn btn-outline next-problem" ${progress.current === progress.total ? 'disabled' : ''}>
                    Next →
                </button>
            </div>
        </div>
    `;
    
    // Render current problem
    renderPracticeProblem(problemSet.getCurrentProblem(), '.current-problem-container');
    
    // Setup navigation
    const prevBtn = container.querySelector('.prev-problem');
    const nextBtn = container.querySelector('.next-problem');
    
    prevBtn.addEventListener('click', () => {
        const prev = problemSet.previousProblem();
        if (prev) {
            renderProblemSet(problemSet, containerSelector);
        }
    });
    
    nextBtn.addEventListener('click', () => {
        const next = problemSet.nextProblem();
        if (next) {
            renderProblemSet(problemSet, containerSelector);
        }
    });
}

// ============================================
// PROGRESS TRACKING
// ============================================

function updateProgress(problemId, solved) {
    const grade = MathBuddys.currentGrade;
    const lesson = MathBuddys.currentLesson;
    
    if (!MathBuddys.userProgress[grade]) {
        MathBuddys.userProgress[grade] = {};
    }
    
    if (!MathBuddys.userProgress[grade][lesson]) {
        MathBuddys.userProgress[grade][lesson] = {
            problems: {},
            completed: false
        };
    }
    
    MathBuddys.userProgress[grade][lesson].problems[problemId] = {
        solved: solved,
        timestamp: new Date().toISOString()
    };
    
    MathBuddys.saveProgress();
    updateProgressDisplay();
}

function updateProgressDisplay() {
    const progressIndicators = document.querySelectorAll('.progress-indicator');
    progressIndicators.forEach(indicator => {
        const grade = indicator.dataset.grade;
        const lesson = indicator.dataset.lesson;
        
        if (MathBuddys.userProgress[grade]?.[lesson]) {
            const lessonProgress = MathBuddys.userProgress[grade][lesson];
            const solvedCount = Object.values(lessonProgress.problems).filter(p => p.solved).length;
            indicator.textContent = `${solvedCount} completed`;
            indicator.classList.add('has-progress');
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showFeedback(message, type = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `feedback-toast ${type}`;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        feedback.classList.remove('show');
        setTimeout(() => feedback.remove(), 300);
    }, 3000);
}

function formatNumber(num) {
    return num.toLocaleString();
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================
// ANIMATIONS & EFFECTS
// ============================================

function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

function addRippleEffect() {
    document.querySelectorAll('.btn, .card').forEach(element => {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

function setupAccessibility() {
    // Keyboard navigation for cards
    document.querySelectorAll('.grade-card, .lesson-card').forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // Skip to main content
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const main = document.querySelector('main');
            if (main) {
                main.setAttribute('tabindex', '-1');
                main.focus();
            }
        });
    }
    
    // Announce dynamic content changes
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.className = 'sr-only';
    document.body.appendChild(ariaLive);
    
    window.announceToScreenReader = (message) => {
        ariaLive.textContent = message;
        setTimeout(() => ariaLive.textContent = '', 1000);
    };
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    MathBuddys.init();
    animateOnScroll();
    addRippleEffect();
    setupAccessibility();
    updateProgressDisplay();
    
    console.log('Math Buddys initialized successfully! 📚✨');
});

// ============================================
// EXPORT FOR MODULE USE (if needed)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MathBuddys,
        PracticeProblem,
        ProblemSet,
        renderPracticeProblem,
        renderProblemSet
    };
}
