const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database.js');

// User Schema
const UserSchema = mongoose.Schema ({
  name: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },  
  message: {
    type: String,
    required: false
  }  
});

const User = module.exports = mongoose.model('User', UserSchema);

module.exports.getUserById = function(id, callback) {
  User.findById(id, callback);
}

module.exports.getUserByUsername = function(username, callback) {
  const query = {username: username}
  User.findOne(query, callback);
}

module.exports.updateUser = function(updateUser, callback) {
  var query = { username: updateUser.username, password:updateUser.password };
  User.update(query, { message:updateUser.message}, { multi: false }, callback)
}

module.exports.addUser = function(newUser, callback) {
  UserSchema.index({username: 1}, {unique:true});
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if(err) throw err;
      newUser.password = hash;
      newUser.save(callback);
    });
  });
}

module.exports.addoAuthUser = function(newUser, callback) {
  UserSchema.index({username: 1}, {unique:true});
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if(err) throw err;
      newUser.password = hash;
      //newUser.save(callback);

      var query = {'username':newUser.username};   
      User.findOneAndUpdate(query, { $set: { name: newUser.name, email: newUser.email } },
                                  { upsert:true, useFindAndModify: false, passRawResult: true}, 
                                  (err, doc, res)=>{
                                    if (err) 
                                      throw err;
                                    callback();
                                    return doc;
                                  });
    });
  });
}

module.exports.comparePassword = function(candidatePassword, hash, callback) {
  bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    if(err) throw err;
    callback(null, isMatch);
  });
}