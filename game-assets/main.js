// Configurações globais
const GAME_CONFIG = {
    width: 800,
    height: 600,
    lanes: [-150, 0, 150], // Trilhas mais próximas para melhor perspectiva
    timeLines: {
        future: { 
            name: 'Futurista',
            color: 0x4287f5,
            floor: 0x1a1a1a,
            obstacles: ['barrier', 'drone'],
            bgSpeed: 2 // Velocidade do fundo
        },
        past: { 
            name: 'Pré-História',
            color: 0x2d5a27,
            floor: 0x3d2616,
            obstacles: ['rock', 'tree'],
            bgSpeed: 1 // Velocidade do fundo
        }
    },
    initialSpeed: 8,
    speedIncrease: 0.0001, // Aumento gradual de velocidade
    obstacleSpawnRate: 1500, // Milissegundos entre obstáculos
    relicSpawnRate: 2000 // Milissegundos entre relíquias
};

// Cena do Menu Principal
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Fundo gradiente
        const background = this.add.graphics();
        background.fillGradientStyle(0x4287f5, 0x4287f5, 0x2d5a27, 0x2d5a27, 1);
        background.fillRect(0, 0, 800, 600);

        // Título
        this.add.text(400, 100, 'ChronoSnatch', {
            fontSize: '64px',
            fill: '#fff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Subtítulo
        this.add.text(400, 180, 'Viagem no Tempo', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Botões
        this.createMenuButton(400, 300, 'Jogar', () => {
            console.log('Iniciando jogo...');
            this.scene.start('GameScene');
        });
        
        this.createMenuButton(400, 380, 'Tutorial', () => {
            console.log('Tutorial clicado');
            // Implementar tutorial depois
        });
        
        this.createMenuButton(400, 460, 'Configurações', () => {
            console.log('Configurações clicadas');
            // Implementar configurações depois
        });
    }

    createMenuButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 200, 50, 0x000000, 0.5);
        bg.setInteractive({ useHandCursor: true });
        
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        button.add([bg, buttonText]);
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0x444444, 0.7);
            buttonText.setScale(1.1);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x000000, 0.5);
            buttonText.setScale(1);
        });
        
        bg.on('pointerdown', () => {
            console.log('Botão clicado:', text);
            callback();
        });
    }
}

// Cena Principal do Jogo
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.gameSpeed = GAME_CONFIG.initialSpeed;
        this.currentLane = 1;
        this.currentTimeLine = 'past';
        this.score = 0;
        this.relicCount = 0;
        this.isGameOver = false;
        this.distance = 0;
        this.lastLaneChange = 0; // Controle de tempo para mudança de faixa
    }

    preload() {
        const graphics = this.add.graphics();
        
        // Carregar o sprite do personagem
        this.load.image('player', 'images/personagem pricipal.png');
        
        // Chão com perspectiva
        graphics.clear();
        graphics.fillStyle(0xffffff);
        const floorPoints = [
            0, 600,           // Ponto inferior esquerdo
            800, 600,         // Ponto inferior direito
            600, 300,         // Ponto superior direito
            200, 300          // Ponto superior esquerdo
        ];
        graphics.fillPoints(floorPoints, true);
        graphics.generateTexture('floor', 800, 600);
        
        // Linhas da pista
        graphics.clear();
        graphics.lineStyle(2, 0xffffff, 0.5);
        graphics.beginPath();
        graphics.moveTo(300, 300);
        graphics.lineTo(300, 600);
        graphics.moveTo(500, 300);
        graphics.lineTo(500, 600);
        graphics.strokePath();
        graphics.generateTexture('track_lines', 800, 600);
        
        // Obstáculos
        // Barreira futurista
        graphics.clear();
        graphics.lineStyle(2, 0x00ff00);
        graphics.fillStyle(0x444444);
        graphics.fillRect(-30, -60, 60, 60);
        graphics.strokeRect(-30, -60, 60, 60);
        graphics.generateTexture('barrier', 60, 60);
        
        // Drone
        graphics.clear();
        graphics.fillStyle(0xff0000);
        graphics.fillCircle(0, 0, 20);
        graphics.generateTexture('drone', 40, 40);
        
        // Rocha
        graphics.clear();
        graphics.fillStyle(0x666666);
        graphics.fillCircle(0, 0, 30);
        graphics.generateTexture('rock', 60, 60);
        
        // Árvore
        graphics.clear();
        graphics.fillStyle(0x228B22);
        graphics.fillTriangle(-25, 0, 25, 0, 0, -80);
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(-10, 0, 20, 20);
        graphics.generateTexture('tree', 50, 100);
        
        // Relíquia (círculo dourado simples)
        graphics.clear();
        graphics.fillStyle(0xffd700);
        graphics.fillCircle(0, 0, 15);
        graphics.lineStyle(2, 0xffff00);
        graphics.strokeCircle(0, 0, 15);
        graphics.generateTexture('relic', 30, 30);
        
        graphics.destroy();
    }

    create() {
        // Criar chão com perspectiva
        this.floor = this.add.sprite(400, 300, 'floor');
        this.floor.setTint(GAME_CONFIG.timeLines[this.currentTimeLine].floor);
        
        // Adicionar linhas da pista
        this.trackLines = this.add.sprite(400, 300, 'track_lines');
        this.trackLines.setAlpha(0.3);
        
        // Criar jogador
        this.player = this.physics.add.sprite(
            400 + GAME_CONFIG.lanes[this.currentLane],
            450, // Posição Y mais alta para melhor perspectiva
            'player'
        );
        this.player.setScale(0.5); // Ajustar escala do sprite
        
        // Adicionar animação de corrida
        this.tweens.add({
            targets: this.player,
            y: '+=10',
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Adicionar sombra do jogador
        this.playerShadow = this.add.ellipse(
            this.player.x,
            this.player.y + 70,
            50,
            20,
            0x000000,
            0.3
        );

        // Grupos
        this.obstacles = this.physics.add.group();
        this.relics = this.physics.add.group();
        
        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Controles de toque/mouse
        let startX = 0;
        this.input.on('pointerdown', (pointer) => {
            startX = pointer.x;
        });
        
        this.input.on('pointerup', (pointer) => {
            const swipeDistance = pointer.x - startX;
            if (Math.abs(swipeDistance) > 50) {
                if (swipeDistance > 0) {
                    this.moveLane(1);
                } else {
                    this.moveLane(-1);
                }
            } else if (pointer.y < 300) {
                this.switchTimeLine(this.currentTimeLine === 'past' ? 'future' : 'past');
            }
        });

        // HUD
        this.scoreText = this.add.text(16, 16, 'Pontos: 0', {
            fontSize: '24px',
            fill: '#fff'
        });
        
        this.timelineText = this.add.text(16, 50, 'Era: ' + GAME_CONFIG.timeLines[this.currentTimeLine].name, {
            fontSize: '24px',
            fill: '#fff'
        });

        // Spawn de obstáculos e relíquias
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 3000,
            callback: this.spawnRelic,
            callbackScope: this,
            loop: true
        });
    }

    moveLane(direction) {
        const newLane = Phaser.Math.Clamp(this.currentLane + direction, 0, 2);
        if (newLane !== this.currentLane) {
            this.currentLane = newLane;
            
            // Animação de movimento lateral
            this.tweens.add({
                targets: [this.player, this.playerShadow],
                x: 400 + GAME_CONFIG.lanes[this.currentLane],
                duration: 200,
                ease: 'Power2'
            });
            
            // Inclinação do personagem
            this.tweens.add({
                targets: this.player,
                angle: direction * 15,
                duration: 100,
                yoyo: true,
                ease: 'Power1'
            });
        }
    }

    switchTimeLine(newTimeLine) {
        if (this.currentTimeLine === newTimeLine) return;
        
        this.currentTimeLine = newTimeLine;
        this.tweens.add({
            targets: this.floor,
            tint: GAME_CONFIG.timeLines[newTimeLine].floor,
            duration: 500
        });
        
        // Efeito de flash na transição
        const flash = this.add.rectangle(400, 300, 800, 600, 0xffffff);
        flash.alpha = 0;
        this.tweens.add({
            targets: flash,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            onComplete: () => flash.destroy()
        });
    }

    spawnObstacle() {
        if (this.isGameOver) return;

        const lane = Phaser.Math.Between(0, 2);
        const type = Phaser.Math.RND.pick(GAME_CONFIG.timeLines[this.currentTimeLine].obstacles);
        const obstacle = this.obstacles.create(
            400 + GAME_CONFIG.lanes[lane],
            0,
            type
        );
        
        // Ajustar escala baseado na perspectiva
        const scale = 0.5 + (obstacle.y / 600) * 0.5;
        obstacle.setScale(scale);
        
        this.tweens.add({
            targets: obstacle,
            y: 600,
            scale: 1,
            duration: 2000,
            onComplete: () => obstacle.destroy()
        });
    }

    spawnRelic() {
        if (this.isGameOver) return;

        const lane = Phaser.Math.Between(0, 2);
        const relic = this.relics.create(
            400 + GAME_CONFIG.lanes[lane],
            0,
            'relic'
        );
        
        this.tweens.add({
            targets: relic,
            y: 600,
            scale: { from: 0.5, to: 1 },
            angle: 360,
            duration: 2000,
            onComplete: () => relic.destroy()
        });
    }

    update() {
        if (this.isGameOver) return;

        // Atualizar posição da sombra
        this.playerShadow.x = this.player.x;

        // Movimento lateral com cooldown
        const now = this.time.now;
        if (now - this.lastLaneChange > 200) { // 200ms de cooldown
            if (this.cursors.left.isDown) {
                this.moveLane(-1);
                this.lastLaneChange = now;
            } else if (this.cursors.right.isDown) {
                this.moveLane(1);
                this.lastLaneChange = now;
            }
        }

        // Mudança de era
        if (this.cursors.up.isDown) {
            this.switchTimeLine('future');
        } else if (this.cursors.down.isDown) {
            this.switchTimeLine('past');
        }

        // Aumentar velocidade gradualmente
        this.gameSpeed += GAME_CONFIG.speedIncrease;

        // Atualizar pontuação
        this.distance += this.gameSpeed;
        this.score = Math.floor(this.distance / 10);
        this.scoreText.setText('Pontos: ' + this.score);
        this.timelineText.setText('Era: ' + GAME_CONFIG.timeLines[this.currentTimeLine].name);

        // Atualizar movimento do fundo
        this.floor.tilePositionY += this.gameSpeed * GAME_CONFIG.timeLines[this.currentTimeLine].bgSpeed;
        this.trackLines.tilePositionY += this.gameSpeed * GAME_CONFIG.timeLines[this.currentTimeLine].bgSpeed;

        // Verificar colisões
        this.physics.overlap(this.player, this.obstacles, this.handleCollision, null, this);
        this.physics.overlap(this.player, this.relics, this.collectRelic, null, this);
    }

    handleCollision() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        
        this.tweens.add({
            targets: this.player,
            angle: 180,
            scale: 0,
            duration: 1000,
            onComplete: () => {
                this.scene.start('GameOverScene', { score: this.score });
            }
        });
    }

    collectRelic(player, relic) {
        relic.destroy();
        this.score += 100;
        
        // Efeito de brilho
        const glow = this.add.circle(player.x, player.y, 50, 0xffd700, 0.5);
        this.tweens.add({
            targets: glow,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => glow.destroy()
        });
    }
}

// Cena de Pausa
class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, 800, 600);

        this.add.text(400, 200, 'PAUSADO', {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.createMenuButton(400, 300, 'Continuar', () => {
            this.scene.resume('GameScene');
            this.scene.stop();
        });

        this.createMenuButton(400, 380, 'Menu Principal', () => {
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });
    }

    createMenuButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 200, 50, 0x000000, 0.5);
        bg.setInteractive({ useHandCursor: true });
        
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        button.add([bg, buttonText]);
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0x444444, 0.7);
            buttonText.setScale(1.1);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x000000, 0.5);
            buttonText.setScale(1);
        });
        
        bg.on('pointerdown', callback);
    }
}

// Cena de Game Over
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
    }

    create() {
        // Fundo escuro
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, 800, 600);

        // Título
        this.add.text(400, 150, 'Game Over', {
            fontSize: '64px',
            fill: '#ff0000',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Pontuação
        this.add.text(400, 250, 'Pontuação: ' + this.finalScore, {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Botões
        this.createMenuButton(400, 350, 'Jogar Novamente', () => {
            this.scene.start('GameScene');
        });

        this.createMenuButton(400, 430, 'Menu Principal', () => {
            this.scene.start('MenuScene');
        });
    }

    createMenuButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 250, 50, 0x444444, 0.8);
        bg.setInteractive({ useHandCursor: true });
        
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        button.add([bg, buttonText]);
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0x666666, 0.8);
            buttonText.setScale(1.1);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x444444, 0.8);
            buttonText.setScale(1);
        });
        
        bg.on('pointerdown', callback);
    }
}

// Configuração do jogo
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    parent: 'game',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, PauseScene, GameOverScene]
};

window.onload = () => {
    const game = new Phaser.Game(config);
}; 