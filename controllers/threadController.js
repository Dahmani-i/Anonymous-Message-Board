const Thread = require('../models/Thread');
const Reply = require('../models/Reply');

exports.createThread = async (req, res) => {
  try {
    const { text, delete_password } = req.body;
    const { board } = req.params;
    
    if (!text || !delete_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const thread = new Thread({
      board,
      text,
      delete_password,
      created_on: new Date(),
      bumped_on: new Date()
    });
    
    await thread.save();
    res.json({ 
      _id: thread._id, 
      text: thread.text, 
      created_on: thread.created_on, 
      bumped_on: thread.bumped_on 
    });
  } catch (error) {
    console.error('Create thread error:', error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(400).json({ error: 'Database connection error' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getThreads = async (req, res) => {
  try {
    const { board } = req.params;
    const threads = await Thread.find({ board })
      .sort({ bumped_on: -1 })
      .limit(10);
    
    const threadsWithReplyCount = threads.map(thread => {
      // Get the 3 most recent replies
      const recentReplies = (thread.replies || [])
        .sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
        .slice(0, 3)
        .map(reply => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
        }));
      
      return {
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: recentReplies,
        replycount: thread.replycount || 0
      };
    });
    
    res.json(threadsWithReplyCount);
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteThread = async (req, res) => {
  try {
    const { board } = req.params;
    const { thread_id, delete_password } = req.body;
    
    if (!thread_id || !delete_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const thread = await Thread.findOne({ _id: thread_id, board });
    if (!thread) {
      return res.status(400).json({ error: 'Thread not found' });
    }
    
    if (thread.delete_password !== delete_password) {
      return res.status(400).json({ error: 'incorrect password' });
    }
    
    await Reply.deleteMany({ thread_id });
    await Thread.findByIdAndDelete(thread_id);
    
    res.json({ message: 'success' });
  } catch (error) {
    console.error('Delete thread error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.reportThread = async (req, res) => {
  try {
    const { board } = req.params;
    const { thread_id } = req.body;
    
    if (!thread_id) {
      return res.status(400).json({ error: 'Missing thread_id' });
    }
    
    const thread = await Thread.findOneAndUpdate(
      { _id: thread_id, board },
      { reported: true },
      { new: true }
    );
    
    if (!thread) {
      return res.status(400).json({ error: 'Thread not found' });
    }
    
    res.json({ message: 'success' });
  } catch (error) {
    console.error('Report thread error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 
