/**
 * 敌人类 - 包含史莱姆,哥布林,骷髅兵等
 * 使用对象池管理
 */

import { spawnExplosion } from './particle.js';
import { playSound } from './audio.js';

// 敌人对象池
const enemyPool = [];
const activeEnemies = [];
const MAX_ENEMIES = 50;

/**
 * 敌人基类
 */
class Enemy {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.hp = 0; this.maxHp = 0;
    this.atk = 0; this.def = 0;
    this.speed = 0;
    this.width = 40; this.height = 40;
    this.type = 'slime';
    this.state = 'idle'; // idle, patrol, chase, attack, hurt, dead
    this.direction = 1; // 1=右, -1=左
    this.animFrame = 0;
    this.animTimer = 0;
    this.attackCooldown = 0;
    this.detectionRange = 200;
    this.attackRange = 50;
    this.patrolRange = 100;
    this.patrolStartX = 0;
    this.hitFlash = 0;
    this.deathTimer = 0;
    this.active = false;
    this.knockback = 0;
  }
  
  init(x, y, type) {
    this.x = x; this.y = y;
    this.patrolStartX = x;
    this.type = type;
    this.active = true;
    this.state = 'patrol';
    this.hitFlash = 0;
    this.deathTimer = 0;
    this.knockback = 0;
    
    switch (type) {
      case 'slime':
        this.hp = 30; this.maxHp = 30;
        this.atk = 8; this.def = 2;
        this.speed = 1.2;
        this.width = 40; this.height = 48;
        this.detectionRange = 150;
        this.attackRange = 30;
        break;
        
      case 'goblin':
        this.hp = 50; this.maxHp = 50;
        this.atk = 12; this.def = 4;
        this.speed = 1.8;
        this.width = 40; this.height = 56;
        this.detectionRange = 200;
        this.attackRange = 45;
        break;
        
      case 'skeleton':
        this.hp = 60; this.maxHp = 60;
        this.atk = 15; this.def = 5;
        this.speed = 1.5;
        this.width = 40; this.height = 56;
        this.detectionRange = 180;
        this.attackRange = 40;
        break;
    }
    
    return this;
  }
  
  update(dt, player, map) {
    if (!this.active) return;
    
    // 更新动画
    this.animTimer += dt;
    if (this.animTimer > 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
    
    // 受击闪烁
    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
    }
    
    // 击退
    if (this.knockback !== 0) {
      this.x += this.knockback * dt * 60;
      this.knockback *= 0.9;
      if (Math.abs(this.knockback) < 0.1) this.knockback = 0;
    }
    
    // 死亡动画
    if (this.state === 'dead') {
      this.deathTimer += dt;
      return;
    }
    
    // 攻击冷却
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }
    
    // AI 状态机
    const distToPlayer = Math.abs(this.x - player.x);
    
    if (distToPlayer < this.detectionRange) {
      // 发现玩家
      if (distToPlayer < this.attackRange && this.attackCooldown <= 0) {
        this.state = 'attack';
        this.attackCooldown = 1.0;
      } else if (distToPlayer < this.attackRange) {
        this.state = 'idle';
      } else {
        this.state = 'chase';
      }
      
      this.direction = player.x > this.x ? 1 : -1;
    } else {
      // 巡逻
      if (Math.abs(this.x - this.patrolStartX) > this.patrolRange) {
        this.direction *= -1;
      }
      this.state = 'patrol';
    }
    
    // 移动
    switch (this.state) {
      case 'patrol':
        this.vx = this.speed * this.direction * 0.5;
        break;
      case 'chase':
        this.vx = this.speed * this.direction;
        break;
      case 'attack':
        this.vx = 0;
        break;
    }
    
    // 应用重力
    this.vy += 0.6 * dt * 60;
    
    // 移动和碰撞
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    
    // 地面碰撞
    const groundY = map.getGroundY(this.x);
    if (this.y > groundY - this.height) {
      this.y = groundY - this.height;
      this.vy = 0;
    }
    
    // 边界
    this.x = Math.max(0, Math.min(map.width - this.width, this.x));
  }
  
  takeDamage(damage, knockbackDir) {
    if (this.state === 'dead') return;
    
    const actualDamage = Math.max(1, damage - this.def);
    this.hp -= actualDamage;
    this.hitFlash = 0.15;
    this.knockback = knockbackDir * 5;
    
    playSound('hit');
    
    // 伤害数字(由外部处理)
    
    if (this.hp <= 0) {
      this.state = 'dead';
      this.deathTimer = 0;
      spawnExplosion(this.x + this.width / 2, this.y + this.height / 2, 8, '#88ff88');
    }
    
    return actualDamage;
  }
  
  getAttackBox() {
    if (this.state !== 'attack' || this.attackCooldown > 0.9) return null;
    
    return {
      x: this.direction > 0 ? this.x + this.width : this.x - 30,
      y: this.y,
      width: 30,
      height: this.height
    };
  }
  
  draw(ctx, camera) {
    if (!this.active) return;
    
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    
    // 视口剔除
    if (screenX < -100 || screenX > ctx.canvas.width + 100) return;
    
    ctx.save();
    
    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX + this.width / 2, screenY + this.height - 2, this.width / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 根据类型绘制
    switch (this.type) {
      case 'slime':
        this.drawSlime(ctx, screenX, screenY);
        break;
      case 'goblin':
        this.drawGoblin(ctx, screenX, screenY);
        break;
      case 'skeleton':
        this.drawSkeleton(ctx, screenX, screenY);
        break;
    }
    
    // 血条
    if (this.hp < this.maxHp && this.state !== 'dead') {
      const barWidth = this.width;
      const barHeight = 4;
      const barY = screenY - 10;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(screenX, barY, barWidth, barHeight);
      
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(screenX, barY, barWidth * (this.hp / this.maxHp), barHeight);
    }
    
    // 受击闪烁
    if (this.hitFlash > 0 && this.state !== 'dead') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(255, 255, 255, ${this.hitFlash * 5})`;
      ctx.fillRect(screenX, screenY, this.width, this.height);
    }
    
    ctx.restore();
  }
  
  drawSlime(ctx, x, y) {
    const bounce = this.state === 'idle' ? Math.sin(Date.now() * 0.005) * 3 : 0;
    const squash = this.state === 'attack' ? 1.3 : (this.state === 'hurt' ? 0.8 : 1);
    
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#88ff88';
    ctx.strokeStyle = '#44aa44';
    ctx.lineWidth = 2;
    
    // 身体(果冻状) - 更圆润
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + this.height - 8 + bounce, 
                this.width / 2 * squash, (this.height / 2) / squash, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2 - 5, y + this.height - 16 + bounce, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + this.width / 2 - 5, y + this.height - 10 + bounce, 5, 0, Math.PI * 2);
    ctx.arc(x + this.width / 2 + 5, y + this.height - 10 + bounce, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // 瞳孔
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + this.width / 2 - 5 + this.direction * 2, y + this.height - 10 + bounce, 2, 0, Math.PI * 2);
    ctx.arc(x + this.width / 2 + 5 + this.direction * 2, y + this.height - 10 + bounce, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawGoblin(ctx, x, y) {
    // 腿 - 带动画
    const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 4;
    ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : '#5d4e37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + this.height);
    ctx.lineTo(x + 8 - legOffset, y + this.height + 10);
    ctx.moveTo(x + this.width - 8, y + this.height);
    ctx.lineTo(x + this.width - 8 + legOffset, y + this.height + 10);
    ctx.stroke();
    
    // 身体 - 更圆润
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#7cb342';
    ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : '#5d4e37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 14, this.width - 8, 26, 5);
    ctx.fill();
    ctx.stroke();
    
    // 腰带
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 28);
    ctx.lineTo(x + this.width - 6, y + 28);
    ctx.stroke();
    
    // 头
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#8b7355';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + 10, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 耳朵
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2 - 12, y + 8);
    ctx.lineTo(x + this.width / 2 - 18, y + 2);
    ctx.lineTo(x + this.width / 2 - 10, y + 12);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2 + 12, y + 8);
    ctx.lineTo(x + this.width / 2 + 18, y + 2);
    ctx.lineTo(x + this.width / 2 + 10, y + 12);
    ctx.stroke();
    
    // 眼睛
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(x + this.width / 2 - 4, y + 10, 3, 0, Math.PI * 2);
    ctx.arc(x + this.width / 2 + 4, y + 10, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 鼻子
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(x + this.width / 2 + this.direction * 7, y + 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawSkeleton(ctx, x, y) {
    ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : '#e0e0e0';
    ctx.lineWidth = 2;
    
    // 头骨 - 更圆润
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + 10, 11, 0, Math.PI * 2);
    ctx.stroke();
    
    // 眼眶
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#000';
    ctx.beginPath();
    ctx.arc(x + this.width / 2 - 4, y + 8, 3.5, 0, Math.PI * 2);
    ctx.arc(x + this.width / 2 + 4, y + 8, 3.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛发光
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(x + this.width / 2 - 4, y + 8, 1.5, 0, Math.PI * 2);
    ctx.arc(x + this.width / 2 + 4, y + 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 鼻子
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2, y + 12);
    ctx.lineTo(x + this.width / 2 - 2, y + 14);
    ctx.lineTo(x + this.width / 2 + 2, y + 14);
    ctx.closePath();
    ctx.fill();
    
    // 脊柱
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2, y + 21);
    ctx.lineTo(x + this.width / 2, y + 36);
    ctx.stroke();
    
    // 肋骨
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + this.width / 2, y + 22 + i * 5);
      ctx.lineTo(x + this.width / 2 - 9, y + 22 + i * 5);
      ctx.moveTo(x + this.width / 2, y + 22 + i * 5);
      ctx.lineTo(x + this.width / 2 + 9, y + 22 + i * 5);
      ctx.stroke();
    }
    
    // 腿骨 - 带动画
    const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 5;
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2, y + 36);
    ctx.lineTo(x + 10, y + this.height + legOffset);
    ctx.moveTo(x + this.width / 2, y + 36);
    ctx.lineTo(x + this.width - 10, y + this.height - legOffset);
    ctx.stroke();
    
    // 手臂
    const armOffset = Math.sin(this.animFrame * Math.PI / 2) * 3;
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2, y + 24);
    ctx.lineTo(x - 5, y + 30 + armOffset);
    ctx.moveTo(x + this.width / 2, y + 24);
    ctx.lineTo(x + this.width + 5, y + 30 - armOffset);
    ctx.stroke();
  }
}

/**
 * 初始化敌人池
 */
export function initEnemies() {
  for (let i = 0; i < MAX_ENEMIES; i++) {
    enemyPool.push(new Enemy());
  }
}

/**
 * 生成敌人
 */
export function spawnEnemy(x, y, type) {
  for (const enemy of enemyPool) {
    if (!enemy.active) {
      enemy.init(x, y, type);
      activeEnemies.push(enemy);
      return enemy;
    }
  }
  return null;
}

/**
 * 批量生成敌人
 */
export function spawnEnemies(count, mapWidth, mapHeight, groundFn) {
  const types = ['slime', 'goblin', 'skeleton'];
  const typeWeights = [0.5, 0.3, 0.2];
  
  for (let i = 0; i < count; i++) {
    // 随机类型
    const rand = Math.random();
    let type = 'slime';
    let cumWeight = 0;
    for (let j = 0; j < types.length; j++) {
      cumWeight += typeWeights[j];
      if (rand < cumWeight) {
        type = types[j];
        break;
      }
    }
    
    const x = 200 + Math.random() * (mapWidth - 400);
    const y = groundFn(x) - 40;
    
    spawnEnemy(x, y, type);
  }
}

/**
 * 更新所有敌人
 */
export function updateEnemies(dt, player, map) {
  for (let i = activeEnemies.length - 1; i >= 0; i--) {
    const enemy = activeEnemies[i];
    if (!enemy.active) {
      activeEnemies.splice(i, 1);
      continue;
    }
    
    enemy.update(dt, player, map);
    
    // 移除死亡已久的敌人
    if (enemy.state === 'dead' && enemy.deathTimer > 1.0) {
      enemy.active = false;
      activeEnemies.splice(i, 1);
    }
  }
}

/**
 * 绘制所有敌人
 */
export function drawEnemies(ctx, camera) {
  for (const enemy of activeEnemies) {
    if (enemy.active) {
      enemy.draw(ctx, camera);
    }
  }
}

/**
 * 获取所有活跃敌人
 */
export function getActiveEnemies() {
  return activeEnemies;
}

/**
 * 清除所有敌人
 */
export function clearEnemies() {
  for (const enemy of activeEnemies) {
    enemy.active = false;
  }
  activeEnemies.length = 0;
}

export default { initEnemies, spawnEnemy, spawnEnemies, updateEnemies, drawEnemies, getActiveEnemies, clearEnemies, Enemy };
