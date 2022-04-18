const router = require('express').Router();
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../util/util');


// update a user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { userId, password, isAdmin } = req.body;

    if (id === userId || isAdmin) {
        if (password) {
            try {
                req.body.password = await hashPassword(password);
            } catch (error) {
                console.log(error);
                res.status(500).json({ error: error.message });
            }
        }
        try {
            const user = await User.findByIdAndUpdate(id, {
                $set: req.body
            }, { new: true });
            const { password, ...userWithoutPassword } = user.toObject();
            res.status(200).json({ user: userWithoutPassword, msg: "User updated successfully" });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }


    } else {
        res.status(403).send({ message: 'Unauthorized.You can update only your account' });
        return;
    }

});

// delete user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { userId, isAdmin } = req.body;

    if (id === userId || isAdmin) {
        try {
            const user = await User.findByIdAndDelete(id);
            const { password, ...userWithoutPassword } = user.toObject();
            res.status(200).json({ msg: "User Deleted successfully" });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }


    } else {
        res.status(403).send({ message: 'Unauthorized.You can delete only your account' });
        return;
    }

});

// get a user
router.get('/', async (req, res) => {

    const userId = req.query.userId;
    const username = req.query.username;

    try {

        const user = userId
            ? await User.findById(userId)
            : await User.findOne({ username: username });

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const { password, ...userWithoutPassword } = user.toObject();
        res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }


});

// get friends
router.get('/friends/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        const friends = await Promise.all(
            user.following.map(friendId => {
                return User.findById(friendId);
            })
        )

        let friendList = [];
        friends.map(friend => {
            const { _id, username, profilePicture } = friend;
            friendList.push({ _id, username, profilePicture })
        });

        res.status(200).send(friendList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// follow a user
router.put('/follow/:id', async (req, res) => {

    const { id } = req.params;
    const { userId } = req.body;

    if (userId !== id) {
        try {

            const user = await User.findById(id); // user to be followed
            const currentUser = await User.findById(userId);
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            // if (!user.followers.includes(userId)) {
                await user.updateOne({ $push: { followers: userId } });
                await currentUser.updateOne({ $push: { following: id } });
                await user.save();
                await currentUser.save();
                res.status(200).json({ msg: "User followed successfully" });
            // } else {
            //     res.status(403).send({ message: 'Already following this user' });
            //     return;
            // }

        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }

    } else {
        res.status(403).send({ message: 'Unauthorized.You can follow only other users' });
        return;
    }

});


// unfollow a user
router.put('/unfollow/:id', async (req, res) => {

    const { id } = req.params;
    const { userId } = req.body;

    if (userId !== id) {
        try {

            const user = await User.findById(id);
            const currentUser = await User.findById(userId);
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            // if (user.followers.includes(userId)) {
                await user.updateOne({ $pull: { followers: userId } });
                await currentUser.updateOne({ $pull: { following: id } });
                await user.save();
                await currentUser.save();
                res.status(200).json({ msg: "User unfollowed successfully" });
            // } else {
            //     res.status(403).send({ message: 'Your are not following this user' });
            //     return;
            // }

        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }

    } else {
        res.status(403).send({ message: 'Unauthorized.You cannot unfollow yourself' });
        return;
    }

});

module.exports = router;