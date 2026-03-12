/* ============================================================
   HealthAI — AI Engine & App Logic
   ============================================================ */

// ── KNOWLEDGE BASE ──────────────────────────────────────────
const DISEASES = [
  {
    id: 'flu', name: 'Influenza (Flu)', icon: '🤧',
    symptoms: ['fever','chills','muscle ache','fatigue','cough','sore throat','headache','runny nose','body pain'],
    risk: 'medium',
    desc: 'A contagious respiratory illness caused by influenza viruses.',
    recommendations: [
      { icon: '🛌', text: '<strong>Rest at home</strong> and avoid contact with others to prevent spreading.' },
      { icon: '💧', text: '<strong>Stay hydrated</strong> — drink water, herbal teas, and warm broths.' },
      { icon: '💊', text: '<strong>Take fever reducers</strong> like paracetamol if temperature is high.' },
      { icon: '👨‍⚕️', text: '<strong>See a doctor</strong> if symptoms worsen or last more than 7 days.' }
    ]
  },
  {
    id: 'covid', name: 'COVID-19', icon: '🦠',
    symptoms: ['fever','cough','shortness of breath','fatigue','loss of taste','loss of smell','sore throat','headache','body pain','chills'],
    risk: 'high',
    desc: 'Infectious disease caused by the SARS-CoV-2 coronavirus.',
    recommendations: [
      { icon: '🏠', text: '<strong>Isolate immediately</strong> — stay home and away from others.' },
      { icon: '🧪', text: '<strong>Get tested</strong> for COVID-19 at your nearest testing center.' },
      { icon: '😷', text: '<strong>Wear a mask</strong> if you must go outside or be around others.' },
      { icon: '👨‍⚕️', text: '<strong>Contact your doctor</strong> about treatment options like antivirals.' }
    ]
  },
  {
    id: 'heart_attack', name: 'Heart Attack', icon: '❤️‍🔥',
    symptoms: ['chest pain','chest tightness','left arm pain','jaw pain','shortness of breath','sweating','nausea','dizziness','back pain'],
    risk: 'high',
    desc: 'Occurs when blood flow to part of the heart is blocked.',
    recommendations: [
      { icon: '🚨', text: '<strong>Call emergency services immediately (112/108)</strong> — this is life-threatening.' },
      { icon: '🛑', text: '<strong>Stop all activity</strong> and sit or lie down in a comfortable position.' },
      { icon: '💊', text: '<strong>Chew aspirin (325mg)</strong> if available and not allergic.' },
      { icon: '🤝', text: '<strong>Do NOT drive yourself</strong> — wait for the ambulance.' }
    ]
  },
  {
    id: 'stroke', name: 'Stroke', icon: '🧠',
    symptoms: ['sudden numbness','slurred speech','face drooping','sudden confusion','severe headache','vision problems','loss of balance','sudden weakness'],
    risk: 'high',
    desc: 'Occurs when blood supply to part of the brain is cut off.',
    recommendations: [
      { icon: '🚨', text: '<strong>Call 112/108 immediately</strong> — every minute matters for stroke.' },
      { icon: '🛑', text: '<strong>Do NOT give food or water</strong> — they may have difficulty swallowing.' },
      { icon: '📝', text: '<strong>Note the time</strong> symptoms started — critical for treatment decisions.' },
      { icon: '🤝', text: '<strong>Stay with the person</strong> and keep them calm until help arrives.' }
    ]
  },
  {
    id: 'hypertension', name: 'Hypertension (High BP)', icon: '🩸',
    symptoms: ['headache','dizziness','blurred vision','chest pain','shortness of breath','nausea','nosebleed','fatigue'],
    risk: 'medium',
    desc: 'A condition where blood pressure in the arteries is persistently elevated.',
    recommendations: [
      { icon: '🥗', text: '<strong>Reduce salt intake</strong> — follow a DASH diet with fruits and vegetables.' },
      { icon: '🏃', text: '<strong>Exercise regularly</strong> — 30 minutes of moderate activity most days.' },
      { icon: '👨‍⚕️', text: '<strong>Visit a doctor</strong> to check your blood pressure and get medication if needed.' },
      { icon: '🧘', text: '<strong>Manage stress</strong> through meditation, yoga, or breathing exercises.' }
    ]
  },
  {
    id: 'diabetes', name: 'Diabetes', icon: '🍬',
    symptoms: ['frequent urination','excessive thirst','fatigue','blurred vision','slow healing wounds','numbness','weight loss','hunger','dizziness'],
    risk: 'medium',
    desc: 'A disease that affects how your body uses blood glucose.',
    recommendations: [
      { icon: '🩸', text: '<strong>Check blood sugar levels</strong> at a clinic or with a home glucometer.' },
      { icon: '🥗', text: '<strong>Avoid sugar and refined carbs</strong> — eat fiber-rich, low-GI foods.' },
      { icon: '👨‍⚕️', text: '<strong>See an endocrinologist</strong> for proper diagnosis and medication management.' },
      { icon: '🏃', text: '<strong>Exercise daily</strong> to improve insulin sensitivity.' }
    ]
  },
  {
    id: 'pneumonia', name: 'Pneumonia', icon: '🫁',
    symptoms: ['cough','fever','shortness of breath','chest pain','fatigue','chills','sweating','confusion','rapid breathing'],
    risk: 'high',
    desc: 'Infection that inflames air sacs in one or both lungs.',
    recommendations: [
      { icon: '👨‍⚕️', text: '<strong>See a doctor immediately</strong> for diagnosis (chest X-ray needed).' },
      { icon: '💊', text: '<strong>Complete antibiotics course</strong> if prescribed — do not stop early.' },
      { icon: '🛌', text: '<strong>Rest and stay warm</strong> — your body needs energy to fight infection.' },
      { icon: '💧', text: '<strong>Drink plenty of fluids</strong> to loosen mucus and stay hydrated.' }
    ]
  },
  {
    id: 'migraine', name: 'Migraine', icon: '😖',
    symptoms: ['severe headache','nausea','vomiting','light sensitivity','sound sensitivity','visual aura','dizziness','fatigue'],
    risk: 'low',
    desc: 'Recurring type of headache that causes moderate to severe pain.',
    recommendations: [
      { icon: '🌑', text: '<strong>Rest in a dark, quiet room</strong> away from light and noise triggers.' },
      { icon: '💊', text: '<strong>Take pain relief early</strong> — ibuprofen or sumatriptan at onset.' },
      { icon: '💧', text: '<strong>Stay hydrated</strong> — dehydration is a common migraine trigger.' },
      { icon: '📔', text: '<strong>Keep a migraine diary</strong> to identify and avoid personal triggers.' }
    ]
  },
  {
    id: 'anemia', name: 'Anemia', icon: '🩸',
    symptoms: ['fatigue','weakness','pale skin','dizziness','shortness of breath','cold hands','cold feet','headache','irregular heartbeat'],
    risk: 'medium',
    desc: 'A condition where you lack enough red blood cells to carry oxygen.',
    recommendations: [
      { icon: '🥩', text: '<strong>Eat iron-rich foods</strong> — red meat, spinach, lentils, and beans.' },
      { icon: '🧪', text: '<strong>Get a blood test (CBC)</strong> to confirm anemia type and severity.' },
      { icon: '💊', text: '<strong>Take iron supplements</strong> as prescribed by your doctor.' },
      { icon: '🍊', text: '<strong>Consume Vitamin C</strong> with meals to improve iron absorption.' }
    ]
  },
  {
    id: 'dengue', name: 'Dengue Fever', icon: '🦟',
    symptoms: ['high fever','severe headache','eye pain','joint pain','muscle pain','rash','nausea','vomiting','fatigue'],
    risk: 'high',
    desc: 'A mosquito-borne viral infection causing severe flu-like illness.',
    recommendations: [
      { icon: '👨‍⚕️', text: '<strong>See a doctor immediately</strong> for blood test (platelet count check).' },
      { icon: '💊', text: '<strong>Only take paracetamol</strong> — avoid NSAIDs like aspirin/ibuprofen.' },
      { icon: '💧', text: '<strong>Drink lots of fluids</strong> — dengue causes dangerous dehydration.' },
      { icon: '🦟', text: '<strong>Use mosquito repellent</strong> and sleep under nets to prevent spreading.' }
    ]
  },
  {
    id: 'asthma', name: 'Asthma Attack', icon: '💨',
    symptoms: ['shortness of breath','wheezing','coughing','chest tightness','rapid breathing','anxiety','difficulty speaking'],
    risk: 'high',
    desc: 'A condition where airways become inflamed and narrow, causing breathing difficulty.',
    recommendations: [
      { icon: '💨', text: '<strong>Use your rescue inhaler</strong> (salbutamol) immediately.' },
      { icon: '🧘', text: '<strong>Sit upright</strong> and practice controlled breathing — slow inhale, slow exhale.' },
      { icon: '🚨', text: '<strong>Call 112 if no improvement</strong> in 15 minutes after inhaler use.' },
      { icon: '🚫', text: '<strong>Remove triggers</strong> — allergens, smoke, cold air, or strong smells.' }
    ]
  },
  {
    id: 'uti', name: 'Urinary Tract Infection', icon: '🚽',
    symptoms: ['frequent urination','burning urination','cloudy urine','strong smelling urine','pelvic pain','blood in urine','fatigue','fever'],
    risk: 'medium',
    desc: 'An infection in any part of your urinary system.',
    recommendations: [
      { icon: '💧', text: '<strong>Drink 8+ glasses of water</strong> daily to flush bacteria.' },
      { icon: '👨‍⚕️', text: '<strong>See a doctor</strong> for urine culture and antibiotics prescription.' },
      { icon: '🧴', text: '<strong>Avoid irritants</strong> — caffeine, alcohol, and citrus drinks temporarily.' },
      { icon: '🍒', text: '<strong>Drink cranberry juice</strong> (unsweetened) to help prevent bacterial adhesion.' }
    ]
  },
  {
    id: 'malaria', name: 'Malaria', icon: '🦟',
    symptoms: ['high fever','chills','sweating','headache','nausea','vomiting','muscle pain','fatigue','diarrhea'],
    risk: 'high',
    desc: 'A life-threatening disease spread through infected mosquito bites.',
    recommendations: [
      { icon: '🧪', text: '<strong>Get a malaria blood test (RDT)</strong> immediately — do not delay.' },
      { icon: '👨‍⚕️', text: '<strong>Seek medical care urgently</strong> — antimalarial drugs must be prescribed.' },
      { icon: '💊', text: '<strong>Do not self-medicate</strong> — treatment depends on the malaria species.' },
      { icon: '🛌', text: '<strong>Rest and hydrate</strong> — fever and sweating cause significant fluid loss.' }
    ]
  },
  {
    id: 'appendicitis', name: 'Appendicitis', icon: '⚠️',
    symptoms: ['abdominal pain','nausea','vomiting','fever','loss of appetite','abdominal swelling','diarrhea','painful urination'],
    risk: 'high',
    desc: 'Inflammation of the appendix — a medical emergency if untreated.',
    recommendations: [
      { icon: '🚨', text: '<strong>Go to the ER immediately</strong> — appendicitis can be life-threatening if it ruptures.' },
      { icon: '🚫', text: '<strong>Do not eat or drink</strong> anything until evaluated by a doctor.' },
      { icon: '🚫', text: '<strong>Do not take laxatives or antacids</strong> — this can worsen the condition.' },
      { icon: '🏥', text: '<strong>Surgery (appendectomy)</strong> is often required — do not delay treatment.' }
    ]
  },
  {
    id: 'anxiety', name: 'Anxiety Disorder', icon: '😰',
    symptoms: ['rapid heartbeat','sweating','trembling','shortness of breath','dizziness','nausea','chest pain','fatigue','sleep problems','difficulty concentrating'],
    risk: 'low',
    desc: 'A mental health condition characterized by persistent worry or fear.',
    recommendations: [
      { icon: '🧘', text: '<strong>Practice deep breathing</strong> — inhale 4 counts, hold 4, exhale 6 counts.' },
      { icon: '👨‍⚕️', text: '<strong>See a mental health professional</strong> — therapy (CBT) is very effective.' },
      { icon: '🏃', text: '<strong>Exercise regularly</strong> — physical activity reduces anxiety hormones.' },
      { icon: '📵', text: '<strong>Limit caffeine and social media</strong> — both can amplify anxiety symptoms.' }
    ]
  }
];

// ── EMERGENCY PATTERNS ──────────────────────────────────────
const EMERGENCY_PATTERNS = [
  {
    name: 'Possible Heart Attack',
    keywords: ['chest pain', 'chest tightness', 'left arm pain', 'jaw pain'],
    requiredAny: ['chest pain', 'chest tightness'],
    co_symptoms: ['shortness of breath', 'sweating', 'left arm pain', 'jaw pain', 'nausea', 'back pain']
  },
  {
    name: 'Possible Stroke',
    keywords: ['face drooping', 'sudden numbness', 'slurred speech', 'sudden weakness', 'sudden confusion', 'severe headache', 'vision problems', 'loss of balance'],
    requiredAny: ['face drooping', 'slurred speech', 'sudden numbness', 'sudden weakness']
  }
];

// ── QUICK SUGGESTIONS ───────────────────────────────────────
const QUICK_SYMPTOMS = [
  'fever', 'headache', 'cough', 'fatigue', 'chest pain',
  'shortness of breath', 'nausea', 'dizziness', 'sore throat', 'body pain'
];

// ── ALL KNOWN SYMPTOMS for autocomplete ─────────────────────
const ALL_SYMPTOMS = [...new Set(DISEASES.flatMap(d => d.symptoms))].sort();

// ── STATE ────────────────────────────────────────────────────
let selectedSymptoms = new Set();

// ── DOM HELPERS ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderQuickChips();
  initInput();
  renderMoodQuestions();
});

// ── TAB / PANEL NAVIGATION ───────────────────────────────────
function activateTab(tabName) {
  const mainApp = document.getElementById('main-panels');
  // Hide all panels
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  // Show the right panel
  const panel = document.getElementById('panel-' + tabName);
  if (panel) panel.classList.add('active');
  // Show the main-app container
  mainApp.classList.add('active');
  // Scroll to panels
  mainApp.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closePanel() {
  const mainApp = document.getElementById('main-panels');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  mainApp.classList.remove('active');
  // Scroll back to feature cards
  document.querySelector('.feature-cards-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}


function renderQuickChips() {
  const wrap = $('quick-chips');
  wrap.innerHTML = QUICK_SYMPTOMS.map(s =>
    `<span class="qs-chip" onclick="addSymptom('${s}')">${s}</span>`
  ).join('');
}

// ── SYMPTOM INPUT ────────────────────────────────────────────
function initInput() {
  const input = $('symptom-input');
  const suggestions = $('suggestions');

  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    if (val.length < 1) { suggestions.classList.add('hidden'); return; }
    const matches = ALL_SYMPTOMS.filter(s => s.includes(val) && !selectedSymptoms.has(s)).slice(0, 6);
    if (matches.length === 0) { suggestions.classList.add('hidden'); return; }
    suggestions.innerHTML = matches.map(m =>
      `<div class="suggestion-item" onclick="addSymptom('${m}')">${highlight(m, val)}</div>`
    ).join('');
    suggestions.classList.remove('hidden');
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { addSymptomFromInput(); }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.input-wrapper')) suggestions.classList.add('hidden');
  });
}

function highlight(str, query) {
  return str.replace(new RegExp(`(${query})`, 'gi'), '<mark style="background:rgba(0,212,170,0.3);color:#00d4aa;border-radius:3px">$1</mark>');
}

function addSymptomFromInput() {
  const input = $('symptom-input');
  const val = input.value.trim().toLowerCase();
  if (val) { addSymptom(val); input.value = ''; }
}

function addSymptom(symptom) {
  symptom = symptom.trim().toLowerCase();
  if (!symptom || selectedSymptoms.has(symptom)) return;
  selectedSymptoms.add(symptom);
  renderTags();
  $('symptom-input').value = '';
  $('suggestions').classList.add('hidden');
  updateAnalyzeBtn();
}

function removeSymptom(symptom) {
  selectedSymptoms.delete(symptom);
  renderTags();
  updateAnalyzeBtn();
}

function renderTags() {
  const wrap = $('symptom-tags');
  if (selectedSymptoms.size === 0) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = [...selectedSymptoms].map(s =>
    `<div class="tag">
      <span>💊 ${s}</span>
      <span class="remove" onclick="removeSymptom('${s}')">✕</span>
    </div>`
  ).join('');
}

function updateAnalyzeBtn() {
  $('analyze-btn').disabled = selectedSymptoms.size === 0;
}

// ── AI ENGINE ────────────────────────────────────────────────
function analyzeSymptoms() {
  const symptoms = [...selectedSymptoms];

  // 1. Check for emergency
  const emergency = detectEmergency(symptoms);
  if (emergency) {
    showEmergency(emergency);
  }

  // 2. Score each disease
  const scored = DISEASES.map(d => {
    const matched = d.symptoms.filter(s =>
      symptoms.some(sym => s.includes(sym) || sym.includes(s))
    );
    const confidence = Math.min(100, Math.round((matched.length / Math.max(symptoms.length, d.symptoms.length * 0.4)) * 100));
    return { ...d, matched, confidence };
  })
  .filter(d => d.confidence > 0)
  .sort((a, b) => b.confidence - a.confidence)
  .slice(0, 5);

  if (scored.length === 0) {
    showNoResults();
    return;
  }

  // 3. Compute overall risk
  const overallRisk = computeOverallRisk(scored);

  // 4. Render results
  renderResults(scored, overallRisk);
}

function detectEmergency(symptoms) {
  for (const pattern of EMERGENCY_PATTERNS) {
    const hasRequired = pattern.requiredAny.some(req =>
      symptoms.some(s => s.includes(req) || req.includes(s))
    );
    if (!hasRequired) continue;
    const matchedKeywords = pattern.keywords.filter(k =>
      symptoms.some(s => s.includes(k) || k.includes(s))
    );
    if (matchedKeywords.length >= 2) {
      return { name: pattern.name, matched: matchedKeywords };
    }
  }
  return null;
}

function computeOverallRisk(scored) {
  const top3 = scored.slice(0, 3);
  const hasHigh = top3.some(d => d.risk === 'high' && d.confidence > 30);
  const hasMedium = top3.some(d => d.risk === 'medium' && d.confidence > 40);
  if (hasHigh) return 'high';
  if (hasMedium) return 'medium';
  return 'low';
}

// ── RENDER RESULTS ───────────────────────────────────────────
function renderResults(scored, overallRisk) {
  const section = $('results-section');
  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  renderRisk(overallRisk);
  renderConditions(scored);
  renderRecommendations(scored);
  renderHospitals(overallRisk);
}

function renderRisk(risk) {
  const labels = {
    low:    { text: '🟢 LOW RISK',    desc: 'Your symptoms suggest a mild condition. Monitor and rest.', fill: '30%' },
    medium: { text: '🟡 MEDIUM RISK', desc: 'These symptoms need attention. Consult a doctor soon.',    fill: '60%' },
    high:   { text: '🔴 HIGH RISK',   desc: 'Urgent attention required. Please see a doctor immediately.', fill: '90%' }
  };
  const r = labels[risk];
  const badge = $('risk-badge');
  badge.textContent = r.text;
  badge.className = `risk-badge ${risk}`;
  $('risk-desc').textContent = r.desc;
  const fill = $('risk-fill');
  fill.className = `risk-fill ${risk}`;
  setTimeout(() => { fill.style.width = r.fill; }, 100);
}

function renderConditions(scored) {
  $('conditions-list').innerHTML = scored.map(d => `
    <div class="condition-item">
      <div class="cond-icon">${d.icon}</div>
      <div class="cond-info">
        <div class="cond-name">${d.name}</div>
        <div class="cond-matches">Matched: ${d.matched.join(', ') || 'general symptoms'}</div>
      </div>
      <div class="cond-bar-wrap">
        <div class="cond-confidence">${d.confidence}% match</div>
        <div class="cond-bar"><div class="cond-fill" style="width:${d.confidence}%"></div></div>
      </div>
      <span class="cond-risk-badge ${d.risk}">${d.risk}</span>
    </div>
  `).join('');
}

function renderRecommendations(scored) {
  // Merge unique recommendations from top 1-2 diseases + general
  const topDiseases = scored.slice(0, 2);
  const recs = [];
  topDiseases.forEach(d => recs.push(...d.recommendations));

  // Add general recs
  recs.push({ icon: '📍', text: '<strong>Visit the nearest hospital</strong> listed below for a proper evaluation.' });
  recs.push({ icon: '📵', text: '<strong>Avoid self-medicating</strong> without a doctor\'s guidance.' });

  const unique = recs.slice(0, 6);
  $('recommendations-list').innerHTML = unique.map(r =>
    `<div class="rec-item"><div class="rec-icon">${r.icon}</div><div class="rec-text">${r.text}</div></div>`
  ).join('');
}

const HOSPITALS = [
  { name: 'City General Hospital', specialty: 'Multi-Specialty', rating: '⭐ 4.7', dist: '1.2 km', lat: 28.6139, lng: 77.2090 },
  { name: 'Apollo Clinic', specialty: 'Primary Care & Emergency', rating: '⭐ 4.8', dist: '2.0 km', lat: 28.6200, lng: 77.2150 },
  { name: 'Max Super Speciality', specialty: 'Cardiac & Neurology', rating: '⭐ 4.9', dist: '3.5 km', lat: 28.6250, lng: 77.2000 },
  { name: 'Fortis Healthcare', specialty: 'Internal Medicine', rating: '⭐ 4.6', dist: '4.1 km', lat: 28.6100, lng: 77.2200 },
  { name: '24×7 MedCentre', specialty: 'Urgent Care', rating: '⭐ 4.5', dist: '0.8 km', lat: 28.6080, lng: 77.2050 }
];

function renderHospitals() {
  $('hospitals-grid').innerHTML = HOSPITALS.map(h => `
    <div class="hospital-card">
      <div class="hosp-name">🏥 ${h.name}</div>
      <div class="hosp-specialty">${h.specialty}</div>
      <div class="hosp-meta">
        <span>${h.rating}</span>
        <span>📍 ${h.dist}</span>
      </div>
      <a class="btn-directions" href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}" target="_blank" rel="noopener">
        🗺️ Get Directions
      </a>
    </div>
  `).join('');
}

function showNoResults() {
  const section = $('results-section');
  section.classList.remove('hidden');
  $('conditions-list').innerHTML = `
    <div style="text-align:center;padding:40px;color:var(--text-dim)">
      <div style="font-size:3rem;margin-bottom:16px">🤔</div>
      <p>No specific conditions matched. Please try adding more specific symptoms.</p>
    </div>`;
}

// ── EMERGENCY MODAL ──────────────────────────────────────────
function showEmergency(emergency) {
  $('em-condition-text').innerHTML = `
    ⚡ ${emergency.name}<br>
    <small style="font-weight:400;opacity:0.8">Symptoms detected: ${emergency.matched.join(', ')}</small>
  `;
  $('emergency-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeEmergency() {
  $('emergency-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── DEPRESSION ANALYSIS ENGINE ────────────────────────────────

const MOOD_QUESTIONS = [
  {
    id: 'interest',
    text: 'Over the last two weeks, how often have you had little interest or pleasure in doing things?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
  },
  {
    id: 'hopeless',
    text: 'How often have you felt down, depressed, or hopeless?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
  },
  {
    id: 'energy',
    text: 'How often have you felt tired or had little energy?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
  },
  {
    id: 'concentration',
    text: 'Have you had trouble concentrating on things, such as reading or working?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
  },
  {
    id: 'anxiety',
    text: 'Have you been feeling nervous, anxious, or on edge?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
  },
  {
    id: 'appetite',
    text: 'Have you noticed changes in your appetite (eating too much or too little)?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
  }
];

// State for depression form
let moodAnswers = {}; // { questionId: score 0-3 }
let selectedSleep = null;

function renderMoodQuestions() {
  const container = $('mood-questions');
  if (!container) return;
  container.innerHTML = MOOD_QUESTIONS.map(q => `
    <div class="mood-q" id="mq-${q.id}">
      <div class="mood-q-text">${q.text}</div>
      <div class="mood-options">
        ${q.options.map((opt, idx) => `
          <button class="mood-opt" data-qid="${q.id}" data-score="${idx}" onclick="selectMoodOpt(this, '${q.id}', ${idx})">
            ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function selectMoodOpt(btn, questionId, score) {
  // Deselect siblings
  btn.closest('.mood-options').querySelectorAll('.mood-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  moodAnswers[questionId] = score;
}

function selectSleep(btn) {
  document.querySelectorAll('.sleep-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedSleep = btn.dataset.val;
}

function updateStressLabel(val) {
  const label = $('stress-value-label');
  if (label) label.textContent = val + ' / 10';
}

function analyzeDepression() {
  // Compute mood score (0–18 from 6 questions × 0–3)
  const moodScore = Object.values(moodAnswers).reduce((sum, v) => sum + v, 0);
  const answeredCount = Object.keys(moodAnswers).length;

  const stressVal = parseInt(($('stress-slider') || { value: '5' }).value, 10);

  // Sleep modifier: poor sleep worsens score
  const sleepModifier = {
    less4: 6, '4to6': 3, '6to8': 0, more8: 1
  }[selectedSleep] ?? 2;

  // Total score (0 ~ 34): mood (0-18) + stress (0-10) + sleep (0-6)
  const total = moodScore + stressVal + sleepModifier;

  let level, badgeText, desc, fillPct;
  if (total <= 10) {
    level = 'low'; badgeText = '💚 WELLNESS'; desc = 'Your mood and stress indicators look healthy. Keep up your positive habits!'; fillPct = '20%';
  } else if (total <= 21) {
    level = 'medium'; badgeText = '🟡 MODERATE CONCERN'; desc = 'Some signs of stress or low mood detected. Consider self-care strategies and reach out to someone you trust.'; fillPct = '55%';
  } else {
    level = 'high'; badgeText = '🔴 HIGH CONCERN'; desc = 'Your responses suggest significant distress. Please speak with a mental health professional soon.'; fillPct = '90%';
  }

  // Tailored suggestions
  const suggestions = buildMentalSuggestions(level, stressVal, selectedSleep, answeredCount);

  // Render
  const resultsSection = $('depression-results');
  resultsSection.classList.remove('hidden');

  const badge = $('mental-badge');
  badge.textContent = badgeText;
  badge.className = `risk-badge ${level}`;
  $('mental-desc').textContent = desc;
  const fill = $('mental-fill');
  fill.className = `risk-fill ${level}`;
  setTimeout(() => { fill.style.width = fillPct; }, 100);

  $('mental-suggestions').innerHTML = suggestions.map(s =>
    `<div class="rec-item"><div class="rec-icon">${s.icon}</div><div class="rec-text">${s.text}</div></div>`
  ).join('');

  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildMentalSuggestions(level, stress, sleep, answeredCount) {
  const recs = [];

  if (level === 'high') {
    recs.push({ icon: '👨‍⚕️', text: '<strong>Seek professional help</strong> — talk to a licensed therapist or psychiatrist as soon as possible.' });
    recs.push({ icon: '📞', text: '<strong>Crisis helpline</strong> — iCall: 9152987821 · Vandrevala Foundation: 1860-2662-345 (24×7).' });
  }
  if (level === 'medium' || level === 'high') {
    recs.push({ icon: '🧘', text: '<strong>Practice mindfulness</strong> — even 10 minutes of guided meditation daily can reduce cortisol levels significantly.' });
    recs.push({ icon: '📓', text: '<strong>Journal your feelings</strong> — writing helps process emotions and identify patterns in your mood.' });
  }
  if (stress >= 7) {
    recs.push({ icon: '🏃', text: '<strong>Exercise regularly</strong> — 30 minutes of cardio releases endorphins and reduces anxiety hormones.' });
    recs.push({ icon: '🌿', text: '<strong>Limit stimulants</strong> — reduce caffeine and news consumption, especially after 6 PM.' });
  }
  if (sleep === 'less4' || sleep === '4to6') {
    recs.push({ icon: '😴', text: '<strong>Improve sleep hygiene</strong> — maintain a consistent schedule, dim lights an hour before bed, and avoid screens.' });
    recs.push({ icon: '🌡️', text: '<strong>Cool your room</strong> — 65–68°F (18–20°C) is the optimal temperature for deep sleep.' });
  }
  recs.push({ icon: '🤝', text: '<strong>Social connection</strong> — spend quality time with supportive friends or family, even a short call helps.' });
  if (answeredCount < MOOD_QUESTIONS.length) {
    recs.push({ icon: '✏️', text: '<strong>Complete all questions</strong> for a more accurate assessment next time.' });
  }
  if (level === 'low') {
    recs.push({ icon: '🌟', text: '<strong>Maintain your wellbeing</strong> — continue with your positive routines and regular check-ins on your mental health.' });
  }
  return recs.slice(0, 6);
}
