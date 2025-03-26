class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.baseSpeed = 1;
        this.updateSpeed(); // Add initial speed display
        this.gameTime = 0;
        this.isPaused = false;
        this.items = [];
        
        // Initial canvas setup - must happen before basket creation
        this.resizeCanvas();
        
        // Setup basket after canvas is sized
        this.basket = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 90,
            width: Math.min(100, this.canvas.width * 0.15),
            height: Math.min(50, this.canvas.height * 0.08)
        };
        
        // Load images
        this.images = {
            basket: new Image(),
            gold: new Image(),
            silver: new Image(),
            brown: new Image()
        };

        // Set image sources
        this.images.basket.src = 'images/basket_clip_5805028.png';
        this.images.gold.src = 'images/persik1.png';
        this.images.silver.src = 'images/apple1.png';
        this.images.brown.src = 'images/banana.png';

        // Wait for all images to load before starting
        Promise.all(Object.values(this.images).map(img => {
            return new Promise((resolve) => {
                img.onload = resolve;
            });
        })).then(() => {
            this.init();
        });
        
        // Setup resize handler
        window.addEventListener('resize', () => this.handleResize());

        // Initialize speech synthesis
        this.synthesis = window.speechSynthesis;
        this.voice = null;
        
        // Set up Ukrainian voice if available
        const loadVoices = () => {
            const voices = this.synthesis.getVoices();
            this.voice = voices.find(v => v.lang.includes('uk')) || voices[0];
        };
        
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices();

        // Initialize speech recognition at the end of constructor
        if ('webkitSpeechRecognition' in window) {
            this.setupSpeechRecognition();
        }
    }

    setupSpeechRecognition() {
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'uk-UA';
        
        this.recognition.onstart = () => {
            console.log('Speech recognition started');
        };
        
        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const result = event.results[last];
        
            if (!result.isFinal) return;
        
            const command = result[0].transcript.trim().toLowerCase();
            console.log('Recognized command:', command);
        
            const words = command.split(' ');
            words.forEach(word => {
                if (word === 'вправо' || word === 'вліво') {
                    const direction = word === 'вправо' ? 'right' : 'left';
                    if (!this.isPaused) {
                        this.moveBasket(direction);
                    }
                } else if (word === 'пауза' || word === 'старт') {
                    this.togglePause();
                }
            });
        };
                
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
                
                setTimeout(() => this.recognition.stop(), 50000);
                setTimeout(() => this.recognition.start(), 500);
            }
        };
        
        this.recognition.onend = () => {
            console.log('Speech recognition ended');
            setTimeout(() => this.recognition.start(), 500);
        };

        // Start recognition immediately
        try {
            this.recognition.start();
        } catch (e) {
            console.error('Error starting speech recognition:', e);
        }
    }

    handleResize() {
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        
        this.resizeCanvas();
        
        // Recalculate positions
        const widthRatio = this.canvas.width / oldWidth;
        const heightRatio = this.canvas.height / oldHeight;
        
        // Update basket position
        this.basket.x *= widthRatio;
        this.basket.y = this.canvas.height - 90;
        
        // Update items positions
        this.items.forEach(item => {
            item.x *= widthRatio;
            item.y *= heightRatio;
        });
        
        // Redraw everything
        this.draw();
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        if (!container) {
            console.error('Game container not found! Using default dimensions.');
            this.canvas.width = 800;
            this.canvas.height = 600;
        } else {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
        
        // Adjust basket size based on canvas size
        if (this.basket) {
            this.basket.width = Math.min(100, this.canvas.width * 0.15);
            this.basket.height = Math.min(50, this.canvas.height * 0.08);
        }
    }

    init() {
        console.log('Game initialization started');
        this.setupEventListeners();
        this.startGameLoop();
        this.startTimer();
        console.log('Game initialization completed');
    }

    setupEventListeners() {
        // Keep mouse control as fallback
        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            this.basket.x = (e.clientX - rect.left) * scaleX - this.basket.width / 2;
            
            // Keep basket within canvas bounds
            if (this.basket.x < 0) this.basket.x = 0;
            if (this.basket.x + this.basket.width > this.canvas.width) {
                this.basket.x = this.canvas.width - this.basket.width;
            }
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    moveBasket(direction) {
        const moveAmount = this.basket.width;
        
        if (direction === 'right') {
            this.basket.x = Math.min(
                this.canvas.width - this.basket.width,
                this.basket.x + moveAmount
            );
        } else if (direction === 'left') {
            this.basket.x = Math.max(
                0,
                this.basket.x - moveAmount
            );
        }
    }

    resetGame() {
        this.score = 0;
        this.gameTime = 0;
        this.baseSpeed = 1;
        this.items = [];
        this.updateScore();
        this.updateSpeed();
    }

    startGameLoop() {
        console.log('Game loop started');
        setInterval(() => {
            if (!this.isPaused) {
                this.update();
                this.draw();
            }
        }, 1000 / 60);  // 60 FPS

        setInterval(() => {
            if (!this.isPaused) {
                console.log('Spawning new item');
                this.spawnItem();
            }
        }, 1000);  // Spawn item every second
    }

    startTimer() {
        setInterval(() => {
            if (!this.isPaused) {
                this.gameTime++;
                this.updateTimer();
                
                // Increase speed every 30 seconds
                if (this.gameTime % 30 === 0) {
                    this.baseSpeed += 0.25;
                    this.updateSpeed();
                }
            }
        }, 1000);
    }
    
    updateSpeed() {
        document.querySelector('#speed span').textContent = this.baseSpeed.toFixed(2);
    }

    spawnItem() {
        const types = [
            { image: 'gold', points: 3, speed: 1.5, name: 'персик' },
            { image: 'silver', points: 2, speed: 1.2, name: 'яблуко' },
            { image: 'brown', points: 1, speed: 1.0, name: 'банан' }
        ];

        const type = types[Math.floor(Math.random() * types.length)];
        const itemSize = Math.min(60, this.canvas.width * 0.04);
        
        // Announce the fruit name
        this.speakText(type.name);
        
        this.items.push({
            x: Math.random() * (this.canvas.width - itemSize),
            y: 0,
            width: itemSize,
            height: itemSize,
            ...type
        });
    }

    speakText(text) {
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        if (this.voice) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.voice;
            utterance.lang = 'uk-UA';
            utterance.volume = 1;
            utterance.rate = 1;
            utterance.pitch = 1;
            
            this.synthesis.speak(utterance);
        }
    }

    update() {
        // Update items positions
        this.items.forEach((item, index) => {
            item.y += 2 * item.speed * this.baseSpeed;

            // Check for collision with basket
            if (this.checkCollision(item, this.basket)) {
                this.score += item.points;
                this.items.splice(index, 1);
                this.updateScore();
            }
            // Remove items that fell off screen
            else if (item.y > this.canvas.height) {
                this.score = Math.max(0, this.score - 1);
                this.items.splice(index, 1);
                this.updateScore();
            }
        });
    }

    checkCollision(item, basket) {
        return item.x < basket.x + basket.width &&
               item.x + item.width > basket.x &&
               item.y < basket.y + basket.height &&
               item.y + item.height > basket.y;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw basket
        this.ctx.drawImage(
            this.images.basket,
            this.basket.x,
            this.basket.y,
            this.basket.width,
            this.basket.height
        );

        // Draw items
        this.items.forEach(item => {
            this.ctx.drawImage(
                this.images[item.image],
                item.x,
                item.y,
                item.width,
                item.height
            );
        });
    }

    updateScore() {
        document.querySelector('#score span').textContent = this.score;
    }

    updateTimer() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.querySelector('#timer span').textContent = timeString;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        // Update pause button state if needed
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.isPaused ? 'Продовжити' : 'Пауза';
    }
}

// Wait for DOM to load before starting the game
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});