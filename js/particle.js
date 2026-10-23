/**
 * 粒子系统 - 对象池实现
 * 用于攻击特效,魔法拖尾,爆炸等视觉效果
 */

// 粒子对象池
const particlePool = [];
const activeParticles = [];
const MAX_PARTICLES = 500;

/**
 * 初始化粒子池
 */
export function initParticles() {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particlePool.push({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0,
      size: 0, color: '#fff',
      active: false,
      type: 'circle' // circle, spark, trail
    });
  }
}

/**
 * 获取一个粒子
 */
function getParticle() {
  // 优先从池中获取未激活的粒子
  for (let i = 0; i < particlePool.length; i++) {
    if (!particlePool[i].active) {
      return particlePool[i];
    }
  }
  // 如果池满了,复用最旧的
  return particlePool[0];
}

/**
 * 创建粒子
 */
export function spawnParticle(x, y, vx, vy, life, size, color, type = 'circle') {
  const p = getParticle();
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.life = life;
  p.maxLife = life;
  p.size = size;
  p.color = color;
  p.type = type;
  p.active = true;
  activeParticles.push(p);
}

/**
 * 创建粒子爆炸
 */
export function spawnExplosion(x, y, count, color, speed = 3) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const vel = speed * (0.5 + Math.random() * 0.5);
    spawnParticle(
      x, y,
      Math.cos(angle) * vel,
      Math.sin(angle) * vel,
      0.5 + Math.random() * 0.5,
      2 + Math.random() * 3,
      color,
      'spark'
    );
  }
}

/**
 * 创建魔法拖尾
 */
export function spawnMagicTrail(x, y, color) {
  for (let i = 0; i < 3; i++) {
    spawnParticle(
      x + (Math.random() - 0.5) * 10,
      y + (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5 - 1,
      0.3 + Math.random() * 0.3,
      3 + Math.random() * 4,
      color,
      'trail'
    );
  }
}

/**
 * 创建攻击拖尾
 */
export function spawnAttackTrail(x, y, direction, color) {
  for (let i = 0; i < 5; i++) {
    spawnParticle(
      x - direction * i * 8,
      y + (Math.random() - 0.5) * 10,
      -direction * (2 + Math.random() * 2),
      (Math.random() - 0.5) * 1,
      0.2 + Math.random() * 0.3,
      3 + Math.random() * 3,
      color,
      'trail'
    );
  }
}

/**
 * 创建回旋斩特效（战士技能1）
 */
export function spawnWhirlwind(x, y, color) {
  const count = 16;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    spawnParticle(
      x + Math.cos(angle) * 30,
      y + Math.sin(angle) * 30,
      Math.cos(angle) * 4,
      Math.sin(angle) * 4,
      0.4 + Math.random() * 0.3,
      4 + Math.random() * 3,
      color,
      'spark'
    );
  }
  // 中心爆发
  spawnExplosion(x, y, 8, '#ffffff', 2);
}

/**
 * 创建冲锋特效（战士技能2）
 */
export function spawnChargeTrail(x, y, direction, color) {
  for (let i = 0; i < 10; i++) {
    spawnParticle(
      x - direction * i * 10,
      y + (Math.random() - 0.5) * 20,
      -direction * 5,
      (Math.random() - 0.5) * 2,
      0.3 + Math.random() * 0.3,
      5 + Math.random() * 4,
      color,
      'trail'
    );
  }
}

/**
 * 创建火焰新星特效（法师技能1）
 */
export function spawnFireNova(x, y, color) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    spawnParticle(
      x + Math.cos(angle) * 20,
      y + Math.sin(angle) * 20,
      Math.cos(angle) * 3 + (Math.random() - 0.5),
      Math.sin(angle) * 3 + (Math.random() - 0.5) - 1,
      0.5 + Math.random() * 0.5,
      6 + Math.random() * 4,
      color,
      'circle'
    );
  }
  // 火焰核心
  spawnExplosion(x, y, 6, '#ffff00', 3);
}

/**
 * 创建寒冰射线特效（法师技能2）
 */
export function spawnIceBeam(x, y, direction, color) {
  for (let i = 0; i < 8; i++) {
    spawnParticle(
      x + direction * i * 15,
      y + (Math.random() - 0.5) * 30,
      direction * 6,
      (Math.random() - 0.5) * 0.5,
      0.3 + Math.random() * 0.3,
      4 + Math.random() * 3,
      color,
      'trail'
    );
  }
  // 冰晶碎片
  for (let i = 0; i < 6; i++) {
    spawnParticle(
      x + direction * 50,
      y + (Math.random() - 0.5) * 40,
      direction * 2 + (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      0.4 + Math.random() * 0.4,
      3 + Math.random() * 2,
      '#ffffff',
      'spark'
    );
  }
}

/**
 * 创建散射箭特效（游侠技能1）
 */
export function spawnArrowSpread(x, y, direction, color) {
  for (let i = -1; i <= 1; i++) {
    const vy = i * 1.5;
    for (let j = 0; j < 5; j++) {
      spawnParticle(
        x + direction * j * 8,
        y + 10 + vy * j,
        direction * 6,
        vy,
        0.3 + Math.random() * 0.2,
        3 + Math.random() * 2,
        color,
        'trail'
      );
    }
  }
}

/**
 * 创建穿透箭特效（游侠技能2）
 */
export function spawnPierceArrow(x, y, direction, color) {
  for (let i = 0; i < 12; i++) {
    spawnParticle(
      x + direction * i * 10,
      y + (Math.random() - 0.5) * 15,
      direction * 8,
      (Math.random() - 0.5) * 0.5,
      0.3 + Math.random() * 0.3,
      4 + Math.random() * 3,
      color,
      'trail'
    );
  }
  // 箭头发光
  spawnExplosion(x + direction * 30, y, 5, '#ffff00', 2);
}

/**
 * 创建大招特效（全屏）
 */
export function spawnUltimateEffect(x, y, color) {
  // 中心爆发
  spawnExplosion(x, y, 30, color, 6);
  
  // 全屏闪光粒子
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 200;
    spawnParticle(
      x + Math.cos(angle) * dist,
      y + Math.sin(angle) * dist,
      -Math.cos(angle) * 2,
      -Math.sin(angle) * 2,
      0.8 + Math.random() * 0.5,
      8 + Math.random() * 6,
      color,
      'circle'
    );
  }
  
  // 环形冲击波
  const ringCount = 20;
  for (let i = 0; i < ringCount; i++) {
    const angle = (Math.PI * 2 / ringCount) * i;
    spawnParticle(
      x + Math.cos(angle) * 80,
      y + Math.sin(angle) * 80,
      Math.cos(angle) * 5,
      Math.sin(angle) * 5,
      0.5 + Math.random() * 0.3,
      5 + Math.random() * 3,
      '#ffffff',
      'spark'
    );
  }
}

/**
 * 更新所有粒子
 */
export function updateParticles(dt) {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.life -= dt;
    
    if (p.life <= 0) {
      p.active = false;
      activeParticles.splice(i, 1);
      continue;
    }
    
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    p.vy += 0.1 * dt * 60; // 重力
    
    // 淡出
    const alpha = p.life / p.maxLife;
    p.currentAlpha = alpha;
  }
}

/**
 * 绘制所有粒子
 */
export function drawParticles(ctx, camera) {
  for (const p of activeParticles) {
    if (!p.active) continue;
    
    const screenX = p.x - camera.x;
    const screenY = p.y - camera.y;
    
    // 视口剔除
    if (screenX < -50 || screenX > ctx.canvas.width + 50 ||
        screenY < -50 || screenY > ctx.canvas.height + 50) continue;
    
    const alpha = p.currentAlpha !== undefined ? p.currentAlpha : 1;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    if (p.type === 'circle') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'spark') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX - p.vx * 2, screenY - p.vy * 2);
      ctx.stroke();
    } else if (p.type === 'trail') {
      const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, p.size);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

/**
 * 清除所有粒子
 */
export function clearParticles() {
  for (const p of activeParticles) {
    p.active = false;
  }
  activeParticles.length = 0;
}

export default { initParticles, spawnParticle, spawnExplosion, spawnMagicTrail, updateParticles, drawParticles, clearParticles };
