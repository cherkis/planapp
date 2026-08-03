// Storage keys
const STORAGE_KEYS = {
    DAILY_PLANS: 'myplan_daily_plans',
    NEXT_PLAN: 'myplan_next_plan',
    EVENTUALLY_PLAN: 'myplan_eventually_plan',
    RECURRING_TASKS: 'myplan_recurring_tasks'
};

// Task statuses
const TaskStatus = {
    NOT_STARTED: 'notStarted',
    QUARTER_DONE: 'quarterDone',
    HALF_DONE: 'halfDone',
    THREE_QUARTERS_DONE: 'threeQuartersDone',
    DONE: 'done',
    DELEGATED: 'delegated'
};

const TASK_STATUS_OPTIONS = [
    { label: 'Done', status: TaskStatus.DONE },
    { label: '3/4 Done', status: TaskStatus.THREE_QUARTERS_DONE },
    { label: '1/2 Done', status: TaskStatus.HALF_DONE },
    { label: '1/4 Done', status: TaskStatus.QUARTER_DONE },
    { label: 'Undone', status: TaskStatus.NOT_STARTED },
    { label: 'Delegate', status: TaskStatus.DELEGATED }
];

// Current state
let currentDate = new Date();
let selectedDate = new Date();
let currentView = 'calendar';
let bulletMenuOpen = null;
let confirmDialogOpen = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    renderHelpStatuses();
    renderCalendar();
});

function initializeApp() {
    // Initialize storage if empty
    if (!localStorage.getItem(STORAGE_KEYS.DAILY_PLANS)) {
        localStorage.setItem(STORAGE_KEYS.DAILY_PLANS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NEXT_PLAN)) {
        localStorage.setItem(STORAGE_KEYS.NEXT_PLAN, JSON.stringify({ title: '', tasks: [] }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTUALLY_PLAN)) {
        localStorage.setItem(STORAGE_KEYS.EVENTUALLY_PLAN, JSON.stringify({ title: '', tasks: [] }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECURRING_TASKS)) {
        localStorage.setItem(STORAGE_KEYS.RECURRING_TASKS, JSON.stringify([]));
    }
}

// Event Listeners
function setupEventListeners() {
    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    document.getElementById('today-btn').addEventListener('click', goToToday);
    document.getElementById('day-today-btn').addEventListener('click', goToToday);
    
    // View navigation
    document.getElementById('back-to-calendar').addEventListener('click', () => showView('calendar'));
    document.getElementById('back-from-next').addEventListener('click', () => showView('calendar'));
    document.getElementById('back-from-eventually').addEventListener('click', () => showView('calendar'));
    document.getElementById('back-from-help').addEventListener('click', () => showView('calendar'));
    document.getElementById('back-from-recurring').addEventListener('click', () => showView('calendar'));
    document.getElementById('next-nav-btn').addEventListener('click', () => showView('next'));
    document.getElementById('eventually-nav-btn').addEventListener('click', () => showView('eventually'));
    document.getElementById('help-btn').addEventListener('click', () => showView('help'));
    document.getElementById('recurring-nav-btn').addEventListener('click', () => showView('recurring'));
    
    // Add task buttons
    document.getElementById('add-task-btn').addEventListener('click', () => addTask('day'));
    document.getElementById('add-next-task-btn').addEventListener('click', () => addTask('next'));
    document.getElementById('add-eventually-task-btn').addEventListener('click', () => addTask('eventually'));
    document.getElementById('add-recurring-task-btn').addEventListener('click', () => addNewRecurringTask());
    
    // Date inputs
    document.getElementById('next-date-input').addEventListener('input', (e) => {
        const plan = getNextPlan();
        plan.title = e.target.value;
        saveNextPlan(plan);
    });
    
    document.getElementById('eventually-date-input').addEventListener('input', (e) => {
        const plan = getEventuallyPlan();
        plan.title = e.target.value;
        saveEventuallyPlan(plan);
    });
    
    // Close menu on click outside
    document.addEventListener('click', (e) => {
        if (bulletMenuOpen && !e.target.closest('.bullet-menu') && !e.target.closest('.task-bullet')) {
            closeBulletMenu();
        }
    });
}

// Calendar functions
function renderCalendar() {
    const monthYear = document.getElementById('month-year');
    const grid = document.getElementById('calendar-grid');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYear.textContent = new Date(year, month).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    grid.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        grid.appendChild(emptyCell);
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.textContent = day;
        
        const cellDate = new Date(year, month, day);
        
        // Check if today
        if (isToday(cellDate)) {
            cell.classList.add('today');
        }
        
        // Check if selected
        if (isSameDay(cellDate, selectedDate)) {
            cell.classList.add('selected');
        }
        
        // Check if has plan
        if (hasPlan(cellDate)) {
            cell.classList.add('has-plan');
        }
        
        cell.addEventListener('click', () => selectDay(cellDate));
        grid.appendChild(cell);
    }
}

function changeMonth(delta) {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    renderCalendar();
}

function selectDay(date) {
    selectedDate = new Date(date);
    showView('day');
    renderDayView();
}

function goToToday() {
    selectedDate = new Date();
    currentDate = new Date();
    if (currentView === 'calendar') {
        renderCalendar();
    } else {
        showView('day');
        renderDayView();
    }
}

// View management
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    switch(viewName) {
        case 'calendar':
            document.getElementById('calendar-view').classList.add('active');
            renderCalendar();
            break;
        case 'day':
            document.getElementById('day-view').classList.add('active');
            renderDayView();
            break;
        case 'next':
            document.getElementById('next-view').classList.add('active');
            renderNextView();
            break;
        case 'eventually':
            document.getElementById('eventually-view').classList.add('active');
            renderEventuallyView();
            break;
        case 'help':
            document.getElementById('help-view').classList.add('active');
            break;
        case 'recurring':
            document.getElementById('recurring-view').classList.add('active');
            renderRecurringView();
            break;
    }

    currentView = viewName;
}

// Day view
function renderDayView() {
    const dateHeader = document.getElementById('selected-date');
    dateHeader.textContent = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    ensureRecurringTasks(selectedDate);
    const plan = getDailyPlan(selectedDate);
    renderTasksList('tasks-list', plan.tasks, 'day');
}

// Next view
function renderNextView() {
    const plan = getNextPlan();
    document.getElementById('next-date-input').value = plan.title;
    renderTasksList('next-tasks-list', plan.tasks, 'next');
}

// Eventually view
function renderEventuallyView() {
    const plan = getEventuallyPlan();
    document.getElementById('eventually-date-input').value = plan.title;
    renderTasksList('eventually-tasks-list', plan.tasks, 'eventually');
}

// Tasks
function renderTasksList(containerId, tasks, viewType) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    tasks.forEach((task, index) => {
        const taskRow = createTaskRow(task, index, viewType);
        container.appendChild(taskRow);
    });

    initDragAndDrop(container, viewType);
}

function createTaskRow(task, index, viewType) {
    const row = document.createElement('div');
    row.className = 'task-row';
    if (task.recurringId) {
        row.classList.add('recurring-indicator');
    }
    
    const bullet = createBullet(task.status);
    bullet.addEventListener('click', (e) => openBulletMenu(e, index, viewType));
    
    const input = document.createElement('textarea');
    input.className = 'task-input';
    input.value = task.text;
    input.placeholder = 'Enter task';
    input.addEventListener('input', (e) => updateTaskText(index, e.target.value, viewType));
    input.addEventListener('input', autoResize);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => confirmDeleteTask(index, viewType));

    row.appendChild(bullet);
    row.appendChild(input);
    row.appendChild(deleteBtn);

    // Auto-resize textarea
    setTimeout(() => autoResize.call(input), 0);
    
    return row;
}

function autoResize() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
}

function createBullet(status) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'task-bullet');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    
    switch(status) {
        case TaskStatus.NOT_STARTED:
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '12');
            circle.setAttribute('cy', '12');
            circle.setAttribute('r', '10');
            circle.setAttribute('class', 'bullet-not-started');
            svg.appendChild(circle);
            break;
            
        case TaskStatus.DONE:
            const filledCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            filledCircle.setAttribute('cx', '12');
            filledCircle.setAttribute('cy', '12');
            filledCircle.setAttribute('r', '10');
            filledCircle.setAttribute('class', 'bullet-done');
            svg.appendChild(filledCircle);
            break;
            
        case TaskStatus.HALF_DONE:
            const halfCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            halfCircle.setAttribute('cx', '12');
            halfCircle.setAttribute('cy', '12');
            halfCircle.setAttribute('r', '10');
            halfCircle.setAttribute('class', 'bullet-half');
            svg.appendChild(halfCircle);
            
            const halfPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            halfPath.setAttribute('d', 'M 12 12 L 12 2 A 10 10 0 0 1 12 22 Z');
            halfPath.setAttribute('fill', 'currentColor');
            svg.appendChild(halfPath);
            break;

        case TaskStatus.THREE_QUARTERS_DONE:
            const threeQuarterCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            threeQuarterCircle.setAttribute('cx', '12');
            threeQuarterCircle.setAttribute('cy', '12');
            threeQuarterCircle.setAttribute('r', '10');
            threeQuarterCircle.setAttribute('class', 'bullet-three-quarter');
            svg.appendChild(threeQuarterCircle);

            const threeQuarterPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            threeQuarterPath.setAttribute('d', 'M 12 12 L 12 2 A 10 10 0 1 1 2 12 Z');
            threeQuarterPath.setAttribute('fill', 'currentColor');
            svg.appendChild(threeQuarterPath);
            break;
            
        case TaskStatus.QUARTER_DONE:
            const quarterCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            quarterCircle.setAttribute('cx', '12');
            quarterCircle.setAttribute('cy', '12');
            quarterCircle.setAttribute('r', '10');
            quarterCircle.setAttribute('class', 'bullet-quarter');
            svg.appendChild(quarterCircle);
            
            const quarterPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            quarterPath.setAttribute('d', 'M 12 12 L 12 2 A 10 10 0 0 1 22 12 Z');
            quarterPath.setAttribute('fill', 'currentColor');
            svg.appendChild(quarterPath);
            break;
            
        case TaskStatus.DELEGATED:
            const delegatedCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            delegatedCircle.setAttribute('cx', '12');
            delegatedCircle.setAttribute('cy', '12');
            delegatedCircle.setAttribute('r', '10');
            delegatedCircle.setAttribute('class', 'bullet-delegated');
            svg.appendChild(delegatedCircle);
            
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arrow.setAttribute('d', 'M 8 12 L 16 12 M 13 9 L 16 12 L 13 15');
            arrow.setAttribute('stroke', 'currentColor');
            arrow.setAttribute('stroke-width', '2');
            arrow.setAttribute('fill', 'none');
            arrow.setAttribute('stroke-linecap', 'round');
            arrow.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(arrow);
            break;
    }
    
    return svg;
}

function openBulletMenu(event, taskIndex, viewType) {
    closeBulletMenu();
    
    const menu = document.createElement('div');
    menu.className = 'bullet-menu';

    TASK_STATUS_OPTIONS.forEach(({ label, status }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.addEventListener('click', () => {
            updateTaskStatus(taskIndex, status, viewType);
            closeBulletMenu();
        });
        menu.appendChild(btn);
    });
    
    document.body.appendChild(menu);
    
    const rect = event.target.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 8) + 'px';
    
    bulletMenuOpen = menu;
}

    function renderHelpStatuses() {
        const container = document.getElementById('help-status-list');
        if (!container) return;

        container.innerHTML = '';

        TASK_STATUS_OPTIONS.forEach(({ label, status }) => {
            const row = document.createElement('div');
            row.className = 'help-status-row';

            const bullet = createBullet(status);
            bullet.setAttribute('width', '20');
            bullet.setAttribute('height', '20');

            const text = document.createElement('span');
            text.textContent = label;

            row.appendChild(bullet);
            row.appendChild(text);
            container.appendChild(row);
        });
    }

function closeBulletMenu() {
    if (bulletMenuOpen) {
        bulletMenuOpen.remove();
        bulletMenuOpen = null;
    }
}

// Confirmation dialog
function openConfirmDialog({ title, body, note, confirmLabel = 'Delete', onConfirm }) {
    closeConfirmDialog();

    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';

    const titleEl = document.createElement('div');
    titleEl.className = 'confirm-title';
    titleEl.textContent = title;
    dialog.appendChild(titleEl);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'confirm-body';
    bodyEl.textContent = body;
    dialog.appendChild(bodyEl);

    if (note) {
        const noteEl = document.createElement('div');
        noteEl.className = 'confirm-note';
        noteEl.textContent = note;
        dialog.appendChild(noteEl);
    }

    const actions = document.createElement('div');
    actions.className = 'confirm-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'confirm-btn confirm-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', closeConfirmDialog);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'confirm-btn confirm-delete';
    confirmBtn.textContent = confirmLabel;
    confirmBtn.addEventListener('click', () => {
        closeConfirmDialog();
        onConfirm();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeConfirmDialog();
    });

    const onKeyDown = (e) => {
        if (e.key === 'Escape') closeConfirmDialog();
    };
    document.addEventListener('keydown', onKeyDown);

    document.body.appendChild(overlay);
    confirmDialogOpen = { overlay, onKeyDown };
}

function closeConfirmDialog() {
    if (confirmDialogOpen) {
        document.removeEventListener('keydown', confirmDialogOpen.onKeyDown);
        confirmDialogOpen.overlay.remove();
        confirmDialogOpen = null;
    }
}

function confirmDeleteTask(index, viewType) {
    const task = getTask(index, viewType);
    if (!task) return;

    openConfirmDialog({
        title: 'Delete task?',
        body: task.text.trim() || 'Untitled task',
        note: task.recurringId ? 'It will still appear on other days.' : null,
        onConfirm: () => deleteTask(index, viewType)
    });
}

function getTask(index, viewType) {
    switch(viewType) {
        case 'day': return getDailyPlan(selectedDate).tasks[index];
        case 'next': return getNextPlan().tasks[index];
        case 'eventually': return getEventuallyPlan().tasks[index];
        default: return null;
    }
}

function deleteTask(index, viewType) {
    switch(viewType) {
        case 'day': {
            const dayPlan = getDailyPlan(selectedDate);
            const [removed] = dayPlan.tasks.splice(index, 1);
            if (removed && removed.recurringId) {
                const skipped = dayPlan.skippedRecurringIds || [];
                if (!skipped.includes(removed.recurringId)) {
                    skipped.push(removed.recurringId);
                }
                dayPlan.skippedRecurringIds = skipped;
            }
            saveDailyPlan(selectedDate, dayPlan);
            renderDayView();
            break;
        }
        case 'next': {
            const nextPlan = getNextPlan();
            nextPlan.tasks.splice(index, 1);
            saveNextPlan(nextPlan);
            renderNextView();
            break;
        }
        case 'eventually': {
            const eventuallyPlan = getEventuallyPlan();
            eventuallyPlan.tasks.splice(index, 1);
            saveEventuallyPlan(eventuallyPlan);
            renderEventuallyView();
            break;
        }
    }
}

function addTask(viewType) {
    const newTask = {
        text: '',
        status: TaskStatus.NOT_STARTED,
        createdAt: new Date().toISOString()
    };
    
    switch(viewType) {
        case 'day':
            const dayPlan = getDailyPlan(selectedDate);
            dayPlan.tasks.push(newTask);
            saveDailyPlan(selectedDate, dayPlan);
            renderDayView();
            break;
        case 'next':
            const nextPlan = getNextPlan();
            nextPlan.tasks.push(newTask);
            saveNextPlan(nextPlan);
            renderNextView();
            break;
        case 'eventually':
            const eventuallyPlan = getEventuallyPlan();
            eventuallyPlan.tasks.push(newTask);
            saveEventuallyPlan(eventuallyPlan);
            renderEventuallyView();
            break;
    }
}

function updateTaskText(index, text, viewType) {
    switch(viewType) {
        case 'day':
            const dayPlan = getDailyPlan(selectedDate);
            dayPlan.tasks[index].text = text;
            saveDailyPlan(selectedDate, dayPlan);
            break;
        case 'next':
            const nextPlan = getNextPlan();
            nextPlan.tasks[index].text = text;
            saveNextPlan(nextPlan);
            break;
        case 'eventually':
            const eventuallyPlan = getEventuallyPlan();
            eventuallyPlan.tasks[index].text = text;
            saveEventuallyPlan(eventuallyPlan);
            break;
    }
}

function updateTaskStatus(index, status, viewType) {
    switch(viewType) {
        case 'day':
            const dayPlan = getDailyPlan(selectedDate);
            dayPlan.tasks[index].status = status;
            saveDailyPlan(selectedDate, dayPlan);
            renderDayView();
            break;
        case 'next':
            const nextPlan = getNextPlan();
            nextPlan.tasks[index].status = status;
            saveNextPlan(nextPlan);
            renderNextView();
            break;
        case 'eventually':
            const eventuallyPlan = getEventuallyPlan();
            eventuallyPlan.tasks[index].status = status;
            saveEventuallyPlan(eventuallyPlan);
            renderEventuallyView();
            break;
    }
}

// Storage functions
function getDailyPlan(date) {
    const plans = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_PLANS));
    const key = dateToKey(date);
    return plans[key] || { tasks: [] };
}

function saveDailyPlan(date, plan) {
    const plans = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_PLANS));
    const key = dateToKey(date);
    plans[key] = plan;
    localStorage.setItem(STORAGE_KEYS.DAILY_PLANS, JSON.stringify(plans));
    if (currentView === 'calendar') {
        renderCalendar();
    }
}

function getNextPlan() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NEXT_PLAN));
}

function saveNextPlan(plan) {
    localStorage.setItem(STORAGE_KEYS.NEXT_PLAN, JSON.stringify(plan));
}

function getEventuallyPlan() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTUALLY_PLAN));
}

function saveEventuallyPlan(plan) {
    localStorage.setItem(STORAGE_KEYS.EVENTUALLY_PLAN, JSON.stringify(plan));
}

function hasPlan(date) {
    const plan = getDailyPlan(date);
    if (plan.tasks && plan.tasks.length > 0) return true;
    const skipped = plan.skippedRecurringIds || [];
    const recurringTasks = getRecurringTasks();
    return recurringTasks.some(rt => !skipped.includes(rt.id) && shouldRecurOnDate(rt, date));
}

// Utility functions
function dateToKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function isToday(date) {
    const today = new Date();
    return isSameDay(date, today);
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// Recurring tasks
function getRecurringTasks() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURRING_TASKS)) || [];
}

function saveRecurringTasks(tasks) {
    localStorage.setItem(STORAGE_KEYS.RECURRING_TASKS, JSON.stringify(tasks));
}

function shouldRecurOnDate(recurringTask, date) {
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    switch (recurringTask.schedule.type) {
        case 'everyday': return true;
        case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
        case 'specific': return recurringTask.schedule.days.includes(dayOfWeek);
        default: return false;
    }
}

function ensureRecurringTasks(date) {
    const recurringTasks = getRecurringTasks();
    if (recurringTasks.length === 0) return;

    const plan = getDailyPlan(date);
    const skipped = plan.skippedRecurringIds || [];
    let changed = false;

    recurringTasks.forEach(rt => {
        if (!shouldRecurOnDate(rt, date)) return;
        if (skipped.includes(rt.id)) return;
        const alreadyExists = plan.tasks.some(t => t.recurringId === rt.id);
        if (!alreadyExists) {
            plan.tasks.unshift({
                text: rt.text,
                status: TaskStatus.NOT_STARTED,
                createdAt: new Date().toISOString(),
                recurringId: rt.id
            });
            changed = true;
        }
    });

    if (changed) {
        saveDailyPlan(date, plan);
    }
}

function formatSchedule(schedule) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    switch (schedule.type) {
        case 'everyday': return 'Every day';
        case 'weekdays': return 'Weekdays';
        case 'specific':
            return schedule.days.map(d => dayNames[d]).join(', ');
        default: return '';
    }
}

function addNewRecurringTask() {
    const tasks = getRecurringTasks();
    tasks.push({
        id: 'rec_' + Date.now(),
        text: '',
        schedule: { type: 'everyday', days: [] },
        createdAt: new Date().toISOString()
    });
    saveRecurringTasks(tasks);
    renderRecurringView();
}

function confirmDeleteRecurringTask(task) {
    openConfirmDialog({
        title: 'Delete recurring task?',
        body: task.text.trim() || 'Untitled task',
        note: 'It will stop appearing on future days.',
        onConfirm: () => deleteRecurringTask(task.id)
    });
}

function deleteRecurringTask(id) {
    const tasks = getRecurringTasks().filter(t => t.id !== id);
    saveRecurringTasks(tasks);
    renderRecurringView();
}

function updateRecurringTaskText(index, text) {
    const tasks = getRecurringTasks();
    tasks[index].text = text;
    saveRecurringTasks(tasks);
}

function updateRecurringTaskSchedule(index, schedule) {
    const tasks = getRecurringTasks();
    tasks[index].schedule = schedule;
    saveRecurringTasks(tasks);
    renderRecurringView();
}

function renderRecurringView() {
    const container = document.getElementById('recurring-tasks-list');
    container.innerHTML = '';
    const tasks = getRecurringTasks();

    tasks.forEach((task, index) => {
        const row = createRecurringTaskRow(task, index);
        container.appendChild(row);
    });
}

function createRecurringTaskRow(task, index) {
    const row = document.createElement('div');
    row.className = 'recurring-task-row';

    // Top row: text input + delete button
    const topRow = document.createElement('div');
    topRow.className = 'recurring-task-top';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'recurring-task-text';
    input.value = task.text;
    input.placeholder = 'Enter recurring task';
    input.addEventListener('input', (e) => updateRecurringTaskText(index, e.target.value));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'recurring-delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => confirmDeleteRecurringTask(task));

    topRow.appendChild(input);
    topRow.appendChild(deleteBtn);
    row.appendChild(topRow);

    // Schedule subtitle
    const subtitle = document.createElement('div');
    subtitle.className = 'recurring-schedule';
    subtitle.textContent = formatSchedule(task.schedule);
    row.appendChild(subtitle);

    // Schedule editor
    const editor = document.createElement('div');
    editor.className = 'schedule-editor';

    // Type selector
    const typeSelector = document.createElement('div');
    typeSelector.className = 'schedule-type-selector';
    const types = [
        { label: 'Every day', value: 'everyday' },
        { label: 'Weekdays', value: 'weekdays' },
        { label: 'Specific', value: 'specific' }
    ];
    types.forEach(({ label, value }) => {
        const btn = document.createElement('button');
        btn.className = 'schedule-type-btn';
        btn.textContent = label;
        if (task.schedule.type === value) btn.classList.add('active');
        btn.addEventListener('click', () => {
            const newSchedule = { type: value, days: value === 'specific' ? (task.schedule.days || []) : [] };
            updateRecurringTaskSchedule(index, newSchedule);
        });
        typeSelector.appendChild(btn);
    });
    editor.appendChild(typeSelector);

    // Day toggles (only for "specific")
    if (task.schedule.type === 'specific') {
        const dayToggles = document.createElement('div');
        dayToggles.className = 'day-toggles';
        const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        dayLabels.forEach((label, dayIndex) => {
            const btn = document.createElement('button');
            btn.className = 'day-toggle';
            btn.textContent = label;
            if (task.schedule.days.includes(dayIndex)) btn.classList.add('active');
            btn.addEventListener('click', () => {
                const days = [...task.schedule.days];
                const pos = days.indexOf(dayIndex);
                if (pos >= 0) {
                    days.splice(pos, 1);
                } else {
                    days.push(dayIndex);
                    days.sort();
                }
                updateRecurringTaskSchedule(index, { type: 'specific', days });
            });
            dayToggles.appendChild(btn);
        });
        editor.appendChild(dayToggles);
    }

    row.appendChild(editor);
    return row;
}

// Drag and drop reordering
let dragState = null;

function initDragAndDrop(container, viewType) {
    if (container._dragInitialized) return;
    container._dragInitialized = true;
    container.addEventListener('touchstart', (e) => handleDragStart(e, container, viewType), { passive: false });
    container.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return; // handled by touchstart
        handleDragStart(e, container, viewType);
    });
}

function handleDragStart(event, container, viewType) {
    const taskRow = event.target.closest('.task-row');
    if (!taskRow) return;
    // Don't drag if user is interacting with the textarea, bullet or delete button
    if (event.target.closest('.task-input') || event.target.closest('.task-bullet') || event.target.closest('.task-delete-btn')) return;

    const isTouch = event.type === 'touchstart';
    const startPos = isTouch ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY };

    // Set up long-press timer
    const longPressTimer = setTimeout(() => {
        startDragging(taskRow, container, viewType, startPos, isTouch);
    }, 500);

    const cancelThreshold = 10;
    const onMove = (e) => {
        const pos = e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
        if (Math.abs(pos.x - startPos.x) > cancelThreshold || Math.abs(pos.y - startPos.y) > cancelThreshold) {
            clearTimeout(longPressTimer);
            cleanup();
        }
    };
    const onEnd = () => {
        clearTimeout(longPressTimer);
        cleanup();
    };
    const cleanup = () => {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        document.removeEventListener('touchcancel', onEnd);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
}

function startDragging(taskRow, container, viewType, startPos, isTouch) {
    const rows = Array.from(container.querySelectorAll('.task-row'));
    const dragIndex = rows.indexOf(taskRow);
    if (dragIndex === -1) return;

    const rect = taskRow.getBoundingClientRect();

    // Create floating clone
    const clone = taskRow.cloneNode(true);
    clone.className = 'task-row-clone';
    const cloneDeleteBtn = clone.querySelector('.task-delete-btn');
    if (cloneDeleteBtn) cloneDeleteBtn.remove();
    clone.style.width = rect.width + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    document.body.appendChild(clone);

    taskRow.classList.add('dragging');

    dragState = {
        clone,
        taskRow,
        container,
        viewType,
        dragIndex,
        currentIndex: dragIndex,
        startY: startPos.y,
        offsetY: startPos.y - rect.top,
        rows
    };

    // Prevent scrolling during drag
    const onMove = (e) => {
        e.preventDefault();
        const pos = e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
        handleDragMove(pos);
    };
    const onEnd = (e) => {
        handleDragEnd();
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        document.removeEventListener('touchcancel', onEnd);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onEnd);
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
}

function handleDragMove(pos) {
    if (!dragState) return;

    // Move clone
    dragState.clone.style.top = (pos.y - dragState.offsetY) + 'px';

    // Remove old indicators
    dragState.container.querySelectorAll('.drop-indicator').forEach(el => el.remove());

    // Find insertion index
    const rows = Array.from(dragState.container.querySelectorAll('.task-row'));
    let newIndex = rows.length;
    for (let i = 0; i < rows.length; i++) {
        const rowRect = rows[i].getBoundingClientRect();
        const midY = rowRect.top + rowRect.height / 2;
        if (pos.y < midY) {
            newIndex = i;
            break;
        }
    }

    // Show indicator
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
    if (newIndex < rows.length) {
        dragState.container.insertBefore(indicator, rows[newIndex]);
    } else {
        dragState.container.appendChild(indicator);
    }

    dragState.currentIndex = newIndex;
}

function handleDragEnd() {
    if (!dragState) return;

    const { clone, taskRow, viewType, dragIndex, currentIndex } = dragState;

    // Clean up visuals
    clone.remove();
    taskRow.classList.remove('dragging');
    dragState.container.querySelectorAll('.drop-indicator').forEach(el => el.remove());

    // Reorder if position changed
    let targetIndex = currentIndex;
    if (targetIndex > dragIndex) targetIndex--; // adjust for removal
    if (dragIndex !== targetIndex) {
        reorderTask(viewType, dragIndex, targetIndex);
    }

    dragState = null;
}

function reorderTask(viewType, fromIndex, toIndex) {
    switch (viewType) {
        case 'day': {
            const plan = getDailyPlan(selectedDate);
            const [task] = plan.tasks.splice(fromIndex, 1);
            plan.tasks.splice(toIndex, 0, task);
            saveDailyPlan(selectedDate, plan);
            renderDayView();
            break;
        }
        case 'next': {
            const plan = getNextPlan();
            const [task] = plan.tasks.splice(fromIndex, 1);
            plan.tasks.splice(toIndex, 0, task);
            saveNextPlan(plan);
            renderNextView();
            break;
        }
        case 'eventually': {
            const plan = getEventuallyPlan();
            const [task] = plan.tasks.splice(fromIndex, 1);
            plan.tasks.splice(toIndex, 0, task);
            saveEventuallyPlan(plan);
            renderEventuallyView();
            break;
        }
    }
}
