/**
 * 玩家类 - 战士/法师/游侠
 * 包含移动,跳跃,攻击,技能,装备
 */

import { spawnExplosion, spawnMagicTrail, spawnAttackTrail, spawnWhirlwind, spawnChargeTrail, spawnFireNova, spawnIceBeam, spawnArrowSpread, spawnPierceArrow, spawnUltimateEffect } from './particle.js';
import { playSound } from './audio.js';
import { EQUIPMENT_DB, CONSUMABLES, applySetBonuses } from './item.js';

// 玩家对象池(单人游戏,只需一个)
const playerPool = [];

/**
 * 玩家类
 */
class Player {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = 100; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.hp = 100; this.maxHp = 100;
    this.mp = 50; this.maxMp = 50;
    this.atk = 10; this.def = 5;
    this.level = 1; this.exp = 0; this.expToNext = 100;
    this.gold = 0;
    this.speed = 5;
    this.jumpForce = -13;
    this.grounded = false;
    this.jumpCount = 0;
    this.maxJumps = 2;
    this.direction = 1;
    this.state = 'idle';
    this.animFrame = 0;
    this.animTimer = 0;
    this.attackTimer = 0;
    this.attackDuration = 0.35;
    this.attackPhase = 'none'; // none, windup, strike, recovery
    this.attackTrailTimer = 0;
    this.skill1Cooldown = 0;
    this.skill2Cooldown = 0;
    this.ultimateCooldown = 0;
    this.ultimateCharge = 0;
    this.maxUltimateCharge = 100;
    this.hitFlash = 0;
    this.invincible = 0;
    this.classType = 'warrior';
    this.width = 48; this.height = 64;
    this.equipment = {
      weapon: null,
      armor: null,
      ring: null
    };
    this.inventory = [];
    this.active = false;
  }
  
  init(x, y, classType) {
    this.x = x; this.y = y;
    this.classType = classType;
    this.active = true;
    this.state = 'idle';
    this.hitFlash = 0;
    this.invincible = 0;
    
    // 根据职业设置属性
    switch (classType) {
      case 'warrior':
        this.maxHp = 150; this.hp = 150;
        this.maxMp = 30; this.mp = 30;
        this.atk = 12; this.def = 10;
        this.speed = 4.5;
        this.jumpForce = -12;
        break;
      case 'mage':
        this.maxHp = 80; this.hp = 80;
        this.maxMp = 100; this.mp = 100;
        this.atk = 18; this.def = 4;
        this.speed = 4;
        this.jumpForce = -11;
        break;
      case 'ranger':
        this.maxHp = 100; this.hp = 100;
        this.maxMp = 60; this.mp = 60;
        this.atk = 14; this.def = 6;
        this.speed = 5;
        this.jumpForce = -13;
        break;
    }
    
    // 应用装备加成
    this.recalcStats();
    
    return this;
  }
  
  recalcStats() {
    let bonusAtk = 0, bonusDef = 0, bonusSpd = 0;
    
    for (const slot of Object.values(this.equipment)) {
      if (slot) {
        bonusAtk += slot.atk || 0;
        bonusDef += slot.def || 0;
        bonusSpd += slot.spd || 0;
      }
    }
    
    // 应用套装加成
    const setBonus = applySetBonuses(this);
    bonusAtk += setBonus.atk;
    bonusDef += setBonus.def;
    bonusSpd += setBonus.spd;
    
    this.atk = this.getBaseAtk() + bonusAtk;
    this.def = this.getBaseDef() + bonusDef;
    this.speed = this.getBaseSpeed() + bonusSpd;
  }
  
  getBaseSpeed() {
    switch (this.classType) {
      case 'warrior': return 4.5;
      case 'mage': return 4;
      case 'ranger': return 5;
      default: return 4;
    }
  }
  
  getBaseAtk() {
    switch (this.classType) {
      case 'warrior': return 12 + this.level * 2;
      case 'mage': return 18 + this.level * 3;
      case 'ranger': return 14 + this.level * 2.5;
      default: return 10 + this.level * 2;
    }
  }
  
  getBaseDef() {
    switch (this.classType) {
      case 'warrior': return 10 + this.level * 1.5;
      case 'mage': return 4 + this.level * 0.8;
      case 'ranger': return 6 + this.level * 1;
      default: return 5 + this.level * 1;
    }
  }
  
  update(dt, input, map) {
    if (!this.active) return;
    
    // 更新动画
    this.animTimer += dt;
    if (this.animTimer > 0.12) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
    
    // 更新冷却
    if (this.skill1Cooldown > 0) this.skill1Cooldown -= dt;
    if (this.skill2Cooldown > 0) this.skill2Cooldown -= dt;
    if (this.ultimateCooldown > 0) this.ultimateCooldown -= dt;
    if (this.invincible > 0) this.invincible -= dt;
    
    // 水平移动
    let moveX = 0;
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX = -1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX = 1;
    
    if (moveX !== 0) {
      this.direction = moveX;
      this.vx = this.speed * moveX;
      this.state = 'run';
    } else {
      this.vx *= 0.8;
      if (Math.abs(this.vx) < 0.1) {
        this.vx = 0;
        if (this.grounded) this.state = 'idle';
      }
    }
    
    // 跳跃
    if (input.keys['KeyW'] || input.keys['ArrowUp'] || input.keys['Space']) {
      if (!this.jumpPressed && this.jumpCount < this.maxJumps) {
        this.vy = this.jumpForce;
        this.jumpCount++;
        this.grounded = false;
        this.state = 'jump';
        playSound('jump');
      }
      this.jumpPressed = true;
    } else {
      this.jumpPressed = false;
    }
    
    // 应用重力
    this.vy += 0.7 * dt * 60;
    
    // 移动
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    
    // 地面碰撞
    const groundY = map.getGroundY(this.x);
    if (this.y > groundY - this.height) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.grounded = true;
      this.jumpCount = 0;
      if (this.state === 'jump') this.state = 'idle';
    } else {
      this.grounded = false;
    }
    
    // 边界
    this.x = Math.max(0, Math.min(map.width - this.width, this.x));
    
    // 攻击
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      
      // 攻击阶段
      const attackProgress = 1 - (this.attackTimer / this.attackDuration);
      if (attackProgress < 0.4) {
        this.attackPhase = 'windup';
      } else if (attackProgress < 0.6) {
        this.attackPhase = 'strike';
      } else {
        this.attackPhase = 'recovery';
      }
      
      if (this.attackTimer <= 0) {
        this.attackPhase = 'none';
        this.state = this.grounded ? 'idle' : 'jump';
      }
    }
    
    // 受击闪烁
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }
  
  attack() {
    if (this.attackTimer > 0) return null;
    
    this.attackTimer = this.attackDuration;
    this.attackPhase = 'windup';
    this.state = 'attack';
    playSound('attack');
    
    // 生成攻击拖尾
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    spawnAttackTrail(cx, cy, this.direction, this.getWeaponColor() || '#ffffff');
    
    // 立即返回攻击碰撞箱
    return {
      x: this.direction > 0 ? this.x + this.width : this.x - 50,
      y: this.y,
      width: 50,
      height: this.height,
      damage: this.atk
    };
  }
  
  skill1() {
    if (this.skill1Cooldown > 0 || this.mp < 15) return null;
    
    this.skill1Cooldown = 2.0;
    this.mp -= 15;
    this.state = 'attack';
    playSound('magic');
    
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    
    // 根据职业不同效果
    if (this.classType === 'warrior') {
      // 回旋斩
      spawnWhirlwind(cx, cy, '#00ffff');
      return {
        x: cx - 50, y: cy - 50,
        width: 100, height: 100,
        damage: this.atk * 2,
        type: 'aoe'
      };
    } else if (this.classType === 'mage') {
      // 火焰新星
      spawnFireNova(cx, cy, '#ff6600');
      return {
        x: cx - 70, y: cy - 70,
        width: 140, height: 140,
        damage: this.atk * 2.5,
        type: 'aoe'
      };
    } else {
      // 散射箭
      spawnArrowSpread(cx, cy, this.direction, '#90ee90');
      return {
        x: cx - 30, y: cy - 30,
        width: 60, height: 60,
        damage: this.atk * 1.5,
        type: 'aoe'
      };
    }
  }
  
  skill2() {
    if (this.skill2Cooldown > 0 || this.mp < 25) return null;
    
    this.skill2Cooldown = 4.0;
    this.mp -= 25;
    this.state = 'attack';
    playSound('magic');
    
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    
    if (this.classType === 'warrior') {
      // 冲锋斩
      spawnChargeTrail(cx, cy, this.direction, '#00ffff');
      this.vx = this.direction * 15;
      this.invincible = 0.5;
      return {
        x: this.direction > 0 ? this.x : this.x - 100,
        y: this.y - 10,
        width: 100,
        height: this.height + 20,
        damage: this.atk * 3
      };
    } else if (this.classType === 'mage') {
      // 寒冰射线
      spawnIceBeam(cx, cy, this.direction, '#00ffff');
      return {
        x: this.direction > 0 ? this.x : this.x - 180,
        y: this.y - 30,
        width: 180,
        height: this.height + 60,
        damage: this.atk * 3
      };
    } else {
      // 穿透箭
      spawnPierceArrow(cx, cy, this.direction, '#90ee90');
      return {
        x: this.direction > 0 ? this.x : this.x - 250,
        y: this.y - 10,
        width: 250,
        height: this.height + 20,
        damage: this.atk * 2.5,
        type: 'pierce'
      };
    }
  }
  
  ultimate() {
    if (this.ultimateCooldown > 0 || this.ultimateCharge < this.maxUltimateCharge) return null;
    
    this.ultimateCooldown = 10.0;
    this.ultimateCharge = 0;
    playSound('magic');
    
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    
    // 大招特效
    const ultimateColor = this.classType === 'warrior' ? '#00ffff' : 
                         this.classType === 'mage' ? '#ff4500' : '#ffff00';
    spawnUltimateEffect(cx, cy, ultimateColor);
    
    // 清屏级伤害
    return {
      x: this.x - 150,
      y: this.y - 150,
      width: 400,
      height: 400,
      damage: this.atk * 10,
      type: 'ultimate'
    };
  }
  
  takeDamage(damage) {
    if (this.invincible > 0) return 0;
    
    const actualDamage = Math.max(1, damage - this.def);
    this.hp -= actualDamage;
    this.hitFlash = 0.15;
    this.invincible = 0.5;
    
    playSound('hurt');
    spawnExplosion(this.x + this.width / 2, this.y + this.height / 2, 6, '#ff0000');
    
    return actualDamage;
  }
  
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
  
  restoreMana(amount) {
    this.mp = Math.min(this.maxMp, this.mp + amount);
  }
  
  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.exp -= this.expToNext;
    this.level++;
    this.expToNext = Math.floor(this.expToNext * 1.5);
    this.maxHp += 20;
    this.hp = this.maxHp;
    this.maxMp += 10;
    this.mp = this.maxMp;
    this.atk += 3;
    this.def += 2;
    
    playSound('levelup');
    spawnExplosion(this.x + this.width / 2, this.y + this.height / 2, 20, '#ffd700');
  }
  
  draw(ctx, camera) {
    if (!this.active) return;
    
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    
    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX + this.width / 2, screenY + this.height - 2, this.width / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 角色绘制
    ctx.save();
    if (this.direction === -1) {
      ctx.translate(screenX + this.width, screenY);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(screenX, screenY);
    }
    
    // 受击闪烁
    if (this.hitFlash > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(this.hitFlash * 30) * 0.5;
    }
    
    // 无敌闪烁
    if (this.invincible > 0 && Math.floor(this.invincible * 20) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    // 根据职业绘制
    switch (this.classType) {
      case 'warrior':
        this.drawWarrior(ctx);
        break;
      case 'mage':
        this.drawMage(ctx);
        break;
      case 'ranger':
        this.drawRanger(ctx);
        break;
    }
    
    ctx.restore();
  }
  
  drawWarrior(ctx) {
    // 动画偏移
    let bodyOffsetY = 0;
    let bodyTilt = 0;
    let legOffset = 0;
    let armAngle = 0;
    
    switch (this.state) {
      case 'idle':
        // 呼吸动画
        bodyOffsetY = Math.sin(this.animFrame * Math.PI / 2) * 5;
        break;
      case 'run':
        // 跑步摆动
        bodyOffsetY = Math.abs(Math.sin(this.animFrame * Math.PI / 2)) * 6;
        legOffset = Math.sin(this.animFrame * Math.PI / 2) * 8;
        break;
      case 'jump':
        // 跳跃姿态
        bodyOffsetY = -8;
        legOffset = -8;
        break;
      case 'attack':
        // 攻击阶段 - 更细致的动画
        if (this.attackPhase === 'windup') {
          // 起手：身体后仰，武器向后拉
          bodyTilt = -0.2;
          armAngle = 0.8;
        } else if (this.attackPhase === 'strike') {
          // 打击：身体前冲，武器向前挥
          bodyTilt = 0.4;
          armAngle = -1.5;
        } else {
          // 收招：身体回正
          bodyTilt = 0.15;
          armAngle = -0.6;
        }
        break;
      case 'hurt':
        // 受击后仰
        bodyTilt = -0.3;
        break;
    }
    
    // 腿
    ctx.strokeStyle = '#2c5aa0';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(16, 48);
    ctx.lineTo(16 - legOffset, 64);
    ctx.moveTo(36, 48);
    ctx.lineTo(36 + legOffset, 64);
    ctx.stroke();
    
    // 靴子
    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(10 - legOffset, 62, 16, 8);
    ctx.fillRect(30 + legOffset, 62, 16, 8);
    // 靴子边缘
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 2;
    ctx.strokeRect(10 - legOffset, 62, 16, 8);
    ctx.strokeRect(30 + legOffset, 62, 16, 8);
    
    // 身体（带倾斜）
    ctx.save();
    ctx.translate(26, 36 + bodyOffsetY);
    ctx.rotate(bodyTilt);
    
    // 身体主体
    ctx.fillStyle = '#4169e1';
    ctx.beginPath();
    ctx.roundRect(-16, -14, 32, 28, 5);
    ctx.fill();
    
    // 身体轮廓
    ctx.strokeStyle = '#2c5aa0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -14, 32, 28, 5);
    ctx.stroke();
    
    // 铠甲装饰
    ctx.strokeStyle = '#6495ED';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.lineTo(16, -2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-16, 8);
    ctx.lineTo(16, 8);
    ctx.stroke();
    
    // 铠甲核心
    ctx.fillStyle = '#6495ED';
    ctx.beginPath();
    ctx.roundRect(-8, -10, 16, 20, 3);
    ctx.fill();
    
    // 铠甲核心轮廓
    ctx.strokeStyle = '#4169e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-8, -10, 16, 20, 3);
    ctx.stroke();
    
    ctx.restore();
    
    // 头
    const headY = 16 + bodyOffsetY;
    
    // 脖子
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(23, headY + 10, 8, 5);
    
    // 头
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(26, headY, 14, 0, Math.PI * 2);
    ctx.fill();
    
    // 头部轮廓
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(26, headY, 14, 0, Math.PI * 2);
    ctx.stroke();
    
    // 头盔（如果穿戴）
    if (this.equipment.helmet) {
      ctx.fillStyle = this.equipment.helmet.rarity.color;
      ctx.beginPath();
      ctx.arc(26, headY - 2, 14, Math.PI, Math.PI * 2);
      ctx.fill();
      // 头盔轮廓
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(26, headY - 2, 14, Math.PI, Math.PI * 2);
      ctx.stroke();
      // 头盔装饰
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(26, headY - 12, 4, 0, Math.PI * 2);
      ctx.fill();
      // 头盔装饰轮廓
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(26, headY - 12, 4, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // 头发
      ctx.fillStyle = '#4a3728';
      ctx.beginPath();
      ctx.arc(26, headY - 2, 14, Math.PI, Math.PI * 2);
      ctx.fill();
      
      // 头发轮廓
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(26, headY - 2, 14, Math.PI, Math.PI * 2);
      ctx.stroke();
      
      // 眼睛
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(26 - 5, headY + 2, 3, 0, Math.PI * 2);
      ctx.arc(26 + 5, headY + 2, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // 眼睛高光
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(26 - 4, headY + 1, 1, 0, Math.PI * 2);
      ctx.arc(26 + 6, headY + 1, 1, 0, Math.PI * 2);
      ctx.fill();
      
      // 嘴巴
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(26 - 4, headY + 8);
      ctx.lineTo(26 + 4, headY + 8);
      ctx.stroke();
    }
    
    // 剑（根据攻击阶段改变位置）
    ctx.save();
    ctx.translate(40, 36 + bodyOffsetY);
    ctx.rotate(bodyTilt + armAngle);
    ctx.strokeStyle = this.getWeaponColor();
    ctx.lineWidth = this.getWeaponWidth();
    ctx.lineCap = 'round';
    
    if (this.state === 'attack') {
      if (this.attackPhase === 'windup') {
        // 起手：剑向后拉，准备挥砍
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-14, -26);
        ctx.stroke();
        // 蓄力光晕
        ctx.strokeStyle = this.getWeaponGlow();
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-14, -26);
        ctx.stroke();
      } else if (this.attackPhase === 'strike') {
        // 打击：剑向前挥，带弧线
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(22, -22, 40, -12);
        ctx.stroke();
        // 剑气光晕
        ctx.strokeStyle = this.getWeaponGlow();
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(22, -22, 40, -12);
        ctx.stroke();
      } else {
        // 收招：剑回到身后
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(12, -22);
        ctx.stroke();
      }
    } else {
      // 待机/跑步 - 剑在身后
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(12, -22);
      ctx.stroke();
    }
    ctx.restore();
  }
  
  getWeaponColor() {
    if (!this.equipment.weapon) return '#c0c0c0';
    switch (this.equipment.weapon.rarity.class) {
      case 'rare': return '#339af0';
      case 'epic': return '#ff6600';
      case 'legendary': return '#ffd700';
      default: return '#c0c0c0';
    }
  }
  
  getWeaponWidth() {
    if (!this.equipment.weapon) return 3;
    switch (this.equipment.weapon.rarity.class) {
      case 'rare': return 4;
      case 'epic': return 5;
      case 'legendary': return 6;
      default: return 3;
    }
  }
  
  getWeaponGlow() {
    if (!this.equipment.weapon) return 'transparent';
    switch (this.equipment.weapon.rarity.class) {
      case 'rare': return 'rgba(51,154,240,0.4)';
      case 'epic': return 'rgba(255,102,0,0.5)';
      case 'legendary': return 'rgba(255,215,0,0.6)';
      default: return 'transparent';
    }
  }
  
  drawMage(ctx) {
    // 动画偏移
    let bodyOffsetY = 0;
    let bodyTilt = 0;
    let legOffset = 0;
    
    switch (this.state) {
      case 'idle':
        bodyOffsetY = Math.sin(this.animFrame * Math.PI / 2) * 5;
        break;
      case 'run':
        bodyOffsetY = Math.abs(Math.sin(this.animFrame * Math.PI / 2)) * 6;
        legOffset = Math.sin(this.animFrame * Math.PI / 2) * 4;
        break;
      case 'jump':
        bodyOffsetY = -8;
        legOffset = -5;
        break;
      case 'attack':
        // 攻击阶段
        if (this.attackPhase === 'windup') {
          bodyTilt = -0.15;
        } else if (this.attackPhase === 'strike') {
          bodyTilt = 0.25;
        } else {
          bodyTilt = 0.1;
        }
        break;
      case 'hurt':
        bodyTilt = -0.3;
        break;
    }
    
    // 腿
    ctx.strokeStyle = '#7d3c98';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(15, 44);
    ctx.lineTo(15 - legOffset, 60);
    ctx.moveTo(25, 44);
    ctx.lineTo(25 + legOffset, 60);
    ctx.stroke();
    
    // 靴子
    ctx.fillStyle = '#4a235a';
    ctx.fillRect(11 - legOffset, 58, 10, 6);
    ctx.fillRect(23 - legOffset, 58, 10, 6);
    
    // 法袍（带倾斜）
    ctx.save();
    ctx.translate(20, 42 + bodyOffsetY);
    ctx.rotate(bodyTilt);
    
    // 法袍主体
    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(12, -2);
    ctx.lineTo(8, 16);
    ctx.lineTo(-8, 16);
    ctx.closePath();
    ctx.fill();
    
    // 法袍轮廓
    ctx.strokeStyle = '#7d3c98';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(12, -2);
    ctx.lineTo(8, 16);
    ctx.lineTo(-8, 16);
    ctx.closePath();
    ctx.stroke();
    
    // 法袍装饰
    ctx.strokeStyle = '#bb8fce';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.lineTo(10, 4);
    ctx.stroke();
    
    // 铠甲装饰
    if (this.equipment.armor) {
      ctx.fillStyle = this.equipment.armor.rarity.color;
      ctx.fillRect(-8, 0, 16, 2);
      ctx.fillRect(-8, 6, 16, 2);
    }
    ctx.restore();
    
    // 头
    const headY = 14 + bodyOffsetY;
    
    // 头
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(20, headY, 11, 0, Math.PI * 2);
    ctx.fill();
    
    // 头部轮廓
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(20, headY, 11, 0, Math.PI * 2);
    ctx.stroke();
    
    // 头盔
    if (this.equipment.helmet) {
      ctx.fillStyle = this.equipment.helmet.rarity.color;
      ctx.beginPath();
      ctx.arc(20, headY - 2, 11, Math.PI, Math.PI * 2);
      ctx.fill();
      // 头盔轮廓
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(20, headY - 2, 11, Math.PI, Math.PI * 2);
      ctx.stroke();
    } else {
      // 帽子
      ctx.fillStyle = '#8e44ad';
      ctx.beginPath();
      ctx.moveTo(10, headY);
      ctx.lineTo(20, headY - 24);
      ctx.lineTo(30, headY);
      ctx.closePath();
      ctx.fill();
      
      // 帽子轮廓
      ctx.strokeStyle = '#6c3483';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, headY);
      ctx.lineTo(20, headY - 24);
      ctx.lineTo(30, headY);
      ctx.closePath();
      ctx.stroke();
      
      // 眼睛
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(20 - 4, headY + 2, 2.5, 0, Math.PI * 2);
      ctx.arc(20 + 4, headY + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 眼睛高光
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(20 - 3, headY + 1, 1, 0, Math.PI * 2);
      ctx.arc(20 + 5, headY + 1, 1, 0, Math.PI * 2);
      ctx.fill();
      
      // 嘴巴
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20 - 4, headY + 8);
      ctx.lineTo(20 + 4, headY + 8);
      ctx.stroke();
    }
    
    // 法杖（根据攻击阶段改变角度）
    ctx.save();
    ctx.translate(32, 22 + bodyOffsetY);
    ctx.rotate(bodyTilt);
    let staffAngle = 0;
    if (this.state === 'attack') {
      if (this.attackPhase === 'windup') {
        staffAngle = 0.4;
      } else if (this.attackPhase === 'strike') {
        staffAngle = -0.6;
      } else {
        staffAngle = -0.2;
      }
    } else if (this.state === 'jump') {
      staffAngle = 0.1;
    }
    ctx.rotate(staffAngle);
    
    // 法杖主体
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 32);
    ctx.stroke();
    
    // 法杖轮廓
    ctx.strokeStyle = '#5d3a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.lineTo(-1, 32);
    ctx.moveTo(1, 0);
    ctx.lineTo(1, 32);
    ctx.stroke();
    
    // 法杖顶端宝石
    ctx.fillStyle = this.getWeaponGlow() || '#00ffff';
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 宝石轮廓
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }
  
  drawRanger(ctx) {
    // 动画偏移
    let bodyOffsetY = 0;
    let bodyTilt = 0;
    let legOffset = 0;
    
    switch (this.state) {
      case 'idle':
        bodyOffsetY = Math.sin(this.animFrame * Math.PI / 2) * 5;
        break;
      case 'run':
        bodyOffsetY = Math.abs(Math.sin(this.animFrame * Math.PI / 2)) * 6;
        legOffset = Math.sin(this.animFrame * Math.PI / 2) * 7;
        break;
      case 'jump':
        bodyOffsetY = -8;
        legOffset = -6;
        break;
      case 'attack':
        // 攻击阶段
        if (this.attackPhase === 'windup') {
          bodyTilt = -0.15;
        } else if (this.attackPhase === 'strike') {
          bodyTilt = 0.25;
        } else {
          bodyTilt = 0.1;
        }
        break;
      case 'hurt':
        bodyTilt = -0.3;
        break;
    }
    
    // 腿
    ctx.strokeStyle = '#1e8449';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(13, 44);
    ctx.lineTo(13 - legOffset, 60);
    ctx.moveTo(27, 44);
    ctx.lineTo(27 + legOffset, 60);
    ctx.stroke();
    
    // 靴子
    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(9 - legOffset, 58, 10, 6);
    ctx.fillRect(25 - legOffset, 58, 10, 6);
    // 靴子边缘
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 2;
    ctx.strokeRect(9 - legOffset, 58, 10, 6);
    ctx.strokeRect(25 - legOffset, 58, 10, 6);
    
    // 身体（带倾斜）
    ctx.save();
    ctx.translate(20, 30 + bodyOffsetY);
    ctx.rotate(bodyTilt);
    
    // 身体主体
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.roundRect(-12, -10, 24, 20, 4);
    ctx.fill();
    
    // 身体轮廓
    ctx.strokeStyle = '#1e8449';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-12, -10, 24, 20, 4);
    ctx.stroke();
    
    // 铠甲装饰
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    
    // 铠甲核心
    if (this.equipment.armor) {
      ctx.fillStyle = this.equipment.armor.rarity.color;
      ctx.fillRect(-6, -6, 12, 14);
      
      // 铠甲核心轮廓
      ctx.strokeStyle = '#1e8449';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-6, -6, 12, 14, 2);
      ctx.stroke();
    }
    ctx.restore();
    
    // 头
    const headY = 14 + bodyOffsetY;
    
    // 头
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(20, headY, 11, 0, Math.PI * 2);
    ctx.fill();
    
    // 头部轮廓
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(20, headY, 11, 0, Math.PI * 2);
    ctx.stroke();
    
    // 头盔
    if (this.equipment.helmet) {
      ctx.fillStyle = this.equipment.helmet.rarity.color;
      ctx.beginPath();
      ctx.arc(20, headY - 2, 11, Math.PI, Math.PI * 2);
      ctx.fill();
      // 头盔轮廓
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(20, headY - 2, 11, Math.PI, Math.PI * 2);
      ctx.stroke();
    } else {
      // 帽子（羽毛帽）
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.moveTo(10, headY);
      ctx.lineTo(20, headY - 10);
      ctx.lineTo(30, headY);
      ctx.closePath();
      ctx.fill();
      
      // 帽子轮廓
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, headY);
      ctx.lineTo(20, headY - 10);
      ctx.lineTo(30, headY);
      ctx.closePath();
      ctx.stroke();
      
      // 羽毛
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(20, headY - 10);
      ctx.lineTo(18, headY - 20);
      ctx.stroke();
      
      // 羽毛纹理
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, headY - 12);
      ctx.lineTo(19, headY - 18);
      ctx.stroke();
      
      // 眼睛
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(20 - 4, headY + 2, 2.5, 0, Math.PI * 2);
      ctx.arc(20 + 4, headY + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 眼睛高光
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(20 - 3, headY + 1, 1, 0, Math.PI * 2);
      ctx.arc(20 + 5, headY + 1, 1, 0, Math.PI * 2);
      ctx.fill();
      
      // 嘴巴
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20 - 4, headY + 8);
      ctx.lineTo(20 + 4, headY + 8);
      ctx.stroke();
    }
    
    // 弓（根据攻击阶段改变）
    ctx.save();
    ctx.translate(30, 30 + bodyOffsetY);
    ctx.rotate(bodyTilt);
    ctx.strokeStyle = this.getWeaponColor();
    ctx.lineWidth = this.getWeaponWidth();
    ctx.lineCap = 'round';
    
    if (this.state === 'attack') {
      if (this.attackPhase === 'windup') {
        // 拉弓准备
        ctx.beginPath();
        ctx.arc(0, 0, 14, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        // 弓弦向后拉
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(-10, 0);
        ctx.lineTo(0, 14);
        ctx.stroke();
        // 箭
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-12, -1.5, 20, 3);
        // 箭羽
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-12, -1.5);
        ctx.lineTo(-16, -4);
        ctx.lineTo(-16, 1);
        ctx.closePath();
        ctx.fill();
      } else if (this.attackPhase === 'strike') {
        // 射箭
        ctx.beginPath();
        ctx.arc(0, 0, 12, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        // 弓弦恢复
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(0, 12);
        ctx.stroke();
        // 箭矢飞出
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(6, -1.5, 18, 3);
        // 箭羽
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(22, -1.5);
        ctx.lineTo(26, -4);
        ctx.lineTo(26, 1);
        ctx.closePath();
        ctx.fill();
      } else {
        // 收招
        ctx.beginPath();
        ctx.arc(0, 0, 12, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }
    } else {
      // 待机
      ctx.beginPath();
      ctx.arc(0, 0, 12, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      // 弓弦
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 12);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * 获取玩家实例
 */
export function getPlayer() {
  if (playerPool.length === 0) {
    playerPool.push(new Player());
  }
  return playerPool[0];
}

/**
 * 初始化玩家
 */
export function initPlayer() {
  if (playerPool.length === 0) {
    playerPool.push(new Player());
  }
  return playerPool[0];
}

/**
 * 重置玩家
 */
export function resetPlayer() {
  if (playerPool.length > 0) {
    playerPool[0].reset();
  }
}

export default { Player, getPlayer, initPlayer, resetPlayer };
