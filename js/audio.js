/**
 * 音效管理器 - 使用 WebAudio API 合成音效
 * 无需外部音频文件
 */

// 音频上下文
let audioCtx = null;

/**
 * 初始化音频上下文(需要用户交互后才能启动)
 */
export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * 播放音效
 * @param {string} type - 音效类型: jump, attack, hit, pickup, boss-roar, magic, arrow
 */
export function playSound(type) {
  if (!audioCtx) return;
  
  const now = audioCtx.currentTime;
  
  try {
    switch (type) {
      case 'jump':
        playTone(400, 0.1, 'square', 0.1, now);
        playTone(600, 0.08, 'square', 0.08, now + 0.05);
        break;
        
      case 'attack':
        // 挥剑声
        const noise = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.02));
        }
        noise.buffer = buffer;
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        noise.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start(now);
        noise.stop(now + 0.1);
        break;
        
      case 'hit':
        playTone(200, 0.15, 'sawtooth', 0.12, now);
        break;
        
      case 'pickup':
        playTone(800, 0.08, 'sine', 0.08, now);
        playTone(1000, 0.1, 'sine', 0.08, now + 0.05);
        playTone(1200, 0.12, 'sine', 0.08, now + 0.1);
        break;
        
      case 'boss-roar':
        playTone(80, 0.8, 'sawtooth', 0.25, now);
        playTone(60, 1.0, 'square', 0.2, now);
        break;
        
      case 'magic':
        playTone(300, 0.3, 'sine', 0.1, now);
        playTone(500, 0.2, 'triangle', 0.08, now + 0.05);
        break;
        
      case 'arrow':
        playTone(800, 0.05, 'square', 0.05, now);
        playTone(400, 0.08, 'sawtooth', 0.05, now + 0.02);
        break;
        
      case 'levelup':
        playTone(523, 0.15, 'sine', 0.1, now);
        playTone(659, 0.15, 'sine', 0.1, now + 0.1);
        playTone(784, 0.2, 'sine', 0.1, now + 0.2);
        break;
        
      case 'hurt':
        playTone(150, 0.2, 'sawtooth', 0.15, now);
        break;
    }
  } catch (e) {
    // 静默处理音频错误
  }
}

/**
 * 播放单个音调
 */
function playTone(freq, duration, type, volume, startTime) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * 设置音量
 */
export function setVolume(vol) {
  // 简单实现:实际项目中会控制主增益节点
}

export default { initAudio, playSound, setVolume };
