const router = require('express').Router();
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../util/util');

// register
router.post('/register', async (req, res) => {

    const { username, email, password } = req.body;


    try {
        // hashing password
        const hashedPassword = await hashPassword(password);

        const newUser = await new User({
            username: username,
            email: email,
            password: hashedPassword

        });

        // saving new user
        await newUser.save();

        res.status(201).send({ user: newUser._id });
    } catch (err) {
        res.status(400).send(err);
    }

});


// login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email });

        if (!user) {
            res.status(404).send({ message: 'User not found' });
            return;
        }

        // comparing password
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            res.status(400).send({ message: 'Invalid password' });
            return;
        }

        res.status(200).send({  user });
    } catch (err) {
        res.status(500).send(err);
    }


});



module.exports = router;