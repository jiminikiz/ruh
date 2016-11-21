var Question = require('../models/question');

module.exports = {
    create: (req, res) => {
        var newDoc = new Question(req.body);
        console.log("ROUTE CREATING QUESTION FROM :", req.body);
        newDoc.qUser = req.session.userId;
        newDoc.save((err, doc)=>{
            if(err){
                res.status(500).send(err);
            } else {
                res.send(doc);
            }
        });
    },
    get: (req, res) => {
        // get One
        if(req.params.id) {
            Question.findOne({ _id : req.params.id }, (err, document) => {
                if(err){
                    return res.status(500).send(err);
                }

                if(!document){
                    res.send('No question with that id');
                } else {
                    res.send(document);
                }
            });
        } else {
            Question.find({}, (err, documents) => {
                if(err){
                    res.status(500).send(err);
                } else {
                    res.send(documents);
                }
            });
        }
    }
};
