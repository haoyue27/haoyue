/**
 * 主游戏入口 - 游戏循环,场景管理,输入处理
 */

import { initAudio, playSound } from './audio.js';
import { initParticles, updateParticles, drawParticles, clearParticles, spawnExplosion } from './particle.js';
import { initPlayer, getPlayer, resetPlayer } from './player.js';
import { initEnemies, spawnEnemies, updateEnemies, drawEnemies, getActiveEnemies, clearEnemies } from './enemy.js';
import { initBosses, spawnBoss, updateBosses, drawBosses, getActiveBosses, clearBosses } from './boss.js';
import { GameMap, getGroundHeight, MAP_CONFIG } from './map.js';
import { generateDrop } from './item.js';
import { UIManager } from './ui.js';

// 画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏状态
const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over'
};

// 游戏配置
const CONFIG = {
  width: 1280,
  height: 720,
  targetFPS: 60,
  fixedDeltaTime: 1 / 60,
  maxFrameSkip: 5
};

// 游戏主类
class Game {
  constructor() {
    this.state = GameState.MENU;
    this.lastTime = 0;
    this.accumulator = 0;
    this.frameCount = 0;
    this.paused = false;
    
    // 相机
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      smoothing: 0.08
    };
    
    // 游戏对象
    this.player = null;
    this.map = null;
    this.ui = null;
    this.enemies = [];
    this.bosses = [];
    this.particles = [];
    
    // 投射物
    this.projectiles = [];
    
    // 技能伤害判定
    this.skillDamageBoxes = [];
    
    // 伤害数字
    this.damageNumbers = [];
    
    // 关卡进度
    this.currentLevel = 1;
    this.totalKills = 0;
    this.levelKills = 0;
    this.levelExp = 0;
    this.levelGold = 0;
    
    // 输入状态
    this.input = {
      keys: {},
      mouse: { x: 0, y: 0, down: false }
    };
    
    // Boss 房间
    this.bossRoom = false;
    this.bossSpawned = false;
    this.bossDefeated = false;
    
    // 初始化
    this.resize();
    this.setupInput();
    this.init();
    
    // 启动游戏循环
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  /**
   * 初始化游戏
   */
  init() {
    // 初始化音频
    initAudio();
    
    // 初始化粒子系统
    initParticles();
    
    // 初始化玩家
    this.player = initPlayer();
    
    // 初始化敌人池
    initEnemies();
    
    // 初始化Boss池
    initBosses();
    
    // 初始化UI
    this.ui = new UIManager();
    this.ui.init(this.player, this);
    
    // 生成地图
    this.generateLevel();
    
    // 显示主菜单
    this.ui.showMainMenu();
  }
  
  /**
   * 生成关卡
   */
  generateLevel() {
    this.map = new GameMap(this.currentLevel);
    
    // 根据关卡设置不同主题
    switch (this.currentLevel) {
      case 1: // 翡翠草原
        this.ui.setLevelName('翡翠草原');
        break;
      case 2: // 幽暗洞窟
        this.ui.setLevelName('幽暗洞窟');
        break;
      case 3: // 烈焰火山
        this.ui.setLevelName('烈焰火山');
        break;
    }
    
    // 生成敌人
    const enemyCount = 10 + this.currentLevel * 5;
    spawnEnemies(enemyCount, this.map.width, this.map.height, (x) => getGroundHeight(x));
    
    // 生成Boss(关卡末尾)
    if (!this.bossSpawned) {
      const bossX = this.map.width - 200;
      const bossY = getGroundHeight(bossX);
      let bossType;
      
      switch (this.currentLevel) {
        case 1: bossType = 'wild_boar'; break;
        case 2: bossType = 'crystal_golem'; break;
        case 3: bossType = 'fire_dragon'; break;
        default: bossType = 'wild_boar';
      }
      
      spawnBoss(bossX, bossY - 80, bossType);
      this.bossSpawned = true;
    }
    
    // 重置关卡统计
    this.levelKills = 0;
    this.levelExp = 0;
    this.levelGold = 0;
    this.bossDefeated = false;
  }
  
  /**
   * 开始游戏
   */
  start() {
    this.state = GameState.PLAYING;
    this.player.init(100, 300, this.player.classType);
    this.generateLevel();
  }
  
  /**
   * 重启
   */
  restart() {
    this.currentLevel = 1;
    this.totalKills = 0;
    this.bossSpawned = false;
    
    clearEnemies();
    clearBosses();
    clearParticles();
    
    this.player = initPlayer();
    this.ui.init(this.player, this);
    this.generateLevel();
    this.start();
  }
  
  /**
   * 下一关
   */
  nextLevel() {
    this.currentLevel++;
    this.bossSpawned = false;
    
    clearEnemies();
    clearBosses();
    clearParticles();
    
    this.generateLevel();
    this.start();
  }
  
  /**
   * 设置输入监听
   */
  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;
      
      // 防止按键重复
      if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      
      // 攻击快捷键
      if (this.state === GameState.PLAYING) {
        switch (e.code) {
          case 'KeyJ':
          case 'Mouse0':
            this.playerAttack();
            break;
          case 'KeyK':
            this.playerSkill1();
            break;
          case 'KeyL':
            this.playerSkill2();
            break;
          case 'Space':
            this.playerUltimate();
            break;
        }
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });
    
    // 鼠标
    canvas.addEventListener('mousedown', (e) => {
      this.input.mouse.down = true;
      if (this.state === GameState.PLAYING) {
        this.playerAttack();
      }
    });
    
    canvas.addEventListener('mouseup', () => {
      this.input.mouse.down = false;
    });
    
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.input.mouse.x = e.clientX - rect.left;
      this.input.mouse.y = e.clientY - rect.top;
    });
    
    // 窗口大小调整
    window.addEventListener('resize', () => this.resize());
    
    // 手机虚拟按键
    this.setupMobileControls();
  }
  
  /**
   * 设置手机虚拟按键
   */
  setupMobileControls() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');
    const btnAttack = document.getElementById('btn-attack');
    const btnSkill1 = document.getElementById('btn-skill1');
    const btnSkill2 = document.getElementById('btn-skill2');
    const btnUltimate = document.getElementById('btn-ultimate');
    
    if (!joystickBase || !joystickStick) return;
    
    // 虚拟摇杆
    let joystickTouch = null;
    let joystickCenterX = 0;
    let joystickCenterY = 0;
    const joystickRadius = 35;
    
    const handleJoystickStart = (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      joystickTouch = touch.identifier;
      const rect = joystickBase.getBoundingClientRect();
      joystickCenterX = rect.left + rect.width / 2;
      joystickCenterY = rect.top + rect.height / 2;
      this.input.keys['KeyA'] = false;
      this.input.keys['KeyD'] = false;
    };
    
    const handleJoystickMove = (e) => {
      e.preventDefault();
      if (joystickTouch === null) return;
      
      for (const touch of e.changedTouches) {
        if (touch.identifier !== joystickTouch) continue;
        
        const dx = touch.clientX - joystickCenterX;
        const dy = touch.clientY - joystickCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const clampedDistance = Math.min(distance, joystickRadius);
        const angle = Math.atan2(dy, dx);
        
        const stickX = Math.cos(angle) * clampedDistance;
        const stickY = Math.sin(angle) * clampedDistance;
        
        joystickStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
        
        // 设置移动方向
        if (Math.abs(dx) > 10) {
          this.input.keys['KeyD'] = dx > 0;
          this.input.keys['KeyA'] = dx < 0;
        } else {
          this.input.keys['KeyA'] = false;
          this.input.keys['KeyD'] = false;
        }
        
        // 向上推 = 跳跃
        if (dy < -20) {
          this.input.keys['KeyW'] = true;
        } else {
          this.input.keys['KeyW'] = false;
        }
        
        break;
      }
    };
    
    const handleJoystickEnd = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouch) {
          joystickTouch = null;
          joystickStick.style.transform = 'translate(-50%, -50%)';
          this.input.keys['KeyA'] = false;
          this.input.keys['KeyD'] = false;
          this.input.keys['KeyW'] = false;
          break;
        }
      }
    };
    
    joystickBase.addEventListener('touchstart', handleJoystickStart, { passive: false });
    joystickBase.addEventListener('touchmove', handleJoystickMove, { passive: false });
    joystickBase.addEventListener('touchend', handleJoystickEnd, { passive: false });
    joystickBase.addEventListener('touchcancel', handleJoystickEnd, { passive: false });
    
    // 动作按钮
    const setupButton = (btn, keyCode, action) => {
      if (!btn) return;
      
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.input.keys[keyCode] = true;
        if (action && this.state === GameState.PLAYING) {
          action();
        }
      });
      
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.input.keys[keyCode] = false;
      });
      
      btn.addEventListener('touchcancel', (e) => {
        this.input.keys[keyCode] = false;
      });
    };
    
    setupButton(btnAttack, 'KeyJ', () => this.playerAttack());
    setupButton(btnSkill1, 'KeyK', () => this.playerSkill1());
    setupButton(btnSkill2, 'KeyL', () => this.playerSkill2());
    setupButton(btnUltimate, 'Space', () => this.playerUltimate());
  }
  
  /**
   * 调整画布大小
   */
  resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  /**
   * 游戏主循环
   */
  gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    
    if (!this.paused && this.state === GameState.PLAYING) {
      // 固定时间步长更新
      this.accumulator += deltaTime;
      
      let frames = 0;
      while (this.accumulator >= CONFIG.fixedDeltaTime && frames < CONFIG.maxFrameSkip) {
        this.update(CONFIG.fixedDeltaTime);
        this.accumulator -= CONFIG.fixedDeltaTime;
        frames++;
      }
    }
    
    // 渲染
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  /**
   * 更新逻辑
   */
  update(dt) {
    // 更新地图
    this.map.update(dt);
    
    // 更新玩家
    this.player.update(dt, this.input, this.map);
    
    // 更新相机
    this.updateCamera(dt);
    
    // 更新敌人
    updateEnemies(dt, this.player, this.map);
    
    // 更新Boss
    updateBosses(dt, this.player, this.map);
    
    // 更新粒子
    updateParticles(dt);
    
    // 更新投射物
    this.updateProjectiles(dt);
    
    // 更新技能伤害判定
    for (const box of this.skillDamageBoxes) {
      box.life -= dt;
    }
    this.skillDamageBoxes = this.skillDamageBoxes.filter(box => box.life > 0);
    
    // 更新伤害数字
    this.updateDamageNumbers(dt);
    
    // 碰撞检测
    this.checkCollisions();
    
    // 检查Boss击败
    this.checkBossDefeated();
    
    // 更新UI
    this.ui.update(dt);
  }
  
  /**
   * 更新相机
   */
  updateCamera(dt) {
    // 目标位置:跟随玩家,但保持平滑
    this.camera.targetX = this.player.x - canvas.width / 3;
    this.camera.targetY = this.player.y - canvas.height / 2;
    
    // 平滑插值
    this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;
    this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothing;
    
    // 边界限制
    this.camera.x = Math.max(0, Math.min(this.map.width - canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.map.height - canvas.height, this.camera.y));
  }
  
  /**
   * 更新投射物
   */
  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      
      proj.x += proj.vx * dt * 60;
      proj.y += proj.vy * dt * 60;
      proj.life -= dt;
      
      // 移除过期投射物
      if (proj.life <= 0 || proj.x < 0 || proj.x > this.map.width) {
        this.projectiles.splice(i, 1);
      }
    }
  }
  
  /**
   * 更新伤害数字
   */
  updateDamageNumbers(dt) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y -= 1 * dt * 60;
      dn.life -= dt;
      
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }
  
  /**
   * 碰撞检测
   */
  checkCollisions() {
    // 玩家攻击 vs 敌人
    if (this.player.attackTimer > 0 && this.player.attackTimer < this.player.attackDuration - 0.05) {
      const attackBox = {
        x: this.player.direction > 0 ? this.player.x + this.player.width : this.player.x - 50,
        y: this.player.y,
        width: 50,
        height: this.player.height
      };
      
      for (const enemy of getActiveEnemies()) {
        if (enemy.state === 'dead') continue;
        
        if (this.boxCollision(attackBox, enemy)) {
          const damage = enemy.takeDamage(this.player.atk, this.player.direction);
          this.showDamageNumber(enemy.x + enemy.width / 2, enemy.y, damage, false);
          
          // 经验获得
          this.player.gainExp(10);
          this.levelExp += 10;
        }
      }
      
      // 玩家攻击 vs Boss
      for (const boss of getActiveBosses()) {
        if (boss.state === 'dead') continue;
        
        if (this.boxCollision(attackBox, boss)) {
          const damage = boss.takeDamage(this.player.atk);
          this.showDamageNumber(boss.x + boss.width / 2, boss.y, damage, false);
        }
      }
    }
    
    // 玩家技能 vs 敌人/Boss
    for (const skillBox of this.skillDamageBoxes) {
      // 敌人
      for (const enemy of getActiveEnemies()) {
        if (enemy.state === 'dead') continue;
        
        const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
        if (this.boxCollision(skillBox, enemyBox)) {
          const damage = enemy.takeDamage(skillBox.damage, this.player.direction);
          this.showDamageNumber(enemy.x + enemy.width / 2, enemy.y, damage, false);
          this.player.gainExp(10);
          this.levelExp += 10;
        }
      }
      
      // Boss
      for (const boss of getActiveBosses()) {
        if (boss.state === 'dead') continue;
        
        const bossBox = { x: boss.x, y: boss.y, width: boss.width, height: boss.height };
        if (this.boxCollision(skillBox, bossBox)) {
          const damage = boss.takeDamage(skillBox.damage);
          this.showDamageNumber(boss.x + boss.width / 2, boss.y, damage, false);
        }
      }
    }
    
    // 敌人攻击 vs 玩家
    for (const enemy of getActiveEnemies()) {
      if (enemy.state === 'dead' || enemy.state !== 'attack') continue;
      
      const attackBox = enemy.getAttackBox();
      if (!attackBox) continue;
      
      const playerBox = {
        x: this.player.x,
        y: this.player.y,
        width: this.player.width,
        height: this.player.height
      };
      
      if (this.boxCollision(attackBox, playerBox)) {
        this.player.takeDamage(enemy.atk);
      }
    }
    
    // Boss攻击 vs 玩家
    for (const boss of getActiveBosses()) {
      if (boss.state === 'dead') continue;
      
      const attackBox = boss.getAttackBox();
      if (attackBox && this.boxCollision(attackBox, this.player)) {
        this.player.takeDamage(boss.atk);
      }
      
      // 预警圈(简化版)
      const warning = boss.getWarningCircle();
      if (warning && warning.timer <= 0.1) {
        // 预警即将生效
      }
    }
    
    // 投射物 vs 敌人/Boss
    for (const proj of this.projectiles) {
      // 敌人
      for (const enemy of getActiveEnemies()) {
        if (enemy.state === 'dead') continue;
        
        const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
        if (this.boxCollision(proj, enemyBox)) {
          const damage = enemy.takeDamage(proj.damage, proj.vx > 0 ? 1 : -1);
          this.showDamageNumber(enemy.x + enemy.width / 2, enemy.y, damage, false);
          this.player.gainExp(10);
          proj.life = 0;
          break;
        }
      }
      
      // Boss
      for (const boss of getActiveBosses()) {
        if (boss.state === 'dead') continue;
        
        const bossBox = { x: boss.x, y: boss.y, width: boss.width, height: boss.height };
        if (this.boxCollision(proj, bossBox)) {
          const damage = boss.takeDamage(proj.damage);
          this.showDamageNumber(boss.x + boss.width / 2, boss.y, damage, false);
          proj.life = 0;
          break;
        }
      }
    }
    
    // 拾取检测
    this.checkPickups();
  }
  
  /**
   * 碰撞检测辅助
   */
  boxCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }
  
  /**
   * 检查拾取
   */
  checkPickups() {
    // 简化版:敌人死亡时直接掉落到玩家背包
    // 实际项目中会有独立的掉落物实体
  }
  
  /**
   * 显示伤害数字
   */
  showDamageNumber(x, y, damage, isCritical) {
    this.damageNumbers.push({
      x, y,
      text: Math.floor(damage).toString(),
      life: 1.0,
      color: isCritical ? '#ff0' : '#fff',
      size: isCritical ? 20 : 14
    });
  }
  
  /**
   * 检查Boss是否被击败
   */
  checkBossDefeated() {
    for (const boss of getActiveBosses()) {
      if (boss.state === 'dead' && !this.bossDefeated) {
        this.bossDefeated = true;
        
        // 奖励
        const drops = generateDrop(boss.type.toLowerCase());
        for (const drop of drops) {
          if (drop.type === 'gold') {
            this.player.gold += drop.amount;
            this.levelGold += drop.amount;
          } else if (drop.type === 'consumable') {
            this.player.inventory.push(drop.item);
          } else if (drop.type === 'equipment') {
            this.player.inventory.push(drop.item);
          }
        }
        
        // 显示结算
        setTimeout(() => {
          this.ui.showResult(
            this.levelKills,
            this.levelExp,
            this.levelGold,
            drops
          );
        }, 1500);
      }
    }
  }
  
  /**
   * 玩家攻击
   */
  playerAttack() {
    const attackBox = this.player.attack();
    if (attackBox) {
      spawnExplosion(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        5, '#fff'
      );
    }
  }
  
  /**
   * 玩家技能1
   */
  playerSkill1() {
    const result = this.player.skill1();
    if (result) {
      if (result.projectiles) {
        this.projectiles.push(...result.projectiles);
      }
      if (result.x !== undefined) {
        this.skillDamageBoxes.push({
          ...result,
          life: 0.3,
          maxLife: 0.3
        });
      }
      spawnExplosion(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        10, '#00ffff'
      );
    }
  }
  
  /**
   * 玩家技能2
   */
  playerSkill2() {
    const result = this.player.skill2();
    if (result) {
      if (result.projectiles) {
        this.projectiles.push(...result.projectiles);
      }
      if (result.x !== undefined) {
        this.skillDamageBoxes.push({
          ...result,
          life: 0.4,
          maxLife: 0.4
        });
      }
      spawnExplosion(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        15, '#ff00ff'
      );
    }
  }
  
  /**
   * 玩家大招
   */
  playerUltimate() {
    const result = this.player.ultimate();
    if (result) {
      if (result.projectiles) {
        this.projectiles.push(...result.projectiles);
      }
      if (result.x !== undefined) {
        this.skillDamageBoxes.push({
          ...result,
          life: 0.6,
          maxLife: 0.6
        });
      }
      spawnExplosion(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        30, '#ffd700'
      );
    }
  }
  
  /**
   * 渲染
   */
  render() {
    // 清空画布
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (this.state === GameState.MENU) {
      // 菜单背景动画
      this.renderMenuBackground();
      return;
    }
    
    if (!this.map || !this.player) return;
    
    // 绘制视差背景层
    this.map.drawBackground(ctx, this.camera, 0); // 天空
    this.map.drawBackground(ctx, this.camera, 1); // 云朵
    this.map.drawBackground(ctx, this.camera, 2); // 远山
    this.map.drawBackground(ctx, this.camera, 3); // 丘陵
    this.map.drawBackground(ctx, this.camera, 4); // 树木
    this.map.drawBackground(ctx, this.camera, 5); // 地面
    
    // 绘制Boss预警圈
    for (const boss of getActiveBosses()) {
      const warning = boss.getWarningCircle();
      if (warning) {
        const screenX = warning.x - this.camera.x;
        const screenY = warning.y - this.camera.y;
        
        ctx.strokeStyle = `rgba(255, 0, 0, ${warning.timer})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX, screenY, warning.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内部填充
        ctx.fillStyle = `rgba(255, 0, 0, ${warning.timer * 0.2})`;
        ctx.fill();
      }
    }
    
    // 绘制敌人
    drawEnemies(ctx, this.camera);
    
    // 绘制Boss
    drawBosses(ctx, this.camera);
    
    // 绘制玩家
    this.player.draw(ctx, this.camera);
    
    // 绘制粒子
    drawParticles(ctx, this.camera);
    
    // 绘制投射物
    this.drawProjectiles(ctx);
    
    // 绘制伤害数字
    this.drawDamageNumbers(ctx);
    
    // 绘制碰撞箱(调试)
    // this.map.drawColliders(ctx, this.camera);
  }
  
  /**
   * 绘制菜单背景
   */
  renderMenuBackground() {
    // 简单的星空背景
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 97 + Date.now() * 0.01) % canvas.width;
      const y = (i * 53) % canvas.height;
      const size = (i % 3) + 1;
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.001 + i) * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  
  /**
   * 绘制投射物
   */
  drawProjectiles(ctx) {
    for (const proj of this.projectiles) {
      const screenX = proj.x - this.camera.x;
      const screenY = proj.y - this.camera.y;
      
      ctx.fillStyle = proj.color || '#ff0';
      ctx.beginPath();
      ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // 拖尾
      ctx.strokeStyle = proj.color || '#ff0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX - proj.vx * 2, screenY - proj.vy * 2);
      ctx.stroke();
    }
  }
  
  /**
   * 绘制伤害数字
   */
  drawDamageNumbers(ctx) {
    for (const dn of this.damageNumbers) {
      const screenX = dn.x - this.camera.x;
      const screenY = dn.y - this.camera.y;
      const alpha = dn.life;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dn.color;
      ctx.font = `bold ${dn.size}px Microsoft YaHei`;
      ctx.textAlign = 'center';
      ctx.fillText(dn.text, screenX, screenY);
      ctx.globalAlpha = 1;
    }
  }
}

// 启动游戏
const game = new Game();

// 导出供调试使用
export { game, GameState };
