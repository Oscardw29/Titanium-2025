const STORAGE_KEY = 'tasks';
function loadTasks(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }catch(e){ return {}; } }
function saveTasks(obj){ localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); }

function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
    });
}

function buildList(){
    const all = loadTasks();
    const listEl = document.getElementById('list');
    listEl.innerHTML = '';
    // flatten into array of {date, text, done, status, index}
    const rows = [];
    Object.keys(all).sort().forEach(dateKey=>{
    (all[dateKey]||[]).forEach((t, idx)=> rows.push({ date: dateKey, text: t.text, done: !!t.done, status: t.status || (t.done? 'completado':'pendiente'), index: idx }));
    });

    if(rows.length === 0){ listEl.innerHTML = '<div class="muted">No hay tareas guardadas.</div>'; return; }

    rows.forEach((r, globalIndex)=>{
    const row = document.createElement('div');
    row.className = 'task-row';
    // marcar estado en data-attribute para estilos
    row.setAttribute('data-status', r.status);
    if(r.status === 'completado') row.classList.add('completed');
    
    // Check if task is expired or due today
    const [year, month, day] = r.date.split('-');
    const taskDate = new Date(year, month - 1, day);
    taskDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (taskDate < today && r.status !== 'completado') {
        row.classList.add('expired');
    } else if (taskDate.getTime() === today.getTime() && r.status !== 'completado') {
        row.classList.add('due-today');
    }
    const date = document.createElement('div'); date.className='task-date'; date.textContent = formatDate(r.date);
    const text = document.createElement('div'); text.className='task-text'; text.textContent = r.text;
    const status = document.createElement('div');
    const pill = document.createElement('span');
    pill.className = 'status-pill ' + (r.status === 'completado' ? 'status-completado' : r.status === 'en proceso' ? 'status-proceso' : 'status-pendiente');
    pill.textContent = r.status === 'completado' ? 'Completado' : (r.status === 'en proceso' ? 'En proceso' : 'Pendiente');
    status.appendChild(pill);

const actions = document.createElement('div'); actions.className='actions';
    // three-state changer
    const sel = document.createElement('select');
    const opts = [['pendiente','Pendiente'],['en proceso','En proceso'],['completado','Completado']];
    opts.forEach(o=>{ const op = document.createElement('option'); op.value=o[0]; op.textContent=o[1]; if(o[0]===r.status) op.selected=true; sel.appendChild(op); });
    sel.addEventListener('change', ()=>{
        const data = loadTasks();
        const bucket = data[r.date];
        if(bucket && bucket[r.index]){
        bucket[r.index].status = sel.value;
        bucket[r.index].done = sel.value === 'completado';
        saveTasks(data);
        buildList();
        }
    });
    const del = document.createElement('button'); del.textContent='Eliminar'; del.addEventListener('click', ()=>{
        const data = loadTasks();
        const taskText = r.text;
        
        // Eliminar la tarea
        if (!data[r.date]) return;
        data[r.date].splice(r.index,1);
        if(data[r.date].length===0) delete data[r.date];
        saveTasks(data);
        
        // Eliminar el recordatorio correspondiente si existe
        const taskUniqueId = `${r.date}-${r.index}-${taskText.substring(0, 20)}`;
        let reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        reminders = reminders.filter(rem => rem.taskId !== taskUniqueId);
        localStorage.setItem('reminders', JSON.stringify(reminders));
        
        if (typeof showNotification === 'function') {
            showNotification('Eliminado', 'La tarea fue eliminada.', { duration: 2200 });
        }
        
        buildList();
    });

actions.appendChild(sel);
    actions.appendChild(del);

    row.appendChild(date);
    row.appendChild(text);
    row.appendChild(status);
    row.appendChild(actions);

    listEl.appendChild(row);
    });
}

document.getElementById('backBtn').addEventListener('click', ()=>{ 
    window.location.href = 'agenda.html';
});

// Obtener la fecha del parámetro URL si existe
const urlParams = new URLSearchParams(window.location.search);
const dateParam = urlParams.get('date');

if (dateParam) {
    const tasks = loadTasks();
    if (!tasks[dateParam]) {
    tasks[dateParam] = [];
    saveTasks(tasks);
    }
    document.querySelector('h1').textContent = `Tareas para ${formatDate(dateParam)}`;
}

buildList();
