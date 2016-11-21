var socketIO = require('socket.io'),
    Question = require('./models/question'),
    Admin = require('./models/admin');

module.exports = ( Servers ) => {
    var io = socketIO.listen(Servers.HTTPS);

    io.sockets.on('connection', registerListeners);

    function registerListeners(socket) {
        var first = true;
        var allInqs = [];  // used for testing when database is not available
        //messages are simply broadcast to all sockets
        socket.on('message', (message) => {
            socket.broadcast.emit('message', message);

            if (typeof message === "string") {
                console.log(`BC MESSAGE ${message} FROM ${socket.id}  ` );
            } else {
                if(message.type !== "candidate"   ){
                    console.log(`BC MESSAGE ${message.type} FROM ${socket.id}  ` );
                }
            }
        });

        socket.on('noDatabase', (questionObjs) => {
            // add the question object with a key of the socketID
            //allInqs.push({"id":socket.id, "question":questionObj});

            // here we get all the questions
            allInqs = questionObjs;
            var newQuestion = allInqs[allInqs.length -1]

            // create the room with the new question UUID
            socket.join( newQuestion.qUUID );
            console.log(`${socket.id} noDatabase ${newQuestion.qUUID}`);

            // ping back to questioner  (was "created")  send back the new question object
            socket.emit('created', newQuestion.qUUID, socket.id);

            // send the array of inquiries back to everyone
            socket.broadcast.emit('allQuestions', allInqs, socket.id);
            //console.log(allInqs);
        });

        socket.on('useDatabase', (newQuestion) => {
            var newDoc = new Question(newQuestion);
            newDoc.qSubject = newQuestion.selectedCat.subjectName;
            //TODO newDoc.qUser = req.session.userId;  populate this on the front end :
            newDoc.save((err, doc)=>{
                if(err){
                    console.log("SOCKET ERR SAVING ", newDoc);
                }
                console.log("SOCKET  SAVED ", newDoc);
            });

            // create the room with the new question UUID
            socket.join( newDoc._id );
            console.log(`${socket.id} using room ${newDoc._id}`);

            // ping back to questioner  (was "created")  send back the new question object
            socket.emit('created', newDoc._id, socket.id);  // client sets "initiator"

            // send an array of questions back to everyone
            Question.find({}, (err, documents)=>{
                if(err){
                    console.log("Question.find ERR  ", err);
                }
                //console.log("allQuestions", documents);
                socket.broadcast.emit('allQuestions', documents, socket.id);
            });
        });

        socket.on('getAllQuestions', () => {
            Question.find({}, (err, documents)=>{
                if(err){
                    console.log("Question.find ERR  ", err);
                }
                //console.log("SENDING QUESTIONS  ", documents);
                socket.emit('allQuestions', documents, socket.id);
            });
        });

        socket.on('getAllAdmin', () => {
            Admin.findOne({}, (err, documents)=>{
                if(err){
                    console.log("Admin.find ERR  ", err);
                }

                //console.log("SENDING ADMIN  ", documents);
                socket.emit('getAllAdmin', documents, socket.id);
            });
        });

        socket.on('answer', (qUUID) => {
            socket.join(qUUID);
            console.log(` ${socket.id} IS ANSWERING ${qUUID}`)

            io.sockets.in(qUUID).emit('join', qUUID);   // broadcast to room set isChannelReady
            socket.emit('joined', qUUID, socket.id);   // back to new peer  set isChannelReady
        });

        socket.on('ipaddr', () => {
            var ifaces = os.networkInterfaces();
            for (var dev in ifaces) {
                ifaces[dev].forEach((details) => {
                    if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                        console.log(` server emits IPADDR   ${details.address} `)
                        socket.emit('ipaddr', details.address);
                    }
                });
            }
        });

        console.info('[INFO] Socket Liteners Registered');
    }
};
