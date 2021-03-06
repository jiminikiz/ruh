'use strict';

angular.module("RuhApp")
  .controller('RuhQuestionController', questionController);
questionController.$inject = ['RuhQuestionFactory', '$scope'];



function questionController(RuhQuestionFactory, $scope){
  var questionThis = this;
  // These are assigned to questionThis so butils.js can hold shared code
  questionThis.token = "questionController";
  questionThis.socket = io.connect();
  questionThis.pc;

  questionThis.data = RuhQuestionFactory.admin;
  console.log("IS ADMIN UNDEFINED", RuhQuestionFactory );

  $scope.$on('newAdmin', function(event, data) {
    console.log(data);
    questionThis.data = RuhQuestionFactory.admin;
    $scope.$apply();
  });

  questionThis.message = "You are one click (more or less) away from expert help";

  //var pcConfig = { 'iceServers': [ {'url': 'stun:stun.l.google.com:19302'} ] };
  //var sdpConstraints = { 'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true} };
  //var mediaConstraints = { audio: false, video: true };
  var constraints = {
      video: {
          mandatory: {
              minAspectRatio: 1.777,
              maxAspectRatio: 1.778
          },
          optional: [{
              maxWidth: 640
          }, {
              maxHeigth: 480
          }]
      },
      audio: false
  }


////////////////// addQuestion  ng-click

questionThis.addQuestion = function() {

              questionThis.newQuestion.qUser = RuhQuestionFactory.user.uEmail;
              questionThis.socket.emit('useDatabase', questionThis.newQuestion);

              // should be triggered by emit('useDatabase'
              // expertThis.socket.emit('getAllQuestions');


        navigator.mediaDevices.getUserMedia(constraints)
            .then(gotStream)
            .catch(function(e) {
                alert('getUserMedia() error: ' + e);
            });

    } ////////////////// addQuestion

//GUM >>
//////////////////////////////////////////////////////////// SHARED LOGIC
// gotStream >sends GUM>>
  // maybeStart  if ChannelReady>>
    // createPeerConnection >> addStream (so isStarted = true;)
      //pc.onicecandidate = handleIceCandidate;
      //pc.onaddstream = handleRemoteStreamAdded;
      //pc.onremovestream






var localStream;
var remoteStream;
var localVideo = document.getElementById('localVideo')
var remoteVideo = document.getElementById('remoteVideo');

var isInitiator = false;
var isChannelReady = false;
var isStarted = false;
var offerOptions = { offerToReceiveAudio: 1, offerToReceiveVideo: 1 };
var turnReady;


function gotStream(stream) {
  console.log('gotStream adding local stream to tag.');
  localVideo.src = window.URL.createObjectURL(stream);
  localStream = stream;
  sendMessage(questionThis, 'got user media');
  // if (isInitiator) {
  //     console.log('I think I the initiator, so maybeStart()');
  //   maybeStart();                                               // why would this ever work? channels not ready
  // }
}

function maybeStart() {

  console.log(`maybeStart() isStarted is ${isStarted} isChannelReady is ${isChannelReady}` );

  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {

    console.log(' maybeStart() creating peer connection');
    createPeerConnection();
    questionThis.pc.addStream(localStream);
    isStarted = true;

    if (isInitiator) {
      doOffer(questionThis);
    }
  }
}

//////////////////////////////OFFER ///////////////////////////
function doOffer() {
  console.log('************ DO OFFER');
  questionThis.pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}


////////////////////////////// ANSWER ///////////////////////////
function doAnswer() {
  console.log('************ DO ANSWER');
  questionThis.pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  console.log('************ SET LOCAL');
  // Set Opus as the preferred codec in SDP if Opus is present.
  //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  questionThis.pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription.type);
  sendMessage(questionThis, sessionDescription);
}

function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
}



/////////////// SOCKET EVENTS  //////////////////////////


questionThis.socket.on('message', function(message) {  /////////////  MESSAGE ///////////


  if(message.type) {
      console.log('received message with', message.type);
  } else {
      console.log('received message with', message);
  }

  if (message === 'got user media') {
    maybeStart();                                   ///////////// peer joined so  MAYBE START ///////////


  } else if (message.type === 'offer') {    // if i get an offer start? set remote & answer
    if (!isInitiator && !isStarted) {

      maybeStart();
    }

    questionThis.pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();


  } else if (message.type === 'answer' && isStarted) {
    questionThis.pc.setRemoteDescription(new RTCSessionDescription(message));


  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    questionThis.pc.addIceCandidate(candidate);

  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});



// questionThis.socket.on(eventName, function (obj) {
//   processSocketEvent(obj,  eventName, questionThis);
// });

questionThis.socket.on('created', room => {     ////////////////////////  CREATED
  console.log(`ON created -  set initiator  ${room}`);
  isInitiator = true;
});

questionThis.socket.on('join', room =>{        ////////////////////////  JOIN (tell client peer joined)
  console.log(`ON join - set Channel Ready  ${room}`);
  isChannelReady = true;
});

questionThis.socket.on('joined', room =>{     ////////////////////////  JOINED
  console.log(`ON joined - set Channel Ready  ${room}`);
  isChannelReady = true;
});



questionThis.socket.on('full', room => {       ////////////////////////  FULL
  console.log(`ON  full with ${room} `);
});

questionThis.socket.on('allInqs', inq => {    ////////////////////////  ALLINQS
  console.dir("ON all inqueries " +inq);
});



//////////////////////  ICE    //////////////////////////

function createPeerConnection() {
  try {
    questionThis.pc = new RTCPeerConnection(null);
    questionThis.pc.onicecandidate = handleIceCandidate;
    questionThis.pc.onaddstream = handleRemoteStreamAdded;
    questionThis.pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('ICE CANDIDATE event: ', event.type);
  if (event.candidate) {
    sendMessage(questionThis, {
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

//////////////////////  REMOTE STREAM    //////////////////////////
function handleRemoteStreamAdded(event) {
  console.log('*************REMOTE STREAM EVENT.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteStream = event.stream;
}

//////////////////////  GOODBYES

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function handleRemoteHangup() {
  console.log('************ handleRemoteHangup');
  stop(questionThis);
  isInitiator = false;
}

function hangup() {
  console.log('*************  Hanging up.');
  stop(questionThis);
  sendMessage(questionThis, 'bye');
}

window.onbeforeunload = function() {
  sendMessage(questionThis, 'bye');
};

////////////////////////////////////////////////////////
} //END qMainController
