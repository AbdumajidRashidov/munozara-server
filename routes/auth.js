const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require('../keys')
const requireLogin = require('../middleware/requireLogin')

router.get('/', (req, res) => {
    res.send('Homepage')
})
router.get('/protected', requireLogin,(req, res) => {
    res.send("Salom bizning foydalanuvchi!")
})

router.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !name || !password) {
        return res.status(422).json({ error: "Iltimos barcha bo'limlarni to'ldiring!" })
    }

    User.findOne({ email: email })
        .then((savedUser) => {
            if (savedUser) {
                return res.status(422).json({ error: "BU email bilan ro'yxatdan o'tilgan!" })
            }
            bcrypt.hash(password, 15)
                .then(hashedpassword => {
                    const user = new User({
                        email,
                        password: hashedpassword,
                        name
                    })
                    user.save()
                        .then(user => {
                            res.json({ message: "Ma'lumotlar muvaffaqqiyatli saqlandi!" })
                        })
                        .catch(err => {
                            console.log(err)
                        })
                })


        }).catch(err => { console.log(err) })
})

router.post('/signin', (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        res.status(422).json({ error: "Iltimos email yoki parolni kiriting!" })
    }
    User.findOne({ email: email })
        .then(savedUser => {
            if (!savedUser) {
                res.status(422).json({ error: "Email yoki parol noto'g'ri!" })
            }
            bcrypt.compare(password, savedUser.password)
                .then(doMath => {
                    if (doMath) {
                        // res.json({ message: "Successfully singed in!" })
                        const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET)
                        const {_id,name,email}= savedUser
                        res.json({ token, user: { _id, name, email } })
                    } else {
                        res.status(422).json({ error: "Noto'g'ri parol!" })
                    }
                }).catch(err => {
                    console.log(err)
                })
        })
})

module.exports = router