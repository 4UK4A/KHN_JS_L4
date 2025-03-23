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
        
        // Setup resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Initialize game
        this.init();
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
            this.isPaused = !this.isPaused;
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    resetGame() {
        this.score = 0;
        this.gameTime = 0;
        this.items = [];
        this.updateScore();
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
            }
        }, 1000);
    }

    spawnItem() {
        const types = [
            { color: 'gold', points: 3, speed: 1.5 },
            { color: 'silver', points: 2, speed: 1.2 },
            { color: 'brown', points: 1, speed: 1.0 }
        ];

        const type = types[Math.floor(Math.random() * types.length)];
        const itemSize = Math.min(30, this.canvas.width * 0.04);
        
        this.items.push({
            x: Math.random() * (this.canvas.width - itemSize),
            y: 0,
            width: itemSize,
            height: itemSize,
            ...type
        });
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
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.basket.x, this.basket.y, this.basket.width, this.basket.height);

        // Draw items
        this.items.forEach(item => {
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(item.x, item.y, item.width, item.height);
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
}

// Wait for DOM to load before starting the game
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});