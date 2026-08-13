const request = require('supertest');
const app = require('../src/app');
const todoController = require('../src/controllers/todoController');

describe('TaskPulse ToDo Website API Integration Suite', () => {

  beforeEach(() => {
    // Reset dataset before each test case
    todoController.resetTodos();
  });

  describe('GET /health', () => {
    it('should return 200 OK and server health details', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.application).toBe('TaskPulse ToDo Website');
    });
  });

  describe('GET /api/todos', () => {
    it('should retrieve all ToDo tasks with 200 status', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter ToDos by category', async () => {
      const res = await request(app).get('/api/todos?category=Work');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.every(t => t.category === 'Work')).toBe(true);
    });

    it('should filter ToDos by priority', async () => {
      const res = await request(app).get('/api/todos?priority=High');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.every(t => t.priority === 'High')).toBe(true);
    });
  });

  describe('GET /api/todos/stats', () => {
    it('should return 200 OK and calculated statistics summary', async () => {
      const res = await request(app).get('/api/todos/stats');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toHaveProperty('total');
      expect(res.body.stats).toHaveProperty('active');
      expect(res.body.stats).toHaveProperty('completed');
      expect(res.body.stats).toHaveProperty('completionRate');
    });
  });

  describe('GET /api/todos/:id', () => {
    it('should return ToDo by valid ID', async () => {
      const res = await request(app).get('/api/todos/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('1');
    });

    it('should return 404 Not Found for non-existent ID', async () => {
      const res = await request(app).get('/api/todos/unknown-999');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new ToDo task', async () => {
      const newTodo = {
        title: 'Buy fresh groceries',
        description: 'Milk, bread, cheese, and coffee',
        category: 'Personal',
        dueDate: '2026-08-15',
        priority: 'Medium'
      };

      const res = await request(app)
        .post('/api/todos')
        .send(newTodo);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(newTodo.title);
      expect(res.body.data.completed).toBe(false);
    });

    it('should return 400 Bad Request when title is missing', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ category: 'Work' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Title is required');
    });
  });

  describe('PATCH /api/todos/:id/toggle', () => {
    it('should toggle ToDo completed status', async () => {
      const initial = await request(app).get('/api/todos/1');
      const initialStatus = initial.body.data.completed;

      const res = await request(app).patch('/api/todos/1/toggle');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completed).toBe(!initialStatus);
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update existing ToDo details', async () => {
      const res = await request(app)
        .put('/api/todos/1')
        .send({ title: 'Updated EC2 Deployment Title', priority: 'High' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated EC2 Deployment Title');
      expect(res.body.data.priority).toBe('High');
    });
  });

  describe('DELETE /api/todos/completed', () => {
    it('should clear all completed ToDo tasks', async () => {
      const res = await request(app).delete('/api/todos/completed');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const allRes = await request(app).get('/api/todos');
      expect(allRes.body.data.every(t => !t.completed)).toBe(true);
    });
  });

  describe('DELETE /api/todos/:id', () => {

    it('should delete existing ToDo task', async () => {
      const res = await request(app).delete('/api/todos/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const fetchRes = await request(app).get('/api/todos/1');
      expect(fetchRes.statusCode).toBe(404);
    });
  });
});
