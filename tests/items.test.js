const request = require('supertest');
const app = require('../src/app');
const itemController = require('../src/controllers/itemController');

describe('Node.js CRUD Web App API Integration Suite', () => {

  beforeEach(() => {
    // Reset dataset before each test case
    itemController.resetItems();
  });

  describe('GET /health', () => {
    it('should return 200 OK and server health details', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/items', () => {
    it('should retrieve all items with 200 status', async () => {
      const res = await request(app).get('/api/items');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter items by category', async () => {
      const res = await request(app).get('/api/items?category=DevOps');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.every(i => i.category === 'DevOps')).toBe(true);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return item by valid ID', async () => {
      const res = await request(app).get('/api/items/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('1');
    });

    it('should return 404 Not Found for non-existent ID', async () => {
      const res = await request(app).get('/api/items/non-existent-999');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item with valid data', async () => {
      const newItemPayload = {
        title: 'Configure GitHub Actions Secrets',
        description: 'Add DOCKER_USERNAME, DOCKER_PASSWORD, and EC2 SSH variables.',
        category: 'DevOps',
        status: 'Pending',
        priority: 'High'
      };

      const res = await request(app)
        .post('/api/items')
        .send(newItemPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(newItemPayload.title);
      expect(res.body.data).toHaveProperty('id');
    });

    it('should return 400 Bad Request when title is missing', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ category: 'General' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Title is required');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update existing item data', async () => {
      const res = await request(app)
        .put('/api/items/1')
        .send({ status: 'Completed', priority: 'Low' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Completed');
      expect(res.body.data.priority).toBe('Low');
    });

    it('should return 404 when updating non-existent item', async () => {
      const res = await request(app)
        .put('/api/items/99999')
        .send({ title: 'New Title' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete existing item', async () => {
      const res = await request(app).delete('/api/items/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify item is removed
      const fetchRes = await request(app).get('/api/items/1');
      expect(fetchRes.statusCode).toBe(404);
    });

    it('should return 404 when deleting non-existent item', async () => {
      const res = await request(app).delete('/api/items/unknown-id');
      expect(res.statusCode).toBe(404);
    });
  });
});
