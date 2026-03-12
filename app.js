/* ============================================================
   NeuralNexus - Healthcare App Logic
   Page Navigation, Tab System, Feature Content
   ============================================================ */

// ── PAGE NAVIGATION ──────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// ── TAB SYSTEM (macOS-style Floating Panels) ─────────────────
const tabState = {
  symptom: { tabs: [], activeTab: null },
  depression: { tabs: [], activeTab: null }
};

const TAB_TITLES = {
  'disease-detection': '🔍 Disease Detection',
  'nearby-hospitals': '🏥 Nearby Hospitals',
  'nearby-pharmacy': '💊 Nearby Pharmacy',
  'health-tips': '💡 Health Tips',
  'consult-doctor': '👨‍⚕️ Consult Doctor',
  'depression-test': '📋 Depression Test',
  'mood-tracker': '📊 Mood Tracker',
  'ai-advice': '🤖 AI Advice',
  'meditation-guidance': '🧘 Meditation Guidance',
  'daily-diary': '📓 Daily Diary'
};

let panelZIndex = 100;
const panelPositions = {};

function openTab(section, tabId, navBtn) {
  var state = tabState[section];

  // If already open, bring to front
  if (state.tabs.includes(tabId)) {
    var existing = document.getElementById('panel-' + tabId);
    if (existing) {
      // Restore if minimized
      if (existing.classList.contains('minimized')) {
        existing.classList.remove('minimized');
        renderDock(section);
      }
      bringToFront(section, tabId);
    }
    return;
  }

  // Add to state
  state.tabs.push(tabId);
  state.activeTab = tabId;

  // Hide empty state
  var workspace = document.getElementById('workspace-' + section);
  var empty = workspace.querySelector('.workspace-empty');
  if (empty) empty.style.display = 'none';

  // Create floating panel
  createFloatingPanel(section, tabId);

  // Update sidebar
  updateSidebarActive(section, tabId);
}

function createFloatingPanel(section, tabId) {
  var workspace = document.getElementById('workspace-' + section);
  var title = TAB_TITLES[tabId] || tabId;

  // Calculate cascade position
  var offset = (tabState[section].tabs.length - 1) * 30;
  var startX = 30 + (offset % 200);
  var startY = 20 + (offset % 150);

  var panel = document.createElement('div');
  panel.id = 'panel-' + tabId;
  panel.className = 'floating-panel focused';
  panel.dataset.section = section;
  panel.dataset.tabId = tabId;
  panel.style.left = startX + 'px';
  panel.style.top = startY + 'px';
  panel.style.zIndex = ++panelZIndex;

  panel.innerHTML =
    '<div class="panel-titlebar" data-panel="' + tabId + '">' +
      '<div class="panel-dots">' +
        '<button class="panel-dot dot-close" onclick="closeTab(\'' + section + '\',\'' + tabId + '\',event)" title="Close"></button>' +
        '<button class="panel-dot dot-minimize" onclick="minimizePanel(\'' + section + '\',\'' + tabId + '\')" title="Minimize"></button>' +
        '<button class="panel-dot dot-maximize" onclick="maximizePanel(\'' + section + '\',\'' + tabId + '\')" title="Maximize"></button>' +
      '</div>' +
      '<span class="panel-title">' + escapeHtml(title) + '</span>' +
    '</div>' +
    '<div class="panel-body">' + getTabContent(tabId) + '</div>' +
    '<div class="panel-resize" data-panel="' + tabId + '"></div>';

  workspace.appendChild(panel);

  // Unfocus all others
  unfocusAllPanels(section);
  panel.classList.add('focused');

  // Init drag
  initPanelDrag(panel, section, tabId);
  initPanelResize(panel);

  // Init feature (e.g., symptom input)
  initTabFeature(tabId);
}

function bringToFront(section, tabId) {
  var workspace = document.getElementById('workspace-' + section);
  var panels = workspace.querySelectorAll('.floating-panel');
  panels.forEach(function(p) { p.classList.remove('focused'); });
  var panel = document.getElementById('panel-' + tabId);
  if (panel) {
    panel.style.zIndex = ++panelZIndex;
    panel.classList.add('focused');
  }
  tabState[section].activeTab = tabId;
  updateSidebarActive(section, tabId);
}

function unfocusAllPanels(section) {
  var workspace = document.getElementById('workspace-' + section);
  workspace.querySelectorAll('.floating-panel').forEach(function(p) {
    p.classList.remove('focused');
  });
}

function closeTab(section, tabId, e) {
  if (e) e.stopPropagation();
  var state = tabState[section];
  var idx = state.tabs.indexOf(tabId);
  if (idx === -1) return;

  state.tabs.splice(idx, 1);

  // Remove panel
  var panel = document.getElementById('panel-' + tabId);
  if (panel) {
    panel.style.transform = 'scale(0.9)';
    panel.style.opacity = '0';
    setTimeout(function() { panel.remove(); }, 150);
  }

  // Activate next panel or show empty
  if (state.activeTab === tabId) {
    if (state.tabs.length > 0) {
      var newIdx = Math.min(idx, state.tabs.length - 1);
      bringToFront(section, state.tabs[newIdx]);
    } else {
      state.activeTab = null;
      showEmptyState(section);
    }
  }

  renderDock(section);
}

function minimizePanel(section, tabId) {
  var panel = document.getElementById('panel-' + tabId);
  if (!panel) return;
  panel.classList.add('minimized');

  // Activate another visible panel
  var state = tabState[section];
  if (state.activeTab === tabId) {
    var visible = state.tabs.filter(function(t) {
      var p = document.getElementById('panel-' + t);
      return p && !p.classList.contains('minimized');
    });
    if (visible.length > 0) {
      bringToFront(section, visible[visible.length - 1]);
    } else {
      state.activeTab = null;
    }
  }

  renderDock(section);
}

function maximizePanel(section, tabId) {
  var panel = document.getElementById('panel-' + tabId);
  if (!panel) return;

  if (panel.classList.contains('maximized')) {
    panel.classList.remove('maximized');
    // Restore saved position
    var saved = panelPositions[tabId];
    if (saved) {
      panel.style.left = saved.left;
      panel.style.top = saved.top;
      panel.style.width = saved.width;
      panel.style.height = saved.height || '';
    }
  } else {
    // Save current position
    panelPositions[tabId] = {
      left: panel.style.left,
      top: panel.style.top,
      width: panel.style.width,
      height: panel.style.height
    };
    panel.classList.add('maximized');
  }
  bringToFront(section, tabId);
}

function showEmptyState(section) {
  var workspace = document.getElementById('workspace-' + section);
  var empty = workspace.querySelector('.workspace-empty');
  if (empty) empty.style.display = '';
}

function renderDock(section) {
  var workspace = document.getElementById('workspace-' + section);
  // Remove existing dock
  var existingDock = workspace.querySelector('.minimized-dock');
  if (existingDock) existingDock.remove();

  var minimized = tabState[section].tabs.filter(function(t) {
    var p = document.getElementById('panel-' + t);
    return p && p.classList.contains('minimized');
  });

  if (minimized.length === 0) return;

  var dock = document.createElement('div');
  dock.className = 'minimized-dock';
  minimized.forEach(function(tabId) {
    var title = TAB_TITLES[tabId] || tabId;
    var item = document.createElement('div');
    item.className = 'dock-item';
    item.textContent = title;
    item.onclick = function() {
      var panel = document.getElementById('panel-' + tabId);
      if (panel) {
        panel.classList.remove('minimized');
        bringToFront(section, tabId);
        renderDock(section);
      }
    };
    dock.appendChild(item);
  });
  workspace.appendChild(dock);
}

function updateSidebarActive(section, tabId) {
  var sidebar = document.getElementById('page-' + section);
  if (!sidebar) return;
  sidebar.querySelectorAll('.dash-nav-item').forEach(function(b) { b.classList.remove('active'); });
  var activeBtn = sidebar.querySelector('[data-tab="' + tabId + '"]');
  if (activeBtn) activeBtn.classList.add('active');
}

// ── DRAG SYSTEM ──────────────────────────────────────────────
function initPanelDrag(panel, section, tabId) {
  var titlebar = panel.querySelector('.panel-titlebar');
  var isDragging = false;
  var startX, startY, origX, origY;

  function onMouseDown(e) {
    if (e.target.closest('.panel-dots')) return;
    e.preventDefault();
    bringToFront(section, tabId);
    if (panel.classList.contains('maximized')) return;

    isDragging = true;
    panel.classList.add('dragging');
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;
    origX = panel.offsetLeft;
    origY = panel.offsetTop;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove, { passive: false });
    document.addEventListener('touchend', onMouseUp);
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var dx = clientX - startX;
    var dy = clientY - startY;
    panel.style.left = Math.max(0, origX + dx) + 'px';
    panel.style.top = Math.max(0, origY + dy) + 'px';
  }

  function onMouseUp() {
    isDragging = false;
    panel.classList.remove('dragging');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onMouseMove);
    document.removeEventListener('touchend', onMouseUp);
  }

  titlebar.addEventListener('mousedown', onMouseDown);
  titlebar.addEventListener('touchstart', onMouseDown, { passive: false });

  // Click anywhere on panel to bring to front
  panel.addEventListener('mousedown', function() {
    bringToFront(section, tabId);
  });
}

function initPanelResize(panel) {
  var handle = panel.querySelector('.panel-resize');
  if (!handle) return;
  var isResizing = false;
  var startX, startY, startW, startH;

  function onMouseDown(e) {
    if (panel.classList.contains('maximized')) return;
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;
    startW = panel.offsetWidth;
    startH = panel.offsetHeight;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove, { passive: false });
    document.addEventListener('touchend', onMouseUp);
  }

  function onMouseMove(e) {
    if (!isResizing) return;
    e.preventDefault();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var newW = Math.max(340, startW + (clientX - startX));
    var newH = Math.max(200, startH + (clientY - startY));
    panel.style.width = newW + 'px';
    panel.style.height = newH + 'px';
  }

  function onMouseUp() {
    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onMouseMove);
    document.removeEventListener('touchend', onMouseUp);
  }

  handle.addEventListener('mousedown', onMouseDown);
  handle.addEventListener('touchstart', onMouseDown, { passive: false });
}

// Remove old functions that are no longer needed
function activateTab(section, tabId) { bringToFront(section, tabId); }
function renderTabBar() {}
function renderEmptyState(section) { showEmptyState(section); }

// ── TAB CONTENT GENERATORS ──────────────────────────────────

function getTabContent(tabId) {
  switch (tabId) {
    case 'disease-detection': return getDiseaseDetectionHTML();
    case 'nearby-hospitals': return getNearbyHospitalsHTML();
    case 'nearby-pharmacy': return getNearbyPharmacyHTML();
    case 'health-tips': return getHealthTipsHTML();
    case 'consult-doctor': return getConsultDoctorHTML();
    case 'depression-test': return getDepressionTestHTML();
    case 'mood-tracker': return getMoodTrackerHTML();
    case 'ai-advice': return getAIAdviceHTML();
    case 'meditation-guidance': return getMeditationGuidanceHTML();
    case 'daily-diary': return getDiaryHTML();
    default: return '<p>Content not available</p>';
  }
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── DISEASE DETECTION ────────────────────────────────────────
const DISEASES = [
  { id:'flu', name:'Influenza (Flu)', icon:'🤧', symptoms:['fever','chills','muscle ache','fatigue','cough','sore throat','headache','runny nose','body pain'], risk:'medium', desc:'A contagious respiratory illness caused by influenza viruses.', recs:[{i:'🛌',t:'<strong>Rest at home</strong> and avoid contact.'},{i:'💧',t:'<strong>Stay hydrated</strong> with water and warm fluids.'},{i:'💊',t:'<strong>Take fever reducers</strong> like paracetamol.'},{i:'👨‍⚕️',t:'<strong>See a doctor</strong> if symptoms worsen.'}]},
  { id:'covid', name:'COVID-19', icon:'🦠', symptoms:['fever','cough','shortness of breath','fatigue','loss of taste','loss of smell','sore throat','headache','body pain','chills'], risk:'high', desc:'Caused by the SARS-CoV-2 coronavirus.', recs:[{i:'🏠',t:'<strong>Isolate immediately</strong>.'},{i:'🧪',t:'<strong>Get tested</strong> for COVID-19.'},{i:'😷',t:'<strong>Wear a mask</strong> around others.'},{i:'👨‍⚕️',t:'<strong>Contact your doctor</strong>.'}]},
  { id:'heart_attack', name:'Heart Attack', icon:'❤️‍🔥', symptoms:['chest pain','chest tightness','left arm pain','jaw pain','shortness of breath','sweating','nausea','dizziness','back pain'], risk:'high', desc:'Occurs when blood flow to part of the heart is blocked.', recs:[{i:'🚨',t:'<strong>Call emergency services (112/108)</strong>.'},{i:'🛑',t:'<strong>Stop all activity</strong>, sit/lie down.'},{i:'💊',t:'<strong>Chew aspirin (325mg)</strong> if not allergic.'},{i:'🤝',t:'<strong>Do NOT drive yourself</strong>.'}]},
  { id:'stroke', name:'Stroke', icon:'🧠', symptoms:['sudden numbness','slurred speech','face drooping','sudden confusion','severe headache','vision problems','loss of balance','sudden weakness'], risk:'high', desc:'Blood supply to part of the brain is cut off.', recs:[{i:'🚨',t:'<strong>Call 112/108 immediately</strong>.'},{i:'🛑',t:'<strong>Do NOT give food/water</strong>.'},{i:'📝',t:'<strong>Note the time</strong> symptoms started.'},{i:'🤝',t:'<strong>Stay with the person</strong>.'}]},
  { id:'hypertension', name:'Hypertension', icon:'🩸', symptoms:['headache','dizziness','blurred vision','chest pain','shortness of breath','nausea','nosebleed','fatigue'], risk:'medium', desc:'Persistently elevated blood pressure.', recs:[{i:'🥗',t:'<strong>Reduce salt</strong>, eat fruits/vegetables.'},{i:'🏃',t:'<strong>Exercise regularly</strong> (30 min/day).'},{i:'👨‍⚕️',t:'<strong>Visit a doctor</strong> for medication.'},{i:'🧘',t:'<strong>Manage stress</strong> with meditation.'}]},
  { id:'diabetes', name:'Diabetes', icon:'🍬', symptoms:['frequent urination','excessive thirst','fatigue','blurred vision','slow healing wounds','numbness','weight loss','hunger','dizziness'], risk:'medium', desc:'Affects how your body uses blood glucose.', recs:[{i:'🩸',t:'<strong>Check blood sugar levels</strong>.'},{i:'🥗',t:'<strong>Avoid sugar/refined carbs</strong>.'},{i:'👨‍⚕️',t:'<strong>See an endocrinologist</strong>.'},{i:'🏃',t:'<strong>Exercise daily</strong>.'}]},
  { id:'pneumonia', name:'Pneumonia', icon:'🫁', symptoms:['cough','fever','shortness of breath','chest pain','fatigue','chills','sweating','confusion','rapid breathing'], risk:'high', desc:'Infection inflaming air sacs in lungs.', recs:[{i:'👨‍⚕️',t:'<strong>See a doctor immediately</strong>.'},{i:'💊',t:'<strong>Complete antibiotics</strong> if prescribed.'},{i:'🛌',t:'<strong>Rest and stay warm</strong>.'},{i:'💧',t:'<strong>Drink plenty of fluids</strong>.'}]},
  { id:'migraine', name:'Migraine', icon:'😖', symptoms:['severe headache','nausea','vomiting','light sensitivity','sound sensitivity','visual aura','dizziness','fatigue'], risk:'low', desc:'Recurring moderate to severe headache.', recs:[{i:'🌑',t:'<strong>Rest in a dark room</strong>.'},{i:'💊',t:'<strong>Take pain relief early</strong>.'},{i:'💧',t:'<strong>Stay hydrated</strong>.'},{i:'📔',t:'<strong>Keep a migraine diary</strong>.'}]},
  { id:'dengue', name:'Dengue Fever', icon:'🦟', symptoms:['high fever','severe headache','eye pain','joint pain','muscle pain','rash','nausea','vomiting','fatigue'], risk:'high', desc:'Mosquito-borne viral infection.', recs:[{i:'👨‍⚕️',t:'<strong>See a doctor immediately</strong>.'},{i:'💊',t:'<strong>Only take paracetamol</strong>.'},{i:'💧',t:'<strong>Drink lots of fluids</strong>.'},{i:'🦟',t:'<strong>Use mosquito repellent</strong>.'}]},
  { id:'asthma', name:'Asthma Attack', icon:'💨', symptoms:['shortness of breath','wheezing','coughing','chest tightness','rapid breathing','anxiety','difficulty speaking'], risk:'high', desc:'Airways inflame and narrow.', recs:[{i:'💨',t:'<strong>Use rescue inhaler</strong>.'},{i:'🧘',t:'<strong>Sit upright</strong>, breathe slowly.'},{i:'🚨',t:'<strong>Call 112 if no improvement</strong>.'},{i:'🚫',t:'<strong>Remove triggers</strong>.'}]},
  { id:'anxiety', name:'Anxiety Disorder', icon:'😰', symptoms:['rapid heartbeat','sweating','trembling','shortness of breath','dizziness','nausea','chest pain','fatigue','sleep problems','difficulty concentrating'], risk:'low', desc:'Persistent worry or fear.', recs:[{i:'🧘',t:'<strong>Practice deep breathing</strong>.'},{i:'👨‍⚕️',t:'<strong>See a therapist</strong> (CBT is effective).'},{i:'🏃',t:'<strong>Exercise regularly</strong>.'},{i:'📵',t:'<strong>Limit caffeine/social media</strong>.'}]}
];

const EMERGENCY_PATTERNS = [
  { name:'Possible Heart Attack', requiredAny:['chest pain','chest tightness'], co:['shortness of breath','sweating','left arm pain','jaw pain','nausea'] },
  { name:'Possible Stroke', requiredAny:['face drooping','slurred speech','sudden numbness','sudden weakness'] }
];

const QUICK_SYMPTOMS = ['fever','headache','cough','fatigue','chest pain','shortness of breath','nausea','dizziness','sore throat','body pain'];
const ALL_SYMPTOMS = [...new Set(DISEASES.flatMap(d => d.symptoms))].sort();
let selectedSymptoms = new Set();

function getDiseaseDetectionHTML() {
  return '<div class="content-card" id="symptom-input-section"><h3>🔍 Enter Your Symptoms</h3><p class="card-sub">Type a symptom and press Enter or click to add.</p>' +
    '<div class="input-row"><div class="input-wrapper"><input type="text" id="symptom-input" placeholder="e.g. fever, headache, chest pain…" autocomplete="off"><div id="suggestions" class="suggestions hidden"></div></div>' +
    '<button class="btn-add" onclick="addSymptomFromInput()">+ Add</button></div>' +
    '<div id="symptom-tags" class="symptom-tags"></div>' +
    '<div class="quick-symptoms"><span class="qs-label">Quick add:</span><div class="qs-chips" id="quick-chips"></div></div>' +
    '<button class="btn-primary btn-teal" id="analyze-btn" onclick="startAnalysisFlow()" disabled><span>🤖</span> Analyze Symptoms</button></div>' +
    '<div id="questionnaire-section" class="hidden"></div>' +
    '<div id="results-section" class="results-section hidden"></div>';
}

function initDiseaseDetection() {
  selectedSymptoms = new Set();
  renderQuickChips();
  initSymptomInput();
  renderSymptomTags();
}

function renderQuickChips() {
  var wrap = document.getElementById('quick-chips');
  if (!wrap) return;
  wrap.innerHTML = QUICK_SYMPTOMS.map(function(s) {
    var used = selectedSymptoms.has(s) ? ' used' : '';
    return '<span class="qs-chip' + used + '" onclick="addSymptom(\'' + s + '\')">' + escapeHtml(s) + '</span>';
  }).join('');
}

function initSymptomInput() {
  var input = document.getElementById('symptom-input');
  if (!input) return;
  input.addEventListener('input', function() {
    var val = this.value.toLowerCase().trim();
    var suggestions = document.getElementById('suggestions');
    if (val.length < 2) { suggestions.classList.add('hidden'); return; }
    var matches = ALL_SYMPTOMS.filter(function(s) { return s.includes(val) && !selectedSymptoms.has(s); });
    if (matches.length === 0) { suggestions.classList.add('hidden'); return; }
    suggestions.innerHTML = matches.slice(0, 6).map(function(s) { return '<div class="suggestion-item" onclick="addSymptom(\'' + s + '\')">' + escapeHtml(s) + '</div>'; }).join('');
    suggestions.classList.remove('hidden');
  });
  input.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); addSymptomFromInput(); } });
  document.addEventListener('click', function(e) {
    var suggestions = document.getElementById('suggestions');
    if (suggestions && !e.target.closest('.input-wrapper')) suggestions.classList.add('hidden');
  });
}

function addSymptomFromInput() {
  var input = document.getElementById('symptom-input');
  if (!input) return;
  var val = input.value.toLowerCase().trim();
  if (val) { addSymptom(val); input.value = ''; }
  var suggestions = document.getElementById('suggestions');
  if (suggestions) suggestions.classList.add('hidden');
}

function addSymptom(symptom) {
  if (selectedSymptoms.has(symptom)) return;
  selectedSymptoms.add(symptom);
  renderSymptomTags();
  renderQuickChips();
  var btn = document.getElementById('analyze-btn');
  if (btn) btn.disabled = selectedSymptoms.size === 0;
}

function removeSymptom(symptom) {
  selectedSymptoms.delete(symptom);
  renderSymptomTags();
  renderQuickChips();
  var btn = document.getElementById('analyze-btn');
  if (btn) btn.disabled = selectedSymptoms.size === 0;
}

function renderSymptomTags() {
  var wrap = document.getElementById('symptom-tags');
  if (!wrap) return;
  wrap.innerHTML = Array.from(selectedSymptoms).map(function(s) {
    return '<span class="symptom-tag">' + escapeHtml(s) + ' <span class="tag-remove" onclick="removeSymptom(\'' + s + '\')">×</span></span>';
  }).join('');
}

// ── INTERACTIVE QUESTIONNAIRE LOGIC ─────────────────────────────
const FOLLOW_UP_QUESTIONS = [
  {
    trigger: 'fever',
    id: 'fever_temp',
    text: 'What is your body temperature?',
    options: ['99–100°F', '101–102°F', '103°F+']
  },
  {
    trigger: 'headache',
    id: 'has_headache',
    text: 'Do you have a headache?',
    options: ['Yes', 'No']
  },
  {
    trigger: 'cough',
    id: 'has_cough',
    text: 'Do you have a cough?',
    options: ['Yes', 'No']
  },
  {
    trigger: 'body pain',
    id: 'has_body_pain',
    text: 'Do you have body pain?',
    options: ['Yes', 'No']
  }
];

let questionnaireAnswers = {};
let activeQuestions = [];

function startAnalysisFlow() {
  if (selectedSymptoms.size === 0) return;
  
  // Reset previous state
  questionnaireAnswers = {};
  activeQuestions = [];
  
  const symptomsList = Array.from(selectedSymptoms);
  
  // Find which follow-up questions are triggered
  FOLLOW_UP_QUESTIONS.forEach(q => {
    // If the trigger symptom was explicitly selected, OR we just want to ask these common ones anyway
    // Here we'll ask if ANY of these related symptoms are selected to be safe,
    // or we can just strictly match. Let's ask if they specifically added 'fever', etc.
    // For a better UX based on the prompt, let's ask these standard follow ups if ANY of them trigger, 
    // or just ask the ones related to their input.
    if (symptomsList.includes(q.trigger) || symptomsList.includes('fever')) {
      // Avoid duplicates if we trigger broadly
      if (!activeQuestions.some(aq => aq.id === q.id)) {
        activeQuestions.push(q);
      }
    }
  });
  
  // If no questions match, or they didn't select fever/cough/etc, we can just skip straight to analyze
  // However, the prompt implies these are the standard follow ups if they pick something like 'fever'.
  if (activeQuestions.length > 0) {
    renderQuestionnaire();
  } else {
    // Skip to final analysis directly
    completeAnalysis();
  }
}

function renderQuestionnaire() {
  const inputSection = document.getElementById('symptom-input-section');
  const questSection = document.getElementById('questionnaire-section');
  const resultsSection = document.getElementById('results-section');
  
  if (inputSection) inputSection.classList.add('hidden');
  if (resultsSection) resultsSection.classList.add('hidden');
  if (questSection) questSection.classList.remove('hidden');
  
  let html = '<div class="content-card questionnaire-card"><h3>📋 Follow-up Questions</h3><p class="card-sub">Please answer a few quick questions to help us understand your condition better.</p><div class="q-list">';
  
  activeQuestions.forEach((q, index) => {
    html += '<div class="follow-up-q"><h4>' + (index + 1) + '. ' + escapeHtml(q.text) + '</h4><div class="q-options">';
    q.options.forEach(opt => {
      html += '<button class="q-opt-btn" data-qid="' + q.id + '" data-val="' + escapeHtml(opt) + '" onclick="selectQuestionAnswer(this, \'' + q.id + '\', \'' + escapeHtml(opt) + '\')">' + escapeHtml(opt) + '</button>';
    });
    html += '</div></div>';
  });
  
  html += '</div>';
  html += '<div class="q-actions"><button class="btn-primary" style="background:var(--surface);color:var(--text);border:1px solid var(--border);" onclick="cancelQuestionnaire()">Back</button>';
  html += '<button class="btn-primary btn-teal" onclick="completeAnalysis()">🔍 Analyze</button></div>';
  html += '</div>';
  
  questSection.innerHTML = html;
}

function selectQuestionAnswer(btn, qid, val) {
  questionnaireAnswers[qid] = val;
  const siblings = btn.parentElement.querySelectorAll('.q-opt-btn');
  siblings.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function cancelQuestionnaire() {
  const inputSection = document.getElementById('symptom-input-section');
  const questSection = document.getElementById('questionnaire-section');
  if (inputSection) inputSection.classList.remove('hidden');
  if (questSection) questSection.classList.add('hidden');
}

function completeAnalysis() {
  const questSection = document.getElementById('questionnaire-section');
  if (questSection) questSection.classList.add('hidden');
  
  const inputSection = document.getElementById('symptom-input-section');
  if (inputSection) inputSection.classList.remove('hidden');
  
  if (selectedSymptoms.size === 0) return;
  var symptoms = Array.from(selectedSymptoms);

  // Check emergencies
  for (var i = 0; i < EMERGENCY_PATTERNS.length; i++) {
    var ep = EMERGENCY_PATTERNS[i];
    var hasRequired = ep.requiredAny.some(function(s) { return symptoms.includes(s); });
    if (hasRequired) { showEmergency(ep.name); return; }
  }

  // Score diseases
  var scored = DISEASES.map(function(d) {
    var matched = d.symptoms.filter(function(s) { return symptoms.includes(s); });
    return { disease: d, matchCount: matched.length, matchPercent: Math.round(matched.length / d.symptoms.length * 100), matched: matched };
  }).filter(function(s) { return s.matchCount > 0; }).sort(function(a, b) { return b.matchPercent - a.matchPercent; });

  var resultsDiv = document.getElementById('results-section');
  if (!resultsDiv) return;

  if (scored.length === 0) {
    resultsDiv.innerHTML = '<div class="content-card"><h3>No matches found</h3><p class="card-sub">Try adding more symptoms or different terms.</p></div>';
    resultsDiv.classList.remove('hidden');
    return;
  }

  var topDisease = scored[0].disease;
  var topRisk = topDisease.risk;
  
  // Contextual modifications based on interactive questionnaire
  if (questionnaireAnswers['fever_temp'] === '103°F+') {
    topRisk = 'high'; // Escalate risk if fever is very high
    
    // Auto-escalate the Dengue probability if high fever and body pain exist
    if (questionnaireAnswers['has_body_pain'] === 'Yes') {
      const dengueMatch = scored.find(s => s.disease.id === 'dengue');
      if (dengueMatch) {
         // Force Dengue closer to top if these symptoms match
         dengueMatch.matchPercent += 20; 
         scored.sort(function(a, b) { return b.matchPercent - a.matchPercent; });
      }
    }
  }

  var riskColors = { low: 'low', medium: 'medium', high: 'high' };
  var riskDescs = { low: 'Monitor symptoms at home.', medium: 'Consider seeing a doctor.', high: 'Seek medical attention soon.' };

  // Adjust recommendation text dynamically if needed based on the user's specific answers
  let customRecHTML = '';
  if (questionnaireAnswers['fever_temp'] === '103°F+') {
     customRecHTML += '<div class="rec-item"><span class="rec-icon">🚨</span><span><strong>Immediate Action:</strong> Your fever is very high (103°F+). Please consult a doctor immediately.</span></div>';
  } else if (questionnaireAnswers['fever_temp'] === '101–102°F') {
     customRecHTML += '<div class="rec-item"><span class="rec-icon">⚠️</span><span><strong>Note:</strong> Drink fluids, rest, and consult a doctor if fever exceeds 102°F.</span></div>';
  }

  var html = '<div class="content-card risk-card"><div class="risk-label">Risk Level</div>' +
    '<div class="risk-badge ' + riskColors[topRisk] + '">' + topRisk.toUpperCase() + '</div>' +
    '<div class="risk-desc">' + riskDescs[topRisk] + '</div>' +
    '<div class="risk-meter"><div class="risk-fill ' + riskColors[topRisk] + '"></div></div></div>';

  html += '<div class="content-card"><h3>🩺 Possible Conditions</h3><p class="card-sub">Based on your symptoms — not a diagnosis.</p><div class="conditions-list">';
  scored.slice(0, 5).forEach(function(s) {
    html += '<div class="condition-item"><span class="condition-icon">' + s.disease.icon + '</span><div class="condition-info">' +
      '<div class="condition-name">' + escapeHtml(s.disease.name) + '</div>' +
      '<div class="condition-match">' + s.matchCount + '/' + s.disease.symptoms.length + ' symptoms match (' + s.matchPercent + '%)</div>' +
      '<div class="match-bar"><div class="match-fill" style="width:' + s.matchPercent + '%"></div></div></div></div>';
  });
  html += '</div></div>';

  var finalTopDisease = scored[0].disease;
  html += '<div class="content-card"><h3>📋 Recommendation</h3><div class="recommendations-list">';
  
  if (customRecHTML) {
    html += customRecHTML;
  }
  
  finalTopDisease.recs.forEach(function(r) {
    html += '<div class="rec-item"><span class="rec-icon">' + r.i + '</span><span>' + r.t + '</span></div>';
  });
  html += '</div></div>';
  html += '<div class="disclaimer-card">⚕️ <strong>Disclaimer:</strong> Not a substitute for professional medical advice.</div>';

  resultsDiv.innerHTML = html;
  resultsDiv.classList.remove('hidden');
}

function showEmergency(conditionName) {
  var modal = document.getElementById('emergency-modal');
  var condText = document.getElementById('em-condition-text');
  if (condText) condText.textContent = conditionName;
  if (modal) modal.classList.remove('hidden');
}

function closeEmergency() {
  var modal = document.getElementById('emergency-modal');
  if (modal) modal.classList.add('hidden');
}

// ── GEOLOCATION & LOCATION STATE ────────────────────────────
var currentLocation = null;
var nearbyHospitals = [];
var nearbyPharmacies = [];

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('Location obtained:', currentLocation);
        searchNearbyPlaces('hospital', 'nearby-hospitals');
      },
      function(error) {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enable location services.');
      }
    );
  } else {
    alert('Geolocation is not supported by your browser.');
  }
}

function searchNearbyPlaces(placeType, tabId) {
  if (!currentLocation) {
    alert('Location not available. Please enable location services.');
    return;
  }

  var service = new google.maps.places.PlacesService(document.createElement('div'));
  var searchType = placeType === 'hospital' ? 'hospital' : 'pharmacy';
  
  var request = {
    location: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
    radius: 5000,
    type: searchType
  };

  service.nearbySearch(request, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      if (placeType === 'hospital') {
        nearbyHospitals = results.slice(0, 8);
        updateNearbyHospitalsDisplay();
      } else {
        nearbyPharmacies = results.slice(0, 8);
        updateNearbyPharmaciesDisplay();
      }
    } else {
      console.error('Places service error:', status);
      alert('Unable to find nearby ' + (placeType === 'hospital' ? 'hospitals' : 'pharmacies') + '. Please try again.');
    }
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var distance = R * c;
  return distance.toFixed(1);
}

function updateNearbyHospitalsDisplay() {
  var panelBody = document.querySelector('[data-tab-id="nearby-hospitals"] .panel-body') || 
                  document.getElementById('panel-nearby-hospitals')?.querySelector('.panel-body');
  if (!panelBody) return;
  
  var html = '<div class="content-card"><h3>🏥 Nearby Hospitals</h3><p class="card-sub">Found ' + nearbyHospitals.length + ' hospitals near you</p></div><div class="hospital-grid">';
  nearbyHospitals.forEach(function(h) {
    var distance = calculateDistance(currentLocation.lat, currentLocation.lng, h.geometry.location.lat(), h.geometry.location.lng());
    var rating = h.rating ? '⭐ ' + h.rating.toFixed(1) : 'No rating';
    var operational = h.opening_hours ? (h.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed') : 'Status Unknown';
    html += '<div class="hospital-card" onclick="window.open(\'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(h.name) + '&query_place_id=' + h.place_id + '\', \'_blank\')">' +
      '<h4>' + escapeHtml(h.name) + '</h4>' +
      '<p style="font-size:0.85rem;color:var(--text-dim);margin:4px 0;">' + escapeHtml(h.vicinity) + '</p>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-top:6px;">' +
      '<span>' + distance + ' km away</span>' +
      '<span>' + rating + '</span>' +
      '</div>' +
      '<span class="distance" style="margin-top:4px;display:block;">' + operational + '</span>' +
      '</div>';
  });
  html += '</div>';
  panelBody.innerHTML = html;
}

function updateNearbyPharmaciesDisplay() {
  var panelBody = document.querySelector('[data-tab-id="nearby-pharmacy"] .panel-body') || 
                  document.getElementById('panel-nearby-pharmacy')?.querySelector('.panel-body');
  if (!panelBody) return;
  
  var html = '<div class="content-card"><h3>💊 Nearby Pharmacies</h3><p class="card-sub">Found ' + nearbyPharmacies.length + ' pharmacies near you</p></div><div class="hospital-grid">';
  nearbyPharmacies.forEach(function(p) {
    var distance = calculateDistance(currentLocation.lat, currentLocation.lng, p.geometry.location.lat(), p.geometry.location.lng());
    var rating = p.rating ? '⭐ ' + p.rating.toFixed(1) : 'No rating';
    var operational = p.opening_hours ? (p.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed') : 'Status Unknown';
    html += '<div class="hospital-card" onclick="window.open(\'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.name) + '&query_place_id=' + p.place_id + '\', \'_blank\')">' +
      '<h4>' + escapeHtml(p.name) + '</h4>' +
      '<p style="font-size:0.85rem;color:var(--text-dim);margin:4px 0;">' + escapeHtml(p.vicinity) + '</p>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-top:6px;">' +
      '<span>' + distance + ' km away</span>' +
      '<span>' + rating + '</span>' +
      '</div>' +
      '<span class="distance" style="margin-top:4px;display:block;">' + operational + '</span>' +
      '</div>';
  });
  html += '</div>';
  panelBody.innerHTML = html;
}

// ── NEARBY HOSPITALS ─────────────────────────────────────────
function getNearbyHospitalsHTML() {
  var html = '<div class="content-card"><h3>🏥 Nearby Hospitals</h3><p class="card-sub">Find hospitals near your current location.</p>';
  html += '<button class="btn-primary btn-teal" onclick="getCurrentLocation(); searchNearbyPlaces(\'hospital\', \'nearby-hospitals\')" style="width:100%;margin-bottom:12px;"><span>📍</span> Get My Location & Search</button>';
  html += '</div>';
  
  if (nearbyHospitals.length === 0) {
    html += '<div class="content-card" style="text-align:center;padding:40px 20px;"><p style="color:var(--text-dim);">📍 Click the button above to enable location and find nearby hospitals.</p></div>';
  } else {
    html += '<div class="hospital-grid">';
    nearbyHospitals.forEach(function(h) {
      var distance = calculateDistance(currentLocation.lat, currentLocation.lng, h.geometry.location.lat(), h.geometry.location.lng());
      var rating = h.rating ? '⭐ ' + h.rating.toFixed(1) : 'No rating';
      var operational = h.opening_hours ? (h.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed') : 'Status Unknown';
      html += '<div class="hospital-card" onclick="window.open(\'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(h.name) + '&query_place_id=' + h.place_id + '\', \'_blank\')">' +
        '<h4>' + escapeHtml(h.name) + '</h4>' +
        '<p style="font-size:0.85rem;color:var(--text-dim);margin:4px 0;">' + escapeHtml(h.vicinity) + '</p>' +
        '<div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-top:6px;">' +
        '<span>' + distance + ' km away</span>' +
        '<span>' + rating + '</span>' +
        '</div>' +
        '<span class="distance" style="margin-top:4px;display:block;">' + operational + '</span>' +
        '</div>';
    });
    html += '</div>';
  }
  
  return html;
}

// ── NEARBY PHARMACY ──────────────────────────────────────────
var PHARMACIES = [
  { name:'MedPlus Pharmacy', addr:'100 Health Blvd', dist:'0.3 km', hours:'24/7' },
  { name:'Apollo Pharmacy', addr:'200 Care St', dist:'0.7 km', hours:'8AM - 10PM' },
  { name:'LifeLine Drugs', addr:'300 Wellness Ave', dist:'1.1 km', hours:'24/7' },
  { name:'City Pharmacy', addr:'400 Medical Ln', dist:'1.5 km', hours:'9AM - 9PM' },
  { name:'QuickMed Store', addr:'500 Cure Rd', dist:'0.9 km', hours:'7AM - 11PM' }
];

function getNearbyPharmacyHTML() {
  var html = '<div class="content-card"><h3>💊 Nearby Pharmacies</h3><p class="card-sub">Find pharmacies near you.</p></div><div class="hospital-grid">';
  PHARMACIES.forEach(function(p) {
    html += '<div class="hospital-card" onclick="window.open(\'https://www.google.com/maps/search/' + encodeURIComponent(p.name + ' pharmacy') + '\', \'_blank\')">' +
      '<h4>' + escapeHtml(p.name) + '</h4><p>' + escapeHtml(p.addr) + '</p><p style="font-size:0.78rem;color:var(--teal);margin-top:4px;">🕐 ' + p.hours + '</p><span class="distance">' + p.dist + '</span></div>';
  });
  html += '</div>';
  return html;
}

// ── HEALTH TIPS ──────────────────────────────────────────────
function getHealthTipsHTML() {
  var tips = [
    { icon:'💧', title:'Stay Hydrated', desc:'Drink at least 8 glasses of water daily. Proper hydration supports kidney function, digestion, and brain health.' },
    { icon:'🏃', title:'Exercise Regularly', desc:'30 minutes of moderate exercise most days reduces risk of heart disease, diabetes, and improves mental health.' },
    { icon:'😴', title:'Prioritize Sleep', desc:'Aim for 7-9 hours of quality sleep. Poor sleep weakens immunity and impairs cognitive function.' },
    { icon:'🥗', title:'Eat Balanced Meals', desc:'Include fruits, vegetables, lean proteins, and whole grains. Limit processed foods and added sugars.' },
    { icon:'🧘', title:'Manage Stress', desc:'Practice mindfulness, deep breathing, or yoga. Chronic stress increases risk of many diseases.' },
    { icon:'🚭', title:'Avoid Harmful Substances', desc:'Avoid smoking and limit alcohol. Both significantly increase risk of cancer and organ damage.' },
    { icon:'🧴', title:'Practice Good Hygiene', desc:'Wash hands frequently, maintain oral hygiene, and keep your living environment clean.' },
    { icon:'👨‍⚕️', title:'Regular Check-ups', desc:'Annual health screenings catch problems early. Don\'t skip preventive care appointments.' }
  ];
  var html = '<div class="content-card"><h3>💡 Health Tips</h3><p class="card-sub">Evidence-based tips for a healthier life.</p></div><div class="tips-grid">';
  tips.forEach(function(t) {
    html += '<div class="tip-card"><div class="tip-icon">' + t.icon + '</div><h4>' + escapeHtml(t.title) + '</h4><p>' + escapeHtml(t.desc) + '</p></div>';
  });
  html += '</div>';
  return html;
}

// ── CONSULT DOCTOR ───────────────────────────────────────────

const DOCTORS = [
  { id: 1, name: 'Dr. Sarah Jenkins', spec: 'General Physician', exp: '12 Years Exp', rating: 4.8, available: true, img: '👩‍⚕️' },
  { id: 2, name: 'Dr. Michael Chen', spec: 'Cardiologist', exp: '15 Years Exp', rating: 4.9, available: true, img: '👨‍⚕️' },
  { id: 3, name: 'Dr. Priya Sharma', spec: 'Dermatologist', exp: '8 Years Exp', rating: 4.7, available: false, img: '👩‍⚕️' },
  { id: 4, name: 'Dr. David Wilson', spec: 'Neurologist', exp: '20 Years Exp', rating: 4.9, available: true, img: '👨‍⚕️' },
  { id: 5, name: 'Dr. Emily Carter', spec: 'Psychiatrist', exp: '10 Years Exp', rating: 4.6, available: true, img: '👩‍⚕️' },
  { id: 6, name: 'Dr. Robert Fox', spec: 'General Physician', exp: '5 Years Exp', rating: 4.5, available: true, img: '👨‍⚕️' }
];

function getConsultDoctorHTML() {
  var html = '<div class="content-card"><h3>👨‍⚕️ Consult a Doctor</h3><p class="card-sub">Connect with top specialists for online or in-person consultations.</p>';
  
  // Category Filter
  html += `
    <div class="doctor-filter">
      <select id="doctor-spec-filter" onchange="filterDoctors(this.value)">
        <option value="all">All Specialties</option>
        <option value="General Physician">General Physician</option>
        <option value="Cardiologist">Cardiologist</option>
        <option value="Dermatologist">Dermatologist</option>
        <option value="Neurologist">Neurologist</option>
        <option value="Psychiatrist">Psychiatrist</option>
      </select>
    </div>
    <div class="doctor-grid" id="doctor-grid">
  `;
  
  html += renderDoctorCards(DOCTORS);
  
  html += '</div></div>';
  return html;
}

function renderDoctorCards(docs) {
  if (docs.length === 0) return '<p>No doctors found for this specialty.</p>';
  
  return docs.map(doc => `
    <div class="doctor-card">
      <div class="doctor-card-header">
        <div class="doctor-avatar">${doc.img}</div>
        <div class="doctor-info">
          <h4>${doc.name}</h4>
          <p class="doctor-spec">${doc.spec}</p>
          <p class="doctor-exp">${doc.exp} • ⭐ ${doc.rating}</p>
        </div>
      </div>
      <div class="doctor-card-footer">
        <span class="doctor-status ${doc.available ? 'online' : 'offline'}">
          ${doc.available ? '🟢 Available Today' : '🔴 Next Available Tmrw'}
        </span>
        <button class="btn-book ${doc.available ? '' : 'disabled'}" 
          onclick="${doc.available ? `bookAppointment('${doc.name}', '${doc.spec}')` : ''}">
          Book Now
        </button>
      </div>
    </div>
  `).join('');
}

function filterDoctors(spec) {
  var grid = document.getElementById('doctor-grid');
  if (!grid) return;
  
  if (spec === 'all') {
    grid.innerHTML = renderDoctorCards(DOCTORS);
  } else {
    var filtered = DOCTORS.filter(d => d.spec === spec);
    grid.innerHTML = renderDoctorCards(filtered);
  }
}

function bookAppointment(docName, docSpec) {
  alert('Booking request sent for ' + docName + ' (' + docSpec + ').\n\nThe doctor\'s clinic will contact you shortly to confirm the time slots.');
}

// ── DEPRESSION TEST ──────────────────────────────────────────
var DEPRESSION_QUESTIONS = [
  'Little interest or pleasure in doing things?',
  'Feeling down, depressed, or hopeless?',
  'Trouble falling or staying asleep, or sleeping too much?',
  'Feeling tired or having little energy?',
  'Poor appetite or overeating?',
  'Feeling bad about yourself or that you are a failure?',
  'Trouble concentrating on things?',
  'Moving or speaking slowly, or being fidgety/restless?',
  'Thoughts that you would be better off dead or of hurting yourself?'
];

var DEPRESSION_OPTIONS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
var depressionAnswers = {};
var selectedSleep = '';

function getDepressionTestHTML() {
  var html = '<div class="content-card"><h3>📋 PHQ-9 Depression Screening</h3><p class="card-sub">Answer honestly — your responses stay on your device.</p><div id="dep-questions">';
  DEPRESSION_QUESTIONS.forEach(function(q, i) {
    html += '<div class="mood-question"><p>' + (i+1) + '. ' + escapeHtml(q) + '</p><div class="mood-options">';
    DEPRESSION_OPTIONS.forEach(function(opt, j) {
      html += '<button class="mood-opt" data-q="' + i + '" data-v="' + j + '" onclick="selectDepAnswer(this,' + i + ',' + j + ')">' + escapeHtml(opt) + '</button>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  html += '<div class="content-card"><h3>📊 Stress Level</h3><p class="card-sub">How stressed in the past two weeks?</p>' +
    '<div class="stress-slider-wrap"><input type="range" id="stress-slider" min="1" max="10" value="5" class="stress-slider" oninput="updateStressLabel(this.value)">' +
    '<div class="stress-labels"><span>😌 Calm</span><span id="stress-value-label" class="stress-current">5 / 10</span><span>😰 Very Stressed</span></div></div></div>';
  html += '<div class="content-card"><h3>😴 Sleep Quality</h3><p class="card-sub">Average hours of sleep per night?</p>' +
    '<div class="sleep-options"><button class="sleep-btn" onclick="selectSleep(this)" data-val="less4">Less than 4h</button>' +
    '<button class="sleep-btn" onclick="selectSleep(this)" data-val="4to6">4 – 6 hours</button>' +
    '<button class="sleep-btn" onclick="selectSleep(this)" data-val="6to8">6 – 8 hours</button>' +
    '<button class="sleep-btn" onclick="selectSleep(this)" data-val="more8">More than 8h</button></div></div>';
  html += '<button class="btn-primary btn-purple" style="width:100%;margin-top:8px;" onclick="analyzeDepression()">🧠 Analyze Mental Health</button>';
  html += '<div id="depression-results" class="results-section hidden"></div>';
  return html;
}

function selectDepAnswer(btn, qIdx, val) {
  depressionAnswers[qIdx] = val;
  var siblings = btn.parentElement.querySelectorAll('.mood-opt');
  siblings.forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
}

function updateStressLabel(val) {
  var label = document.getElementById('stress-value-label');
  if (label) label.textContent = val + ' / 10';
}

function selectSleep(btn) {
  selectedSleep = btn.getAttribute('data-val');
  btn.parentElement.querySelectorAll('.sleep-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
}

function analyzeDepression() {
  var total = 0;
  var answered = Object.keys(depressionAnswers).length;
  if (answered < 5) { alert('Please answer at least 5 questions.'); return; }
  for (var k in depressionAnswers) total += depressionAnswers[k];

  var slider = document.getElementById('stress-slider');
  var stress = slider ? parseInt(slider.value) : 5;
  var sleepPenalty = 0;
  if (selectedSleep === 'less4') sleepPenalty = 4;
  else if (selectedSleep === '4to6') sleepPenalty = 2;
  else if (selectedSleep === 'more8') sleepPenalty = 1;

  var score = total + Math.round(stress * 0.5) + sleepPenalty;
  var maxScore = 27 + 5 + 4;
  var pct = Math.round(score / maxScore * 100);

  var level, desc, suggestions;
  if (pct <= 25) {
    level = 'low'; desc = 'Your mental health appears stable. Keep up your healthy habits!';
    suggestions = [{i:'🌟',t:'Continue your positive routines.'},{i:'🏃',t:'Stay physically active.'},{i:'🧑‍🤝‍🧑',t:'Maintain social connections.'}];
  } else if (pct <= 55) {
    level = 'medium'; desc = 'Some signs of emotional strain. Consider self-care strategies.';
    suggestions = [{i:'🧘',t:'Try daily mindfulness or meditation.'},{i:'😴',t:'Improve your sleep routine.'},{i:'📝',t:'Journal your thoughts and feelings.'},{i:'👨‍⚕️',t:'Consider talking to a counselor.'}];
  } else {
    level = 'high'; desc = 'Significant signs of distress. Please reach out for support.';
    suggestions = [{i:'🆘',t:'<strong>Contact a helpline</strong>: iCall 9152987821 or Vandrevala 1860-2662-345.'},{i:'👨‍⚕️',t:'<strong>See a mental health professional</strong> as soon as possible.'},{i:'🤝',t:'Talk to someone you trust.'},{i:'🛌',t:'Prioritize rest and self-care.'}];
  }

  var resultsDiv = document.getElementById('depression-results');
  if (!resultsDiv) return;
  var html = '<div class="content-card risk-card"><div class="risk-label">Mental Wellness Score</div>' +
    '<div class="risk-badge ' + level + '">' + level.toUpperCase() + ' (' + pct + '%)</div>' +
    '<div class="risk-desc">' + desc + '</div><div class="risk-meter"><div class="risk-fill ' + level + '"></div></div></div>';
  html += '<div class="content-card"><h3>💡 Suggestions</h3><div class="recommendations-list">';
  suggestions.forEach(function(s) { html += '<div class="rec-item"><span class="rec-icon">' + s.i + '</span><span>' + s.t + '</span></div>'; });
  html += '</div></div><div class="disclaimer-card">⚕️ <strong>Disclaimer:</strong> Please consult a licensed mental health professional.</div>';
  resultsDiv.innerHTML = html;
  resultsDiv.classList.remove('hidden');
}

// ── MOOD TRACKER ─────────────────────────────────────────────
var moodLog = JSON.parse(localStorage.getItem('nn_mood_log') || '[]');
var selectedMoodEmoji = '';

function getMoodTrackerHTML() {
  var moods = ['😊','🙂','😐','😔','😢'];
  var html = '<div class="content-card"><h3>📊 How are you feeling today?</h3><p class="card-sub">Select your current mood.</p>' +
    '<div class="mood-selector">';
  moods.forEach(function(m) {
    html += '<button class="mood-select-btn" onclick="selectMoodEmoji(this, \'' + m + '\')">' + m + '</button>';
  });
  html += '</div><button class="mood-log-btn" onclick="logMood()">Log Today\'s Mood</button></div>';
  html += '<div class="content-card"><h3>📅 Last 7 Days</h3><div class="mood-tracker-grid" id="mood-grid"></div></div>';
  return html;
}

function selectMoodEmoji(btn, emoji) {
  selectedMoodEmoji = emoji;
  btn.closest('.mood-selector').querySelectorAll('.mood-select-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
}

function logMood() {
  if (!selectedMoodEmoji) { alert('Select a mood first!'); return; }
  var today = new Date().toISOString().slice(0, 10);
  var existing = moodLog.findIndex(function(m) { return m.date === today; });
  if (existing >= 0) moodLog[existing].mood = selectedMoodEmoji;
  else moodLog.push({ date: today, mood: selectedMoodEmoji });
  if (moodLog.length > 30) moodLog = moodLog.slice(-30);
  localStorage.setItem('nn_mood_log', JSON.stringify(moodLog));
  renderMoodGrid();
  selectedMoodEmoji = '';
  document.querySelectorAll('.mood-select-btn').forEach(function(b) { b.classList.remove('selected'); });
}

function renderMoodGrid() {
  var grid = document.getElementById('mood-grid');
  if (!grid) return;
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var dateStr = d.toISOString().slice(0, 10);
    var entry = moodLog.find(function(m) { return m.date === dateStr; });
    var dayName = d.toLocaleDateString('en', { weekday: 'short' });
    days.push('<div class="mood-day"><span class="mood-emoji">' + (entry ? entry.mood : '·') + '</span><span class="mood-label">' + dayName + '</span></div>');
  }
  grid.innerHTML = days.join('');
}

// ── AI ADVICE ────────────────────────────────────────────────
function getAIAdviceHTML() {
  var advices = [
    { title:'🌅 Morning Routine', text:'Start your day with 5 minutes of deep breathing. Avoid checking your phone for the first 30 minutes. Eat a nutritious breakfast and set one realistic goal for the day.' },
    { title:'💪 Building Resilience', text:'Reframe negative thoughts by asking: "Will this matter in 5 years?" Practice gratitude by writing 3 things you\'re thankful for each night before bed.' },
    { title:'🧑‍🤝‍🧑 Social Connection', text:'Isolation worsens depression. Reach out to one person today — even a short text counts. Join a community group or volunteer for a cause you care about.' },
    { title:'📵 Digital Detox', text:'Social media comparison fuels anxiety. Set screen time limits. Replace scrolling with reading, walking, or creative hobbies.' },
    { title:'🍎 Nutrition & Mood', text:'Omega-3 fatty acids (fish, walnuts) support brain health. Reduce sugar and processed foods which cause energy crashes and mood swings.' },
    { title:'📝 Journaling Therapy', text:'Write freely for 10 minutes daily without judgment. Express fears, hopes, and emotions. Studies show journaling reduces symptoms of depression.' }
  ];
  var html = '<div class="content-card"><h3>🤖 AI-Driven Mental Health Advice</h3><p class="card-sub">Personalized strategies for emotional well-being.</p></div>';
  advices.forEach(function(a) {
    html += '<div class="advice-card"><h4>' + a.title + '</h4><p>' + escapeHtml(a.text) + '</p></div>';
  });
  return html;
}

// ── MEDITATION GUIDANCE ──────────────────────────────────────
var meditationTimer = null;
var meditationSeconds = 0;
var meditationRunning = false;

function getMeditationGuidanceHTML() {
  var sessions = [
    { emoji:'🌊', title:'Body Scan Relaxation', desc:'Progressive relaxation from head to toe. 10 min.', duration: 600 },
    { emoji:'🌬️', title:'Deep Breathing (4-7-8)', desc:'Inhale 4s, hold 7s, exhale 8s. 5 min.', duration: 300 },
    { emoji:'🌸', title:'Loving Kindness', desc:'Send compassion to yourself and others. 8 min.', duration: 480 },
    { emoji:'🎯', title:'Focused Attention', desc:'Concentrate on a single point of focus. 10 min.', duration: 600 }
  ];
  var html = '<div class="content-card"><h3>🧘 Guided Meditation</h3><p class="card-sub">Choose a session to begin.</p></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:20px;">';
  sessions.forEach(function(s) {
    html += '<div class="meditation-card" onclick="startMeditation(' + s.duration + ',\'' + escapeHtml(s.title) + '\')">' +
      '<div class="meditation-emoji">' + s.emoji + '</div><h4>' + escapeHtml(s.title) + '</h4><p>' + escapeHtml(s.desc) + '</p></div>';
  });
  html += '</div>';
  html += '<div class="content-card" id="meditation-timer-area" style="display:none;"><div class="meditation-timer">' +
    '<div class="timer-circle" id="med-timer-circle"><span id="med-timer-display">0:00</span></div>' +
    '<p class="timer-instruction" id="med-timer-instruction">Focus on your breathing...</p>' +
    '<button class="timer-btn" id="med-timer-btn" onclick="toggleMeditation()">Pause</button></div></div>';
  return html;
}

function startMeditation(duration, title) {
  meditationSeconds = duration;
  meditationRunning = true;
  var area = document.getElementById('meditation-timer-area');
  var circle = document.getElementById('med-timer-circle');
  var instruction = document.getElementById('med-timer-instruction');
  if (area) area.style.display = 'block';
  if (circle) circle.classList.add('active');
  if (instruction) instruction.textContent = title + ' — Focus on your breathing...';
  updateTimerDisplay();
  clearInterval(meditationTimer);
  meditationTimer = setInterval(function() {
    if (!meditationRunning) return;
    meditationSeconds--;
    updateTimerDisplay();
    if (meditationSeconds <= 0) {
      clearInterval(meditationTimer);
      meditationRunning = false;
      var display = document.getElementById('med-timer-display');
      if (display) display.textContent = '✓ Done';
      if (circle) circle.classList.remove('active');
      if (instruction) instruction.textContent = 'Session complete. Well done!';
      var btn = document.getElementById('med-timer-btn');
      if (btn) btn.textContent = 'Done';
    }
  }, 1000);
}

function toggleMeditation() {
  meditationRunning = !meditationRunning;
  var btn = document.getElementById('med-timer-btn');
  if (btn) btn.textContent = meditationRunning ? 'Pause' : 'Resume';
}

function updateTimerDisplay() {
  var display = document.getElementById('med-timer-display');
  if (!display) return;
  var m = Math.floor(meditationSeconds / 60);
  var s = meditationSeconds % 60;
  display.textContent = m + ':' + (s < 10 ? '0' : '') + s;
}

// ── DAILY DIARY FEATURE ──────────────────────────────────────
var diaryLog = JSON.parse(localStorage.getItem('nn_diary_log') || '[]');

function getDiaryHTML() {
  var html = '<div class="content-card"><h3>📓 Daily Diary</h3><p class="card-sub">Write down your thoughts. Journaling can help clear your mind and track your progress.</p>' +
    '<textarea id="diary-textarea" class="diary-textarea" placeholder="How are you feeling today? What happened?"></textarea>' +
    '<button class="btn-primary btn-purple diary-btn" onclick="saveDiaryEntry()">Save Entry</button></div>';
  
  html += '<div class="content-card"><h3>📅 Past Entries</h3><div id="diary-entries-container" class="diary-entries-container">';
  html += renderDiaryEntriesList();
  html += '</div></div>';
  return html;
}

function renderDiaryEntriesList() {
  if (diaryLog.length === 0) {
    return '<p style="color:var(--text-dim); text-align:center; padding: 20px;">No entries yet. Start writing your first one above.</p>';
  }
  
  // Sort by date descending
  var sortedLog = [...diaryLog].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  var html = '';
  sortedLog.forEach(function(entry) {
    var dateObj = new Date(entry.date);
    var dateStr = dateObj.toLocaleDateString('en', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    var timeStr = dateObj.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    
    html += '<div class="diary-entry-card">' +
      '<div class="diary-entry-header">' +
        '<span class="diary-entry-date">' + dateStr + '</span>' +
        '<span class="diary-entry-time">' + timeStr + '</span>' +
      '</div>' +
      '<div class="diary-entry-text">' + escapeHtml(entry.text).replace(/\n/g, '<br>') + '</div>' +
      '<button class="diary-delete-btn" onclick="deleteDiaryEntry(' + entry.id + ')" title="Delete entry">🗑️</button>' +
    '</div>';
  });
  
  return html;
}

function saveDiaryEntry() {
  var textarea = document.getElementById('diary-textarea');
  if (!textarea) return;
  
  var text = textarea.value.trim();
  if (!text) {
    alert('Please write something before saving.');
    return;
  }
  
  var newEntry = {
    id: Date.now(),
    date: new Date().toISOString(),
    text: text
  };
  
  diaryLog.push(newEntry);
  localStorage.setItem('nn_diary_log', JSON.stringify(diaryLog));
  
  textarea.value = '';
  
  var container = document.getElementById('diary-entries-container');
  if (container) {
    container.innerHTML = renderDiaryEntriesList();
  }
}

function deleteDiaryEntry(id) {
  if (!confirm('Are you sure you want to delete this specific diary entry?')) return;
  
  diaryLog = diaryLog.filter(entry => entry.id !== id);
  localStorage.setItem('nn_diary_log', JSON.stringify(diaryLog));
  
  var container = document.getElementById('diary-entries-container');
  if (container) {
    container.innerHTML = renderDiaryEntriesList();
  }
}

// ── TAB FEATURE INITIALIZATION ───────────────────────────────
function initTabFeature(tabId) {
  switch (tabId) {
    case 'disease-detection': initDiseaseDetection(); break;
    case 'mood-tracker':
      setTimeout(function() { renderMoodGrid(); }, 50);
      break;
  }
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  navigateTo('landing');
  initChatbot();
});

// ── AI CHATBOT ───────────────────────────────────────────────
const CHAT_ENDPOINTS = ['/chat', 'http://localhost:3001/chat'];
var chatHistory = [];

function initChatbot() {
  appendMessage('ai', "Hi there 👋 I'm **NeuralNexus AI**, your personal mental health companion. You can talk to me about anything — how you're feeling, stress, anxiety, or just your day. I'm here to listen. 💙");
}

function appendMessage(role, text) {
  var container = document.getElementById('chatbot-messages');
  if (!container) return;

  var now = new Date();
  var timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

  var msg = document.createElement('div');
  msg.className = 'chat-msg ' + role;

  var icon = role === 'user' ? '👤' : '🧠';

  var formattedText = escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  msg.innerHTML =
    '<div class="chat-msg-icon">' + icon + '</div>' +
    '<div>' +
      '<div class="chat-bubble">' + formattedText + '</div>' +
      '<div class="chat-msg-time">' + timeStr + '</div>' +
    '</div>';

  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  var container = document.getElementById('chatbot-messages');
  if (!container) return;
  var typing = document.createElement('div');
  typing.className = 'chat-msg ai';
  typing.id = 'chat-typing-indicator';
  typing.innerHTML =
    '<div class="chat-msg-icon">🧠</div>' +
    '<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>';
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  var el = document.getElementById('chat-typing-indicator');
  if (el) el.remove();
}

async function sendMessage(message, history) {
  var lastError;

  for (var i = 0; i < CHAT_ENDPOINTS.length; i++) {
    try {
      var response = await fetch(CHAT_ENDPOINTS[i], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          history: history
        })
      });

      var data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      return data.reply;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Unable to reach chat service.');
}

async function sendChatMessage() {
  var input = document.getElementById('chatbot-input');
  var sendBtn = document.getElementById('chatbot-send-btn');
  if (!input) return;

  var message = input.value.trim();
  if (!message) return;

  appendMessage('user', message);
  input.value = '';
  input.style.height = 'auto';

  chatHistory.push({ role: 'user', content: message });

  if (sendBtn) sendBtn.disabled = true;
  showTypingIndicator();

  try {
    var reply = await sendMessage(message, chatHistory.slice(-12));
    removeTypingIndicator();

    if (reply) {
      appendMessage('ai', reply);
      chatHistory.push({ role: 'assistant', content: reply });
    } else {
      appendMessage('ai', 'Sorry, I had trouble understanding that. Could you rephrase?');
    }
  } catch (err) {
    removeTypingIndicator();
    appendMessage('ai', '⚠️ I could not connect to the AI service right now. Please make sure backend server is running on port 3001 and try again.');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }
}

function handleChatKey(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

function autoResizeChatInput(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function clearChatHistory() {
  chatHistory = [];
  var container = document.getElementById('chatbot-messages');
  if (container) container.innerHTML = '';
  appendMessage('ai', "Chat cleared! 🌱 I'm here whenever you're ready to talk. What's on your mind?");
}
