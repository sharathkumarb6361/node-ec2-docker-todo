// In-memory data store with initial sample data
let items = [
  {
    id: '1',
    title: 'Deploy to AWS EC2',
    description: 'Set up GitHub Actions workflow with Docker deployment to EC2 instance.',
    category: 'DevOps',
    status: 'In Progress',
    priority: 'High',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Write Unit & Integration Tests',
    description: 'Implement Jest and Supertest suite to validate API CRUD endpoints.',
    category: 'Testing',
    status: 'Completed',
    priority: 'High',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Configure Docker Container',
    description: 'Create multi-stage Dockerfile and docker-compose configurations.',
    category: 'Docker',
    status: 'Completed',
    priority: 'Medium',
    createdAt: new Date().toISOString()
  }
];

// Helper: generate unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

// Get all items (with optional search query & category filter)
exports.getItems = (req, res) => {
  try {
    let result = [...items];
    const { search, category, status } = req.query;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'All') {
      result = result.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }

    if (status && status !== 'All') {
      result = result.filter(item => item.status.toLowerCase() === status.toLowerCase());
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving items', error: error.message });
  }
};

// Get single item by ID
exports.getItemById = (req, res) => {
  try {
    const { id } = req.params;
    const item = items.find(i => i.id === id);

    if (!item) {
      return res.status(404).json({ success: false, message: `Item with ID '${id}' not found` });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving item', error: error.message });
  }
};

// Create new item
exports.createItem = (req, res) => {
  try {
    const { title, description, category, status, priority } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const newItem = {
      id: generateId(),
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'General',
      status: status || 'Pending',
      priority: priority || 'Medium',
      createdAt: new Date().toISOString()
    };

    items.unshift(newItem);

    return res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: newItem
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error creating item', error: error.message });
  }
};

// Update item
exports.updateItem = (req, res) => {
  try {
    const { id } = req.params;
    const index = items.findIndex(i => i.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Item with ID '${id}' not found` });
    }

    const { title, description, category, status, priority } = req.body;

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title cannot be empty' });
    }

    items[index] = {
      ...items[index],
      title: title !== undefined ? title.trim() : items[index].title,
      description: description !== undefined ? description.trim() : items[index].description,
      category: category !== undefined ? category : items[index].category,
      status: status !== undefined ? status : items[index].status,
      priority: priority !== undefined ? priority : items[index].priority,
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: items[index]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error updating item', error: error.message });
  }
};

// Delete item
exports.deleteItem = (req, res) => {
  try {
    const { id } = req.params;
    const index = items.findIndex(i => i.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Item with ID '${id}' not found` });
    }

    const deletedItem = items.splice(index, 1)[0];

    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
      data: deletedItem
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error deleting item', error: error.message });
  }
};

// Reset dataset (useful for testing)
exports.resetItems = () => {
  items = [
    {
      id: '1',
      title: 'Deploy to AWS EC2',
      description: 'Set up GitHub Actions workflow with Docker deployment to EC2 instance.',
      category: 'DevOps',
      status: 'In Progress',
      priority: 'High',
      createdAt: new Date().toISOString()
    }
  ];
};
