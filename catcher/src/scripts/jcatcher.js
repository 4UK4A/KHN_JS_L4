class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.score = 0;
        this.baseSpeed = 1;
        this.gameTime = 0;
        this.isPaused = false;
        
        this.basket = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 100,
            height: 50
        };
        
        this.items = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startGameLoop();
        this.startTimer();
    }

    setupEventListeners() {
        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.basket.x = e.clientX - rect.left - this.basket.width / 2;
            
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
        setInterval(() => {
            if (!this.isPaused) {
                this.update();
                this.draw();
            }
        }, 1000 / 60);  // 60 FPS

        setInterval(() => {
            if (!this.isPaused) {
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
        
        this.items.push({
            x: Math.random() * (this.canvas.width - 30),
            y: 0,
            width: 30,
            height: 30,
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

// Start the game when the window loads
window.onload = () => {
    new Game();
};