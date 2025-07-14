const Thread = require('../models/Thread');
const Reply = require('../models/Reply');
const mongoose = require('mongoose');

exports.createReply = async (req, res) => {
  try {
    const { text, delete_password, thread_id } = req.body;
    const { board } = req.params;
    
    if (!text || !delete_password || !thread_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const thread = await Thread.findOne({ _id: thread_id, board });
    if (!thread) {
      return res.status(400).json({ error: 'Thread not found' });
    }
    
    const reply = new Reply({
      thread_id,
      text,
      delete_password,
      created_on: new Date()
    });
    
    await reply.save();
    
    // Add the reply object to the thread's replies array
    thread.replies.push({
      _id: reply._id,
      text: reply.text,
      created_on: reply.created_on,
      delete_password: reply.delete_password,
      reported: reply.reported
    });
    thread.replycount = thread.replies.length;
    thread.bumped_on = reply.created_on;
    await thread.save();
    
    res.json({ _id: reply._id, text: reply.text, created_on: reply.created_on });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getReplies = async (req, res) => {
  try {
    const { board } = req.params;
    const { thread_id } = req.query;
    
    if (!thread_id) {
      return res.status(400).json({ error: 'Missing thread_id' });
    }
    
    const thread = await Thread.findOne({ _id: thread_id, board });
    
    if (!thread) {
      return res.status(400).json({ error: 'Thread not found' });
    }
    
    res.json({
      _id: thread._id,
      text: thread.text,
      created_on: thread.created_on,
      bumped_on: thread.bumped_on,
      replies: (thread.replies || []).map(reply => ({
        _id: reply._id,
        text: reply.text,
        created_on: reply.created_on
      }))
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteReply = async (req, res) => {
  try {
    const { board } = req.params;
    const { thread_id, reply_id, delete_password } = req.body;
    
    if (!thread_id || !reply_id || !delete_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const thread = await Thread.findOne({ _id: thread_id, board });
    if (!thread) {
      return res.status(400).json({ error: 'Thread not found' });
    }
    
    const reply = await Reply.findOne({ _id: reply_id, thread_id });
    if (!reply) {
      return res.status(400).json({ error: 'Reply not found' });
    }
    
    if (reply.delete_password !== delete_password) {
      return res.status(400).json({ error: 'incorrect password' });
    }
    
    reply.text = '[deleted]';
    await reply.save();
    
    // Update the reply in the thread's embedded array
    const replyIndex = thread.replies.findIndex(r => r._id.toString() === reply_id);
    if (replyIndex !== -1) {
      thread.replies[replyIndex].text = '[deleted]';
      await thread.save();
    }
    
    res.json({ message: 'success' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.reportReply = async (req, res) => {
  try {
    const { board } = req.params;
    const { thread_id, reply_id } = req.body;
    
    if (!thread_id || !reply_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const thread = await Thread.findOne({ _id: thread_id, board });
    if (!thread) {
      return res.status(400).json({ error: 'Thread not found' });
    }
    
    const reply = await Reply.findOneAndUpdate(
      { _id: reply_id, thread_id },
      { reported: true },
      { new: true }
    );
    
    if (!reply) {
      return res.status(400).json({ error: 'Reply not found' });
    }
    
    // Update the reply in the thread's embedded array
    const replyIndex = thread.replies.findIndex(r => r._id.toString() === reply_id);
    if (replyIndex !== -1) {
      thread.replies[replyIndex].reported = true;
      await thread.save();
    }
    
    res.json({ message: 'success' });
  } catch (error) {
    console.error('Report reply error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 