/**
 * UI 系统 - HUD,菜单,背包,小地图
 */

import { EQUIPMENT_DB, CONSUMABLES, RARITY, SET_BONUSES, getActiveSetCount } from './item.js';
import { playSound } from './audio.js';

/**
 * UI 管理器
 */
export class UIManager {
  constructor() {
    this.visible = false;
    this.inventoryOpen = false;
    this.player = null;
    this.game = null;
    
    // DOM 元素缓存
    this.elements = {};
    this.cacheElements();
  }
  
  cacheElements() {
    this.elements = {
      mainMenu: document.getElementById('main-menu'),
      pauseMenu: document.getElementById('pause-menu'),
      resultPanel: document.getElementById('result-panel'),
      gameHud: document.getElementById('game-hud'),
      inventoryPanel: document.getElementById('inventory-panel'),
      hpFill: document.getElementById('hp-fill'),
      mpFill: document.getElementById('mp-fill'),
      expFill: document.getElementById('exp-fill'),
      hpText: document.getElementById('hp-text'),
      mpText: document.getElementById('mp-text'),
      expText: document.getElementById('exp-text'),
      levelBadge: document.getElementById('level-badge'),
      goldText: document.getElementById('gold-text'),
      levelName: document.getElementById('level-name'),
      minimap: document.getElementById('minimap'),
      skillCdJ: document.getElementById('cd-j'),
      skillCdK: document.getElementById('cd-k'),
      skillCdL: document.getElementById('cd-l'),
      skillCdUlt: document.getElementById('cd-ultimate'),
      ultimateCharge: document.getElementById('ultimate-charge'),
      resultKills: document.getElementById('result-kills'),
      resultExp: document.getElementById('result-exp'),
      resultGold: document.getElementById('result-gold'),
      resultItems: document.getElementById('result-items')
    };
  }
  
  init(player, game) {
    this.player = player;
    this.game = game;
    this.setupEventListeners();
    this.drawSkillIcons();
  }
  
  setupEventListeners() {
    // 菜单按钮
    document.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleMenuAction(action);
      });
    });
    
    // 职业选择
    document.querySelectorAll('.class-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const classType = e.target.closest('.class-btn').dataset.class;
        this.selectClass(classType);
      });
    });
    
    // 技能快捷键
    document.addEventListener('keydown', (e) => {
      if (!this.visible) return;
      
      switch (e.key.toLowerCase()) {
        case 'i':
          this.toggleInventory();
          break;
        case 'm':
          // 地图切换(简化版)
          break;
        case 'escape':
          this.togglePause();
          break;
      }
    });
  }
  
  handleMenuAction(action) {
    switch (action) {
      case 'start':
        if (!this.player.classType) {
          this.toggleClassSelect();
        } else {
          this.startGame();
        }
        break;
        
      case 'class-select':
        this.toggleClassSelect();
        break;
        
      case 'controls':
        this.toggleControls();
        break;
        
      case 'toggle-sound':
        this.toggleSound();
        break;
        
      case 'resume':
        this.resumeGame();
        break;
        
      case 'restart':
        this.restartGame();
        break;
        
      case 'next-level':
        this.nextLevel();
        break;
        
      case 'close-inventory':
        this.closeInventory();
        break;
    }
  }
  
  toggleClassSelect() {
    const panel = document.getElementById('class-select-panel');
    const controlsPanel = document.getElementById('controls-panel');
    controlsPanel.style.display = 'none';
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
  
  toggleControls() {
    const panel = document.getElementById('controls-panel');
    const classPanel = document.getElementById('class-select-panel');
    classPanel.style.display = 'none';
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
  
  selectClass(classType) {
    this.player.init(100, 300, classType);
    this.startGame();
  }
  
  toggleSound() {
    const btn = document.querySelector('[data-action="toggle-sound"]');
    const current = btn.textContent.includes('开');
    btn.textContent = current ? '音量: 关' : '音量: 开';
    // 实际音量控制逻辑
  }
  
  startGame() {
    this.visible = true;
    this.elements.mainMenu.style.display = 'none';
    this.elements.gameHud.style.display = 'block';
    
    if (this.game) {
      this.game.start();
    }
  }
  
  togglePause() {
    if (this.elements.pauseMenu.style.display === 'none') {
      this.elements.pauseMenu.style.display = 'flex';
      if (this.game) this.game.paused = true;
    } else {
      this.resumeGame();
    }
  }
  
  resumeGame() {
    this.elements.pauseMenu.style.display = 'none';
    if (this.game) this.game.paused = false;
  }
  
  restartGame() {
    this.elements.pauseMenu.style.display = 'none';
    this.elements.resultPanel.style.display = 'none';
    if (this.game) this.game.restart();
  }
  
  nextLevel() {
    this.elements.resultPanel.style.display = 'none';
    if (this.game) this.game.nextLevel();
  }
  
  toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    this.elements.inventoryPanel.style.display = this.inventoryOpen ? 'flex' : 'none';
    
    if (this.inventoryOpen) {
      this.updateInventory();
    }
  }
  
  closeInventory() {
    this.inventoryOpen = false;
    this.elements.inventoryPanel.style.display = 'none';
  }
  
  updateInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    
    // 显示装备槽（武器、头盔、铠甲、戒指、靴子）
    const slots = ['weapon', 'helmet', 'armor', 'ring', 'boots'];
    const slotNames = { weapon: '武器', helmet: '头盔', armor: '铠甲', ring: '戒指', boots: '靴子' };
    
    for (const slot of slots) {
      const item = this.player.equipment[slot];
      const slotDiv = document.createElement('div');
      slotDiv.className = 'inventory-slot';
      
      if (item) {
        slotDiv.textContent = item.icon;
        slotDiv.style.borderColor = item.rarity.color;
        slotDiv.title = `${slotNames[slot]}: ${item.name}\n${item.desc || ''}\nATK: ${item.atk || 0} | DEF: ${item.def || 0} | SPD: ${item.spd || 0}`;
      } else {
        slotDiv.textContent = slotNames[slot][0];
        slotDiv.style.color = '#666';
        slotDiv.title = slotNames[slot];
      }
      
      grid.appendChild(slotDiv);
    }
    
    // 显示套装激活状态
    const setCounts = getActiveSetCount(this.player);
    for (const [setId, count] of Object.entries(setCounts)) {
      const set = SET_BONUSES[setId];
      if (!set || count < 2) continue;
      
      const setDiv = document.createElement('div');
      setDiv.className = 'inventory-slot';
      setDiv.style.borderColor = '#ffd700';
      setDiv.style.gridColumn = 'span 2';
      
      let bonusText = `${set.name} (${count}件): `;
      for (const [pieceCount, bonus] of Object.entries(set.bonuses)) {
        if (count >= parseInt(pieceCount)) {
          bonusText += `${bonus.name} `;
        }
      }
      
      setDiv.textContent = bonusText;
      setDiv.title = bonusText;
      grid.appendChild(setDiv);
    }
    
    // 显示物品栏
    for (const item of this.player.inventory) {
      const itemDiv = document.createElement('div');
      itemDiv.className = `inventory-slot ${item.rarity?.class || 'common'}`;
      itemDiv.textContent = item.icon || '?';
      itemDiv.title = item.name;
      grid.appendChild(itemDiv);
    }
  }
  
  /**
   * 更新 HUD
   */
  update(dt) {
    if (!this.visible || !this.player) return;
    
    // 更新血条
    const hpPercent = (this.player.hp / this.player.maxHp) * 100;
    this.elements.hpFill.style.width = `${Math.max(0, hpPercent)}%`;
    this.elements.hpText.textContent = `${Math.floor(this.player.hp)}/${this.player.maxHp}`;
    
    // 更新蓝条
    const mpPercent = (this.player.mp / this.player.maxMp) * 100;
    this.elements.mpFill.style.width = `${Math.max(0, mpPercent)}%`;
    this.elements.mpText.textContent = `${Math.floor(this.player.mp)}/${this.player.maxMp}`;
    
    // 更新经验条
    const expPercent = (this.player.exp / this.player.expToNext) * 100;
    this.elements.expFill.style.width = `${Math.min(100, expPercent)}%`;
    this.elements.expText.textContent = `${this.player.exp}/${this.player.expToNext}`;
    
    // 更新等级
    this.elements.levelBadge.textContent = `Lv.${this.player.level}`;
    
    // 更新金币
    this.elements.goldText.textContent = this.player.gold;
    
    // 更新技能冷却
    this.updateSkillCooldown('j', this.player.attackTimer, 0.3);
    this.updateSkillCooldown('k', this.player.skill1Cooldown, 2.0);
    this.updateSkillCooldown('l', this.player.skill2Cooldown, 4.0);
    this.updateSkillCooldown('ultimate', this.player.ultimateCooldown, 10.0);
    
    // 更新大招充能
    const chargePercent = (this.player.ultimateCharge / this.player.maxUltimateCharge) * 100;
    this.elements.ultimateCharge.style.height = `${chargePercent}%`;
    
    // 更新小地图
    this.drawMinimap();
  }
  
  updateSkillCooldown(skill, currentCooldown, maxCooldown) {
    const element = document.getElementById(`cd-${skill}`);
    if (!element) return;
    
    const percent = maxCooldown > 0 ? (currentCooldown / maxCooldown) * 100 : 0;
    element.style.transform = `scaleY(${Math.min(100, percent) / 100})`;
  }
  
  /**
   * 绘制小地图
   */
  drawMinimap() {
    const canvas = this.elements.minimap;
    if (!canvas || !this.game) return;
    
    const ctx = canvas.getContext('2d');
    const map = this.game.map;
    const player = this.player;
    
    // 清空
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 缩放比例
    const scaleX = canvas.width / map.width;
    const scaleY = canvas.height / map.height;
    
    // 绘制敌人点
    ctx.fillStyle = '#ff4444';
    for (const enemy of this.game.enemies) {
      if (enemy.active) {
        ctx.beginPath();
        ctx.arc(enemy.x * scaleX, enemy.y * scaleY, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 绘制Boss点
    ctx.fillStyle = '#ff0000';
    for (const boss of this.game.bosses) {
      if (boss.active) {
        ctx.beginPath();
        ctx.arc(boss.x * scaleX, boss.y * scaleY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 绘制玩家
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(player.x * scaleX, player.y * scaleY, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制视口
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    const viewX = this.game.camera.x * scaleX;
    ctx.strokeRect(viewX, 0, canvas.width * scaleX, canvas.height);
  }
  
  /**
   * 绘制技能图标
   */
  drawSkillIcons() {
    const icons = {
      'j': '⚔️', // 普通攻击
      'k': '💥', // 技能1
      'l': '✨', // 技能2
      'ultimate': '⭐'  // 大招
    };
    
    for (const [skill, icon] of Object.entries(icons)) {
      const canvas = document.querySelector(`[data-skill="${skill}"] .skill-icon`);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffd700';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, canvas.width / 2, canvas.height / 2);
      }
    }
  }
  
  /**
   * 显示结算面板
   */
  showResult(kills, exp, gold, items) {
    this.elements.resultKills.textContent = kills;
    this.elements.resultExp.textContent = exp;
    this.elements.resultGold.textContent = gold;
    
    // 显示掉落物品
    this.elements.resultItems.innerHTML = '';
    for (const item of items) {
      const itemDiv = document.createElement('div');
      itemDiv.className = `item-reward ${item.rarity?.class || 'common'}`;
      itemDiv.textContent = `${item.icon || '📦'} ${item.name || item.id}`;
      this.elements.resultItems.appendChild(itemDiv);
    }
    
    this.elements.resultPanel.style.display = 'flex';
  }
  
  /**
   * 隐藏所有菜单
   */
  hideAllMenus() {
    this.elements.mainMenu.style.display = 'none';
    this.elements.pauseMenu.style.display = 'none';
    this.elements.resultPanel.style.display = 'none';
    this.elements.inventoryPanel.style.display = 'none';
  }
  
  /**
   * 显示主菜单
   */
  showMainMenu() {
    this.visible = false;
    this.elements.mainMenu.style.display = 'flex';
    this.elements.gameHud.style.display = 'none';
    this.hideAllMenus();
    this.elements.mainMenu.style.display = 'flex';
  }
  
  /**
   * 设置关卡名称
   */
  setLevelName(name) {
    this.elements.levelName.textContent = name;
  }
}

export default { UIManager };
