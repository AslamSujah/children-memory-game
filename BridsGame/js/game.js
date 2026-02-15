// ================================
// MEMORY GAME - MAIN GAME LOGIC
// ================================
// Bird-themed memory matching game for children aged 5-6 years

// ================================
// GAME CONFIGURATION
// ================================
const GAME_CONFIG = {
    easy: {
        pairs: 6,        // Total cards = pairs * 2 = 12 cards
        gridClass: 'easy',
        flipSpeed: 600,
        matchDelay: 800
    },
    medium: {
        pairs: 12,       // Total cards = 24 cards
        gridClass: 'medium',
        flipSpeed: 500,
        matchDelay: 700
    },
    hard: {
        pairs: 20,       // Total cards = 40 cards
        gridClass: 'hard',
        flipSpeed: 400,
        matchDelay: 600
    }
};

// 🐦 BIRD EMOJI OPTIONS - Fun, colorful birds for kids!
const CARD_EMOJIS = [
    '🐦', // Generic bird
    '🦅', // Eagle
    '🦆', // Duck
    '🦉', // Owl
    '🐧', // Penguin
    '🦜', // Parrot
    '🦚', // Peacock
    '🦩', // Flamingo
    '🐔', // Chicken
    '🐓', // Rooster
    '🦃', // Turkey
    '🕊️', // Dove
    '🦢', // Swan
    '🦤', // Dodo
    '🪿', // Goose
    '🐥', // Baby chick
    '🐤', // Baby chick (front)
    '🐣', // Hatching chick
    '🦆', // Duck (alternative)
    '🦅', // Eagle (alternative)
];

// ================================
// GAME STATE
// ================================
let gameState = {
    currentLevel: null,
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    score: 0,
    isChecking: false,
    stars: 3
};

// ================================
// SCREEN MANAGEMENT
// ================================

/**
 * Show a specific screen and hide others
 * @param {string} screenId - ID of screen to show
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

/**
 * Go back to main menu
 */
function backToMenu() {
    GameAudio.playClickSound();
    showScreen('levelScreen');
    // Update best score display
    document.getElementById('bestScore').textContent = GameStorage.getBestScore();
}

// ================================
// GAME INITIALIZATION
// ================================

/**
 * Start a new game with selected difficulty
 * @param {string} level - 'easy', 'medium', or 'hard'
 */
function startGame(level) {
    console.log('🐦 Starting bird memory game - Level:', level);
    
    // Initialize audio on first user interaction
    GameAudio.init();
    GameAudio.playClickSound();
    
    // Save level selection
    GameStorage.saveLastLevel(level);
    GameStorage.incrementGamesPlayed();
    
    // Reset game state
    gameState = {
        currentLevel: level,
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        score: 0,
        isChecking: false,
        stars: 3
    };
    
    // Show game screen
    showScreen('gameScreen');
    
    // Create game board
    createBoard(level);
    
    // Update UI
    updateScore();
    updateStars();
}

/**
 * Restart the current game
 */
function restartGame() {
    GameAudio.playClickSound();
    if (gameState.currentLevel) {
        startGame(gameState.currentLevel);
    }
}

// ================================
// BOARD CREATION
// ================================

/**
 * Create the game board with bird cards
 * @param {string} level - Game difficulty level
 */
function createBoard(level) {
    const config = GAME_CONFIG[level];
    const gameBoard = document.getElementById('gameBoard');
    
    // Clear existing board
    gameBoard.innerHTML = '';
    gameBoard.className = 'game-board ' + config.gridClass;
    
    // Select random bird emojis for this game
    const selectedBirds = CARD_EMOJIS.slice(0, config.pairs);
    
    // Create pairs (each bird appears twice)
    const cardValues = [...selectedBirds, ...selectedBirds];
    
    // Shuffle cards
    const shuffledCards = shuffleArray(cardValues);
    
    // Create card elements
    shuffledCards.forEach((birdEmoji, index) => {
        const card = createCardElement(birdEmoji, index);
        gameBoard.appendChild(card);
        gameState.cards.push({
            id: index,
            value: birdEmoji,
            isFlipped: false,
            isMatched: false
        });
    });
    
    console.log('✅ Board created with', shuffledCards.length, 'bird cards');
}

/**
 * Create a single card DOM element
 * @param {string} birdEmoji - The bird emoji to display
 * @param {number} id - Unique card ID
 * @returns {HTMLElement} Card element
 */
function createCardElement(birdEmoji, id) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = id;
    
    // Card back (shown when not flipped) - using egg emoji as mystery icon
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    cardBack.textContent = '🥚'; // Egg for bird theme!
    
    // Card front (shown when flipped)
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';
    cardFront.textContent = birdEmoji;
    
    card.appendChild(cardBack);
    card.appendChild(cardFront);
    
    // Add click handler
    card.addEventListener('click', () => handleCardClick(id));
    
    return card;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ================================
// GAME LOGIC
// ================================

/**
 * Handle card click event
 * @param {number} cardId - ID of clicked card
 */
function handleCardClick(cardId) {
    // Prevent clicking during check or if card already flipped/matched
    if (gameState.isChecking) return;
    
    const card = gameState.cards[cardId];
    if (card.isFlipped || card.isMatched) return;
    
    // Prevent selecting more than 2 cards
    if (gameState.flippedCards.length >= 2) return;
    
    // Flip the card
    flipCard(cardId);
    
    // Add to flipped cards
    gameState.flippedCards.push(cardId);
    
    // Check for match when 2 cards are flipped
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        updateScore();
        checkMatch();
    }
}

/**
 * Flip a card (visual animation)
 * @param {number} cardId - ID of card to flip
 */
function flipCard(cardId) {
    const cardElement = document.querySelector(`[data-id="${cardId}"]`);
    cardElement.classList.add('flipped');
    gameState.cards[cardId].isFlipped = true;
}

/**
 * Unflip a card
 * @param {number} cardId - ID of card to unflip
 */
function unflipCard(cardId) {
    const cardElement = document.querySelector(`[data-id="${cardId}"]`);
    cardElement.classList.remove('flipped');
    gameState.cards[cardId].isFlipped = false;
}

/**
 * Check if two flipped cards match
 */
function checkMatch() {
    gameState.isChecking = true;
    
    const [cardId1, cardId2] = gameState.flippedCards;
    const card1 = gameState.cards[cardId1];
    const card2 = gameState.cards[cardId2];
    
    const config = GAME_CONFIG[gameState.currentLevel];
    
    if (card1.value === card2.value) {
        // ✅ MATCH!
        setTimeout(() => {
            handleMatch(cardId1, cardId2);
        }, config.matchDelay);
    } else {
        // ❌ NO MATCH
        setTimeout(() => {
            handleNoMatch(cardId1, cardId2);
        }, config.matchDelay);
    }
}

/**
 * Handle successful match
 * @param {number} cardId1 - First card ID
 * @param {number} cardId2 - Second card ID
 */
function handleMatch(cardId1, cardId2) {
    console.log('✅ Bird match found!');
    
    // Mark cards as matched
    gameState.cards[cardId1].isMatched = true;
    gameState.cards[cardId2].isMatched = true;
    
    // Add matched styling
    const card1Element = document.querySelector(`[data-id="${cardId1}"]`);
    const card2Element = document.querySelector(`[data-id="${cardId2}"]`);
    card1Element.classList.add('matched');
    card2Element.classList.add('matched');
    
    // Update score
    gameState.matchedPairs++;
    gameState.score += 10;
    
    // Play sound and show feedback with bird theme
    GameAudio.playMatchSound();
    const encouragingMessages = [
        'Tweet Tweet! 🐦',
        'Perfect Match! 🦜',
        'Flying High! 🦅',
        'Great Job! 🎉',
        'Awesome! ⭐'
    ];
    const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
    showFeedback(randomMessage, 'positive');
    
    // Reset turn
    resetTurn();
    
    // Check if game is complete
    const config = GAME_CONFIG[gameState.currentLevel];
    if (gameState.matchedPairs === config.pairs) {
        setTimeout(() => {
            completeGame();
        }, 500);
    }
}

/**
 * Handle no match
 * @param {number} cardId1 - First card ID
 * @param {number} cardId2 - Second card ID
 */
function handleNoMatch(cardId1, cardId2) {
    console.log('❌ No match');
    
    // Unflip both cards
    unflipCard(cardId1);
    unflipCard(cardId2);
    
    // Play sound and show feedback
    GameAudio.playWrongSound();
    showFeedback('Try Again! 💪', 'negative');
    
    // Update stars based on moves
    updateStars();
    
    // Reset turn
    resetTurn();
}

/**
 * Reset the current turn
 */
function resetTurn() {
    gameState.flippedCards = [];
    gameState.isChecking = false;
    updateScore();
}

// ================================
// UI UPDATES
// ================================

/**
 * Update score display
 */
function updateScore() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('moves').textContent = gameState.moves;
}

/**
 * Update star rating based on moves
 */
function updateStars() {
    const config = GAME_CONFIG[gameState.currentLevel];
    const maxMoves = config.pairs; // Ideal number of moves
    
    // Calculate star rating
    let stars = 3;
    if (gameState.moves > maxMoves * 2) {
        stars = 1;
    } else if (gameState.moves > maxMoves * 1.5) {
        stars = 2;
    }
    
    gameState.stars = stars;
    
    // Update star display
    const starElements = document.querySelectorAll('.stars .star');
    starElements.forEach((star, index) => {
        if (index < stars) {
            star.classList.remove('lost');
            star.classList.add('earned');
        } else {
            star.classList.add('lost');
            star.classList.remove('earned');
        }
    });
}

/**
 * Show feedback message to player
 * @param {string} message - Message to display
 * @param {string} type - 'positive' or 'negative'
 */
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = 'feedback show ' + type;
    
    // Clear feedback after animation
    setTimeout(() => {
        feedback.className = 'feedback';
        feedback.textContent = '';
    }, 1500);
}

// ================================
// GAME COMPLETION
// ================================

/**
 * Handle game completion
 */
function completeGame() {
    console.log('🎉 Bird Game Complete!');
    
    // Play win sound
    GameAudio.playWinSound();
    
    // Save best score
    const isNewBest = GameStorage.saveBestScore(gameState.score);
    
    // Update win screen
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalMoves').textContent = gameState.moves;
    
    // Show win screen
    showScreen('winScreen');
    
    // Create confetti
    createConfetti();
}

/**
 * Create confetti animation
 */
function createConfetti() {
    const confettiContainer = document.getElementById('confetti');
    confettiContainer.innerHTML = '';
    
    const colors = ['#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];
    
    // Create 50 confetti pieces
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.setProperty('--x', (Math.random() * 200 - 100) + 'px');
        confetti.style.setProperty('--rotate', (Math.random() * 360) + 'deg');
        confetti.style.animationDelay = (Math.random() * 0.5) + 's';
        
        confettiContainer.appendChild(confetti);
    }
}

// ================================
// INITIALIZATION
// ================================

// Load best score on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🐦 Bird Memory Game Loaded');
    console.log('📊 Best Score:', GameStorage.getBestScore());
    console.log('🎯 Total Games:', GameStorage.getTotalGames());
});