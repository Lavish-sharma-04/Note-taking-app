// 🔑 Aapki Groq Cloud API Key
const GROQ_API_KEY = "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";

// App State
let notes = JSON.parse(localStorage.getItem('notenest_v6_notes')) || [
  {
    id: 1,
    title: "Welcome to NoteNest Ultra AI",
    body: "Select any text to apply <b>Bold</b>, <i>Italics</i>, <span style='color:#a855f7;'>Custom Text Colors</span>, or <span style='background-color:#fef08a; color:#000;'>Highlights</span>! Click the bottom-right AI Globe to chat live with real Groq Llama 3 AI.",
    folder: "ideas",
    updatedAt: new Date().toISOString()
  }
];

let activeNoteId = null;
let currentFolder = 'all';
let isPreviewMode = false;
let mousePos = { x: 0, y: 0 };

// DOM Elements
const noteTitle = document.getElementById('note-title');
const noteBody = document.getElementById('note-body');
const notePreviewBox = document.getElementById('note-preview-box');
const noteFolderSelect = document.getElementById('note-folder-select');
const fontStyleSelect = document.getElementById('font-style-select');
const fontSizeSelect = document.getElementById('font-size-select');
const textColorPicker = document.getElementById('text-color-picker');
const saveBtn = document.getElementById('btn-save-note');
const newNoteBtn = document.getElementById('btn-new-note');
const deleteBtn = document.getElementById('btn-delete-note');
const exportPdfBtn = document.getElementById('btn-export-pdf');
const previewBtn = document.getElementById('btn-preview-note');
const searchInput = document.getElementById('search-input');
const aiGlobeBtn = document.getElementById('ai-globe-btn');
const aiPanel = document.getElementById('ai-agent-panel');
const closeAiBtn = document.getElementById('btn-close-ai');
const openDrawerBtn = document.getElementById('btn-open-drawer');
const closeDrawerBtn = document.getElementById('btn-close-drawer');
const notesDrawer = document.getElementById('notes-drawer');
const drawerNotesContainer = document.getElementById('drawer-notes-container');
const cursorGlow = document.getElementById('cursor-glow');
const aiChatBox = document.getElementById('ai-chat-box');
const aiChatInput = document.getElementById('ai-chat-input');
const sendAiBtn = document.getElementById('btn-send-ai');

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  init3DBackground();
  initCursorTrail();
  setupSidebarFolders();
  setupSelectionFormatting();
  setupAiAgent();
  updateFolderCounts();
  if (notes.length > 0) loadNote(notes[0].id);
});

// Cursor Glow
function initCursorTrail() {
  window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
    cursorGlow.style.left = `${e.clientX}px`;
    cursorGlow.style.top = `${e.clientY}px`;
  });
}

// Sidebar Folders
function setupSidebarFolders() {
  document.querySelectorAll('.folder-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
      item.classList.add('active');
      currentFolder = item.dataset.folder;
      renderDrawerNotes();
      openDrawer();
    });
  });
}

// Format Selected Text
function formatSelection(command, value = null) {
  document.execCommand(command, false, value);
}

// Selection Formatting Controls
function setupSelectionFormatting() {
  document.getElementById('fmt-bold').addEventListener('click', () => formatSelection('bold'));
  document.getElementById('fmt-italic').addEventListener('click', () => formatSelection('italic'));
  document.getElementById('fmt-underline').addEventListener('click', () => formatSelection('underline'));

  textColorPicker.addEventListener('input', (e) => formatSelection('foreColor', e.target.value));
  fontStyleSelect.addEventListener('change', (e) => formatSelection('fontName', e.target.value));
  fontSizeSelect.addEventListener('change', (e) => formatSelection('fontSize', e.target.value));

  document.querySelectorAll('.hl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      formatSelection('backColor', btn.dataset.color);
    });
  });

  document.querySelectorAll('.shapes-menu button').forEach(btn => {
    btn.addEventListener('click', () => {
      formatSelection('insertHTML', `&nbsp;<b>${btn.dataset.shape}</b>&nbsp;`);
      showToast("Shape Inserted!");
    });
  });
}

// Folder Counts
function updateFolderCounts() {
  document.getElementById('count-all').innerText = notes.length;
  document.getElementById('count-personal').innerText = notes.filter(n => n.folder === 'personal').length;
  document.getElementById('count-work').innerText = notes.filter(n => n.folder === 'work').length;
  document.getElementById('count-ideas').innerText = notes.filter(n => n.folder === 'ideas').length;
}

// Render Drawer Notes
function renderDrawerNotes() {
  drawerNotesContainer.innerHTML = '';
  const query = searchInput.value.toLowerCase();

  const filtered = notes.filter(n => {
    const matchesFolder = (currentFolder === 'all') || (n.folder === currentFolder);
    const matchesSearch = n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query);
    return matchesFolder && matchesSearch;
  });

  document.getElementById('drawer-title').innerText = `${currentFolder.toUpperCase()} NOTES`;
  document.getElementById('drawer-count').innerText = `${filtered.length} Saved`;

  filtered.forEach(note => {
    const card = document.createElement('div');
    card.className = `drawer-card ${note.id === activeNoteId ? 'active' : ''}`;
    card.onclick = () => {
      loadNote(note.id);
      closeDrawer();
    };
    card.innerHTML = `
      <h4>${note.title || 'Untitled Note'}</h4>
      <p>${note.body.replace(/<[^>]*>?/gm, '').slice(0, 60)}...</p>
    `;
    drawerNotesContainer.appendChild(card);
  });
}

// Load Note
function loadNote(id) {
  activeNoteId = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;

  noteTitle.value = note.title;
  noteBody.innerHTML = note.body;
  noteFolderSelect.value = note.folder || 'none';

  if (isPreviewMode) togglePreview();
}

// New Note
newNoteBtn.addEventListener('click', () => {
  activeNoteId = Date.now();
  noteTitle.value = "";
  noteBody.innerHTML = "";
  noteFolderSelect.value = "none";
  showToast("New Canvas Ready!");
});

// Save Note
saveBtn.addEventListener('click', () => {
  if (!noteTitle.value.trim() && !noteBody.innerText.trim()) {
    showToast("Cannot save an empty note!");
    return;
  }

  let note = notes.find(n => n.id === activeNoteId);

  if (!note) {
    note = { id: activeNoteId || Date.now() };
    notes.unshift(note);
  }

  note.title = noteTitle.value || "Untitled Note";
  note.body = noteBody.innerHTML;
  note.folder = noteFolderSelect.value === 'none' ? 'personal' : noteFolderSelect.value;
  note.updatedAt = new Date().toISOString();

  localStorage.setItem('notenest_v6_notes', JSON.stringify(notes));
  updateFolderCounts();
  showToast("Note Saved Successfully!");
});

// Drawer Controls
openDrawerBtn.addEventListener('click', () => { renderDrawerNotes(); openDrawer(); });
closeDrawerBtn.addEventListener('click', closeDrawer);
function openDrawer() { notesDrawer.classList.remove('hidden'); }
function closeDrawer() { notesDrawer.classList.add('hidden'); }

// Toggle Preview
previewBtn.addEventListener('click', togglePreview);

function togglePreview() {
  isPreviewMode = !isPreviewMode;
  if (isPreviewMode) {
    notePreviewBox.innerHTML = `<h1>${noteTitle.value}</h1><hr/><br/><div>${noteBody.innerHTML}</div>`;
    noteBody.classList.add('hidden');
    noteTitle.classList.add('hidden');
    notePreviewBox.classList.remove('hidden');
    previewBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> <span>Edit</span>`;
  } else {
    noteBody.classList.remove('hidden');
    noteTitle.classList.remove('hidden');
    notePreviewBox.classList.add('hidden');
    previewBtn.innerHTML = `<i class="fa-solid fa-eye"></i> <span>Preview</span>`;
  }
}

// PDF Export
exportPdfBtn.addEventListener('click', () => {
  const element = document.createElement('div');
  element.style.padding = '40px';
  element.style.color = '#000';
  element.innerHTML = `
    <h1 style="font-size: 28px; margin-bottom: 10px;">${noteTitle.value || 'Untitled Document'}</h1>
    <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Exported from NoteNest Ultra - ${new Date().toLocaleDateString()}</p>
    <hr/>
    <div style="font-size: 14px; line-height: 1.8; margin-top: 20px;">
      ${noteBody.innerHTML}
    </div>
  `;

  const opt = {
    margin:       0.5,
    filename:     `${noteTitle.value || 'document'}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
  showToast("Downloading PDF...");
});

// Delete Note
deleteBtn.addEventListener('click', () => {
  if (!activeNoteId) return;
  notes = notes.filter(n => n.id !== activeNoteId);
  localStorage.setItem('notenest_v6_notes', JSON.stringify(notes));
  updateFolderCounts();

  if (notes.length > 0) loadNote(notes[0].id);
  else {
    activeNoteId = null;
    noteTitle.value = '';
    noteBody.innerHTML = '';
  }
  showToast("Note Deleted!");
});

// 🚀 Fixed Groq AI Integration
function setupAiAgent() {
  aiGlobeBtn.addEventListener('click', () => aiPanel.classList.toggle('closed'));
  closeAiBtn.addEventListener('click', () => aiPanel.classList.add('closed'));

  document.querySelectorAll('.ai-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const selectedText = window.getSelection().toString();
      const content = selectedText.trim() || noteBody.innerText.trim();

      if (!content) {
        addAiMessage("Please write or select some text in the note canvas first!", "bot");
        return;
      }

      let prompt = "";
      if (action === 'summarize') prompt = `Summarize the following text clearly into bullet points:\n\n${content}`;
      if (action === 'expand') prompt = `Elaborate on the following text with deep insights and clear explanations:\n\n${content}`;
      if (action === 'grammar') prompt = `Fix all grammar, polish the tone, and improve sentence flow:\n\n${content}`;

      askGroqAI(prompt, action);
    });
  });

  sendAiBtn.addEventListener('click', handleAiChat);
  aiChatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAiChat(); });
}

async function askGroqAI(promptText, actionType) {
  if (!GROQ_API_KEY || GROQ_API_KEY.includes("YOUR_GROQ")) {
    addAiMessage("⚠️ Please enter a valid Groq API Key first!", "bot");
    return;
  }

  try {
    addAiMessage("Groq AI is thinking...", "bot");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: promptText }],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    // Remove thinking message
    const lastMsg = aiChatBox.lastChild;
    if (lastMsg && lastMsg.innerText.includes("thinking")) {
      aiChatBox.removeChild(lastMsg);
    }

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const resultText = data.choices[0].message.content;

      if (actionType === 'expand') {
        formatSelection('insertHTML', `<br/><br/><b>[AI Expanded Insight]:</b><br/>${resultText.replace(/\n/g, '<br/>')}<br/>`);
        addAiMessage("Expanded insights inserted into your note!", "bot");
      } else {
        addAiMessage(resultText, "bot");
      }
    } else {
      addAiMessage("Error: Unexpected response structure from Groq API.", "bot");
    }
  } catch (error) {
    console.error("Groq API Detailed Error:", error);
    const lastMsg = aiChatBox.lastChild;
    if (lastMsg && lastMsg.innerText.includes("thinking")) {
      aiChatBox.removeChild(lastMsg);
    }
    addAiMessage(`Error: ${error.message || "Failed to connect to Groq AI."}`, "bot");
  }
}

function handleAiChat() {
  const userMsg = aiChatInput.value.trim();
  if (!userMsg) return;

  addAiMessage(userMsg, "user");
  aiChatInput.value = '';

  const fullPrompt = `You are NoteNest AI Assistant powered by Groq.
Current Note Title: "${noteTitle.value}"
Current Content: "${noteBody.innerText}"

User Input: ${userMsg}`;

  askGroqAI(fullPrompt, 'chat');
}

function addAiMessage(text, sender) {
  const msg = document.createElement('div');
  msg.className = `ai-message ${sender}`;
  msg.innerText = text;
  aiChatBox.appendChild(msg);
  aiChatBox.scrollTop = aiChatBox.scrollHeight;
}

// Search Input
searchInput.addEventListener('input', () => {
  renderDrawerNotes();
  openDrawer();
});

// Toast Helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

// 3D Particles Background
function init3DBackground() {
  const canvas = document.getElementById('bg-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });

  renderer.setSize(window.innerWidth, window.innerHeight);

  const count = 350;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 15;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ size: 0.045, color: 0x818cf8, transparent: true, opacity: 0.8 });
  const points = new THREE.Points(geometry, material);

  scene.add(points);
  camera.position.z = 4.5;

  function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.001;
    points.rotation.x += (mousePos.y * 0.00005 - points.rotation.x) * 0.05;
    points.rotation.y += (mousePos.x * 0.00005 - points.rotation.y) * 0.05;
    renderer.render(scene, camera);
  }
  animate();
}