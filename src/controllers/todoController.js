// Initial sample ToDo items
let todos = [
  {
    id: '1',
    title: 'Complete Project Documentation',
    description: 'Review system requirements, outline key API endpoints, and finish final user guide.',
    category: 'Work',
    status: 'In Progress',
    completed: false,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'High',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Run Integration & Unit Tests',
    description: 'Execute automated test suite using Jest to verify API health and routes.',
    category: 'Work',
    status: 'Completed',
    completed: true,
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'High',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Buy Household Essentials',
    description: 'Pick up groceries, milk, organic fruits, and coffee.',
    category: 'Personal',
    status: 'Pending',
    completed: false,
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    priority: 'Medium',
    createdAt: new Date().toISOString()
  }
];

// Helper: generate unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

// Get all ToDos (supports search, category, priority, status, and completion filter)
exports.getTodos = (req, res) => {
  try {
    let result = [...todos];
    const { search, category, status, completed, priority } = req.query;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'All') {
      result = result.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    if (priority && priority !== 'All') {
      result = result.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
    }

    if (status && status !== 'All') {
      result = result.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }

    if (completed !== undefined && completed !== 'All') {
      const isComp = completed === 'true' || completed === '1';
      result = result.filter(t => t.completed === isComp);
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving ToDos', error: error.message });
  }
};

// Get summary statistics for dashboard
exports.getStats = (req, res) => {
  try {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;
    const highPriority = todos.filter(t => t.priority === 'High').length;
    const mediumPriority = todos.filter(t => t.priority === 'Medium').length;
    const lowPriority = todos.filter(t => t.priority === 'Low').length;

    return res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        priorities: {
          high: highPriority,
          medium: mediumPriority,
          low: lowPriority
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error calculating stats', error: error.message });
  }
};

// Get single ToDo by ID
exports.getTodoById = (req, res) => {
  try {
    const { id } = req.params;
    const todo = todos.find(t => t.id === id);

    if (!todo) {
      return res.status(404).json({ success: false, message: `ToDo task with ID '${id}' not found` });
    }

    return res.status(200).json({ success: true, data: todo });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving ToDo', error: error.message });
  }
};

// Create new ToDo
exports.createTodo = (req, res) => {
  try {
    const { title, description, category, status, dueDate, priority, completed } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const isCompleted = completed === true || status === 'Completed';

    const newTodo = {
      id: generateId(),
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'General',
      status: isCompleted ? 'Completed' : (status || 'Pending'),
      completed: isCompleted,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      priority: priority || 'Medium',
      createdAt: new Date().toISOString()
    };

    todos.unshift(newTodo);

    return res.status(201).json({
      success: true,
      message: 'ToDo created successfully',
      data: newTodo
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error creating ToDo', error: error.message });
  }
};

// Update ToDo
exports.updateTodo = (req, res) => {
  try {
    const { id } = req.params;
    const index = todos.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `ToDo task with ID '${id}' not found` });
    }

    const { title, description, category, status, dueDate, priority, completed } = req.body;

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title cannot be empty' });
    }

    let isCompleted = todos[index].completed;
    if (completed !== undefined) {
      isCompleted = Boolean(completed);
    } else if (status !== undefined) {
      isCompleted = status === 'Completed';
    }

    let newStatus = todos[index].status;
    if (status !== undefined) {
      newStatus = status;
    } else if (completed !== undefined) {
      newStatus = completed ? 'Completed' : 'Pending';
    }

    todos[index] = {
      ...todos[index],
      title: title !== undefined ? title.trim() : todos[index].title,
      description: description !== undefined ? description.trim() : todos[index].description,
      category: category !== undefined ? category : todos[index].category,
      status: newStatus,
      completed: isCompleted,
      dueDate: dueDate !== undefined ? dueDate : todos[index].dueDate,
      priority: priority !== undefined ? priority : todos[index].priority,
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'ToDo updated successfully',
      data: todos[index]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error updating ToDo', error: error.message });
  }
};

// Quick toggle completion status (Check / Uncheck)
exports.toggleTodo = (req, res) => {
  try {
    const { id } = req.params;
    const index = todos.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `ToDo task with ID '${id}' not found` });
    }

    const newCompleted = !todos[index].completed;

    todos[index] = {
      ...todos[index],
      completed: newCompleted,
      status: newCompleted ? 'Completed' : 'Pending',
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: `ToDo marked as ${newCompleted ? 'Completed' : 'Pending'}`,
      data: todos[index]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error toggling ToDo', error: error.message });
  }
};

// Delete ToDo
exports.deleteTodo = (req, res) => {
  try {
    const { id } = req.params;
    const index = todos.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `ToDo task with ID '${id}' not found` });
    }

    const deleted = todos.splice(index, 1)[0];

    return res.status(200).json({
      success: true,
      message: 'ToDo deleted successfully',
      data: deleted
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error deleting ToDo', error: error.message });
  }
};

// Bulk delete all completed ToDos
exports.clearCompletedTodos = (req, res) => {
  try {
    const initialCount = todos.length;
    todos = todos.filter(t => !t.completed);
    const removedCount = initialCount - todos.length;

    return res.status(200).json({
      success: true,
      message: `Cleared ${removedCount} completed ToDo task(s)`,
      count: removedCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error clearing completed ToDos', error: error.message });
  }
};

// Reset dataset for testing
exports.resetTodos = () => {
  todos = [
    {
      id: '1',
      title: 'Complete Project Documentation',
      description: 'Review system requirements, outline key API endpoints, and finish final user guide.',
      category: 'Work',
      status: 'In Progress',
      completed: false,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: 'High',
      createdAt: new Date().toISOString()
    }
  ];
};
