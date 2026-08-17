const elements = {
  list: document.querySelector('#documentList'), search: document.querySelector('#searchInput'),
  title: document.querySelector('#titleInput'), content: document.querySelector('#contentInput'),
  breadcrumb: document.querySelector('#breadcrumbTitle'), updated: document.querySelector('#updatedAt'),
  words: document.querySelector('#wordCount'), saveState: document.querySelector('#saveState'),
  messages: document.querySelector('#messages'), question: document.querySelector('#questionInput'),
  toast: document.querySelector('#toast')
};
let documents = [];
let activeId = null;
let saveTimer;

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));
const relativeDate = (date) => {
  const minutes = Math.floor((Date.now() - new Date(date)) / 60000);
  if (minutes < 1) return '刚刚'; if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  return new Date(date).toLocaleDateString('zh-CN', { month:'short', day:'numeric' });
};
function notify(message) { elements.toast.textContent = message; elements.toast.classList.add('show'); setTimeout(() => elements.toast.classList.remove('show'), 1800); }

function renderList() {
  const query = elements.search.value.trim().toLowerCase();
  const visible = documents.filter((doc) => `${doc.title} ${doc.content}`.toLowerCase().includes(query));
  elements.list.innerHTML = visible.length ? visible.map((doc) => `
    <button class="document-item ${doc.id === activeId ? 'active' : ''}" data-id="${escapeHtml(doc.id)}">
      <strong>${escapeHtml(doc.title || '无标题文档')}</strong><time>${relativeDate(doc.updatedAt)}</time>
      <p>${escapeHtml(doc.content.replace(/[#*`>\n]/g, ' ').trim() || '暂无内容')}</p>
    </button>`).join('') : '<p style="color:#999;font-size:12px;text-align:center;margin-top:35px">没有找到文档</p>';
  document.querySelectorAll('.document-item').forEach((button) => button.addEventListener('click', () => selectDocument(button.dataset.id)));
}
function selectDocument(id) {
  const doc = documents.find((item) => item.id === id); if (!doc) return;
  activeId = id; elements.title.value = doc.title; elements.content.value = doc.content;
  elements.breadcrumb.textContent = doc.title || '无标题文档'; elements.updated.textContent = `${relativeDate(doc.updatedAt)}更新`;
  updateWordCount(); renderList();
}
function updateWordCount() { elements.words.textContent = `${elements.content.value.replace(/\s/g, '').length} 字`; }
async function saveActive() {
  if (!activeId) return;
  elements.saveState.textContent = '正在保存…';
  const saved = await window.vaultAPI.saveDocument({ id:activeId, title:elements.title.value.trim() || '无标题文档', content:elements.content.value });
  const index = documents.findIndex((item) => item.id === activeId); documents[index] = saved;
  elements.breadcrumb.textContent = saved.title; elements.updated.textContent = '刚刚更新'; elements.saveState.textContent = '已保存到本地'; renderList();
}
function scheduleSave() { clearTimeout(saveTimer); elements.saveState.textContent = '有未保存的更改'; saveTimer = setTimeout(saveActive, 500); }
async function createDocument() {
  const saved = await window.vaultAPI.saveDocument({ title:'无标题文档', content:'' });
  documents.unshift(saved); selectDocument(saved.id); elements.title.focus(); elements.title.select(); notify('已创建新文档');
}
function tokenize(text) { return text.toLowerCase().replace(/[，。！？、；：,.!?;:\n#*`()]/g, ' ').split(/\s+/).flatMap((word) => word.length > 2 ? [word, ...Array.from(word)] : [word]).filter(Boolean); }
function answerQuestion(question) {
  if (!documents.length) return { text:'知识库还是空的。请先创建或导入一些文档。' };
  const terms = [...new Set(tokenize(question))];
  const ranked = documents.map((doc) => {
    const haystack = `${doc.title} ${doc.title} ${doc.content}`.toLowerCase();
    const score = terms.reduce((sum, term) => sum + (haystack.split(term).length - 1) * (term.length > 1 ? 3 : 1), 0);
    return { doc, score };
  }).sort((a,b) => b.score - a.score);
  const match = ranked[0];
  if (!match || match.score === 0) return { text:'我暂时没有在本地知识库中找到与这个问题直接相关的内容。可以换一种说法，或先补充相关文档。' };
  const clean = match.doc.content.replace(/^#+\s*/gm, '').trim();
  const sentences = clean.split(/(?<=[。！？.!?])|\n+/).filter(Boolean);
  const best = sentences.map((sentence) => ({ sentence, score:terms.reduce((sum, term) => sum + (sentence.toLowerCase().includes(term) ? term.length : 0), 0) })).sort((a,b) => b.score-a.score).slice(0,3).map((item) => item.sentence.trim()).join(' ');
  return { text:best.slice(0,500) || clean.slice(0,500), source:match.doc.title };
}
function addMessage(text, role, source) {
  const wrap = document.createElement('div'); wrap.className = `message ${role}-message`;
  wrap.innerHTML = role === 'user' ? `<p>${escapeHtml(text)}</p>` : `<div class="avatar">L</div><div><p>${escapeHtml(text)}</p>${source ? `<span class="source">参考 · ${escapeHtml(source)}</span>` : ''}</div>`;
  elements.messages.appendChild(wrap); elements.messages.scrollTop = elements.messages.scrollHeight;
}
async function init() {
  documents = await window.vaultAPI.listDocuments();
  document.querySelector('#dataPath').textContent = await window.vaultAPI.getDataPath();
  if (documents[0]) selectDocument(documents[0].id); else createDocument();
}
elements.search.addEventListener('input', renderList);
elements.title.addEventListener('input', scheduleSave);
elements.content.addEventListener('input', () => { updateWordCount(); scheduleSave(); });
document.querySelector('#newButton').addEventListener('click', createDocument);
document.querySelector('#settingsButton').addEventListener('click', () => window.vaultAPI.openDataPath());
document.querySelector('#importButton').addEventListener('click', async () => { const imported = await window.vaultAPI.importDocuments(); if (imported.length) { documents = [...imported, ...documents]; selectDocument(imported[0].id); notify(`已导入 ${imported.length} 篇文档`); } });
document.querySelector('#deleteButton').addEventListener('click', async () => { if (!activeId || !confirm('确定删除当前文档吗？此操作无法撤销。')) return; await window.vaultAPI.deleteDocument(activeId); documents = documents.filter((doc) => doc.id !== activeId); activeId = null; if (documents[0]) selectDocument(documents[0].id); else createDocument(); notify('文档已删除'); });
document.querySelector('#clearChat').addEventListener('click', () => { document.querySelectorAll('.messages .message, .messages .suggestions').forEach((node) => node.remove()); addMessage('对话已清空。有什么想了解的？', 'assistant'); });
document.querySelector('#chatForm').addEventListener('submit', (event) => { event.preventDefault(); const question = elements.question.value.trim(); if (!question) return; addMessage(question, 'user'); elements.question.value = ''; setTimeout(() => { const answer = answerQuestion(question); addMessage(answer.text, 'assistant', answer.source); }, 260); });
document.querySelectorAll('.suggestions button').forEach((button) => button.addEventListener('click', () => { elements.question.value = button.textContent; document.querySelector('#chatForm').requestSubmit(); }));
document.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); elements.search.focus(); } });
init();
