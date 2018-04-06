'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

const User = require('../models/user');

const seedUsers = require('../db/seed/users');

const expect = chai.expect;
chai.use(chaiHttp);

describe('/api/login', function () {
  let token;
  const id = '333333333333333333333300';
  const fullname = 'User Zero';
  const username = 'user0';
  const password = 'password';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });    

  beforeEach(function() {
    const testUser = seedUsers[0];
    return User.hashPassword(password)
      .then(digest => User.create({
        _id: testUser._id,
        username: testUser.username,
        password: digest,
        fullname: testUser.fullname
      }));
  });

  afterEach(function () {
    return User.remove();
    // alternatively you can drop the DB
    // return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });


  describe.only('POST', function () {

    it('Should return a valid auth token', function () {
      return chai.request(app)
        .post('/api/login')
        .send({ username, password })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.authToken).to.be.a('string');
      
          const payload = jwt.verify(res.body.authToken, JWT_SECRET);
          //   console.log('PAY', payload.user);
          expect(payload.user).to.not.have.property('password');
          expect(payload.user).to.deep.equal({ 'id': '333333333333333333333300', 'fullname': 'User Zero', 'username': 'user0' });
        });
    });

    it('Should reject requests with no credentials', function () {
      return chai.request(app)
        .post('/api/login')
        .send({})
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => err.response)
        .then(res => {
        //   console.log(res.body);
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal(
            'Bad Request'
          );
        });
    });

    // it.only('Should reject requests with incorrect usernames', function() {
    //   return chai.request(app)
    //     .post('api/login')
    //     .send({ username: 'fsadfsaf', password })
    //     // .catch(err => err.response)
    //     // .catch((err) => {//Why can't I catch the error response??
    //     //   console.log('ERROR', err);//err.response = undefined
    //     // });
    //   // .then(res => {
    //   //   console.log('RES', res.body);
    //   // });
    //     .then(() => 
    //       expect.fail(null, null, 'Request should not succeed')
    //     )
    //     .catch(err => err.response)
    //     // .catch((err) => {//Why can't I catch the error response??
    //     //   console.log('ERROR', err);//err.response = undefined
    //     // })
    //     .then(res => {
    //       console.log('RESSS', res);
    //     });


    // });

    it('Should reject requests with incorrect usernames', function () {
      return chai.request(app)
        .post('/api/login')
        .send({ username: 'fsadfsaf', password })
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => err.response)
        .then(res => {
          console.log(res.body);
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal(
            'Unauthorized'
          );
        });
    });

    it('Should reject requests with incorrect passwords', function () {
      return chai.request(app)
        .post('/api/login')
        .send({ username, password: 'password1234' })
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => err.response)
        .then(res => {
          console.log(res.body);
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal(
            'Unauthorized'
          );
        });
    });



  }); 
});