/**
 * Boss 类 - 巨型野猪王,水晶魔像,火焰巨龙
 * 多阶段战斗,攻击前摇预警
 */

import { spawnExplosion } from './particle.js';
import { playSound } from './audio.js';

// Boss 对象池
const bossPool = [];
const activeBosses = [];

/**
 * Boss 基类
 */
class Boss {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.hp = 0; this.maxHp = 0;
    this.atk = 0; this.def = 0;
    this.width = 80; this.height = 80;
    this.type = 'wild_boar';
    this.phase = 1;
    this.state = 'idle';
    this.direction = 1;
    this.animFrame = 0;
    this.animTimer = 0;
    this.attackCooldown = 0;
    this.specialCooldown = 0;
    this.hitFlash = 0;
    this.active = false;
    this.knockback = 0;
    this.warningTimer = 0;
    this.warningType = null;
    this.targetX = 0;
    this.targetY = 0;
  }
  
  init(x, y, type) {
    this.x = x; this.y = y;
    this.type = type;
    this.active = true;
    this.state = 'idle';
    this.phase = 1;
    this.hitFlash = 0;
    this.knockback = 0;
    
    switch (type) {
      case 'wild_boar':
        this.hp = 200; this.maxHp = 200;
        this.atk = 20; this.def = 5;
        this.width = 100; this.height = 80;
        this.speed = 2;
        break;
        
      case 'crystal_golem':
        this.hp = 400; this.maxHp = 400;
        this.atk = 30; this.def = 12;
        this.width = 120; this.height = 140;
        this.speed = 1;
        break;
        
      case 'fire_dragon':
        this.hp = 800; this.maxHp = 800;
        this.atk = 45; this.def = 18;
        this.width = 160; this.height = 120;
        this.speed = 1.5;
        break;
    }
    
    return this;
  }
  
  update(dt, player, map) {
    if (!this.active) return;
    
    this.animTimer += dt;
    if (this.animTimer > 0.2) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
    
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.specialCooldown > 0) this.specialCooldown -= dt;
    if (this.warningTimer > 0) this.warningTimer -= dt;
    
    // 击退
    if (this.knockback !== 0) {
      this.x += this.knockback * dt * 60;
      this.knockback *= 0.92;
      if (Math.abs(this.knockback) < 0.1) this.knockback = 0;
    }
    
    // 阶段转换
    const hpPercent = this.hp / this.maxHp;
    if (hpPercent < 0.5 && this.phase === 1) {
      this.phase = 2;
      this.state = 'enraged';
    }
    if (hpPercent < 0.2 && this.phase === 2) {
      this.phase = 3;
      this.state = 'desperate';
    }
    
    // 朝向玩家
    this.direction = player.x > this.x ? 1 : -1;
    
    // AI 行为
    const distToPlayer = Math.sqrt(
      Math.pow(this.x - player.x, 2) + Math.pow(this.y - player.y, 2)
    );
    
    if (this.warningTimer > 0) {
      // 预警阶段
      this.state = 'warning';
    } else if (distToPlayer < 100 && this.attackCooldown <= 0) {
      // 普通攻击
      this.state = 'attack';
      this.attackCooldown = 1.5 / this.phase;
    } else if (distToPlayer < 300 && this.specialCooldown <= 0) {
      // 特殊攻击
      this.state = 'special';
      this.specialCooldown = 5 / this.phase;
      this.warningTimer = 1.0;
      this.warningType = this.type === 'fire_dragon' ? 'fire_breath' : 'charge';
      this.targetX = player.x;
      this.targetY = player.y;
    } else if (distToPlayer < 400) {
      // 追击
      this.state = 'chase';
    } else {
      this.state = 'idle';
    }
    
    // 移动
    if (this.state === 'chase') {
      this.vx = this.speed * this.direction * this.phase;
    } else if (this.state === 'attack' && this.warningTimer <= 0) {
      // 冲撞
      this.vx = this.speed * 6 * this.direction;
      this.warningTimer = 0.3;
      this.warningType = 'melee';
    } else {
      this.vx *= 0.9;
    }
    
    // 重力
    this.vy += 0.6 * dt * 60;
    
    // 应用移动
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    
    // 地面
    const groundY = map.getGroundY(this.x);
    if (this.y > groundY - this.height) {
      this.y = groundY - this.height;
      this.vy = 0;
    }
    
    // 边界
    this.x = Math.max(0, Math.min(map.width - this.width, this.x));
  }
  
  takeDamage(damage) {
    if (this.state === 'dead') return 0;
    
    const actualDamage = Math.max(1, damage - this.def);
    this.hp -= actualDamage;
    this.hitFlash = 0.2;
    this.knockback = -this.direction * 3;
    
    playSound('hit');
    spawnExplosion(this.x + this.width / 2, this.y + this.height / 2, 5, '#ff4444');
    
    if (this.hp <= 0) {
      this.state = 'dead';
      spawnExplosion(this.x + this.width / 2, this.y + this.height / 2, 30, '#ff8800');
      playSound('boss-roar');
    }
    
    return actualDamage;
  }
  
  getAttackBox() {
    if (this.warningTimer > 0) return null;
    
    switch (this.warningType) {
      case 'melee':
        return {
          x: this.direction > 0 ? this.x + this.width : this.x - 60,
          y: this.y,
          width: 60,
          height: this.height
        };
      case 'charge':
        return {
          x: this.x,
          y: this.y,
          width: this.width * 2,
          height: this.height
        };
      default:
        return null;
    }
  }
  
  getWarningCircle() {
    if (this.warningTimer <= 0 || !this.warningType) return null;
    
    return {
      x: this.targetX,
      y: this.targetY,
      radius: this.warningType === 'fire_breath' ? 80 : 60,
      timer: this.warningTimer
    };
  }
  
  draw(ctx, camera) {
    if (!this.active) return;
    
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    
    if (screenX < -200 || screenX > ctx.canvas.width + 200) return;
    
    ctx.save();
    
    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(screenX + this.width / 2, screenY + this.height - 2, this.width / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 根据类型绘制
    switch (this.type) {
      case 'wild_boar':
        this.drawWildBoar(ctx, screenX, screenY);
        break;
      case 'crystal_golem':
        this.drawCrystalGolem(ctx, screenX, screenY);
        break;
      case 'fire_dragon':
        this.drawFireDragon(ctx, screenX, screenY);
        break;
    }
    
    // Boss 血条(屏幕顶部)
    if (this.state !== 'dead') {
      const barWidth = 400;
      const barHeight = 20;
      const barX = (ctx.canvas.width - barWidth) / 2;
      const barY = 15;
      
      // 背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
      
      // 边框
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
      
      // 血条
      const hpPercent = this.hp / this.maxHp;
      const hpColor = hpPercent > 0.5 ? '#ff4444' : hpPercent > 0.2 ? '#ff8800' : '#ff0000';
      ctx.fillStyle = hpColor;
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
      
      // 名字
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.fillText(this.getBossName(), ctx.canvas.width / 2, barY + 14);
      
      // 阶段指示
      if (this.phase > 1) {
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 14px Microsoft YaHei';
        ctx.fillText(`阶段 ${this.phase}`, ctx.canvas.width / 2, barY + 32);
      }
    }
    
    ctx.restore();
  }
  
  getBossName() {
    switch (this.type) {
      case 'wild_boar': return '巨型野猪王';
      case 'crystal_golem': return '水晶魔像';
      case 'fire_dragon': return '火焰巨龙';
      default: return 'BOSS';
    }
  }
  
  drawWildBoar(ctx, x, y) {
    // 身体
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#8b4513';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + this.height / 2 + 10, this.width / 2, this.height / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5d2f0f';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 头
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#a0522d';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2 + this.direction * 20, y + 15, 20, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 獠牙
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2 + this.direction * 30, y + 20);
    ctx.lineTo(x + this.width / 2 + this.direction * 40, y + 30);
    ctx.lineTo(x + this.width / 2 + this.direction * 35, y + 25);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(x + this.width / 2 + this.direction * 25, y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawCrystalGolem(ctx, x, y) {
    // 身体(水晶质感)
    const gradient = ctx.createLinearGradient(x, y, x + this.width, y + this.height);
    gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(150, 100, 255, 0.9)');
    gradient.addColorStop(1, 'rgba(80, 150, 255, 0.7)');
    
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : gradient;
    ctx.beginPath();
    ctx.moveTo(x + 20, y);
    ctx.lineTo(x + this.width - 20, y);
    ctx.lineTo(x + this.width, y + 40);
    ctx.lineTo(x + this.width - 10, y + this.height);
    ctx.lineTo(x + 10, y + this.height);
    ctx.lineTo(x, y + 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 核心
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height / 2, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // 光芒
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Date.now() * 0.001;
      ctx.beginPath();
      ctx.moveTo(x + this.width / 2, y + this.height / 2);
      ctx.lineTo(x + this.width / 2 + Math.cos(angle) * 25, y + this.height / 2 + Math.sin(angle) * 25);
      ctx.stroke();
    }
  }
  
  drawFireDragon(ctx, x, y) {
    // 龙身
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#8b0000';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + this.height / 2 + 20, this.width / 2, this.height / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 龙头
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#a52a2a';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2 + this.direction * 40, y + 20, 30, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 眼睛
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(x + this.width / 2 + this.direction * 50, y + 15, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // 龙角
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2 + this.direction * 30, y + 5);
    ctx.lineTo(x + this.width / 2 + this.direction * 35, y - 15);
    ctx.lineTo(x + this.width / 2 + this.direction * 40, y + 5);
    ctx.fill();
    
    // 火焰光晕
    if (this.phase >= 2) {
      const gradient = ctx.createRadialGradient(
        x + this.width / 2, y + this.height / 2, 0,
        x + this.width / 2, y + this.height / 2, this.width / 2
      );
      gradient.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 20, y - 20, this.width + 40, this.height + 40);
    }
  }
}

/**
 * 初始化 Boss 池
 */
export function initBosses() {
  for (let i = 0; i < 5; i++) {
    bossPool.push(new Boss());
  }
}

/**
 * 生成 Boss
 */
export function spawnBoss(x, y, type) {
  for (const boss of bossPool) {
    if (!boss.active) {
      boss.init(x, y, type);
      activeBosses.push(boss);
      return boss;
    }
  }
  return null;
}

/**
 * 更新所有 Boss
 */
export function updateBosses(dt, player, map) {
  for (let i = activeBosses.length - 1; i >= 0; i--) {
    const boss = activeBosses[i];
    if (!boss.active) {
      activeBosses.splice(i, 1);
      continue;
    }
    
    boss.update(dt, player, map);
    
    if (boss.state === 'dead' && boss.deathTimer > 2.0) {
      boss.active = false;
      activeBosses.splice(i, 1);
    }
  }
}

/**
 * 绘制所有 Boss
 */
export function drawBosses(ctx, camera) {
  for (const boss of activeBosses) {
    if (boss.active) {
      boss.draw(ctx, camera);
    }
  }
}

/**
 * 获取所有活跃 Boss
 */
export function getActiveBosses() {
  return activeBosses;
}

/**
 * 清除所有 Boss
 */
export function clearBosses() {
  for (const boss of activeBosses) {
    boss.active = false;
  }
  activeBosses.length = 0;
}

export default { initBosses, spawnBoss, updateBosses, drawBosses, getActiveBosses, clearBosses, Boss };
