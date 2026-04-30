import mongoose from 'mongoose';
import User from './src/models/User.js';

mongoose.connect('mongodb://127.0.0.1:27017/lpu_marketplace_v2')
  .then(async () => {
    const users = await User.find({}, 'email role status');
    console.log(users);
    mongoose.disconnect();
  });
