// ============ Particles ============
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
    this.opacity = Math.random() * 0.4 + 0.1;
    this.hue = Math.random() > 0.5 ? 260 : 190;
  }
  update() {
    this.x += this.speedX; this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
  }
  draw() {
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 70%, 70%, ${this.opacity})`; ctx.fill();
  }
}
function initParticles() {
  resizeCanvas();
  particles = Array.from({ length: 60 }, () => new Particle());
}
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(139,92,246,${0.06 * (1 - dist / 120)})`; ctx.lineWidth = 0.5; ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animateParticles);
}
window.addEventListener('resize', resizeCanvas);
initParticles();
animateParticles();

// ============ State ============
let chatHistory = [];
let originalChoice = '';

// ============ Navigation ============
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ Input ============
const choiceInput = document.getElementById('choiceInput');
const charCount = document.getElementById('charCount');
const yearsSlider = document.getElementById('yearsSlider');
const yearsValue = document.getElementById('yearsValue');

choiceInput.addEventListener('input', () => {
  charCount.textContent = Math.min(choiceInput.value.length, 200);
  if (choiceInput.value.length > 200) choiceInput.value = choiceInput.value.slice(0, 200);
});
yearsSlider.addEventListener('input', () => { yearsValue.textContent = yearsSlider.value; });

function toggleOptional() {
  const fields = document.getElementById('optionalFields');
  const btn = fields.previousElementSibling;
  fields.classList.toggle('hidden');
  btn.classList.toggle('open');
}

// ============ Prediction ============
async function startPrediction() {
  const choice = choiceInput.value.trim();
  if (!choice) { shake(choiceInput); choiceInput.focus(); return; }

  originalChoice = choice;
  const years = parseInt(yearsSlider.value);
  const currentAge = document.getElementById('ageInput').value;
  const gender = document.getElementById('genderInput').value;
  const personality = document.getElementById('contextInput').value;

  const btn = document.getElementById('predictBtn');
  btn.querySelector('.btn-text').classList.add('hidden');
  btn.querySelector('.btn-loading').classList.remove('hidden');
  btn.disabled = true;

  showSection('loading');

  try {
    const resp = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice, years, currentAge, gender, personality })
    });
    if (!resp.ok) { const e = await resp.json(); throw new Error(e.error || '推测失败'); }

    const data = await resp.json();
    chatHistory = [];
    renderResult(data);
    resetChatUI();
    showSection('result');
  } catch (err) {
    alert('推测失败：' + err.message);
    showSection('input');
  } finally {
    btn.querySelector('.btn-text').classList.remove('hidden');
    btn.querySelector('.btn-loading').classList.add('hidden');
    btn.disabled = false;
  }
}

function shake(el) {
  el.style.animation = 'none'; el.offsetHeight;
  el.style.animation = 'shake 0.5s ease';
  setTimeout(() => el.style.animation = '', 500);
}
const s = document.createElement('style');
s.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}`;
document.head.appendChild(s);

// ============ Render ============
function renderResult(data) {
  document.getElementById('choiceTag').textContent = `假如：${originalChoice}`;
  const text = data.narrative || '';
  // Format: split paragraphs, add proper spacing
  const formatted = text.split(/\n\s*\n|\n/).filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('');
  document.getElementById('narrativeText').innerHTML = formatted || text;
}

// ============ Chat ============
function resetChatUI() {
  document.getElementById('chatMessages').innerHTML = `
    <div class="chat-system-msg">
      <span class="chat-avatar">🧠</span>
      <div class="chat-bubble system-bubble">
        推演已完成。如果你对某个阶段有疑问，或者想了解更多细节，随时问我。
        <div class="chat-suggestions">
          <button class="suggestion-btn" onclick="sendSuggestion('如果中途我想放弃，最可能是因为什么？')">中途放弃的原因</button>
          <button class="suggestion-btn" onclick="sendSuggestion('你觉得最现实的结局是什么样的？')">最现实的结局</button>
          <button class="suggestion-btn" onclick="sendSuggestion('有没有什么办法能让结果更好一些？')">怎样结果更好</button>
          <button class="suggestion-btn" onclick="sendSuggestion('如果我的经济条件更好/更差，结果会有什么不同？')">经济条件影响</button>
        </div>
      </div>
    </div>`;
}

function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 120) + 'px'; });
chatInput.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  const container = document.getElementById('chatMessages');
  const sendBtn = document.getElementById('sendBtn');

  chatHistory.push({ role: 'user', content: msg });
  container.innerHTML += `<div class="chat-msg user"><span class="chat-avatar">👤</span><div class="chat-bubble">${esc(msg)}</div></div>`;

  input.value = ''; input.style.height = 'auto'; sendBtn.disabled = true;
  container.innerHTML += `<div class="chat-typing" id="typing"><span class="chat-avatar">🧠</span><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  scrollChat();

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory, context: originalChoice })
    });
    if (!resp.ok) throw new Error('对话失败');
    const data = await resp.json();
    chatHistory.push({ role: 'assistant', content: data.reply });

    document.getElementById('typing')?.remove();
    const formatted = data.reply.split(/\n\s*\n|\n/).filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('');
    container.innerHTML += `<div class="chat-msg assistant"><span class="chat-avatar">🧠</span><div class="chat-bubble">${formatted || esc(data.reply)}</div></div>`;
  } catch (err) {
    document.getElementById('typing')?.remove();
    container.innerHTML += `<div class="chat-msg assistant"><span class="chat-avatar">🧠</span><div class="chat-bubble" style="color:#ef4444">出错了，请稍后重试。</div></div>`;
  } finally {
    sendBtn.disabled = false;
    scrollChat();
  }
}

function scrollChat() { const el = document.getElementById('chatMessages'); setTimeout(() => { el.scrollTop = el.scrollHeight; }, 100); }
function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

// ============ Reset ============
function resetAll() {
  if (!confirm('确定要重置吗？当前的推测结果和对话都将清除。')) return;
  choiceInput.value = ''; charCount.textContent = '0';
  yearsSlider.value = 10; yearsValue.textContent = '10';
  document.getElementById('ageInput').value = '';
  document.getElementById('genderInput').value = '';
  document.getElementById('contextInput').value = '';
  chatHistory = []; originalChoice = '';
  showSection('hero');
}
