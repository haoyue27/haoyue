/**
 * 地图系统 - 多层视差滚动 + 程序化生成
 */

// 地图配置
export const MAP_CONFIG = {
  width: 6400,  // 地图总宽度（像素）- 更长的横向卷轴
  height: 720,  // 地图高度
  tileSize: 40, // 瓦片大小
};

// 关卡主题配置
export const THEME_CONFIG = {
  1: { // 翡翠草原
    name: '翡翠草原',
    sky: ['#87CEEB', '#B0E0E6', '#E0F6FF', '#FFFACD'],
    skyAccent: '#FFFACD',
    ground: '#228b22',
    groundDark: '#1a6b1a',
    groundLight: '#32cd32',
    mountain: '#2F4F4F',
    tree: '#228B22',
    treeTrunk: '#8B4513',
    accent: '#ffd700',
    particle: '#88ff88'
  },
  2: { // 幽暗洞窟
    name: '幽暗洞窟',
    sky: ['#0a0a1a', '#1a1a3e', '#2a2a5e', '#3a3a7e'],
    skyAccent: '#5a5a8e',
    ground: '#2a2a3a',
    groundDark: '#1a1a2a',
    groundLight: '#3a3a4a',
    mountain: '#0a0a1a',
    tree: '#2a2a4a',
    treeTrunk: '#1a1a2a',
    accent: '#00ffff',
    particle: '#4488ff'
  },
  3: { // 烈焰火山
    name: '烈焰火山',
    sky: ['#2a0a0a', '#5a1a0a', '#8b3a0a', '#bb5a0a'],
    ground: '#3a1a0a',
    groundDark: '#2a0a0a',
    groundLight: '#5a2a0a',
    mountain: '#1a0a0a',
    tree: '#3a1a0a',
    treeTrunk: '#2a1a0a',
    accent: '#ff4500',
    particle: '#ff6600'
  }
};

// 地形高度函数
export function getGroundHeight(x) {
  // 使用多层正弦波生成起伏地形
  const base = 480;
  const h1 = Math.sin(x * 0.0015) * 40;
  const h2 = Math.sin(x * 0.004 + 1) * 25;
  const h3 = Math.sin(x * 0.009 + 2) * 12;
  return base + h1 + h2 + h3;
}

/**
 * 地图类
 */
export class GameMap {
  constructor(level = 1) {
    this.level = level;
    this.width = MAP_CONFIG.width;
    this.height = MAP_CONFIG.height;
    this.tileSize = MAP_CONFIG.tileSize;
    this.groundHeight = 500;
    
    // 关卡主题
    this.theme = THEME_CONFIG[level] || THEME_CONFIG[1];
    
    // 地图元素
    this.platforms = [];
    this.decorations = [];
    this.clouds = [];
    this.mountains = [];
    this.trees = [];
    this.hills = [];
    this.rivers = [];
    this.bridges = [];
    this.landmarks = [];
    this.checkpoints = [];
    
    this.generate();
  }
  
  /**
   * 生成地图
   */
  generate() {
    this.generateTerrain();
    this.generateParallaxLayers();
    this.generateDecorations();
    this.generateLandmarks();
    this.generateCheckpoints();
  }
  
  /**
   * 生成地形
   */
  generateTerrain() {
    this.platforms = [];
    
    // 主地面 - 横向连续地形
    const segments = Math.floor(this.width / this.tileSize);
    for (let i = 0; i < segments; i++) {
      const x = i * this.tileSize;
      const y = getGroundHeight(x);
      
      // 地面瓦片
      this.platforms.push({
        x, y: y + 20,
        width: this.tileSize,
        height: this.height - y - 20,
        type: 'ground'
      });
      
      // 随机生成平台（跳跃点）
      if (Math.random() < 0.06 && i > 10 && i < segments - 10) {
        const platformWidth = 2 + Math.floor(Math.random() * 3);
        const platformY = y - 50 - Math.random() * 70;
        
        for (let j = 0; j < platformWidth; j++) {
          this.platforms.push({
            x: x + j * this.tileSize,
            y: platformY,
            width: this.tileSize,
            height: 16,
            type: 'platform'
          });
        }
      }
    }
  }
  
  /**
   * 生成视差层
   */
  generateParallaxLayers() {
    // 远山层 - 速度 0.2
    this.mountains = [];
    for (let i = 0; i < 12; i++) {
      this.mountains.push({
        x: i * 500 + Math.random() * 200,
        y: this.groundHeight - 180 - Math.random() * 120,
        width: 250 + Math.random() * 300,
        height: 180 + Math.random() * 120,
        parallax: 0.2
      });
    }
    
    // 丘陵层 - 速度 0.4
    this.hills = [];
    for (let i = 0; i < 20; i++) {
      this.hills.push({
        x: i * 300 + Math.random() * 150,
        y: this.groundHeight - 80 - Math.random() * 60,
        width: 150 + Math.random() * 200,
        height: 80 + Math.random() * 60,
        parallax: 0.4
      });
    }
    
    // 树木层 - 速度 0.6
    this.trees = [];
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.width;
      const y = getGroundHeight(x);
      
      this.trees.push({
        x, y: y - 10,
        size: 0.7 + Math.random() * 0.5,
        type: Math.random() < 0.6 ? 'oak' : 'pine',
        parallax: 0.6
      });
    }
    
    // 云朵层 - 速度 0.3
    this.clouds = [];
    for (let i = 0; i < 20; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: 40 + Math.random() * 120,
        width: 100 + Math.random() * 150,
        speed: 0.15 + Math.random() * 0.25,
        parallax: 0.3
      });
    }
  }
  
  /**
   * 生成装饰物
   */
  generateDecorations() {
    this.decorations = [];
    
    // 地面装饰
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.width;
      const y = getGroundHeight(x);
      
      const type = Math.random() < 0.4 ? 'flower' : 
                   Math.random() < 0.5 ? 'grass' : 
                   'stone';
      
      this.decorations.push({
        x, y: y - 3,
        type,
        color: `hsl(${Math.random() * 60 + 80}, 70%, 50%)`,
        size: 0.8 + Math.random() * 0.4
      });
    }
    
    // 火把/光源
    for (let i = 0; i < 25; i++) {
      const x = 200 + Math.random() * (this.width - 400);
      const y = getGroundHeight(x);
      
      this.decorations.push({
        x, y: y - 35,
        type: 'torch',
        flicker: Math.random() * Math.PI * 2
      });
    }
    
    // 横向卷轴元素（灌木丛、小树）
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * this.width;
      const y = getGroundHeight(x);
      
      this.decorations.push({
        x, y: y - 20,
        type: 'bush',
        size: 0.6 + Math.random() * 0.4
      });
    }
  }
  
  /**
   * 生成地标（横版卷轴特色）
   */
  generateLandmarks() {
    this.landmarks = [];
    
    // 桥梁
    const bridgePositions = [800, 2000, 3200, 4800];
    for (const bx of bridgePositions) {
      const by = getGroundHeight(bx) - 30;
      this.bridges.push({
        x: bx,
        y: by,
        width: 200,
        height: 20,
        type: 'wooden_bridge'
      });
      
      this.landmarks.push({
        x: bx,
        y: by - 40,
        type: 'bridge',
        width: 200
      });
    }
    
    // 河流/湖泊
    const waterPositions = [1200, 2800, 4400];
    for (const wx of waterPositions) {
      const wy = getGroundHeight(wx) + 40;
      this.rivers.push({
        x: wx,
        y: wy,
        width: 300 + Math.random() * 200,
        depth: 30 + Math.random() * 20
      });
    }
    
    // 大树/标志性树木
    for (let i = 0; i < 15; i++) {
      const x = 400 + Math.random() * (this.width - 800);
      const y = getGroundHeight(x);
      
      this.landmarks.push({
        x, y: y - 80,
        type: 'large_tree',
        size: 1.5 + Math.random() * 0.5
      });
    }
  }
  
  /**
   * 生成检查点
   */
  generateCheckpoints() {
    this.checkpoints = [];
    
    // 每800像素一个检查点
    for (let i = 0; i < this.width; i += 800) {
      this.checkpoints.push({
        x: i,
        y: getGroundHeight(i) - 50,
        width: 60,
        height: 50,
        activated: false
      });
    }
  }
  
  /**
   * 获取指定 x 坐标的地面高度
   */
  getGroundY(x) {
    return getGroundHeight(x);
  }
  
  /**
   * 更新地图
   */
  update(dt) {
    // 更新云朵
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * dt * 10;
      if (cloud.x > this.width + 100) {
        cloud.x = -cloud.width;
      }
    }
    
    // 更新装饰物闪烁
    for (const dec of this.decorations) {
      if (dec.type === 'torch') {
        dec.flicker += dt * 5;
      }
    }
  }
  
  /**
   * 绘制背景层（视差滚动）
   */
  drawBackground(ctx, camera, layer) {
    switch (layer) {
      case 0: this.drawSky(ctx, camera); break;
      case 1: this.drawClouds(ctx, camera); break;
      case 2: this.drawMountains(ctx, camera); break;
      case 3: this.drawHills(ctx, camera); break;
      case 4: this.drawTrees(ctx, camera); break;
      case 5: this.drawGround(ctx, camera); break;
    }
  }
  
  drawSky(ctx, camera) {
    // 天空渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    const colors = this.theme.sky;
    colors.forEach((color, i) => {
      gradient.addColorStop(i / (colors.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 太阳
    const sunX = ctx.canvas.width * 0.75;
    const sunY = 80;
    ctx.fillStyle = this.theme.skyAccent || '#fffacd';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // 太阳光晕
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, 80);
    sunGlow.addColorStop(0, 'rgba(255, 250, 205, 0.4)');
    sunGlow.addColorStop(1, 'rgba(255, 250, 205, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // 云层 - 不透明
    ctx.fillStyle = '#b4b4c8';
    for (let i = 0; i < 12; i++) {
      const cloudX = (i * 180 + camera.x * 0.03) % (ctx.canvas.width + 200) - 100;
      const cloudY = 40 + (i % 3) * 35;
      ctx.beginPath();
      ctx.ellipse(cloudX, cloudY, 90, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.ellipse(cloudX - 25, cloudY + 8, 55, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.ellipse(cloudX + 30, cloudY + 5, 65, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawMountains(ctx, camera) {
    const parallax = 0.2;
    
    for (const mountain of this.mountains) {
      const x = mountain.x - camera.x * parallax;
      if (x < -mountain.width || x > ctx.canvas.width + mountain.width) continue;
      
      // 远山主体
      ctx.fillStyle = this.theme.mountain;
      ctx.beginPath();
      ctx.moveTo(x, this.height);
      
      // 使用贝塞尔曲线创建更自然的山形
      const peakX = x + mountain.width * 0.5;
      const peakY = mountain.y;
      const cp1x = x + mountain.width * 0.25;
      const cp1y = mountain.y + 30;
      const cp2x = x + mountain.width * 0.75;
      const cp2y = mountain.y + 30;
      
      ctx.bezierCurveTo(cp1x, cp1y, peakX - 20, peakY - 20, peakX, peakY);
      ctx.bezierCurveTo(peakX + 20, peakY - 20, cp2x, cp2y, x + mountain.width, this.height);
      ctx.closePath();
      ctx.fill();
      
      // 山顶
      ctx.fillStyle = '#c8c8d8';
      ctx.beginPath();
      ctx.ellipse(peakX, peakY + 10, 40, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawHills(ctx, camera) {
    const parallax = 0.4;
    
    for (const hill of this.hills) {
      const x = hill.x - camera.x * parallax;
      if (x < -hill.width || x > ctx.canvas.width + hill.width) continue;
      
      // 丘陵
      ctx.fillStyle = this.theme.tree;
      ctx.beginPath();
      ctx.ellipse(x + hill.width * 0.5, hill.y + hill.height * 0.5, 
                   hill.width * 0.5, hill.height * 0.5, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawTrees(ctx, camera) {
    const parallax = 0.6;
    
    for (const tree of this.trees) {
      const x = tree.x - camera.x * parallax;
      if (x < -100 || x > ctx.canvas.width + 100) continue;
      
      if (tree.type === 'oak') {
        // 橡树 - 参考图风格
        ctx.fillStyle = this.theme.treeTrunk;
        ctx.fillRect(x - 4, tree.y - 45, 8, 45);
        
        // 树冠 - 多层
        ctx.fillStyle = this.theme.tree;
        ctx.beginPath();
        ctx.arc(x, tree.y - 55, 28 * tree.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - 12, tree.y - 40, 22 * tree.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 12, tree.y - 40, 22 * tree.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 松树 - 参考图风格
        ctx.fillStyle = this.theme.treeTrunk;
        ctx.fillRect(x - 3, tree.y - 35, 6, 35);
        
        // 多层三角形树冠
        ctx.fillStyle = this.theme.tree;
        for (let layer = 0; layer < 3; layer++) {
          const layerY = tree.y - 25 - layer * 18;
          const layerWidth = 18 - layer * 4;
          ctx.beginPath();
          ctx.moveTo(x, layerY - 15);
          ctx.lineTo(x - layerWidth, layerY + 10);
          ctx.lineTo(x + layerWidth, layerY + 10);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
  
  drawClouds(ctx, camera) {
    const parallax = 0.3;
    
    // 不透明云层
    ctx.fillStyle = '#a0a0b8';
    
    for (const cloud of this.clouds) {
      const x = cloud.x - camera.x * parallax;
      if (x < -cloud.width || x > ctx.canvas.width + 100) continue;
      
      // 云朵主体
      ctx.beginPath();
      ctx.ellipse(x, cloud.y, cloud.width * 0.35, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.ellipse(x - 20, cloud.y + 6, cloud.width * 0.22, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.ellipse(x + 22, cloud.y + 4, cloud.width * 0.28, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.ellipse(x + 5, cloud.y - 8, cloud.width * 0.2, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawGround(ctx, camera) {
    const groundY = getGroundHeight(camera.x) - camera.y;
    
    // 远景地面层
    ctx.fillStyle = '#6e6e7e';
    ctx.fillRect(0, groundY + 20, ctx.canvas.width, this.height - groundY - 20);
    
    // 主地面 - 多层渐变
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, groundY + 200);
    groundGradient.addColorStop(0, this.theme.groundLight);
    groundGradient.addColorStop(0.05, this.theme.ground);
    groundGradient.addColorStop(0.3, this.theme.groundDark);
    groundGradient.addColorStop(1, this.theme.mountain);
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, ctx.canvas.width, this.height - groundY);
    
    // 地面层次线
    ctx.strokeStyle = this.theme.groundLight;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 15; i++) {
      const y = groundY + 15 + i * 20;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // 草地顶部 - 参考图风格的草丛
    ctx.fillStyle = this.theme.groundLight;
    ctx.lineWidth = 2;
    for (let i = 0; i < ctx.canvas.width; i += 4) {
      const worldX = camera.x + i;
      const grassHeight = 4 + Math.sin(worldX * 0.1) * 2 + Math.sin(worldX * 0.2) * 1.5;
      
      // 草叶
      ctx.strokeStyle = this.theme.groundLight;
      ctx.beginPath();
      ctx.moveTo(i, groundY);
      ctx.lineTo(i - 1, groundY - grassHeight);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(i, groundY);
      ctx.lineTo(i + 1, groundY - grassHeight * 0.8);
      ctx.stroke();
    }
    
    // 前景装饰 - 根系/石头
    for (let i = 0; i < ctx.canvas.width; i += 80) {
      const worldX = camera.x + i;
      const rootY = groundY + 5 + Math.sin(worldX * 0.05) * 3;
      
      // 石头
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.ellipse(i + 40, rootY + 5, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 小灌木
      if (i % 160 === 0) {
        ctx.fillStyle = this.theme.tree;
        ctx.beginPath();
        ctx.arc(i + 40, rootY - 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 地标
    for (const landmark of this.landmarks) {
      const x = landmark.x - camera.x;
      if (x < -200 || x > ctx.canvas.width + 200) continue;
      
      switch (landmark.type) {
        case 'bridge':
          // 木桥 - 参考图风格
          ctx.fillStyle = '#4a3728';
          ctx.fillRect(x, landmark.y, landmark.width, 10);
          
          // 桥面木板纹理
          ctx.strokeStyle = '#5a4738';
          ctx.lineWidth = 1;
          for (let i = 0; i < landmark.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(x + i, landmark.y);
            ctx.lineTo(x + i, landmark.y + 10);
            ctx.stroke();
          }
          
          // 桥栏
          ctx.fillStyle = '#6a5748';
          ctx.fillRect(x, landmark.y - 8, 4, 22);
          ctx.fillRect(x + landmark.width - 4, landmark.y - 8, 4, 22);
          break;
          
        case 'large_tree':
          // 大树
          ctx.fillStyle = this.theme.treeTrunk;
          ctx.fillRect(x - 10, landmark.y + 40, 20, 50);
          
          // 树冠 - 多层
          ctx.fillStyle = this.theme.tree;
          ctx.beginPath();
          ctx.arc(x, landmark.y + 25, 40 * landmark.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x - 25, landmark.y + 45, 30 * landmark.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + 25, landmark.y + 45, 30 * landmark.size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    }
    
    // 河流/湖泊
    for (const river of this.rivers) {
      const x = river.x - camera.x;
      if (x < -river.width || x > ctx.canvas.width + river.width) continue;
      
      // 水面
      const waterGradient = ctx.createLinearGradient(0, river.y, 0, river.y + river.depth);
      waterGradient.addColorStop(0, '#506478');
      waterGradient.addColorStop(1, '#283c50');
      
      ctx.fillStyle = waterGradient;
      ctx.fillRect(x, river.y, river.width, river.depth);
      
      // 水面反光
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      const time = Date.now() * 0.002;
      for (let i = 0; i < 8; i++) {
        const wx = x + 20 + i * (river.width - 40) / 8;
        const wy = river.y + 8 + Math.sin(time + i) * 2;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + 12, wy);
        ctx.stroke();
      }
    }
    
    // 装饰物
    for (const dec of this.decorations) {
      const x = dec.x - camera.x;
      if (x < -20 || x > ctx.canvas.width + 20) continue;
      
      switch (dec.type) {
        case 'flower':
          ctx.fillStyle = dec.color;
          ctx.beginPath();
          ctx.arc(x, dec.y, 3 * dec.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'grass':
          ctx.strokeStyle = this.theme.groundLight;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, dec.y);
          ctx.lineTo(x - 1, dec.y - 6);
          ctx.moveTo(x, dec.y);
          ctx.lineTo(x + 1, dec.y - 5);
          ctx.stroke();
          break;
          
        case 'stone':
          ctx.fillStyle = '#666';
          ctx.beginPath();
          ctx.ellipse(x, dec.y, 4 * dec.size, 3 * dec.size, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'bush':
          ctx.fillStyle = this.theme.tree;
          ctx.beginPath();
          ctx.arc(x, dec.y, 10 * dec.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'torch':
          // 火把杆
          ctx.strokeStyle = '#8b4513';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, dec.y + 25);
          ctx.lineTo(x, dec.y - 15);
          ctx.stroke();
          
          // 火焰
          const flicker = Math.sin(dec.flicker) * 2;
          const flameGradient = ctx.createRadialGradient(x, dec.y - 18, 1, x, dec.y - 18, 8 + flicker);
          flameGradient.addColorStop(0, '#ffffc8');
          flameGradient.addColorStop(0.4, '#ffc832');
          flameGradient.addColorStop(1, '#ff8c00');
          
          ctx.fillStyle = flameGradient;
          ctx.beginPath();
          ctx.arc(x, dec.y - 18, 8 + flicker, 0, Math.PI * 2);
          ctx.fill();
          
          // 光晕
          ctx.fillStyle = '#ffc864';
          ctx.beginPath();
          ctx.arc(x, dec.y - 18, 40, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    }
  }
  
  /**
   * 绘制碰撞箱(调试用)
   */
  drawColliders(ctx, camera) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    
    for (const platform of this.platforms) {
      const x = platform.x - camera.x;
      const y = platform.y - camera.y;
      
      ctx.strokeRect(x, y, platform.width, platform.height);
    }
  }
}

export default { GameMap, MAP_CONFIG, getGroundHeight };
