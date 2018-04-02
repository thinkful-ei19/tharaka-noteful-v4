'use strict';

const mongoose = require('mongose');

const userSchema = new mongoose.Schema({
  fullname: { type: String, default: '' },
  username: { type: String, unique: true, require: true },
  password: { type: String, require: true }
});

userSchema.set('toObject', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
  }
});

module.exports = mongoose.model('User', userSchema);