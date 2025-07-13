const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
chai.use(chaiHttp);
const server = require('../server');


suite('Functional Tests', function() {
  // Increase timeout to 15 seconds for database operations
  this.timeout(15000);
  
  const testBoard = 'test-board';
  const testPassword = 'testpassword123';
  const wrongPassword = 'wrongpassword';

  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Test thread text',
        delete_password: testPassword
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, '_id');
        assert.property(res.body, 'text');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'bumped_on');
        assert.equal(res.body.text, 'Test thread text');
        done();
      });
  });

  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
    chai.request(server)
      .get(`/api/threads/${testBoard}`)
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        if (res.body.length > 0) {
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'bumped_on');
          assert.property(res.body[0], 'replies');
          assert.property(res.body[0], 'replycount');
          assert.isArray(res.body[0].replies);
        }
        done();
      });
  });

  test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    // First create a thread, then create a reply
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread for reply test',
        delete_password: testPassword
      })
      .end(function(err, res) {
        const threadId = res.body._id;
        
        chai.request(server)
          .post(`/api/replies/${testBoard}`)
          .send({
            text: 'Test reply text',
            delete_password: testPassword,
            thread_id: threadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'created_on');
            assert.equal(res.body.text, 'Test reply text');
            done();
          });
      });
  });

  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
    // First create a thread and reply, then view them
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread for viewing test',
        delete_password: testPassword
      })
      .end(function(err, res) {
        const threadId = res.body._id;
        
        chai.request(server)
          .post(`/api/replies/${testBoard}`)
          .send({
            text: 'Reply for viewing test',
            delete_password: testPassword,
            thread_id: threadId
          })
          .end(function(err, res) {
            chai.request(server)
              .get(`/api/replies/${testBoard}`)
              .query({ thread_id: threadId })
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, '_id');
                assert.property(res.body, 'text');
                assert.property(res.body, 'created_on');
                assert.property(res.body, 'bumped_on');
                assert.property(res.body, 'replies');
                assert.isArray(res.body.replies);
                assert.equal(res.body._id, threadId);
                done();
              });
          });
      });
  });

  test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
    // First create a thread, then try to delete with wrong password
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread to delete with wrong password',
        delete_password: testPassword
      })
      .end(function(err, res) {
        const threadId = res.body._id;
        
        chai.request(server)
          .delete(`/api/threads/${testBoard}`)
          .send({
            thread_id: threadId,
            delete_password: wrongPassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.property(res.body, 'error');
            assert.equal(res.body.error, 'incorrect password');
            done();
          });
      });
  });

  test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
    // First create a thread, then delete with correct password
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread to delete with correct password',
        delete_password: testPassword
      })
      .end(function(err, res) {
        const threadId = res.body._id;
        
        chai.request(server)
          .delete(`/api/threads/${testBoard}`)
          .send({
            thread_id: threadId,
            delete_password: testPassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, 'message');
            assert.equal(res.body.message, 'success');
            done();
          });
      });
  });

  test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    // First create a new thread to report
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread to report',
        delete_password: testPassword
      })
      .end(function(err, res) {
        const threadToReport = res.body._id;
        
        chai.request(server)
          .put(`/api/threads/${testBoard}`)
          .send({
            thread_id: threadToReport
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, 'message');
            assert.equal(res.body.message, 'success');
            done();
          });
      });
  });

  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
    // First create a thread and reply to test deletion
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread for reply test',
        delete_password: testPassword
      })
      .end(function(err, res) {
        const threadId = res.body._id;
        
        chai.request(server)
          .post(`/api/replies/${testBoard}`)
          .send({
            text: 'Reply to delete',
            delete_password: testPassword,
            thread_id: threadId
          })
          .end(function(err, res) {
            const replyId = res.body._id;
            
            chai.request(server)
              .delete(`/api/replies/${testBoard}`)
              .send({
                thread_id: threadId,
                reply_id: replyId,
                delete_password: wrongPassword
              })
              .end(function(err, res) {
                assert.equal(res.status, 400);
                assert.property(res.body, 'error');
                assert.equal(res.body.error, 'incorrect password');
                done();
              });
          });
      });
  });

  test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
    // First create a thread and reply to test deletion
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread for reply deletion test',
        delete_password: testPassword
      })
      .end(function(err, res) {
        const threadId = res.body._id;
        
        chai.request(server)
          .post(`/api/replies/${testBoard}`)
          .send({
            text: 'Reply to delete with correct password',
            delete_password: testPassword,
            thread_id: threadId
          })
          .end(function(err, res) {
            const replyId = res.body._id;
            
            chai.request(server)
              .delete(`/api/replies/${testBoard}`)
              .send({
                thread_id: threadId,
                reply_id: replyId,
                delete_password: testPassword
              })
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'message');
                assert.equal(res.body.message, 'success');
                done();
              });
          });
      });
  });

  test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
    // First create a thread and reply to test reporting
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread for reply reporting test',
        delete_password: testPassword
      })
      .end(function(err, res) {
        const threadId = res.body._id;
        
        chai.request(server)
          .post(`/api/replies/${testBoard}`)
          .send({
            text: 'Reply to report',
            delete_password: testPassword,
            thread_id: threadId
          })
          .end(function(err, res) {
            const replyId = res.body._id;
            
            chai.request(server)
              .put(`/api/replies/${testBoard}`)
              .send({
                thread_id: threadId,
                reply_id: replyId
              })
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'message');
                assert.equal(res.body.message, 'success');
                done();
              });
          });
      });
  });
});
