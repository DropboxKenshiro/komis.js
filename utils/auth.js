var crypto = require("crypto")
var passport = require("passport")
var jsonwebtoken = require("jsonwebtoken");
var LocalStrategy = require("passport-local");
var JwtStrategy = require("passport-jwt").Strategy;
var JwtExtractors = require("passport-jwt").ExtractJwt;

var {User} = require("../models/models");
const { doesNotReject } = require("assert");

const tokenOptions = {
    secretOrKey: process.env.JWT_SECRET,
    jwtFromRequest: JwtExtractors.fromAuthHeaderAsBearerToken(),
    audience: "komisjs-users",
    issuer: "komisjs"
}

passport.use(new LocalStrategy({usernameField: "email", session: false}, async function (email, password, done) {
    try {
        const loginData = await User.findOne({
            attributes: ['email', 'password', 'salt'],
            where: {
              email: email
            }
          });

          const hasher = crypto.createHash('sha256');
          hasher.update(password + loginData.salt);
        
          if(loginData != null && hasher.digest('hex') === loginData.password) {
            return done(null, loginData);
          }
          else {
            return done(null, false);
          }
    }
    catch (err) {
        return done(err, false);
    }
}));

passport.use(new JwtStrategy(tokenOptions, async function (jwtPayload, done) {
    try {
        const user = await User.findByPk(jwtPayload.email);

        if(user) {
            return done(null, user)
        }
        else {
            return done(null, false)
        }
    }
    catch (err) {
        return done(err, false);
    }
}));

function issueToken(userEmail) {
    return jsonwebtoken.sign({
        email: userEmail
      },
      tokenOptions.secretOrKey,
      {
        expiresIn: "1d",
        audience: tokenOptions.audience,
        issuer: tokenOptions.issuer
      })
}

module.exports = {issueToken};