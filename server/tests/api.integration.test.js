const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

jest.setTimeout(60000);

let mongoServer;
let app;
let connectDatabase;
let models;

async function registerUser({ username, email, password }) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ username, email, password });
  expect(response.status).toBe(201);
}

async function loginUser({ email, password }) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  expect(response.status).toBe(200);
  return response.body;
}

describe('API integration: auth, transactions, chat, moderation, reports', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test_secret_for_jwt';
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    process.env.PORT = '0';
    process.env.NODE_ENV = 'test';

    // Require after env setup so server picks test config.
    // eslint-disable-next-line global-require
    const serverModule = require('../server');
    app = serverModule.app;
    connectDatabase = serverModule.connectDatabase;
    models = serverModule.models;

    await connectDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  test('auth flow: register/login/me/refresh and protected endpoint guard', async () => {
    await registerUser({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123'
    });

    const login = await loginUser({
      email: 'alice@example.com',
      password: 'password123'
    });

    expect(login.access_token).toBeTruthy();
    expect(login.refresh_token).toBeTruthy();
    expect(login.username).toBe('alice');

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.access_token}`);
    expect(me.status).toBe(200);
    expect(me.body.username).toBe('alice');

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refresh_token: login.refresh_token });
    expect(refresh.status).toBe(200);
    expect(refresh.body.access_token).toBeTruthy();
    expect(refresh.body.refresh_token).toBeTruthy();

    const protectedNoToken = await request(app).get('/api/users');
    expect(protectedNoToken.status).toBe(401);
    expect(protectedNoToken.body).toEqual(
      expect.objectContaining({
        code: 'UNAUTHORIZED',
        message: expect.any(String)
      })
    );
  });

  test('transactions flow: spend WTK creates sender+receiver records', async () => {
    await registerUser({
      username: 'bob',
      email: 'bob@example.com',
      password: 'password123'
    });

    const aliceLogin = await loginUser({
      email: 'alice@example.com',
      password: 'password123'
    });

    const tx = await request(app)
      .post('/api/transactions/apply')
      .set('Authorization', `Bearer ${aliceLogin.access_token}`)
      .send({
        username: 'alice',
        type: 'spent',
        title: 'WTK transfer',
        selectedUser: 'bob',
        wtk: 50
      });

    expect(tx.status).toBe(201);
    expect(tx.body.message).toMatch(/WTK sent/i);

    const aliceTx = await request(app)
      .get('/api/transactions/user/alice')
      .set('Authorization', `Bearer ${aliceLogin.access_token}`);
    expect(aliceTx.status).toBe(200);
    expect(Array.isArray(aliceTx.body)).toBe(true);
    expect(aliceTx.body.some((r) => r.type === 'spent')).toBe(true);
  });

  test('chat flow: create message and enforce sender-only delete', async () => {
    const aliceLogin = await loginUser({
      email: 'alice@example.com',
      password: 'password123'
    });
    const bobLogin = await loginUser({
      email: 'bob@example.com',
      password: 'password123'
    });

    const sent = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${aliceLogin.access_token}`)
      .send({
        sender_username: 'alice',
        receiver_username: 'bob',
        text: 'hello bob'
      });
    expect(sent.status).toBe(201);
    const messageId = String(sent.body._id);

    const bobDeleteAttempt = await request(app)
      .delete(`/api/messages/${messageId}`)
      .set('Authorization', `Bearer ${bobLogin.access_token}`)
      .send({});
    expect(bobDeleteAttempt.status).toBe(403);

    const aliceDelete = await request(app)
      .delete(`/api/messages/${messageId}`)
      .set('Authorization', `Bearer ${aliceLogin.access_token}`)
      .send({});
    expect(aliceDelete.status).toBe(200);
  });

  test('reports + moderation flow: user report and admin status update', async () => {
    await registerUser({
      username: 'admin1',
      email: 'admin1@example.com',
      password: 'password123'
    });
    await models.User.updateOne({ username: 'admin1' }, { $set: { role: 'admin' } });

    const aliceLogin = await loginUser({
      email: 'alice@example.com',
      password: 'password123'
    });
    const adminLogin = await loginUser({
      email: 'admin1@example.com',
      password: 'password123'
    });

    const report = await request(app)
      .post('/api/reports/user')
      .set('Authorization', `Bearer ${aliceLogin.access_token}`)
      .send({
        reporter_username: 'alice',
        reported_username: 'bob',
        reason: 'spam',
        details: 'test report'
      });
    expect(report.status).toBe(201);
    const reportId = String(report.body.report._id);

    const listReports = await request(app)
      .get('/api/admin/reports?status=open')
      .set('Authorization', `Bearer ${adminLogin.access_token}`);
    expect(listReports.status).toBe(200);
    expect(Array.isArray(listReports.body)).toBe(true);
    expect(listReports.body.some((r) => String(r._id) === reportId)).toBe(true);

    const updateStatus = await request(app)
      .patch(`/api/admin/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${adminLogin.access_token}`)
      .send({ status: 'reviewed' });
    expect(updateStatus.status).toBe(200);
    expect(updateStatus.body.report.status).toBe('reviewed');
  });
});
