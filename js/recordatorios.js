const STORAGE_KEY = 'reminders';
const TASKS_KEY = 'tasks';
let reminders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let notificationTimeouts = new Map();

function loadTasks() {
    try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) || '{}');
    } catch(e) {
    console.error('Error loading tasks:', e);
    return {};
    }
}

function saveReminders() {
    try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    } catch(e) {
    console.error('Error saving reminders:', e);
    showNotification('Error', 'No se pudieron guardar los recordatorios');
    }
}

function showNotification(title, message, options = {}) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Cerrar notificación');
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = () => closeToast(toast);

    const t = document.createElement('div');
    t.className = 'toast-title';
    t.textContent = title;

    const m = document.createElement('div');
    m.className = 'toast-message';
    m.textContent = message;

    toast.appendChild(closeBtn);
    toast.appendChild(t);
    toast.appendChild(m);
    container.appendChild(toast);

    const ttl = options.duration || 5000;
    const hideTimeout = setTimeout(() => closeToast(toast), ttl);
    toast._hideTimeout = hideTimeout;

    function closeToast(node) {
    if (!node) return;
    clearTimeout(node._hideTimeout);
    node.style.opacity = '0';
    node.style.transform = 'translateY(6px)';
    setTimeout(() => {
        if (node.parentNode) node.parentNode.removeChild(node);
    }, 220);
    }
}

/*
    showSystemNotification: intenta mostrar una notificación del sistema (Notification API).
    - Si el navegador/OS permite notificaciones (permiso granted) se usará Notification.
    - Si no hay permiso o no hay soporte, hace fallback a showNotification (toast interno).
    - Soporta `options.icon` y `options.image` (dependiendo del navegador puede mostrar uno u otro).

    Cómo añadir una imagen o icon a una notificación:
    - Cuando crees un reminder, añade la propiedad `icon` o `image`, por ejemplo:
    reminder.icon = './assets/recordatorio-icon.png';
    - El archivo debe ser accesible desde la página (ruta relativa o URL absoluta).
    - Algunos navegadores solo muestran `icon` (pequeño) y `image` como imagen grande en la notificación.
*/
function showSystemNotification(title, message, options = {}){
    // Fallback to in-page toast
    const fallback = () => showNotification(title, message, options);

    if (!('Notification' in window)) {
    // Not supported
    return fallback();
    }

    const create = () => {
    try {
        const notifOptions = { body: message };
        if (options.icon) notifOptions.icon = options.icon;
        if (options.image) notifOptions.image = options.image;
        if (options.tag) notifOptions.tag = options.tag;
        // show Notification
        const n = new Notification(title, notifOptions);
        // Optional: close after a while if desired
        if (options.duration && typeof options.duration === 'number') {
        setTimeout(() => { try { n.close(); } catch(e){} }, options.duration);
        }
        // When the user clicks the notification, focus the window (nice UX)
        n.onclick = function(ev){
        try { window.focus(); } catch(e){}
        // Could navigate to a specific page or open tasks
        };
    } catch(e){
        // If anything falla, fallback to toast
        fallback();
    }
    };

    if (Notification.permission === 'granted') {
    create();
    } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
        if (p === 'granted') create(); else fallback();
    }).catch(()=> fallback());
    } else {
    // denied
    fallback();
    }
}

function scheduleNotification(reminder) {
    const now = new Date().getTime();
    let reminderTime = new Date(reminder.time).getTime();
    let notificationTime = reminderTime;
    let isFirstNotification = false;
    
    // Si es nuevo, la primera notificación será en X minutos desde ahora
    if (reminder.isNew) {
        notificationTime = now + (reminder.initialNotification * 60 * 1000);
        isFirstNotification = true;
        reminder.isNew = false;
        saveReminders();
    }
    
    // Solo programar si la notificación es en el futuro
    if (notificationTime > now) {
        const timeout = setTimeout(() => {
            let notificationMessage = reminder.message;
            
            // Si es la primera notificación (inmediata), mostrar la fecha ORIGINAL
            if (isFirstNotification && reminder.repeatInterval > 0) {
                const originalTimeStr = new Date(reminderTime).toLocaleString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                notificationMessage = `\nSiguiente notificación: ${originalTimeStr}`;
            } 
            // Si NO es la primera notificación, calcular la siguiente (fecha original + 24h)
            else if (!isFirstNotification && reminder.repeatInterval > 0) {
                const nextNotificationTime = new Date(reminderTime + (reminder.repeatInterval * 60 * 60 * 1000));
                const nextTimeStr = nextNotificationTime.toLocaleString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                notificationMessage += `\nSiguiente notificación: ${nextTimeStr}`;
            }
            
            // Mostrar la notificación
            showSystemNotification(reminder.title, notificationMessage, { 
                icon: 'TT__1_-removebg-preview.png',
                duration: 8000, 
                tag: 'reminder-' + reminder.id 
            });

            // Si tiene repetición y NO es la primera notificación, actualizar para la próxima vez
            if (reminder.repeatInterval > 0 && !isFirstNotification) {
                const nextNotificationTime = new Date(reminderTime + (reminder.repeatInterval * 60 * 60 * 1000));
                reminder.time = nextNotificationTime.toISOString();
                saveReminders();
                scheduleNotification(reminder); // Reprogramar para la siguiente
                renderReminders();
            }
            // Si es la primera notificación, reprogramar para la hora ORIGINAL
            else if (isFirstNotification && reminderTime > now) {
                scheduleNotification(reminder);
            }
        }, notificationTime - now);

        notificationTimeouts.set(reminder.id, timeout);
    } else if (reminderTime > now && reminder.repeatInterval > 0) {
        // Si la hora programada ya pasó pero tiene repetición, calcular la siguiente ocurrencia
        while (reminderTime <= now) {
            reminderTime += reminder.repeatInterval * 60 * 60 * 1000;
        }
        reminder.time = new Date(reminderTime).toISOString();
        saveReminders();
        scheduleNotification(reminder);
    }
}

function addReminder() {
    const title = document.getElementById('reminderTitle').value.trim();
    const message = document.getElementById('reminderMessage').value.trim();
    const time = document.getElementById('reminderTime').value;
    const initialNotification = parseInt(document.getElementById('initialNotification').value);
    const repeatInterval = parseInt(document.getElementById('repeatInterval').value);

    if (!title || !message || !time) {
        showNotification('Error', 'Por favor completa todos los campos', { duration: 3000 });
        return;
    }

    // Validar que la hora seleccionada sea en el futuro
    const selectedDateTime = new Date(time);
    const now = new Date();
    if (isNaN(selectedDateTime.getTime()) || selectedDateTime <= now) {
        showNotification('Error', 'No puedes agregar recordatorios en fechas pasadas.', { duration: 3500 });
        return;
    }

    // Primero agregar a la agenda para poder obtener el índice correcto
    const taskInfo = addReminderToAgenda(title, time);
    
    // Crear el taskId usando la misma lógica que checkTasks
    const taskId = taskInfo ? `${taskInfo.dateKey}-${taskInfo.index}-${title.substring(0, 20)}` : null;

    const reminder = {
        id: Date.now(),
        title,
        message,
        time,
        initialNotification,
        repeatInterval,
        isNew: true,
        taskId: taskId, // Asignar el taskId para evitar duplicados
        fromAgenda: false // Marcar que NO viene de agenda (es recordatorio manual)
    };

    reminders.push(reminder);
    saveReminders();
    scheduleNotification(reminder);
    renderReminders();
    
    // Limpiar formulario
    document.getElementById('reminderTitle').value = '';
    document.getElementById('reminderMessage').value = '';
    document.getElementById('reminderTime').value = '';
    document.getElementById('repeatInterval').value = '0';
    
    showNotification('Éxito', 'Recordatorio agregado correctamente y añadido a la agenda', { duration: 2000 });
}

// Función para agregar recordatorio como tarea en la agenda
function addReminderToAgenda(title, timeString) {
    const tasks = loadTasks();
    const reminderDate = new Date(timeString);
    const dateKey = `${reminderDate.getFullYear()}-${reminderDate.getMonth() + 1}-${reminderDate.getDate()}`;
    
    if (!tasks[dateKey]) {
        tasks[dateKey] = [];
    }
    
    // Verificar que no exista ya
    const exists = tasks[dateKey].some(t => t.text === title);
    if (!exists) {
        tasks[dateKey].push({
            text: title,
            done: false,
            status: 'pendiente',
            fromReminder: true
        });
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        
        // Devolver información para crear el taskId
        return {
            dateKey: dateKey,
            index: tasks[dateKey].length - 1
        };
    }
    
    // Si ya existe, buscar su índice
    const index = tasks[dateKey].findIndex(t => t.text === title);
    return {
        dateKey: dateKey,
        index: index
    };
}

function deleteReminder(id) {
    const timeout = notificationTimeouts.get(id);
    if (timeout) {
    clearTimeout(timeout);
    notificationTimeouts.delete(id);
    }

    // Encontrar el recordatorio antes de eliminarlo
    const reminder = reminders.find(r => r.id === id);
    
    // Si el recordatorio viene de la agenda, eliminarlo también de allí
    if (reminder && reminder.taskId) {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '{}');
        
        // El taskId tiene el formato: "fecha-index-texto"
        const parts = reminder.taskId.split('-');
        if (parts.length >= 3) {
            const date = `${parts[0]}-${parts[1]}-${parts[2]}`; // año-mes-día
            const taskIndex = parseInt(parts[3]);
            const taskTextSubstring = parts.slice(4).join('-'); // resto del texto
            
            // Buscar y eliminar la tarea correspondiente
            if (tasks[date]) {
                const taskIdx = tasks[date].findIndex((task, idx) => {
                    const taskUniqueId = `${date}-${idx}-${task.text.substring(0, 20)}`;
                    return taskUniqueId === reminder.taskId;
                });
                
                if (taskIdx !== -1) {
                    tasks[date].splice(taskIdx, 1);
                    if (tasks[date].length === 0) delete tasks[date];
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                }
            }
        }
    }

    reminders = reminders.filter(r => r.id !== id);
    saveReminders();
    renderReminders();
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
    });
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
    });
}

function checkTasks() {
    console.log('Checking tasks...');
    const tasks = loadTasks();
    let hasNewTasks = false;

    for (const [date, taskList] of Object.entries(tasks)) {
        taskList.forEach((task, taskIndex) => {
            // Crear un ID único para la tarea basado en fecha y texto
            const taskUniqueId = `${date}-${taskIndex}-${task.text.substring(0, 20)}`;
            
            // Solo crear recordatorio si no existe ya
            const existingReminder = reminders.find(r => r.taskId === taskUniqueId);
            
            if (!existingReminder && !task.done) {
                const taskDate = new Date(date.split('-')[0], date.split('-')[1] - 1, date.split('-')[2]);
                const now = new Date();
                
                // Programar notificación para la fecha de la tarea a las 8 AM
                const notificationDate = new Date(taskDate);
                notificationDate.setHours(8, 0, 0, 0);
                
                const reminder = {
                    id: Date.now() + Math.random(),
                    title: `Tarea: ${task.text}`,
                    message: `Recordatorio de tarea para ${formatDate(date)}`,
                    time: notificationDate.toISOString(),
                    initialNotification: 1, // Notificación inicial en 1 minuto
                    repeatInterval: 24,
                    isNew: true, // Marcar como nuevo para que se active la notificación inmediata
                    taskId: taskUniqueId,
                    fromAgenda: true
                };
                
                reminders.push(reminder);
                hasNewTasks = true;
                scheduleNotification(reminder);
            }
        });
    }

    if (hasNewTasks) {
        saveReminders();
        renderReminders();
        console.log('New tasks found and notifications scheduled');
    }
}

function editReminder(id) {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    
    document.getElementById('reminderTitle').value = reminder.title;
    document.getElementById('reminderMessage').value = reminder.message;
    document.getElementById('reminderTime').value = reminder.time.slice(0, 16);
    document.getElementById('initialNotification').value = reminder.initialNotification || 1;
    document.getElementById('repeatInterval').value = reminder.repeatInterval;
    
    deleteReminder(id);
}

function renderReminders() {
    const list = document.getElementById('reminderList');
    list.innerHTML = '';

    const sortedReminders = reminders.sort((a, b) => new Date(a.time) - new Date(b.time));

    if (sortedReminders.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">No hay recordatorios pendientes</div>';
        return;
    }

    sortedReminders.forEach(reminder => {
        const div = document.createElement('div');
        div.className = 'reminder-item';
        div.innerHTML = `
            <div class="reminder-info">
                <div class="reminder-title">${reminder.title}</div>
                <div class="reminder-message">${reminder.message}</div>
                <div class="reminder-time">${formatDateTime(reminder.time)}</div>
                ${reminder.repeatInterval ? 
                    `<div class="reminder-badge repeat">Se repite cada ${reminder.repeatInterval} horas</div>` : ''}
                ${reminder.fromAgenda ? 
                    `<div class="reminder-badge task">Desde Agenda</div>` : ''}
            </div>
            <div class="reminder-actions">
                <button onclick="deleteReminder(${reminder.id})" class="delete-btn">Eliminar</button>
            </div>
        `;
        list.appendChild(div);
    });
}

// Inicialización
window.addEventListener('load', () => {
    // Limpiar timeouts anteriores
    notificationTimeouts.forEach(timeout => clearTimeout(timeout));
    notificationTimeouts.clear();

    // Configurar el mínimo del selector de fecha/hora para evitar seleccionar pasado
    const setMinReminderTime = () => {
        const input = document.getElementById('reminderTime');
        if (!input) return;
        const now = new Date();
        now.setSeconds(0, 0);
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        input.min = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };
    setMinReminderTime();
    // Actualizar el mínimo automáticamente cada minuto por si la página permanece abierta
    setInterval(setMinReminderTime, 60000);
    // También refrescar cuando el usuario enfoca el campo
    const reminderInputEl = document.getElementById('reminderTime');
    if (reminderInputEl) reminderInputEl.addEventListener('focus', setMinReminderTime);
    
    // Revisar tareas existentes al cargar
    checkTasks();
    
    // Programar todas las notificaciones
    reminders.forEach(scheduleNotification);
    
    // Mostrar recordatorios
    renderReminders();
    
    // Revisar tareas nuevas cada minuto
    setInterval(checkTasks, 60000);
});
