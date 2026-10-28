(() => {
    const STORAGE_KEY = "daylight-tracker-v1";
    const today = localDateKey(new Date());
    const starterState = {
        tasks: [
            { id: "starter-task-1", title: "Plan the week with a slow morning", date: today, category: "Personal", priority: "normal", completed: true },
            { id: "starter-task-2", title: "Send the project update", date: today, category: "Work", priority: "important", completed: false },
            { id: "starter-task-3", title: "Pick up a few groceries", date: today, category: "Home", priority: "normal", completed: false }
        ],
        habits: [
            { id: "starter-habit-1", title: "Drink a glass of water", frequency: "Every day", color: "mint", icon: "water", completions: [today] },
            { id: "starter-habit-2", title: "Get outside for a little while", frequency: "Every day", color: "peach", icon: "sun", completions: [] },
            { id: "starter-habit-3", title: "Read a few pages", frequency: "Every day", color: "lavender", icon: "book", completions: [] },
            { id: "starter-habit-4", title: "Take a mindful pause", frequency: "Weekdays", color: "yellow", icon: "spark", completions: [] }
        ]
    };
    let state = loadState();
    let toastTimer;
    const filters = { today: "all", tasks: "all" };

    function localDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function loadState() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return structuredClone(starterState);
            const parsed = JSON.parse(stored);
            if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.habits)) return structuredClone(starterState);
            return {
                tasks: parsed.tasks.filter((task) => task && typeof task.id === "string" && typeof task.title === "string"),
                habits: parsed.habits.filter((habit) => habit && typeof habit.id === "string" && typeof habit.title === "string")
            };
        } catch {
            return structuredClone(starterState);
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            showToast("Changes are visible, but couldn't be saved on this device.");
        }
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
    }

    function formatDate(date, options) {
        return new Intl.DateTimeFormat(undefined, options).format(date);
    }

    function formatTaskDate(dateString) {
        if (dateString < today) return "Overdue";
        if (dateString === today) return "Today";
        const date = new Date(`${dateString}T12:00:00`);
        return formatDate(date, { weekday: "short", month: "short", day: "numeric" });
    }

    function renderDates() {
        const now = new Date();
        document.getElementById("header-date").textContent = formatDate(now, { weekday: "short", month: "short", day: "numeric" });
        document.getElementById("full-date").textContent = formatDate(now, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
        document.getElementById("habits-date").textContent = formatDate(now, { month: "long", day: "numeric" });
        document.getElementById("task-date").value = today;
        document.getElementById("task-date").min = today;
    }

    function getTaskMarkup(task) {
        const checked = task.completed ? " checked" : "";
        const titleClass = task.completed ? " task-title completed" : " task-title";
        const priority = task.priority === "important" ? '<span class="priority-label">Important</span>' : "";
        return `<article class="task-row${task.completed ? " is-complete" : ""}">
            <button type="button" class="task-check${checked}" data-task-toggle="${escapeHTML(task.id)}" aria-label="${task.completed ? "Mark incomplete" : "Mark complete"}: ${escapeHTML(task.title)}" aria-pressed="${Boolean(task.completed)}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.3 8.2 3.1 3.1 6.3-6.5"/></svg></button>
            <div class="task-main"><p class="${titleClass}">${escapeHTML(task.title)}</p><div class="task-meta"><span class="category-dot category-${escapeHTML(task.category.toLowerCase())}"></span><span>${escapeHTML(task.category)}</span><span class="meta-separator">·</span><span class="${task.date < today && !task.completed ? "overdue-label" : ""}">${formatTaskDate(task.date)}</span>${priority}</div></div>
            <button type="button" class="delete-button" data-task-delete="${escapeHTML(task.id)}" aria-label="Delete task: ${escapeHTML(task.title)}">×</button>
        </article>`;
    }

    function visibleTasks(filter, listType) {
        const dueTodayOrEarlier = listType === "today" ? state.tasks.filter((task) => task.date <= today) : state.tasks;
        const filtered = dueTodayOrEarlier.filter((task) => {
            if (filter === "open") return !task.completed;
            if (filter === "done") return task.completed;
            return true;
        });
        return filtered.sort((a, b) => Number(a.completed) - Number(b.completed) || a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    }

    function renderTaskList(containerId, filter, listType) {
        const container = document.getElementById(containerId);
        const tasks = visibleTasks(filter, listType);
        if (!tasks.length) {
            const message = state.tasks.length === 0 ? "Your list is a blank page. Add a task when you're ready." :
                filter === "done" ? "No finished tasks yet. Your first little win is waiting." :
                    filter === "open" ? "Nothing left on your plate. Take a breath." : "Nothing due today. Enjoy the breathing room.";
            container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">✳</span><p>${message}</p></div>`;
            return;
        }
        container.innerHTML = tasks.map(getTaskMarkup).join("");
    }

    function habitIcon(icon) {
        const paths = {
            water: '<path d="M12 3.2s-5.3 6.2-5.3 10.1a5.3 5.3 0 1 0 10.6 0C17.3 9.4 12 3.2 12 3.2Z"/><path d="M9.6 14.4c0 1.2.9 2.1 2.1 2.1"/>',
            sun: '<circle cx="12" cy="12" r="3.3"/><path d="M12 2.8v2m0 14.4v2m9.2-9.2h-2M4.8 12h-2m15.7-6.5-1.4 1.4M6.9 17.1l-1.4 1.4m13 0-1.4-1.4M6.9 6.9 5.5 5.5"/>',
            book: '<path d="M4.2 5.4A2.4 2.4 0 0 1 6.6 3H20v16H6.6a2.4 2.4 0 0 0-2.4 2.4V5.4Z"/><path d="M4.2 18.8a2.4 2.4 0 0 1 2.4-2.4H20"/>',
            spark: '<path d="m12 2.8 1.9 6.1 6.1 1.9-6.1 1.9-1.9 6.1-1.9-6.1L4 10.8l6.1-1.9L12 2.8Z"/><path d="m19 15.8.8 2.4 2.4.8-2.4.8L19 22l-.8-2.2-2.2-.8 2.2-.8.8-2.4Z"/>'
        };
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[icon] || paths.spark}</svg>`;
    }

    function renderHabits(containerId, large) {
        const container = document.getElementById(containerId);
        if (!state.habits.length) {
            container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">♡</span><p>A good habit starts with one small promise. Add yours when you’re ready.</p></div>';
            return;
        }
        container.innerHTML = state.habits.map((habit) => {
            const done = habit.completions.includes(today);
            return `<article class="habit-row${large ? " habit-row-large" : ""}">
                <span class="habit-icon ${escapeHTML(habit.color)}">${habitIcon(habit.icon)}</span>
                <div class="habit-main"><p class="habit-title">${escapeHTML(habit.title)}</p><p class="habit-frequency">${escapeHTML(habit.frequency)} <span>·</span> ${habit.completions.length} ${habit.completions.length === 1 ? "day" : "days"} practiced</p></div>
                <button type="button" class="habit-check${done ? " checked" : ""}" data-habit-toggle="${escapeHTML(habit.id)}" aria-label="${done ? "Undo" : "Complete"} habit: ${escapeHTML(habit.title)}" aria-pressed="${done}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.3 8.2 3.1 3.1 6.3-6.5"/></svg></button>
            </article>`;
        }).join("");
    }

    function getStreak() {
        const checkedDates = new Set(state.habits.flatMap((habit) => habit.completions));
        let day = new Date();
        if (!checkedDates.has(localDateKey(day))) day.setDate(day.getDate() - 1);
        let streak = 0;
        while (checkedDates.has(localDateKey(day)) && streak < 3660) {
            streak += 1;
            day.setDate(day.getDate() - 1);
        }
        return streak;
    }

    function renderWeek() {
        const todayDate = new Date();
        const mondayOffset = (todayDate.getDay() + 6) % 7;
        const start = new Date(todayDate);
        start.setDate(todayDate.getDate() - mondayOffset);
        const completedDates = new Set(state.habits.flatMap((habit) => habit.completions));
        document.getElementById("week-strip").innerHTML = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(start);
            date.setDate(start.getDate() + index);
            const key = localDateKey(date);
            const isToday = key === today;
            const done = completedDates.has(key);
            return `<div class="week-day${isToday ? " is-today" : ""}"><span>${formatDate(date, { weekday: "narrow" })}</span><i class="${done ? "week-dot done" : "week-dot"}${isToday ? " today" : ""}">${done ? "✓" : ""}</i></div>`;
        }).join("");
    }

    function renderProgress() {
        const dueTasks = state.tasks.filter((task) => task.date <= today);
        const done = dueTasks.filter((task) => task.completed).length;
        const percent = dueTasks.length ? Math.round((done / dueTasks.length) * 100) : 0;
        document.getElementById("task-progress-count").textContent = `${done} of ${dueTasks.length}`;
        document.getElementById("task-count").textContent = dueTasks.length;
        document.getElementById("progress-percent").textContent = `${percent}%`;
        document.getElementById("progress-ring").setAttribute("aria-label", `${percent}% complete`);
        document.getElementById("progress-bar").style.width = `${percent}%`;
        document.getElementById("progress-note").textContent = dueTasks.length === 0 ? "A little space for whatever comes." :
            percent === 100 ? "You did what you set out to do. Lovely." : percent >= 50 ? "Look at you, making it happen." : "Every small step matters.";
        document.getElementById("streak-count").textContent = getStreak();
        document.getElementById("habit-count").textContent = state.habits.length;
        document.getElementById("insight-tasks").textContent = state.tasks.filter((task) => task.completed).length;
        document.getElementById("insight-streak").textContent = getStreak();
        document.getElementById("insight-habits").textContent = state.habits.length;
    }

    function render() {
        renderTaskList("today-task-list", filters.today, "today");
        renderTaskList("all-task-list", filters.tasks, "all");
        renderHabits("habit-list", false);
        renderHabits("all-habit-list", true);
        renderWeek();
        renderProgress();
    }

    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.add("visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
    }

    function setView(view) {
        document.querySelectorAll(".view-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}-view`));
        document.querySelectorAll("[data-view]").forEach((button) => {
            const active = button.dataset.view === view;
            button.classList.toggle("active", active);
            if (button.classList.contains("nav-item")) {
                if (active) button.setAttribute("aria-current", "page");
                else button.removeAttribute("aria-current");
            }
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.addEventListener("click", (event) => {
        const target = event.target.closest("button, a");
        if (!target) return;
        if (target.dataset.view) {
            event.preventDefault();
            setView(target.dataset.view);
        }
        if (target.dataset.openDialog) {
            document.getElementById(target.dataset.openDialog).showModal();
            const field = document.querySelector(`#${target.dataset.openDialog} input[type="text"]`);
            if (field) setTimeout(() => field.focus(), 50);
        }
        if (target.hasAttribute("data-close-dialog")) target.closest("dialog").close();
        if (target.dataset.filter) {
            const group = target.closest("#today-filters, #all-filters");
            const listType = group.id === "today-filters" ? "today" : "tasks";
            filters[listType] = target.dataset.filter;
            group.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("selected", chip === target));
            renderTaskList(listType === "today" ? "today-task-list" : "all-task-list", filters[listType], listType);
        }
        if (target.dataset.taskToggle) {
            const task = state.tasks.find((item) => item.id === target.dataset.taskToggle);
            if (task) {
                task.completed = !task.completed;
                saveState();
                render();
                showToast(task.completed ? "One more thing off your mind. ✓" : "Task moved back to your list.");
            }
        }
        if (target.dataset.taskDelete) {
            state.tasks = state.tasks.filter((task) => task.id !== target.dataset.taskDelete);
            saveState();
            render();
            showToast("Task removed.");
        }
        if (target.dataset.habitToggle) {
            const habit = state.habits.find((item) => item.id === target.dataset.habitToggle);
            if (habit) {
                if (habit.completions.includes(today)) habit.completions = habit.completions.filter((date) => date !== today);
                else habit.completions.push(today);
                saveState();
                render();
                showToast(habit.completions.includes(today) ? "You showed up for yourself. ✦" : "Habit check-in undone.");
            }
        }
    });

    document.getElementById("task-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        state.tasks.push({
            id: crypto.randomUUID(),
            title: String(data.get("title")).trim(),
            date: String(data.get("date")),
            category: String(data.get("category")),
            priority: String(data.get("priority")),
            completed: false
        });
        saveState();
        form.closest("dialog").close();
        form.reset();
        document.getElementById("task-date").value = today;
        render();
        showToast("Your new task is on the list.");
    });

    document.getElementById("habit-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const colors = ["mint", "peach", "lavender", "yellow"];
        const icons = ["water", "sun", "book", "spark"];
        const next = state.habits.length;
        state.habits.push({
            id: crypto.randomUUID(),
            title: String(data.get("title")).trim(),
            frequency: String(data.get("frequency")),
            color: colors[next % colors.length],
            icon: icons[next % icons.length],
            completions: []
        });
        saveState();
        form.closest("dialog").close();
        form.reset();
        render();
        showToast("A lovely new habit to grow.");
    });

    document.querySelectorAll("dialog").forEach((dialog) => {
        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) dialog.close();
        });
    });

    renderDates();
    render();
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
        window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {
            showToast("Offline mode isn't available in this browser.");
        }));
    }
})();
