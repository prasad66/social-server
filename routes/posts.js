const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../util/util');

// create a post

router.post('/', async (req, res) => {

    const { userId, desc, img } = req.body;

    const isValidUser = await User.findById(userId);

    if (!isValidUser) {
        res.status(404).json({ error: "Unauthorised" });
        return;
    }

    const newPost = new Post(req.body);

    try {
        const savedPpost = await newPost.save();
        res.status(201).json({ savedPpost });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }

});

// update a post 
router.put("/:id", async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {

            await post.updateOne({ $set: req.body });
            res.status(200).json("post has been updated");

        } else {
            res.status(403).json({ error: "Unauthorised. Cannot update others post" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});



// delete a post

router.delete("/:id", async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {

            await post.deleteOne();
            res.status(200).json("post has been deleted");

        } else {
            res.status(403).json({ error: "Unauthorised. Cannot delete others post" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

// like a post
router.put("/like/:id", async (req, res) => {

    try {
        const post = await Post.findById(req.params.id);

        if (!post.likes.includes(req.body.userId)) {
            await post.updateOne({ $push: { likes: req.body.userId } });
            res.status(200).json("post has been liked");
        }
        else {
            await post.updateOne({ $pull: { likes: req.body.userId } });
            res.status(200).json("post has been disliked");
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});


// get a post

router.get("/:id", async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404).json({ error: "post not found" });
            return;
        }

        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

// get timeline posts

router.get("/timeline/:userId", async (req, res) => {
    try {
        const currentUser = await User.findById(req.params.userId);
        const userPosts = await Post.find({ userId: currentUser._id });

        const friendPosts = await Promise.all(

            currentUser.following.map((friendId) => {
                return Post.find({ userId: friendId });
            })
        );
        res.status(200).json(userPosts.concat(...friendPosts));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

// get user's all posts
router.get("/profile/:username", async (req, res) => {
    try {

        const user = await User.findOne({ username: req.params.username });
        const posts = await Post.find({ userId: user._id });
        res.status(200).json(posts);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});




module.exports = router;