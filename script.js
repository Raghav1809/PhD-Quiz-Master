// Global variables
let currentModule = null;
let currentQuestionIndex = 0;
let quizData = {};
let userAnswers = {};
let modules = [];

// DOM Elements
const moduleSelector = document.getElementById('moduleSelector');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const currentQuestionNumber = document.getElementById('currentQuestionNumber');
const totalQuestions = document.getElementById('totalQuestions');
const prevButton = document.getElementById('prevQuestion');
const nextButton = document.getElementById('nextQuestion');
const questionNavigator = document.getElementById('questionNavigator');
const feedbackContainer = document.getElementById('feedbackContainer');
const progressBar = document.getElementById('progressBar');
const progressPercentage = document.getElementById('progressPercentage');
const darkModeToggle = document.getElementById('darkModeToggle');
const showAnswerBtn = document.getElementById('showAnswer');
const searchOnlineBtn = document.getElementById('searchOnline');
const answerModal = document.getElementById('answerModal');
const closeModal = document.getElementById('closeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalContent = document.getElementById('modalContent');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    fetchQuizData();
    setupEventListeners();
});

// Fetch quiz data from JSON file
// Check if the quiz_data.json file exists and has the correct format
// Add this to your fetchQuizData function
async function fetchQuizData() {
    try {
        const response = await fetch('quiz_data.json');
        quizData = await response.json();
        console.log("Quiz data loaded:", quizData); // Add this line to debug
        modules = Object.keys(quizData);
        
        // Populate module selector
        populateModuleSelector();
        
        // Set default module if available
        if (modules.length > 0) {
            currentModule = modules[0];
            moduleSelector.value = currentModule;
            initializeQuiz();
        }
    } catch (error) {
        console.error('Error fetching quiz data:', error);
        questionText.textContent = 'Failed to load quiz data. Please refresh the page.';
    }
}

// Setup event listeners
function setupEventListeners() {
    moduleSelector.addEventListener('change', handleModuleChange);
    prevButton.addEventListener('click', goToPreviousQuestion);
    nextButton.addEventListener('click', goToNextQuestion);
    showAnswerBtn.addEventListener('click', showAnswer);
    searchOnlineBtn.addEventListener('click', searchQuestionOnline);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    closeModal.addEventListener('click', hideAnswerModal);
    closeModalBtn.addEventListener('click', hideAnswerModal);
}

// Populate module selector dropdown
function populateModuleSelector() {
    moduleSelector.innerHTML = '<option selected disabled>Select Module</option>';
    modules.forEach(module => {
        const option = document.createElement('option');
        option.value = module;
        option.textContent = module;
        moduleSelector.appendChild(option);
    });
}

// Handle module change
function handleModuleChange() {
    currentModule = moduleSelector.value;
    currentQuestionIndex = 0;
    userAnswers = {};
    initializeQuiz();
}

// Initialize quiz with current module
function initializeQuiz() {
    if (!currentModule || !quizData[currentModule]) return;
    
    const questions = quizData[currentModule];
    totalQuestions.textContent = questions.length;
    updateQuestionNavigator();
    loadQuestion();
}

// Load current question
function loadQuestion() {
    if (!currentModule || !quizData[currentModule]) return;
    
    const questions = quizData[currentModule];
    if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) return;
    
    const question = questions[currentQuestionIndex];
    
    // Update question number display
    currentQuestionNumber.textContent = `Question ${currentQuestionIndex + 1}`;
    
    // Display question text
    questionText.textContent = question.question;
    
    // Create options
    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'option-btn w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500';
        optionButton.innerHTML = `
            <span class="inline-block w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-semibold text-center leading-8 mr-3">
                ${String.fromCharCode(65 + index)}
            </span>
            ${option}
        `;
        
        // Check if user has already answered this question
        if (userAnswers[currentQuestionIndex] !== undefined) {
            if (userAnswers[currentQuestionIndex] === index) {
                optionButton.classList.add('selected');
                if (index === question.correctAnswer) {
                    optionButton.classList.add('correct');
                } else {
                    optionButton.classList.add('incorrect');
                }
            } else if (index === question.correctAnswer && userAnswers[currentQuestionIndex] !== null) {
                optionButton.classList.add('correct');
            }
        }
        
        optionButton.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionButton);
    });
    
    // Hide feedback container when loading a new question
    feedbackContainer.classList.add('hidden');
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Update question navigator
    highlightCurrentQuestion();
    
    // Update progress
    updateProgress();
}

// Select an option
function selectOption(optionIndex) {
    if (userAnswers[currentQuestionIndex] !== undefined) return; // Prevent changing answer
    
    const questions = quizData[currentModule];
    const question = questions[currentQuestionIndex];
    
    userAnswers[currentQuestionIndex] = optionIndex;
    
    // Get all option buttons
    const optionButtons = optionsContainer.querySelectorAll('.option-btn');
    
    // Mark selected option
    optionButtons[optionIndex].classList.add('selected');
    
    // Check if answer is correct
    const isCorrect = optionIndex === question.correctAnswer;
    
    if (isCorrect) {
        optionButtons[optionIndex].classList.add('correct');
        showFeedback(true, question.explanation || 'Correct answer!');
    } else {
        optionButtons[optionIndex].classList.add('incorrect');
        optionButtons[question.correctAnswer].classList.add('correct');
        showFeedback(false, question.explanation || 'Incorrect answer. Try again!');
    }
    
    // Update question navigator
    updateQuestionNavigator();
    
    // Update progress
    updateProgress();
}

// Show feedback after answering
function showFeedback(isCorrect, explanation) {
    feedbackContainer.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <i class="fas ${isCorrect ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'} text-2xl"></i>
            </div>
            <div class="ml-3">
                <h3 class="text-lg font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}">
                    ${isCorrect ? 'Correct!' : 'Incorrect!'}
                </h3>
                <div class="mt-2 text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}">
                    ${explanation}
                </div>
            </div>
        </div>
    `;
    
    feedbackContainer.classList.remove('hidden');
    feedbackContainer.classList.add('feedback-animation');
    feedbackContainer.classList.add(isCorrect ? 'bg-green-100' : 'bg-red-100');
    feedbackContainer.classList.remove(isCorrect ? 'bg-red-100' : 'bg-green-100');
}

// Go to previous question
function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

// Go to next question
function goToNextQuestion() {
    const questions = quizData[currentModule];
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

// Jump to specific question
function jumpToQuestion(index) {
    currentQuestionIndex = index;
    loadQuestion();
}

// Update navigation buttons (prev/next)
function updateNavigationButtons() {
    const questions = quizData[currentModule];
    
    prevButton.disabled = currentQuestionIndex === 0;
    prevButton.classList.toggle('opacity-50', currentQuestionIndex === 0);
    
    nextButton.disabled = currentQuestionIndex === questions.length - 1;
    nextButton.classList.toggle('opacity-50', currentQuestionIndex === questions.length - 1);
}

// Create question navigator buttons
function updateQuestionNavigator() {
    questionNavigator.innerHTML = '';
    
    const questions = quizData[currentModule];
    questions.forEach((_, index) => {
        const button = document.createElement('button');
        button.textContent = index + 1;
        button.className = 'question-number-btn w-full aspect-square flex items-center justify-center rounded-full text-sm font-medium';
        
        // Style based on answer status
        if (index === currentQuestionIndex) {
            button.classList.add('bg-indigo-500', 'text-white');
        } else if (userAnswers[index] !== undefined) {
            const question = questions[index];
            const isCorrect = userAnswers[index] === question.correctAnswer;
            if (isCorrect) {
                button.classList.add('bg-green-500', 'text-white');
            } else {
                button.classList.add('bg-red-500', 'text-white');
            }
        } else {
            button.classList.add('bg-gray-300', 'text-gray-700');
        }
        
        button.addEventListener('click', () => jumpToQuestion(index));
        questionNavigator.appendChild(button);
    });
}

// Highlight current question in navigator
function highlightCurrentQuestion() {
    const buttons = questionNavigator.querySelectorAll('button');
    buttons.forEach((button, index) => {
        if (index === currentQuestionIndex) {
            button.classList.add('ring-2', 'ring-indigo-300', 'pulse');
        } else {
            button.classList.remove('ring-2', 'ring-indigo-300', 'pulse');
        }
    });
}

// Update progress bar and percentage
function updateProgress() {
    const questions = quizData[currentModule];
    const answeredCount = Object.keys(userAnswers).length;
    const percentage = Math.round((answeredCount / questions.length) * 100);
    
    progressBar.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
}

// Show answer modal
function showAnswer() {
    const questions = quizData[currentModule];
    const question = questions[currentQuestionIndex];
    
    modalContent.innerHTML = `
        <p class="mb-4"><strong>Question:</strong> ${question.question}</p>
        <p class="mb-2"><strong>Correct Answer:</strong> ${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}</p>
        ${question.explanation ? `<p class="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg"><strong>Explanation:</strong> ${question.explanation}</p>` : ''}
    `;
    
    answerModal.classList.remove('hidden');
}

// Hide answer modal
function hideAnswerModal() {
    answerModal.classList.add('hidden');
}

// Search question online
function searchQuestionOnline() {
    const questions = quizData[currentModule];
    const question = questions[currentQuestionIndex];
    
    // Create search query with question and options
    let searchQuery = question.question;
    question.options.forEach((option, index) => {
        searchQuery += ` ${String.fromCharCode(65 + index)}) ${option}`;
    });
    
    // Encode search query
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Open search in new tab (default to Google, can be changed to ChatGPT)
    window.open(`https://www.google.com/search?q=${encodedQuery}`, '_blank');
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    const icon = darkModeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}