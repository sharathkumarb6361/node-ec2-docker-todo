const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');

// Routes for /api/todos
router.get('/', todoController.getTodos);
router.get('/stats', todoController.getStats);
router.get('/:id', todoController.getTodoById);
router.post('/', todoController.createTodo);

router.put('/:id', todoController.updateTodo);
router.patch('/:id/toggle', todoController.toggleTodo);
router.delete('/completed', todoController.clearCompletedTodos);
router.delete('/:id', todoController.deleteTodo);


module.exports = router;
