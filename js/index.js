const calendar = document.getElementById('calendar');
const monthYear = document.getElementById('monthYear');
const selectedDate = document.getElementById('selectedDate');
const tasksContainer = document.getElementById('tasks');
const newTaskInput = document.getElementById('newTask');

let currentDate = new Date();
let selectedDay = new Date();
let tasks = JSON.parse(localStorage.getItem('tasks')) || {};

function renderCalendar() {
    calendar.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    monthYear.textContent = `${firstDay.toLocaleString('es-ES', { month: 'long' })} ${year}`;

    for (let i = 1; i <= lastDay.getDate(); i++) {
const day = document.createElement('div');
// no añadimos animaciones al calendario (no usar 'fadeIn' aquí)
day.classList.add('day');
    day.textContent = i;

    const dateKey = `${year}-${month + 1}-${i}`;
    const dayCount = tasks[dateKey] ? tasks[dateKey].length : 0;
    if (dayCount > 0) {
        day.style.background = '#e0f2fe';
        const badge = document.createElement('div');
        badge.className = 'day-badge';
        badge.textContent = dayCount;
        day.appendChild(badge);
    }

    const today = new Date();
    const isToday = today.toDateString() === new Date(year, month, i).toDateString();
    const isSelected = selectedDay.toDateString() === new Date(year, month, i).toDateString();

    if (isToday) day.classList.add('today');
    if (isSelected) day.classList.add('selected');

    day.addEventListener('click', () => {
        document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
        day.classList.add('selected');
        selectedDay = new Date(year, month, i);
        showTasks();
    });

    calendar.appendChild(day);
    }
}

function showTasks() {
    const key = `${selectedDay.getFullYear()}-${selectedDay.getMonth() + 1}-${selectedDay.getDate()}`;
    selectedDate.textContent = `Tareas para ${selectedDay.toLocaleDateString('es-ES')}`;
    tasksContainer.innerHTML = '';

    if (tasks[key]) {
    // Check if selected day is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDayNormalized = new Date(selectedDay);
    selectedDayNormalized.setHours(0, 0, 0, 0);
    const isExpired = selectedDayNormalized < today;

    tasks[key].forEach((t, index) => {
        const div = document.createElement('div');
        div.className = 'task-item fadeIn';
        if (isExpired && !t.done) {
            div.classList.add('expired');
        }
        div.innerHTML = `<span class="${t.done ? 'completed' : ''}">${t.text}</span>
                        <div>
                            <button class="task-btn check" onclick="toggleTask('${key}', ${index})" title="Marcar como hecha">✔</button>
                            <button class="task-btn delete" onclick="deleteTask('${key}', ${index})" title="Eliminar tarea">🗑️</button>
                        </div>`;
        tasksContainer.appendChild(div);
    });
    }
}

document.getElementById('addTaskBtn').addEventListener('click', () => {
    const text = newTaskInput.value.trim();
    if (text === '') return;
    // Validar que la fecha seleccionada no sea pasada (solo fecha, sin hora)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const selectedStart = new Date(selectedDay);
    selectedStart.setHours(0, 0, 0, 0);
    if (selectedStart < todayStart) {
        if (typeof showNotification === 'function') {
            showNotification('Fecha inválida', 'No puedes agregar tareas en fechas pasadas.', { duration: 3000 });
        }
        return;
    }
    const key = `${selectedDay.getFullYear()}-${selectedDay.getMonth() + 1}-${selectedDay.getDate()}`;
    if (!tasks[key]) tasks[key] = [];
    
    // Crear la tarea
    const newTask = { text, done: false, status: 'pendiente' };
    tasks[key].push(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    newTaskInput.value = '';
    showTasks();
    renderCalendar();
});

function toggleTask(date, index) {
    tasks[date][index].done = !tasks[date][index].done;
    // sync status with done flag
    tasks[date][index].status = tasks[date][index].done ? 'completado' : (tasks[date][index].status || 'pendiente');
    localStorage.setItem('tasks', JSON.stringify(tasks));
    showTasks();
}

function deleteTask(date, index) {
    const task = tasks[date][index];
    const taskText = task ? task.text : '';
    
    // Eliminar la tarea
    tasks[date].splice(index, 1);
    if (tasks[date].length === 0) delete tasks[date];
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Eliminar el recordatorio correspondiente
    if (taskText) {
        // Crear el ID único de la tarea como lo hace checkTasks()
        const taskUniqueId = `${date}-${index}-${taskText.substring(0, 20)}`;
        
        // Cargar recordatorios y filtrar el que corresponde a esta tarea
        let reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        reminders = reminders.filter(r => r.taskId !== taskUniqueId);
        localStorage.setItem('reminders', JSON.stringify(reminders));
    }
    
    showTasks();
    renderCalendar();
}

document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'tareas_titanium.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
});

document.getElementById('todayBtn').addEventListener('click', () => {
    const today = new Date();
    currentDate = new Date(today);
    selectedDay = new Date(today);
    renderCalendar();
    showTasks();
});

renderCalendar();
showTasks();
