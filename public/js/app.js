document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const itemsGrid = document.getElementById('items-grid');
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const btnRefresh = document.getElementById('btn-refresh');
  
  // Quick Add Form
  const quickAddForm = document.getElementById('quick-add-form');
  const quickTitleInput = document.getElementById('quick-title');
  const quickCategoryInput = document.getElementById('quick-category');
  const quickDueDateInput = document.getElementById('quick-due-date');

  // Set default due date to today
  if (quickDueDateInput) {
    quickDueDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Filter Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabCountAll = document.getElementById('tab-count-all');
  const tabCountActive = document.getElementById('tab-count-active');
  const tabCountCompleted = document.getElementById('tab-count-completed');

  // Modal Elements
  const modalOverlay = document.getElementById('item-modal');
  const modalTitle = document.getElementById('modal-title');
  const itemForm = document.getElementById('item-form');
  const itemIdInput = document.getElementById('item-id');
  const itemTitleInput = document.getElementById('item-title');
  const itemDescInput = document.getElementById('item-description');
  const itemCategoryInput = document.getElementById('item-category');
  const itemDueDateInput = document.getElementById('item-due-date');
  const itemPriorityInput = document.getElementById('item-priority');
  const btnOpenModal = document.getElementById('btn-open-create-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');

  // Metrics Counters
  const statTotal = document.getElementById('stat-total');
  const statActive = document.getElementById('stat-active');
  const statCompleted = document.getElementById('stat-completed');
  const statRate = document.getElementById('stat-rate');
  const serverStatus = document.getElementById('server-status');
  const toastContainer = document.getElementById('toast-container');

  let currentTodos = [];
  let currentActiveTab = 'all'; // 'all' | 'active' | 'completed'

  // Initialize
  checkServerHealth();
  fetchTodos();

  // Event Listeners
  btnRefresh.addEventListener('click', fetchTodos);
  searchInput.addEventListener('input', filterAndRenderTodos);
  categoryFilter.addEventListener('change', filterAndRenderTodos);
  if (priorityFilter) priorityFilter.addEventListener('change', filterAndRenderTodos);

  const btnClearCompleted = document.getElementById('btn-clear-completed');
  if (btnClearCompleted) {
    btnClearCompleted.addEventListener('click', async () => {
      const completedCount = currentTodos.filter(t => t.completed).length;
      if (completedCount === 0) {
        showToast('No completed tasks to clear', 'info');
        return;
      }
      if (!confirm(`Are you sure you want to clear ${completedCount} completed task(s)?`)) return;
      try {
        const res = await fetch('/api/todos/completed', { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message, 'success');
          fetchTodos();
        } else {
          showToast(data.message || 'Failed to clear completed tasks', 'error');
        }
      } catch (err) {
        showToast('Error clearing completed tasks', 'error');
      }
    });
  }


  const btnExportTodos = document.getElementById('btn-export-todos');
  if (btnExportTodos) {
    btnExportTodos.addEventListener('click', () => {
      if (currentTodos.length === 0) {
        showToast('No tasks available to export', 'info');
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentTodos, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `taskpulse-todos-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Exported ToDos backup file successfully!', 'success');
    });
  }

  // Tab switching

  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentActiveTab = target.getAttribute('data-tab');
      filterAndRenderTodos();
    });
  });

  // Quick Add Task Form Submit
  quickAddForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = quickTitleInput.value.trim();
    if (!title) return;

    const payload = {
      title,
      category: quickCategoryInput.value,
      dueDate: quickDueDateInput.value || new Date().toISOString().split('T')[0],
      priority: 'Medium'
    };

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('ToDo task added successfully!', 'success');
        quickTitleInput.value = '';
        fetchTodos();
      } else {
        showToast(data.message || 'Failed to create task', 'error');
      }
    } catch (err) {
      showToast('Server connection error', 'error');
    }
  });

  // Modal Listeners
  btnOpenModal.addEventListener('click', () => openModal());
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  itemForm.addEventListener('submit', handleModalSubmit);

  // Poll server health status
  async function checkServerHealth() {
    try {
      const res = await fetch('/health');
      if (res.ok) {
        serverStatus.textContent = 'Healthy (Online)';
        serverStatus.style.color = '#10b981';
      } else {
        serverStatus.textContent = 'Degraded';
        serverStatus.style.color = '#f59e0b';
      }
    } catch (err) {
      serverStatus.textContent = 'Offline';
      serverStatus.style.color = '#f43f5e';
    }
  }

  // Fetch ToDos from API (tries /api/todos first, falls back to /api/items)
  async function fetchTodos() {
    itemsGrid.innerHTML = `
      <div class="loading-spinner">
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        <p>Loading ToDos from API...</p>
      </div>
    `;

    try {
      const res = await fetch('/api/todos');
      const data = await res.json();

      if (data.success) {
        currentTodos = data.data;
        updateMetrics(currentTodos);
        filterAndRenderTodos();
      } else {
        showToast(data.message || 'Failed to load ToDos', 'error');
      }
    } catch (err) {
      itemsGrid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: #f43f5e; margin-bottom: 12px;"></i>
          <p>Failed to connect to API server.</p>
        </div>
      `;
      showToast('API Connection Error', 'error');
    }
  }

  // Update Metrics & Tab Counters
  function updateMetrics(todos) {
    const total = todos.length;
    const active = todos.filter(t => !t.completed).length;
    const completed = todos.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    statTotal.textContent = total;
    statActive.textContent = active;
    statCompleted.textContent = completed;
    statRate.textContent = `${rate}%`;

    tabCountAll.textContent = total;
    tabCountActive.textContent = active;
    tabCountCompleted.textContent = completed;
  }

  // Filter and Render Cards
  function filterAndRenderTodos() {
    const query = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const selectedPriority = priorityFilter ? priorityFilter.value : 'All';

    let filtered = currentTodos.filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(query) || 
                            (todo.description && todo.description.toLowerCase().includes(query));
      const matchesCategory = selectedCategory === 'All' || todo.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesPriority = selectedPriority === 'All' || (todo.priority && todo.priority.toLowerCase() === selectedPriority.toLowerCase());
      
      let matchesTab = true;
      if (currentActiveTab === 'active') matchesTab = !todo.completed;
      if (currentActiveTab === 'completed') matchesTab = todo.completed;

      return matchesSearch && matchesCategory && matchesPriority && matchesTab;
    });


    if (filtered.length === 0) {
      itemsGrid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-clipboard-check" style="font-size: 2.5rem; color: #6b7280; margin-bottom: 12px;"></i>
          <p>No ToDo tasks found in this view.</p>
        </div>
      `;
      return;
    }

    itemsGrid.innerHTML = filtered.map(todo => createTodoCardHTML(todo)).join('');

    // Attach Event Listeners to Card Elements
    document.querySelectorAll('.todo-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        toggleTodoCompletion(id);
      });
    });

    document.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const todo = currentTodos.find(t => t.id === id);
        if (todo) openModal(todo);
      });
    });

    document.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteTodo(id);
      });
    });
  }

  // Card HTML Template
  function createTodoCardHTML(todo) {
    const isCompleted = Boolean(todo.completed);
    const priorityClass = (todo.priority || 'Medium').toLowerCase();
    const formattedDate = todo.dueDate ? todo.dueDate : 'No date';

    return `
      <div class="item-card glass-card ${isCompleted ? 'is-completed' : ''}">
        <div>
          <div class="item-header">
            <input type="checkbox" class="todo-checkbox" data-id="${todo.id}" ${isCompleted ? 'checked' : ''} title="Mark as ${isCompleted ? 'Pending' : 'Completed'}">
            <div class="item-title-group">
              <h3 class="item-title">${escapeHTML(todo.title)}</h3>
            </div>
          </div>
          ${todo.description ? `<p class="item-description">${escapeHTML(todo.description)}</p>` : ''}
        </div>
        <div>
          <div class="item-footer">
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <span class="tag tag-category">${escapeHTML(todo.category)}</span>
              <span class="tag tag-date"><i class="fa-regular fa-calendar"></i> ${escapeHTML(formattedDate)}</span>
              <span class="tag-priority-${priorityClass}"><i class="fa-solid fa-flag"></i> ${escapeHTML(todo.priority)}</span>
            </div>
            <div class="item-actions">
              <button class="btn-action edit btn-edit-item" data-id="${todo.id}" title="Edit ToDo">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-action delete btn-delete-item" data-id="${todo.id}" title="Delete ToDo">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Quick Toggle ToDo Completion (Checkbox)
  async function toggleTodoCompletion(id) {
    try {
      const res = await fetch(`/api/todos/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();

      if (res.ok && data.success) {
        const index = currentTodos.findIndex(t => t.id === id);
        if (index !== -1) {
          currentTodos[index] = data.data;
        }
        updateMetrics(currentTodos);
        filterAndRenderTodos();
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Failed to toggle task', 'error');
        fetchTodos();
      }
    } catch (err) {
      showToast('Error updating task status', 'error');
      fetchTodos();
    }
  }

  // Handle Modal Form Submit (Create / Edit)
  async function handleModalSubmit(e) {
    e.preventDefault();

    const id = itemIdInput.value;
    const payload = {
      title: itemTitleInput.value.trim(),
      description: itemDescInput.value.trim(),
      category: itemCategoryInput.value,
      dueDate: itemDueDateInput.value || new Date().toISOString().split('T')[0],
      priority: itemPriorityInput.value
    };

    const isEdit = Boolean(id);
    const url = isEdit ? `/api/todos/${id}` : '/api/todos';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(isEdit ? 'ToDo updated successfully' : 'New ToDo created successfully', 'success');
        closeModal();
        fetchTodos();
      } else {
        showToast(data.message || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast('Error sending data to server', 'error');
    }
  }

  // Delete ToDo
  async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this ToDo item?')) return;

    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('ToDo deleted successfully', 'success');
        fetchTodos();
      } else {
        showToast(data.message || 'Failed to delete task', 'error');
      }
    } catch (err) {
      showToast('Error deleting item', 'error');
    }
  }

  // Modal Control
  function openModal(todo = null) {
    if (todo) {
      modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit ToDo`;
      itemIdInput.value = todo.id;
      itemTitleInput.value = todo.title;
      itemDescInput.value = todo.description || '';
      itemCategoryInput.value = todo.category || 'General';
      itemDueDateInput.value = todo.dueDate || new Date().toISOString().split('T')[0];
      itemPriorityInput.value = todo.priority || 'Medium';
    } else {
      modalTitle.innerHTML = `<i class="fa-solid fa-square-plus"></i> Add New Task`;
      itemForm.reset();
      itemIdInput.value = '';
      itemDueDateInput.value = new Date().toISOString().split('T')[0];
    }
    modalOverlay.classList.remove('hidden');
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    itemForm.reset();
    itemIdInput.value = '';
  }

  // Toast Helper
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHTML(message)}</span>`;
    
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
});
