const config = require('../../config/config')
const User = require('mongoose').model('User')
const Patient = require('mongoose').model('Patient')
const Nurse = require('mongoose').model('Nurse')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const jwtExpirySeconds = 3600;
const jwtKey = config.secretKey;

exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body
    const user = await User.findOne({ email })
    if (user) return res.status(400).json({ msg: "The email already exists." })

    // Password Encryption
    const passwordHash = await bcrypt.hash(password, 10)

    var newUser = null
    if(role === 1){
      newUser = new Nurse({...req.body, password: passwordHash})
    } else{
      newUser = new Patient({...req.body, password: passwordHash})
    }
    newUser.save()
    return res.status(200).json(newUser)

  } catch (err) {
    return res.status(500).json({ msg: err.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ msg: "User does not exist." })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ msg: "Incorrect password" })

    //If login success, create access token
    const token = jwt.sign({ id: user._id }, jwtKey,
      { algorithm: 'HS256', expiresIn: jwtExpirySeconds });

    res.cookie('token', token, { maxAge: jwtExpirySeconds * 1000, httpOnly: true });

    return res.status(200).json({ token })

  } catch (err) {
    return res.status(500).json({ msg: err.message })
  }
}

exports.logout = async (req, res) => {
  try {
    res.clearCookie("token")
    return res.status('200').json({ msg: 'Logged out' })
  } catch (err) {
    return res.status(500).json({ msg: err.message })
  }
}