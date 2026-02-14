/**
 * Obsero Course Framework
 * Handles navigation, progress, quizzes, and simulations
 */

class ObseroCourse {
    constructor(config) {
        this.config = {
            courseId: config.courseId || 'course',
            courseTitle: config.courseTitle || 'Course',
            passingScore: config.passingScore || 80,
            modules: config.modules || [],
            ...config
        };
        
        this.state = {
            currentModule: 0,
            currentSlide: 0,
            completedModules: [],
            quizAnswers: {},
            quizScores: {},
            startTime: Date.now(),
            totalTime: 0
        };
        
        this.init();
    }
    
    init() {
        // Load saved progress
        const savedState = SCORM.getSuspendData();
        if (savedState) {
            this.state = { ...this.state, ...savedState };
        }
        
        // Load bookmarked position
        const bookmark = SCORM.getBookmark();
        if (bookmark) {
            const [mod, slide] = bookmark.split(':').map(Number);
            this.state.currentModule = mod || 0;
            this.state.currentSlide = slide || 0;
        }
        
        this.render();
        this.bindEvents();
    }
    
    render() {
        this.updateProgress();
        this.updateNavigation();
        this.loadContent();
    }
    
    updateProgress() {
        const totalModules = this.config.modules.length;
        const completed = this.state.completedModules.length;
        const percent = Math.round((completed / totalModules) * 100);
        
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${percent}% Complete`;
        
        // Update module list
        const moduleList = document.querySelector('.module-list');
        if (moduleList) {
            moduleList.innerHTML = this.config.modules.map((mod, i) => `
                <div class="module-item ${i === this.state.currentModule ? 'active' : ''} 
                            ${this.state.completedModules.includes(i) ? 'completed' : ''}"
                     data-module="${i}">
                    <span class="module-status">
                        ${this.state.completedModules.includes(i) ? '✓' : (i + 1)}
                    </span>
                    <span class="module-title">${mod.title}</span>
                </div>
            `).join('');
        }
    }
    
    updateNavigation() {
        const prevBtn = document.querySelector('.btn-prev');
        const nextBtn = document.querySelector('.btn-next');
        
        const module = this.config.modules[this.state.currentModule];
        const isFirstSlide = this.state.currentModule === 0 && this.state.currentSlide === 0;
        const isLastModule = this.state.currentModule === this.config.modules.length - 1;
        const isLastSlide = this.state.currentSlide === module.slides.length - 1;
        
        if (prevBtn) prevBtn.disabled = isFirstSlide;
        if (nextBtn) {
            if (isLastModule && isLastSlide) {
                nextBtn.textContent = 'Complete Course';
                nextBtn.classList.add('btn-complete');
            } else if (isLastSlide) {
                nextBtn.textContent = 'Next Module →';
            } else {
                nextBtn.textContent = 'Continue →';
                nextBtn.classList.remove('btn-complete');
            }
        }
    }
    
    loadContent() {
        const contentArea = document.querySelector('.content-area');
        const module = this.config.modules[this.state.currentModule];
        const slide = module.slides[this.state.currentSlide];
        
        if (!contentArea || !slide) return;
        
        // Update module header
        const moduleHeader = document.querySelector('.module-header');
        if (moduleHeader) {
            moduleHeader.innerHTML = `
                <span class="module-number">Module ${this.state.currentModule + 1}</span>
                <h2 class="module-name">${module.title}</h2>
                <span class="slide-counter">${this.state.currentSlide + 1} / ${module.slides.length}</span>
            `;
        }
        
        // Render slide content based on type
        switch (slide.type) {
            case 'content':
                contentArea.innerHTML = this.renderContentSlide(slide);
                break;
            case 'quiz':
                contentArea.innerHTML = this.renderQuizSlide(slide);
                this.bindQuizEvents();
                break;
            case 'simulation':
                contentArea.innerHTML = this.renderSimulationSlide(slide);
                this.bindSimulationEvents();
                break;
            case 'video':
                contentArea.innerHTML = this.renderVideoSlide(slide);
                break;
            default:
                contentArea.innerHTML = this.renderContentSlide(slide);
        }
        
        // Save bookmark
        SCORM.setBookmark(`${this.state.currentModule}:${this.state.currentSlide}`);
        SCORM.commit();
    }
    
    renderContentSlide(slide) {
        return `
            <div class="slide-content">
                ${slide.title ? `<h3 class="slide-title">${slide.title}</h3>` : ''}
                <div class="slide-body">${slide.content}</div>
                ${slide.sources ? this.renderSources(slide.sources) : ''}
            </div>
        `;
    }
    
    renderQuizSlide(slide) {
        const quizId = `${this.state.currentModule}-${this.state.currentSlide}`;
        const previousAnswer = this.state.quizAnswers[quizId];
        
        return `
            <div class="quiz-container" data-quiz-id="${quizId}">
                <div class="quiz-header">
                    <span class="quiz-badge">Knowledge Check</span>
                </div>
                <h3 class="quiz-question">${slide.question}</h3>
                <div class="quiz-options">
                    ${slide.options.map((opt, i) => `
                        <label class="quiz-option ${previousAnswer === i ? 'selected' : ''}">
                            <input type="radio" name="quiz-${quizId}" value="${i}" 
                                   ${previousAnswer === i ? 'checked' : ''}>
                            <span class="option-marker">${String.fromCharCode(65 + i)}</span>
                            <span class="option-text">${opt}</span>
                        </label>
                    `).join('')}
                </div>
                <button class="btn btn-check-answer" ${previousAnswer !== undefined ? 'disabled' : ''}>
                    Check Answer
                </button>
                <div class="quiz-feedback"></div>
            </div>
        `;
    }
    
    renderSimulationSlide(slide) {
        return `
            <div class="simulation-container">
                <div class="simulation-header">
                    <span class="simulation-badge">🎯 Interactive Scenario</span>
                </div>
                <div class="simulation-scenario">
                    <h3>${slide.scenario}</h3>
                    <p>${slide.context}</p>
                </div>
                <div class="simulation-choices">
                    ${slide.choices.map((choice, i) => `
                        <button class="simulation-choice" data-choice="${i}" data-correct="${choice.correct || false}">
                            <span class="choice-text">${choice.text}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="simulation-feedback"></div>
            </div>
        `;
    }
    
    renderVideoSlide(slide) {
        return `
            <div class="video-container">
                ${slide.title ? `<h3 class="slide-title">${slide.title}</h3>` : ''}
                <div class="video-wrapper">
                    <video controls>
                        <source src="${slide.videoUrl}" type="video/mp4">
                        Your browser does not support video playback.
                    </video>
                </div>
                ${slide.transcript ? `
                    <details class="video-transcript">
                        <summary>View Transcript</summary>
                        <div class="transcript-content">${slide.transcript}</div>
                    </details>
                ` : ''}
            </div>
        `;
    }
    
    renderSources(sources) {
        return `
            <div class="sources">
                <details>
                    <summary>📚 Sources & References</summary>
                    <ul class="source-list">
                        ${sources.map(s => `
                            <li>
                                <a href="${s.url}" target="_blank" rel="noopener noreferrer">
                                    ${s.title}
                                </a>
                                <span class="source-org">${s.org || ''}</span>
                            </li>
                        `).join('')}
                    </ul>
                </details>
            </div>
        `;
    }
    
    bindEvents() {
        // Navigation buttons
        document.querySelector('.btn-prev')?.addEventListener('click', () => this.prev());
        document.querySelector('.btn-next')?.addEventListener('click', () => this.next());
        
        // Module list clicks
        document.querySelector('.module-list')?.addEventListener('click', (e) => {
            const item = e.target.closest('.module-item');
            if (item) {
                const moduleIndex = parseInt(item.dataset.module);
                if (this.canAccessModule(moduleIndex)) {
                    this.goToModule(moduleIndex);
                }
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
        });
    }
    
    bindQuizEvents() {
        const checkBtn = document.querySelector('.btn-check-answer');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkQuizAnswer());
        }
    }
    
    bindSimulationEvents() {
        document.querySelectorAll('.simulation-choice').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSimulationChoice(e));
        });
    }
    
    checkQuizAnswer() {
        const quizContainer = document.querySelector('.quiz-container');
        const quizId = quizContainer.dataset.quizId;
        const selected = document.querySelector(`input[name="quiz-${quizId}"]:checked`);
        
        if (!selected) {
            alert('Please select an answer');
            return;
        }
        
        const answerIndex = parseInt(selected.value);
        const module = this.config.modules[this.state.currentModule];
        const slide = module.slides[this.state.currentSlide];
        const isCorrect = answerIndex === slide.correctAnswer;
        
        // Save answer
        this.state.quizAnswers[quizId] = answerIndex;
        
        // Show feedback
        const feedback = document.querySelector('.quiz-feedback');
        feedback.innerHTML = `
            <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong>
                <p>${slide.explanation || ''}</p>
            </div>
        `;
        
        // Disable further changes
        document.querySelectorAll('.quiz-option input').forEach(input => input.disabled = true);
        document.querySelector('.btn-check-answer').disabled = true;
        
        // Highlight correct/incorrect
        document.querySelectorAll('.quiz-option').forEach((opt, i) => {
            if (i === slide.correctAnswer) opt.classList.add('correct');
            else if (i === answerIndex) opt.classList.add('incorrect');
        });
        
        this.saveProgress();
    }
    
    handleSimulationChoice(e) {
        const btn = e.target.closest('.simulation-choice');
        const isCorrect = btn.dataset.correct === 'true';
        const choiceIndex = parseInt(btn.dataset.choice);
        
        const module = this.config.modules[this.state.currentModule];
        const slide = module.slides[this.state.currentSlide];
        const choice = slide.choices[choiceIndex];
        
        // Show feedback
        const feedback = document.querySelector('.simulation-feedback');
        feedback.innerHTML = `
            <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>${isCorrect ? '✓ Great choice!' : '✗ Not quite right'}</strong>
                <p>${choice.feedback || ''}</p>
            </div>
        `;
        
        // Highlight selection
        document.querySelectorAll('.simulation-choice').forEach(b => {
            b.disabled = true;
            if (b.dataset.correct === 'true') b.classList.add('correct');
        });
        btn.classList.add(isCorrect ? 'selected-correct' : 'selected-incorrect');
        
        this.saveProgress();
    }
    
    next() {
        const module = this.config.modules[this.state.currentModule];
        
        if (this.state.currentSlide < module.slides.length - 1) {
            // Next slide in current module
            this.state.currentSlide++;
        } else if (this.state.currentModule < this.config.modules.length - 1) {
            // Complete current module, go to next
            this.completeModule(this.state.currentModule);
            this.state.currentModule++;
            this.state.currentSlide = 0;
        } else {
            // Course complete
            this.completeModule(this.state.currentModule);
            this.completeCourse();
            return;
        }
        
        this.render();
    }
    
    prev() {
        if (this.state.currentSlide > 0) {
            this.state.currentSlide--;
        } else if (this.state.currentModule > 0) {
            this.state.currentModule--;
            const prevModule = this.config.modules[this.state.currentModule];
            this.state.currentSlide = prevModule.slides.length - 1;
        }
        
        this.render();
    }
    
    goToModule(moduleIndex) {
        this.state.currentModule = moduleIndex;
        this.state.currentSlide = 0;
        this.render();
    }
    
    canAccessModule(moduleIndex) {
        // Can always access completed modules or the current one
        if (moduleIndex <= this.state.currentModule) return true;
        // Can access next module if previous is complete
        return this.state.completedModules.includes(moduleIndex - 1);
    }
    
    completeModule(moduleIndex) {
        if (!this.state.completedModules.includes(moduleIndex)) {
            this.state.completedModules.push(moduleIndex);
            this.saveProgress();
        }
    }
    
    completeCourse() {
        // Calculate final score
        const score = this.calculateScore();
        const passed = score >= this.config.passingScore;
        
        // Show completion screen
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="completion-screen">
                <div class="completion-icon">${passed ? '🎉' : '📚'}</div>
                <h2>${passed ? 'Congratulations!' : 'Course Complete'}</h2>
                <p class="completion-message">
                    ${passed 
                        ? `You've successfully completed ${this.config.courseTitle}!`
                        : `You've completed the course but didn't reach the passing score of ${this.config.passingScore}%.`
                    }
                </p>
                <div class="score-display">
                    <span class="score-label">Your Score</span>
                    <span class="score-value ${passed ? 'passed' : 'failed'}">${score}%</span>
                </div>
                ${passed ? `
                    <button class="btn btn-certificate" onclick="course.showCertificate()">
                        📜 View Certificate
                    </button>
                ` : `
                    <button class="btn btn-retry" onclick="course.restart()">
                        🔄 Review & Retry
                    </button>
                `}
            </div>
        `;
        
        // Report to LMS
        SCORM.setScore(score);
        SCORM.setStatus(passed ? 'passed' : 'failed');
        SCORM.commit();
    }
    
    calculateScore() {
        const quizSlides = [];
        this.config.modules.forEach((mod, mi) => {
            mod.slides.forEach((slide, si) => {
                if (slide.type === 'quiz') {
                    quizSlides.push({ moduleIndex: mi, slideIndex: si, slide });
                }
            });
        });
        
        if (quizSlides.length === 0) return 100;
        
        let correct = 0;
        quizSlides.forEach(({ moduleIndex, slideIndex, slide }) => {
            const quizId = `${moduleIndex}-${slideIndex}`;
            if (this.state.quizAnswers[quizId] === slide.correctAnswer) {
                correct++;
            }
        });
        
        return Math.round((correct / quizSlides.length) * 100);
    }
    
    showCertificate() {
        const completionDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const certWindow = window.open('', '_blank');
        certWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Certificate - ${this.config.courseTitle}</title>
                <style>
                    body { font-family: 'Georgia', serif; text-align: center; padding: 40px; }
                    .certificate { border: 3px solid #0a2540; padding: 60px; max-width: 800px; margin: 0 auto; }
                    .logo { font-size: 24px; font-weight: bold; color: #0a2540; margin-bottom: 20px; }
                    h1 { color: #0a2540; font-size: 36px; margin: 20px 0; }
                    .course-name { font-size: 28px; color: #0284c7; margin: 30px 0; }
                    .completion-date { margin-top: 40px; color: #666; }
                    .cert-id { font-size: 12px; color: #999; margin-top: 30px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <div class="logo">OBSERO</div>
                    <p>This certifies that</p>
                    <h1>_______________________</h1>
                    <p>has successfully completed</p>
                    <div class="course-name">${this.config.courseTitle}</div>
                    <p class="completion-date">Completed on ${completionDate}</p>
                    <p class="cert-id">Certificate ID: ${this.config.courseId.toUpperCase()}-${Date.now()}</p>
                </div>
                <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
                    🖨️ Print Certificate
                </button>
            </body>
            </html>
        `);
    }
    
    restart() {
        this.state.currentModule = 0;
        this.state.currentSlide = 0;
        this.state.quizAnswers = {};
        this.saveProgress();
        this.render();
    }
    
    saveProgress() {
        this.state.totalTime = Date.now() - this.state.startTime;
        SCORM.setSuspendData(this.state);
        SCORM.commit();
    }
}

// Will be initialized by course content
let course;
