
const state = {
  data: [],
  filtered: [],
  q: '',
  view: 'all',
  filters: { group:'', sub1:'', dosage:'', change:'', hasCondition:false, hasWarning:false, favOnly:false },
  favorites: JSON.parse(localStorage.getItem('nlem-favorites') || '[]'),
  recent: JSON.parse(localStorage.getItem('nlem-recent') || '[]'),
  theme: localStorage.getItem('nlem-theme') || 'dark',
  meta: {}
};

const els = {
  search: document.getElementById('searchInput'),
  suggestions: document.getElementById('suggestions'),
  results: document.getElementById('results'),
  empty: document.getElementById('emptyState'),
  activeChips: document.getElementById('activeChips'),
  resultsInfo: document.getElementById('resultsInfo'),
  statAll: document.getElementById('statAll'),
  statShown: document.getElementById('statShown'),
  statDate: document.getElementById('statDate'),
  recent: document.getElementById('recentSearches'),
  viewMode: document.getElementById('viewMode'),
  groupFilter: document.getElementById('groupFilter'),
  sub1Filter: document.getElementById('sub1Filter'),
  dosageFilter: document.getElementById('dosageFilter'),
  changeFilter: document.getElementById('changeFilter'),
  hasCondition: document.getElementById('hasCondition'),
  hasWarning: document.getElementById('hasWarning'),
  favOnly: document.getElementById('favOnly'),
  clearBtn: document.getElementById('clearBtn'),
  exportBtn: document.getElementById('exportBtn'),
  dialog: document.getElementById('detailDialog'),
  detailTitle: document.getElementById('detailTitle'),
  detailBody: document.getElementById('detailBody'),
  closeDetail: document.getElementById('closeDetail'),
  themeToggle: document.getElementById('themeToggle'),
};

const thaiMap = {'ำ':'า','เเ':'แ'};
const synonyms = {
  'tab':'tablet','tabs':'tablet','ยาเม็ด':'tablet','เม็ด':'tablet',
  'cap':'capsule','caps':'capsule','แคปซูล':'capsule',
  'inj':'injection','ฉีด':'injection','ยาฉีด':'injection',
  'syr':'syrup','น้ำ':'solution','susp':'suspension',
  'old':'บัญชีเดิม','new':'บัญชีใหม่','same':'same','warn':'คำเตือน'
};

function normalize(s=''){
  s = String(s).toLowerCase().trim();
  Object.entries(thaiMap).forEach(([a,b])=>s=s.split(a).join(b));
  s = s.normalize('NFKC').replace(/[^\p{L}\p{N}\s./()-]/gu, ' ');
  Object.entries(synonyms).forEach(([a,b])=>{ s = s.replace(new RegExp(`\\b${escapeRx(a)}\\b`,'g'), b); });
  return s.replace(/\s+/g,' ').trim();
}
function escapeRx(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function levenshtein(a,b){
  if (a===b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = Array.from({length:b.length+1},(_,i)=>[i]);
  for(let j=0;j<=a.length;j++) m[0][j]=j;
  for(let i=1;i<=b.length;i++){
    for(let j=1;j<=a.length;j++){
      m[i][j] = b[i-1]===a[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1,m[i][j-1]+1,m[i-1][j]+1);
    }
  }
  return m[b.length][a.length];
}
function scoreRecord(rec, nq){
  if (!nq) return 1;
  const text = rec._ntext;
  if (text.includes(nq)) return 120 - Math.min(text.indexOf(nq), 60);
  const terms = nq.split(' ').filter(Boolean);
  let score = 0;
  for (const term of terms){
    if (rec._tokens.has(term)) score += 40;
    else if ([...rec._tokens].some(t=>t.startsWith(term))) score += 24;
    else {
      let best = 0;
      for (const t of rec._tokens){
        if (Math.abs(t.length - term.length) > 2) continue;
        const d = levenshtein(term, t);
        if (d <= 2) best = Math.max(best, 14 - d*4);
      }
      score += best;
    }
  }
  return score;
}
function highlight(text, query){
  if (!query) return esc(text || '-');
  let out = esc(text || '-');
  const terms = [...new Set(normalize(query).split(' ').filter(t=>t.length>1))].slice(0,5);
  terms.forEach(t=>{
    const rx = new RegExp(`(${escapeRx(t)})`, 'ig');
    out = out.replace(rx,'<mark>$1</mark>');
  });
  return out;
}
function esc(s){ return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function saveRecent(q){
  if (!q) return;
  state.recent = [q, ...state.recent.filter(x=>x!==q)].slice(0,8);
  localStorage.setItem('nlem-recent', JSON.stringify(state.recent));
}
function toggleFav(id){
  state.favorites = state.favorites.includes(id) ? state.favorites.filter(x=>x!==id) : [...state.favorites, id];
  localStorage.setItem('nlem-favorites', JSON.stringify(state.favorites));
  applyFilters();
}
function buildOptions(){
  const addOpt=(el, items, placeholder)=>{
    el.innerHTML = `<option value="">${placeholder}</option>` + items.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  };
  const uniq=(key)=> [...new Set(state.data.map(x=>x[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));
  addOpt(els.groupFilter, uniq('group_name'),'ทั้งหมด');
  addOpt(els.sub1Filter, uniq('subgroup1_name'),'ทั้งหมด');
  addOpt(els.dosageFilter, uniq('dosage'),'ทั้งหมด');
  addOpt(els.changeFilter, uniq('change_code'),'ทั้งหมด');
}
function applyViewFilter(rec){
  const oldV = !!rec['บัญชีย่อยเดิม'], newV = !!rec['บัญชีย่อยใหม่'];
  if (state.view==='old') return oldV;
  if (state.view==='new') return newV;
  if (state.view==='changed') return rec.change_code && rec.change_code!=='SAME';
  return true;
}
function applyFilters(){
  const nq = normalize(state.q);
  const f = state.filters;
  const results = state.data.filter(rec=>{
    if (!applyViewFilter(rec)) return false;
    if (f.group && rec.group_name !== f.group) return false;
    if (f.sub1 && rec.subgroup1_name !== f.sub1) return false;
    if (f.dosage && rec.dosage !== f.dosage) return false;
    if (f.change && rec.change_code !== f.change) return false;
    if (f.hasCondition && !rec['เงื่อนไข']) return false;
    if (f.hasWarning && !rec['คำเตือน/ข้อควรระวัง']) return false;
    if (f.favOnly && !state.favorites.includes(rec.id)) return false;
    rec._score = scoreRecord(rec, nq);
    return nq ? rec._score > 0 : true;
  }).sort((a,b)=>(b._score||0)-(a._score||0) || a.generic_name.localeCompare(b.generic_name,'th'));
  state.filtered = results;
  render();
}
function render(){
  els.statAll.textContent = state.data.length.toLocaleString();
  els.statShown.textContent = state.filtered.length.toLocaleString();
  els.resultsInfo.textContent = `แสดง ${state.filtered.length.toLocaleString()} รายการ`;
  els.empty.classList.toggle('hidden', state.filtered.length !== 0);
  els.results.innerHTML = state.filtered.map(rec=>{
    const favorite = state.favorites.includes(rec.id);
    const badges = [
      rec['บัญชีย่อยเดิม'] ? `<span class="badge">เดิม: ${esc(rec['บัญชีย่อยเดิม'])}</span>` : '',
      rec['บัญชีย่อยใหม่'] ? `<span class="badge accent">ใหม่: ${esc(rec['บัญชีย่อยใหม่'])}</span>` : '',
      rec.change_code ? `<span class="badge ${rec.change_code!=='SAME'?'warn':''}">${esc(rec.change_code)}</span>` : '',
    ].join('');
    return `<article class="card">
      <h3 class="card-title">${highlight(rec.generic_name, state.q)}</h3>
      <div class="meta">${badges}</div>
      <p>${highlight([rec.dosage, rec.strength_salt].filter(Boolean).join(' • '), state.q)}</p>
      <p style="margin-top:10px">${highlight([rec.group_name, rec.subgroup1_name].filter(Boolean).join(' / '), state.q)}</p>
      <div class="card-actions">
        <button class="icon-btn" data-action="detail" data-id="${rec.id}">ดูรายละเอียด</button>
        <button class="icon-btn" data-action="fav" data-id="${rec.id}">${favorite ? '★ โปรด' : '☆ โปรด'}</button>
      </div>
    </article>`;
  }).join('');
  renderChips();
  renderRecent();
  renderSuggestions();
}
function renderChips(){
  const chips = [];
  if (state.q) chips.push(['ค้นหา', state.q, ()=>{state.q=''; els.search.value=''; applyFilters();}]);
  const map = [['group','หมวดใหญ่'],['sub1','หมวดย่อย 1'],['dosage','รูปแบบยา'],['change','Code']];
  map.forEach(([k,label])=>{ if (state.filters[k]) chips.push([label, state.filters[k], ()=>{state.filters[k]=''; if(k==='group')els.groupFilter.value=''; if(k==='sub1')els.sub1Filter.value=''; if(k==='dosage')els.dosageFilter.value=''; if(k==='change')els.changeFilter.value=''; applyFilters();}]);});
  if (state.filters.hasCondition) chips.push(['มีเงื่อนไข','ใช่', ()=>{state.filters.hasCondition=false; els.hasCondition.checked=false; applyFilters();}]);
  if (state.filters.hasWarning) chips.push(['มีคำเตือน','ใช่', ()=>{state.filters.hasWarning=false; els.hasWarning.checked=false; applyFilters();}]);
  if (state.filters.favOnly) chips.push(['รายการโปรด','ใช่', ()=>{state.filters.favOnly=false; els.favOnly.checked=false; applyFilters();}]);
  els.activeChips.innerHTML = chips.map((c,i)=>`<span class="chip">${esc(c[0])}: ${esc(c[1])} <button data-chip="${i}">×</button></span>`).join('');
  [...els.activeChips.querySelectorAll('[data-chip]')].forEach((btn,i)=>btn.onclick=chips[i][2]);
}
function renderRecent(){
  els.recent.innerHTML = state.recent.map(q=>`<button class="suggestion" data-recent="${esc(q)}">${esc(q)}</button>`).join('');
  els.recent.querySelectorAll('[data-recent]').forEach(btn=>btn.onclick=()=>{ state.q = btn.dataset.recent; els.search.value=state.q; applyFilters(); });
}
function renderSuggestions(){
  const q = normalize(state.q);
  const defaults = ['บัญชีใหม่','บัญชีเดิม','ยาฉีด','tablet','capsule','C4','มีคำเตือน','มีเงื่อนไข'];
  let suggestions = defaults;
  if (q){
    const pool = state.data.flatMap(r=>[r.generic_name, r.dosage, r.change_code, r.group_name]).filter(Boolean);
    suggestions = [...new Set(pool.filter(v=>normalize(v).includes(q)).slice(0,8))];
    if (!suggestions.length) suggestions = defaults.filter(v=>normalize(v).includes(q) || q.includes(normalize(v)));
  }
  els.suggestions.innerHTML = suggestions.slice(0,8).map(s=>`<button class="suggestion" data-suggest="${esc(s)}">${esc(s)}</button>`).join('');
  els.suggestions.querySelectorAll('[data-suggest]').forEach(btn=>btn.onclick=()=>{ state.q=btn.dataset.suggest; els.search.value=state.q; saveRecent(state.q); applyFilters(); });
}
function showDetail(id){
  const rec = state.data.find(x=>x.id===id);
  if (!rec) return;
  els.detailTitle.textContent = rec.generic_name || '-';
  const blocks = [
    ['รูปแบบยา', [rec.dosage, rec.strength_salt].filter(Boolean).join(' • ') || '-'],
    ['หมวดหมู่', [rec.group_name, rec.subgroup1_name, rec.subgroup2_name, rec.subgroup3_name].filter(Boolean).join(' / ') || '-'],
    ['บัญชีเก่า / ใหม่', `เดิม: ${rec['บัญชีย่อยเดิม']||'-'}\nใหม่: ${rec['บัญชีย่อยใหม่']||'-'}`],
    ['Change', [rec.change_code, rec.change_label, rec.change_meaning].filter(Boolean).join(' • ') || '-'],
    ['เงื่อนไข', rec['เงื่อนไข'] || '-'],
    ['คำเตือน/ข้อควรระวัง', rec['คำเตือน/ข้อควรระวัง'] || '-'],
    ['หมายเหตุ', [rec['หมายเหตุ'], rec['อื่นๆ'], rec.change_detail].filter(Boolean).join('\n') || '-'],
    ['ประกาศราชกิจจาฯ', rec['ประกาศราชกิจจาฯ'] || '-']
  ];
  els.detailBody.innerHTML = `<div class="detail-grid">${blocks.map(([h,v])=>`<section class="detail-block"><h4>${esc(h)}</h4><p>${esc(v).replace(/\n/g,'<br>')}</p></section>`).join('')}</div>`;
  els.dialog.showModal();
}
function exportCSV(){
  const headers = ['id','generic_name','dosage','strength_salt','group_name','subgroup1_name','บัญชีย่อยเดิม','บัญชีย่อยใหม่','change_code','เงื่อนไข','คำเตือน/ข้อควรระวัง'];
  const rows = [headers.join(',')].concat(state.filtered.map(r=>headers.map(h=>`"${String(r[h]||'').replace(/"/g,'""')}"`).join(',')));
  const blob = new Blob(["\ufeff"+rows.join('\n')], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nlem_filtered_results.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
function setTheme(theme){
  state.theme = theme;
  document.body.classList.toggle('light', theme==='light');
  localStorage.setItem('nlem-theme', theme);
}
async function init(){
  const [dataRes, metaRes] = await Promise.all([fetch('data/nlem.json'), fetch('data/meta.json')]);
  state.data = await dataRes.json();
  state.meta = await metaRes.json();
  state.data.forEach(rec=>{
    rec._ntext = normalize(rec.search_text || '');
    rec._tokens = new Set(rec._ntext.split(' ').filter(Boolean));
  });
  els.statDate.textContent = state.meta.dataset_version || '-';
  buildOptions();
  setTheme(state.theme);

  els.search.addEventListener('input', e=>{ state.q=e.target.value; applyFilters(); });
  els.search.addEventListener('change', ()=>saveRecent(state.q));
  els.viewMode.querySelectorAll('.seg').forEach(btn=>btn.onclick=()=>{
    els.viewMode.querySelectorAll('.seg').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active'); state.view=btn.dataset.view; applyFilters();
  });
  els.groupFilter.onchange=e=>{state.filters.group=e.target.value; applyFilters();};
  els.sub1Filter.onchange=e=>{state.filters.sub1=e.target.value; applyFilters();};
  els.dosageFilter.onchange=e=>{state.filters.dosage=e.target.value; applyFilters();};
  els.changeFilter.onchange=e=>{state.filters.change=e.target.value; applyFilters();};
  els.hasCondition.onchange=e=>{state.filters.hasCondition=e.target.checked; applyFilters();};
  els.hasWarning.onchange=e=>{state.filters.hasWarning=e.target.checked; applyFilters();};
  els.favOnly.onchange=e=>{state.filters.favOnly=e.target.checked; applyFilters();};
  els.clearBtn.onclick=()=>{ state.q=''; els.search.value=''; state.filters={group:'',sub1:'',dosage:'',change:'',hasCondition:false,hasWarning:false,favOnly:false}; ['groupFilter','sub1Filter','dosageFilter','changeFilter'].forEach(k=>els[k].value=''); ['hasCondition','hasWarning','favOnly'].forEach(k=>els[k].checked=false); state.view='all'; els.viewMode.querySelectorAll('.seg').forEach((x,i)=>x.classList.toggle('active', i===0)); applyFilters(); };
  els.exportBtn.onclick=exportCSV;
  els.closeDetail.onclick=()=>els.dialog.close();
  els.themeToggle.onclick=()=>setTheme(state.theme==='light'?'dark':'light');
  els.results.addEventListener('click', e=>{
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action==='detail') showDetail(btn.dataset.id);
    if (btn.dataset.action==='fav') toggleFav(btn.dataset.id);
  });
  applyFilters();
}
init().catch(err=>{
  console.error(err);
  els.resultsInfo.textContent='ไม่สามารถโหลดข้อมูลได้';
});
