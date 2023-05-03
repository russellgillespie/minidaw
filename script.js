//// Web Audio Code

// window.onload = init;

var ctx;

var pannerSettings = {
  "distanceModel"   : "linear",
  "rolloffFactor"   : 1,
  "coneInnerAngle"  : 360,
  "coneOuterAngle"  : 0,
  "coneOuterGain"   : 0,
  // "setOrientation" : [1,0,0]
  "position"        : [0, 0, -0.5],
  "coneInnerAngle"  : 5,
  "coneOuterAngle"  : 10,
  "coneGain"        : 0.5,
  "coneOuterGain"   : 0.2
}

var pannerSacleFactor = 2;
var gainScale = 3;

var listener = "";

var bufferLoader;
var buffers = [];
var buttons = [];
var durations = [];
var sources = [];
var gainNodes = [];
var volumeControls = [];
var playTrackButtons = [];
var panNodes = [];
var fadeIns = [];
var fadeOuts = [];
//Testing urls
// var urls = [
//   "https://solsticemanagementdiag.blob.core.windows.net/externalapitesting/Going_Home_VO.mp3",
//   "https://solsticemanagementdiag.blob.core.windows.net/externalapitesting/Going_Home_SFX.mp3",
//   "https://solsticemanagementdiag.blob.core.windows.net/externalapitesting/APM_Adobe_Going Home_v3.mp3",
//   "https://solsticemanagementdiag.blob.core.windows.net/externalapitesting/Audio_Postcard_Dumpster.mp3"
// ]

//Production urls
var urls = [
 "./audio/DTNN_INTERVIEW BUS.mp3",
 "./audio/DTNN_SFX BUS.mp3",
 "./audio/DTNN_MUSIC BUS.mp3",
 "./audio/DTNN_AMBI BUS.mp3",
 "./audio/DTNN_STUDIO BUS.mp3"
]
// Placeholder URLs
//  var urls = [
//   "Going_Home_VO.mp3",
//   "Going_Home_SFX.mp3",
//   "APM_Adobe_Going_Home_v3.mp3",
//   "Audio_Postcard_Dumpster.mp3"
// ]



var gainNodeAll;
var panNodeAll;
var playheadSliderJustClicked = 'false';


function init() {
  console.log("init running");
  // Fix up prefixing
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  ctx = new AudioContext();
  listener = ctx.listener;
  listener.setOrientation(0,0,-1,0,1,0);
  bufferLoader = new BufferLoader(ctx, urls, finishedLoading);
  bufferLoader.load();
  initRouting();

  unlockAudioContext(ctx);

  for (var i=0; i < urls.length; i++) {
    let current_track = document.querySelector('#track' + i)
    if (current_track.dataset.playheadOffset === undefined) { current_track.dataset.playheadOffset = 0 };
    if (current_track.dataset.startTrim === undefined) { current_track.dataset.startTrim = 0 };
    if (current_track.dataset.endTrim === undefined) { current_track.dataset.endTrim = masterDuration };
  }
  // Add event listeners for audio data loaded and populate duration elements
}

function finishedLoading(bufferList) {
  //console.log(bufferList);
  bufferList.forEach(function(_buffer, _index, _bufferList) {
  sources[_index] = ctx.createBufferSource();
  buffers[_index] = _bufferList[_index];
  sources[_index].buffer = buffers[_index];
  sources[_index].connect(ctx.destination);
  //sources[_index].start(0);
  });
  //addListenersToArrayElements(sources, durations, 'loadeddata');
}

//////REFACTOR//////
// Initialize Timing Variables
var playheadTime = 0;
var startTime = 0;
var playheadStartTime = 0;
var timerIncrement = 10; // milliseconds
var playheadRunning = 'false';
// Get reference to playhead
const playheadElement = document.querySelector('#playhead');
// const playheadOffset = document.querySelector('#playheadOffset');
const playheadSlider = document.querySelector('#playheadSlider');
// Format playhead time text
playheadElement.innerHTML = formatTime(0);
// playheadOffset.addEventListener('input', function() {
//   if (playheadSliderJustClicked === 'false'){
//     updateInput('playheadSlider', this.valueAsNumber.toFixed(3));
//     playheadTime = this.value;
//     playheadElement.innerHTML = formatTime(this.value * 1000);
//   }
//     if (playAll.dataset.playing == 'true') {
//     PauseAllTracks();
//     PlayAllTracks();
//   }
// }, false)
// playheadSlider.addEventListener('input', function() {
//   playheadSliderJustClicked = 'true';
//   updateInput('playheadOffset', this.valueAsNumber.toFixed(3));
//   // playheadTime = this.value;
//   // playheadElement.innerHTML = formatTime(this.value * 1000);

//   //setTimeout(resetGainValues(gainCache), .15);
// }, false)

// playheadSlider.addEventListener('mouseup', function() {
//   if (playAll.dataset.playing === 'true') {
//     //var gainCache = [];
//     //gainCache = cacheGainValues(gainCache);
//     //if (playheadSliderJustClicked === 'false'){
//     playheadSliderJustClicked = 'false';
//     //setTimeout(function() {
//       playheadTime = this.value;
//       playheadElement.innerHTML = formatTime(this.value * 1000);
//       PauseAllTracks();
//       //playheadSliderJustClicked = 'false';
//       PlayAllTracks();
//     //}, .25);
//  // }
//   }

// });

// playheadOffset.addEventListener('input', function() {
//   //updateInput('playheadSlider', this.valueAsNumber.toFixed(3));
//   playheadTime = this.value;
//   playheadElement.innerHTML = formatTime(this.value * 1000);
//     if (playAll.dataset.playing == 'true') {
//     PauseAllTracks();
//     PlayAllTracks();
//   }
// }, false)
playheadSlider.addEventListener('input', function() {
  //updateInput('playheadOffset', this.valueAsNumber.toFixed(3));
  playheadTime = this.value;
  playheadElement.innerHTML = formatTime(this.value * 1000);
    if (playAll.dataset.playing == 'true') {
    PauseAllTracks();
    PlayAllTracks();
  }
}, false)

//// HTML ELEMENT REFERENCES ////
//////REFACTOR//////
////Get references to Playback buttons and add to buttons array
// Master Track
const returnAll = document.querySelector('#returnAll');
const pauseAll = document.querySelector('#pauseAll');
const playAll = document.querySelector('#playAll');
playAll.dataset.playing = false;
// // Individual Tracks
// urls.forEach(function(_url, _index, _urls) {
//   playTrackButtons.push(document.querySelector('#play' + _index));
//   playTrackButtons[_index].dataset.playing = 'false';
// });

// Get references to audio element durations and add to durations array
const masterDuration = 90;
const duration0 = document.querySelector('#duration0');
durations.push(duration0);
const duration1 = document.querySelector('#duration1');
durations.push(duration1);
const duration2 = document.querySelector('#duration2');
durations.push(duration2);
const duration3 = document.querySelector('#duration3');
durations.push(duration3);

// Get references to volume/gain slider elements
var volumeControlAll = document.querySelector('#gainAll');
urls.forEach(function(_url, _index, _urls) {
  volumeControls.push(document.querySelector('#gain' + _index));
})
// var volumeControls[0] = document.querySelector('#gain0');
// var volumeControls[1] = document.querySelector('#gain1');
// var volumeControls[2] = document.querySelector('#gain2');
// var volumeControls[3] = document.querySelector('#gain3');

// Get references to volume/gain number input elements
const volumeDisplayAll = document.querySelector('#gainAllDisplay');
const volumeDisplay0 = document.querySelector('#gain0Display');
const volumeDisplay1 = document.querySelector('#gain1Display');
const volumeDisplay2 = document.querySelector('#gain2Display');
const volumeDisplay3 = document.querySelector('#gain3Display');

// Get references to pan slider elements
const panControlAll = document.querySelector('#panAll');
const panControl0 = document.querySelector('#pan0');
const panControl1 = document.querySelector('#pan1');
const panControl2 = document.querySelector('#pan2');
const panControl3 = document.querySelector('#pan3');

// Get references to pan number input elements
const panDisplayAll = document.querySelector('#panAllDisplay');
const panDisplay0 = document.querySelector('#pan0Display');
const panDisplay1 = document.querySelector('#pan1Display');
const panDisplay2 = document.querySelector('#pan2Display');
const panDisplay3 = document.querySelector('#pan3Display');

const fadeInAll = document.querySelector('#fadeInAll');
const fadeOutAll = document.querySelector('#fadeOutAll');
urls.forEach(function(_url, _index, _urls) {
  fadeIns.push(document.querySelector('#fadeIn' + _index));
  fadeOuts.push(document.querySelector('#fadeOut' + _index));
})

//// Add event listeners for playback buttons
// playTrackButtons.forEach(function(_button, _index, _buttons){
//   playTrackButtons[_index].addEventListener('click', () => {
//   PlayTrack(_index, playheadTime);
// }, false);
// });


// Master Track
playAll.addEventListener('click', function() {
  PlayAllTracks();
}, false);

window.addEventListener("keydown", event => {
  if (event.keyCode === 32)
  {
    console.log("pressed spacebar");
    if (playAll.dataset.playing === 'false')
    {
      PlayAllTracks();
    }
    else if (playAll.dataset.playing === 'true')
    {
      PauseAllTracks();
    }
  }

  if (event.keyCode === 13)
  {
    console.log('pressed return key');
    if (playAll.dataset.playing === 'true')
    {
      PauseAllTracks();
    }
    setTimeout(function(){
    playheadTime = resetTime(playheadTime);
    playheadElement.innerHTML = formatTime(playheadTime);
    // playheadOffset.value = playheadTime;
    playheadSlider.value = playheadTime;
    }, 10);
  }

}, false);

// playAll.addEventListener('touchstart', function(event) {
//   console.log(event);
//   event.preventDefault();
//   for (var i=0; i < event.targetTouches.length; i++) {
//     console.log(event.targetTouches);
//     PlayAllTracks();
//   }
// }, false);

pauseAll.addEventListener('click', function() {
  PauseAllTracks();
}, false);

// pauseAll.addEventListener("keydown", event => {
//   if (event.isComposing || event.keyCode === 32) {
//     PlayAllTracks();
//   }
// }, false);

pauseAll.addEventListener('touchstart', function(event) {
  event.preventDefault();
  PauseAllTracks();
}, false);

returnAll.addEventListener('click', () => {
  console.log('returnALL clicked');
  if (playAll.dataset.playing == 'true'){
    PauseAllTracks();
  }
  setTimeout(function(){
    playheadTime = resetTime(playheadTime);
    playheadElement.innerHTML = formatTime(playheadTime);
    // playheadOffset.value = playheadTime;
    playheadSlider.value = playheadTime;
  }, 10);
  //console.log("playheadTime: " + playheadTime);
});

returnAll.addEventListener('touchstart', (event) => {
  event.preventDefault();
  console.log('returnALL clicked');
  if (playAll.dataset.playing == 'true'){
    PauseAllTracks();
  }
  setTimeout(function(){
    playheadTime = resetTime(playheadTime);
    playheadElement.innerHTML = formatTime(playheadTime);
    // playheadOffset.value = playheadTime;
    playheadSlider.value = playheadTime;
  }, 10);
  //console.log("playheadTime: " + playheadTime);
});



//// Add event listeners to trigger audio elements ended callback
// playTrackButtons.forEach(function(_button, _index, _buttons){
//   sources[_index].addEventListener('ended', () => {
//   _button.dataset.playing = 'false';
//   }, false);
// })



//// Add event listeners for gain and pan changes
// Gain Sliders
volumeControlAll.addEventListener('input', function() {
 gainNodeAll.gain.linearRampToValueAtTime(this.value * this.value * gainScale, ctx.currentTime + .001);
}, false);
volumeControls[0].addEventListener('input', function() {
 gainNodes[0].gain.linearRampToValueAtTime(this.value * this.value * gainScale, ctx.currentTime + .001);
  //console.log(gainNodes[0].gain.value);
}, false);
volumeControls[1].addEventListener('input', function() {
 gainNodes[1].gain.linearRampToValueAtTime(this.value * this.value * gainScale, ctx.currentTime + .001);
  //console.log(gainNodes[1].gain.value);
}, false);
volumeControls[2].addEventListener('input', function() {
 gainNodes[2].gain.linearRampToValueAtTime(this.value * this.value * gainScale, ctx.currentTime + .001);
  //console.log(gainNodes[2].gain.value);
}, false);
volumeControls[3].addEventListener('input', function() {
 gainNodes[3].gain.linearRampToValueAtTime(this.value * this.value * gainScale, ctx.currentTime + .001);
  //console.log(gainNodes[3].gain.value);
}, false);

// // Gain Number inputs
// volumeDisplayAll.addEventListener('input', function() {
//  gainNodeAll.gain.value = this.value;
// }, false);
// volumeDisplay0.addEventListener('input', function() {
//  gainNodes[0].gain.value = this.value;
//   //console.log(gainNodes[0].gain.value);
// }, false);
// volumeDisplay1.addEventListener('input', function() {
//  gainNodes[1].gain.value = this.value;
//   //console.log(gainNodes[1].gain.value);
// }, false);
// volumeDisplay2.addEventListener('input', function() {
//  gainNodes[2].gain.value = this.value;
//   //console.log(gainNodes[2].gain.value);
// }, false);
// volumeDisplay3.addEventListener('input', function() {
//  gainNodes[3].gain.value = this.value;
//   //console.log(gainNodes[3].gain.value);
// }, false);

// Pan sliders
panControlAll.addEventListener('input', function() {
 // panNodeAll.pan.value = this.value;
  panNodeAll.setPosition(this.value, 0, pannerSettings.position[2]);
}, false);
panControl0.addEventListener('input', function() {
 // panNodes[0].pan.value = this.value;
  panNodes[0].setPosition(this.value, 0, pannerSettings.position[2]);
}, false);
panControl1.addEventListener('input', function() {
 // panNodes[1].pan.value = this.value;
  panNodes[1].setPosition(this.value, 0, pannerSettings.position[2]);
}, false);
panControl2.addEventListener('input', function() {
 // panNodes[2].pan.value = this.value;
  panNodes[2].setPosition(this.value, 0, pannerSettings.position[2]);
}, false);
panControl3.addEventListener('input', function() {
 // panNodes[3].pan.value = this.value;
  panNodes[3].setPosition(this.value, 0, pannerSettings.position[2]);
}, false);

// // Pan number inputs
// panDisplayAll.addEventListener('input', function() {
//  panNodeAll.pan.value = this.value;
// }, false);
// panDisplay0.addEventListener('input', function() {
//  panNodes[0].pan.value = this.value;
// }, false);
// panDisplay1.addEventListener('input', function() {
//  panNodes[1].pan.value = this.value;
// }, false);
// panDisplay2.addEventListener('input', function() {
//  panNodes[2].pan.value = this.value;
// }, false);
// panDisplay3.addEventListener('input', function() {
//  panNodes[3].pan.value = this.value;
// }, false);


//// Functions ////
//// Create Nodes
// Create Gain nodes for all tracks
function initPannerNode(_panner, _settings) {
      _panner.distanceModel   = _settings.distanceModel;
      _panner.rolloffFactor   = _settings.rolloffFactor;
      // _panner.coneInnerAngle  = _settings.coneInnerAngle;
      // _panner.coneOuterAngle  = _settings.coneOuterAngle;
      // _panner.coneOuterGain   = _settings.coneOuterGain;
      // _panner.setOrientation(Math.cos())
      // _panner.orientationX    = _settings.setOrientation[0];
      // _panner.orientationY    = _settings.setOrientation[1];
      // _panner.orientationZ    = _settings.setOrientation[2];
      _panner.positionZ       = _settings.position[2];
      // _panner.coneInnerAngle  = _settings.coneInnerAngle;
      // _panner.coneOuterAngle  = _settings.coneOuterAngle;
      // _panner.coneGain         = _settings.coneGain;
      // _panner.coneOuterGain  = _settings.coneOuterGain;
}

function initRouting(){
  // Create Master Gain Node
  gainNodeAll = ctx.createGain();
  // Route masterPan > masterGain > Final Output Destination
  // try {
  //   panNodeAll = ctx.createStereoPanner();
  //   panNodeAll.connect(gainNodeAll).connect(ctx.destination);
  // }
  // catch (e) {
  //   if (e instanceof TypeError) {
  //     console.log("StereoPanner not supported in Safari");
  //     panNodeAll = ctx.createPanner();
  //     initPannerNode(panNodeAll, pannerSettings);
  //   }
  // }
  panNodeAll = ctx.createPanner();
  panNodeAll.connect(gainNodeAll).connect(ctx.destination);
  initPannerNode(panNodeAll, pannerSettings);

  // Create and Route all Basic Tracks
  urls.forEach(function(_url, _index, _urls){

    panNodes[_index] = ctx.createPanner();
    initPannerNode(panNodes[_index], pannerSettings);


    gainNodes[_index] = ctx.createGain();
    gainNodes[_index].gain.value = volumeControls[_index].valueAsNumber * volumeControls[_index].valueAsNumber * gainScale;
    panNodes[_index].connect(gainNodes[_index]).connect(panNodeAll);
  })
}

function UpdatePlayheadTime(_displayElement, _increment, _buttons)
{
  if (playheadRunning === 'true')
  {
    //console.log(startTime);
    setTimeout(
      function()
      {
        //console.log('updating timer value');
        //console.log('playheadTime: ' + playheadTime);
        //playheadTime += _increment;
        playheadTime = (ctx.currentTime - startTime + playheadStartTime);
        _displayElement.innerHTML = formatTime(playheadTime * 1000);
        var newPlayheadTime = parseFloat(playheadTime.toFixed(3));
        if (playheadSliderJustClicked = 'false'){
           playheadSlider.value = newPlayheadTime;
           // playheadOffset.value = newPlayheadTime;
        }
        //console.log(typeof(playheadSlider.value));

        //if ( CheckIfPlaying(_buttons) )
        if (playheadRunning === 'true')
        {
          //console.log('recursive call');
          UpdatePlayheadTime(_displayElement, _increment, _buttons);
        }
        else
        {
          playheadRunning = 'false';
          //_displayElement.value = formatTime(0);
          //console.log('inner playhead time: ' + playheadTime);
        }
      }, _increment);
  }
}


function resetTime(_value){
  return 0;
}

function updateInput(target, val)
{
  var element = document.getElementById(target);
  if (element.value != val)
  {
    //console.log(typeof(element.value));
    element.value = val;
  }
}

function formatTime(_time)
{
  var hun = 10;
  var sec = hun * 100;
  var min = sec * 60;
  var hr = min * 60;

  var hours = Math.trunc(_time / hr);
  //console.log(_time % hr);
  var minutes = Math.trunc((_time % hr) / min);
  //console.log(_time % min);
  var seconds = Math.trunc((_time % min) / sec);
  //console.log(_time % sec);
  var hundredths = Math.trunc((_time % sec) / hun);

  if (hours < 10) { hours = "0" + hours;}
  if (minutes < 10) { minutes = "0" + minutes;}
  if (seconds < 10) { seconds = "0" + seconds;}
  if (hundredths < 10) { hundredths = "0" + hundredths;}

  return (minutes + ":" + seconds + ":" + hundredths);
}

// function addListenersToArrayElements(_array, _targetValues, _eventString) {
//   _array.forEach(function(e, _index, _arr)
//   {
//     console.log(e.buffer.duration);
//     if (e.buffer.duration){ _targetValues[_index].innerHTML = formatTime(e.buffer.duration*1000);}
//     _targetValues[_index].addEventListener( _eventString, function()
//     {
//       //console.log(_targetValues[index]);
//       if ((_targetValues[_index] !== undefined) && (_targetValues[_index] !== null)) {_targetValues[_index].innerHTML = formatTime(e.buffer.duration*1000);}
//       //console.log('duration' + index + ' set');
//     });
//   });
// }

function ResumeContext() {
  if (ctx.state === 'suspended')
    {
      ctx.resume();
    }
}

// Overwrite sources array elements and populate their buffers with corresponding values from buffers array
function createSource(_index, _node){
  sources[_index] = ctx.createBufferSource();
  sources[_index].buffer = buffers[_index];
  //console.log(bufferList[_index]);
  sources[_index].connect(_node);
  //console.log(sources[_index]);
}

function PlayTrack(_index, _playheadOffset) {
  ResumeContext();
  // if ( playTrackButtons[_index].dataset.playing === 'false') {
  createSource(_index, panNodes[_index]);
  let current_track = document.querySelector('#track' + _index);
  let track_offset = parseFloat(current_track.dataset.playheadOffset);
  let track_start_trim = parseFloat(current_track.dataset.startTrim);
  let track_end_trim = parseFloat(current_track.dataset.endTrim);

  let wh = ctx.currentTime + track_offset - _playheadOffset;
  if ( wh < 0 ) { wh = 0; }
  let off = _playheadOffset - track_offset + track_start_trim;
  if ( off < 0 ) { off = 0; }
  let dur = track_end_trim - off;
  if ( dur < 0 ) { dur = 0; }

  if (track_start_trim < 0) { track_start_trim = 0; }
  sources[_index].start(wh, off, dur)
  //console.log(panNodeAll);
  //console.log(panNodes[_index]);
  //FadeIn
  let initialGain = gainNodes[_index].gain.value;
  //console.log("initialGain: " + initialGain)
  //console.log("when " + (wh));
  //console.log(gainNodes[_index].gain.setTargetAtTime);

  if (fadeIns[_index].value > 0)
  {
    try
    {
      gainNodes[_index].gain.linearRampToValueAtTime(0, ctx.currentTime);
      //console.log("resetGain: " + gainNodes[_index].gain.value);
      gainNodes[_index].gain.linearRampToValueAtTime(volumeControls[_index].value, wh + parseFloat(fadeIns[_index].value), 0.8);
    }
  catch(error)
    {
      console.log("track_" + [_index] + "fade in: " + error);
      gainNodes[_index].gain.setValueAtTime(volumeControls[_index].value, ctx.currentTime);
    }
  }

  //console.log("fadeOut" + [_index] + ": " + (wh + dur - parseFloat(fadeOuts[_index].value)));
  //Schedule Fade Out for Current Track
  if (fadeOuts[_index].value > 0)
  {
    try
    {
      gainNodes[_index].gain.linearRampToValueAtTime(0.0, wh + dur - parseFloat(fadeOuts[_index].value), 0.8);
    }
    catch(error)
    {
      console.log("track_" + [_index] + "fade out: " + error);
      gainNodes[_index].gain.setValueAtTime(volumeControls[_index].value, ctx.currentTime);
    }
  }


}

function PauseTrack(_index) {
  console.log('pausing track ' + _index);
  sources[_index].stop();
  //playTrackButtons[_index].dataset.playing = 'false';
}

function PlayAllTracks() {
  console.log("PlayAllTracks function running");
  if (playAll.dataset.playing == "false") {
    // playTrackButtons.forEach(function(_button, _index, _buttons){
    urls.forEach(function(_button, _index, _buttons){
      // if (_button.dataset.playing === 'true') {
      if (playAll.dataset.playing === 'true') {
        PauseTrack(_index);
      }
    })
    // playheadStartTime = playheadOffset.valueAsNumber; //Commented for Master
    playheadStartTime = playheadSlider.valueAsNumber;
    urls.forEach(function(_url, _index, _urls) {
      PlayTrack(_index, playheadTime);
    })


    //Schedule Master Fade In
    if (fadeInAll.value > 0)
    {
      try
      {
        gainNodeAll.gain.linearRampToValueAtTime(0, ctx.currentTime);
        //console.log("resetGain: " + gainNodeAll.gain.value);
        //console.log("fadeAll target Time: " + (ctx.currentTime - playheadStartTime + parseFloat(fadeInAll.value)));
        gainNodeAll.gain.linearRampToValueAtTime(volumeControlAll.value, ctx.currentTime - playheadStartTime + parseFloat(fadeInAll.value), 0.8);
      }
      catch(error)
      {
        console.log("master fade in: " + error);
        gainNodeAll.gain.setValueAtTime(volumeControlAll.value, ctx.currentTime);
       }
    }

    //Schedule MasterFade out
    if (fadeOutAll.value > 0){
      try
      {
        gainNodeAll.gain.linearRampToValueAtTime(0, masterDuration - playheadStartTime - parseFloat(fadeOutAll.value), 0.8);

      }
      catch(error)
      {
        console.log("master fade out: " + error)
        gainNodeAll.gain.linearRampToValueAtTime(0, masterDuration - playheadStartTime - parseFloat(fadeOutAll.value), 0.8);
      }
    }


    playAll.dataset.playing = 'true';
    playheadRunning = 'true';
    startTime = ctx.currentTime;
    UpdatePlayheadTime(playheadElement, timerIncrement, buttons);
  }
  else {
    console.log("Audio is already playing");
  }
}

function PauseAllTracks() {
  //var fadeTime = 0.1;
  //var gain;
  urls.forEach(function(_url, _index, _urls) {
    //   gain = (gainNodes[_index].gain.value);
    //   gainNodes[_index].gain.linearRampToValueAtTime(.001, fadeTime);
    //   setTimeout(function (){sources[_index].stop();}, fadeTime);
      sources[_index].stop();
      //console.log(gainNodes[_index]);
      gainNodes[_index].gain.cancelScheduledValues(ctx.currentTime);
      //console.log(volumeControls[_index].value)
      gainNodes[_index].gain.setValueAtTime(volumeControls[_index].value, ctx.currentTime);
      //playTrackButtons[_index].dataset.playing = 'false';
    //   gainNodes[_index].gain.setValueAtTime(gain, ctx.currentTime + fadeTime);
     } )
  gainNodeAll.gain.cancelScheduledValues(ctx.currentTime);
  gainNodeAll.gain.setValueAtTime(volumeControlAll.value, ctx.currentTime);
  if (playAll.dataset.playing == 'true') {

  playAll.dataset.playing = 'false';
  playheadRunning = 'false';
  }
  else {
    console.log("Audio is not currently playing");
  }
}

function cacheGainValues(_gainCache){
  urls.forEach(function(_url, _index, _urls){
    _gainCache.push( gainNodes[_index].gain.value );
  });
  return gainCache
}

function resetGainValues(_gainCache){
  urls.forEach(function(_url, _index, _urls){
    gainNode[_index].gain.setValueAtTime(_gainCache[_index], 0 );
  });
}

function unlockAudioContext(audioCtx) {
  if (audioCtx.state !== 'suspended') return;
  const b = document.body;
  const events = ['touchstart','touchend', 'mousedown','keydown'];
  events.forEach(e => b.addEventListener(e, unlock, false));
  function unlock() { audioCtx.resume().then(clean); }
  function clean() { events.forEach(e => b.removeEventListener(e, unlock)); }
}



function makeMoveableDiv(div) {
  const offset_x = document.querySelector('.daw-wrapper').offsetLeft;
  const movers = document.querySelectorAll(div)
  let currentMover = "";
  let original_x_left = 0;
  let original_mouse_x = 0;
  let new_mouse_x = 0;
  let max_right = 540;
  let min_left = 108;
  let maximum_size = 432;
  let timeline_max_time = masterDuration;
  for (let i = 0;i < movers.length; i++) {
    currentMover = movers[i];
    currentMover.addEventListener('mousedown', function(e) {
      e.preventDefault();
      //document.querySelector('.debug').innerHTML = "clicked, original_mouse_x: " + original_mouse_x;
      original_x_left = currentMover.getBoundingClientRect().left;
      original_mouse_x = e.pageX;
      window.addEventListener('mousemove', moveDiv)
      window.addEventListener('mouseup', stopMoveDiv)
    })
  }


  function moveDiv(e) {
    let new_pos = parseInt(original_x_left - (original_mouse_x - e.pageX) - offset_x);
    let moverWidth = parseFloat(getComputedStyle(currentMover, null).getPropertyValue('width').replace('px', ''))
    // console.log("moverWidth: " + moverWidth);
    // console.log("newPos: " + new_pos);
    // console.log(moverWidth + new_pos);
    if (new_pos < min_left) {
      new_pos = min_left;
    }
    if (new_pos + moverWidth > max_right) {
      new_pos = max_right - moverWidth;
    }
    if (new_pos + moverWidth == NaN) {
      new_pos = min_left;
    }
    currentMover.style.left = new_pos + "px";
    currentMover.style.right = (new_pos + parseFloat(currentMover.style.width)) + "px";
    //console.log("right: " + currentMover.style.right);
    let farRight = new_pos + moverWidth;
    //document.querySelector('.debug').innerHTML = "moving, currentMover.style.width: " + (farRight);

    currentMover.dataset.playheadOffset = parseFloat(((new_pos - min_left) / maximum_size) * masterDuration).toFixed(2); //milliseconds
    // console.log("offset: " + currentMover.dataset.playheadOffset);
    // document.querySelector('.debug').innerHTML =
    //   "offset: "  + currentMover.dataset.playheadOffset +
    //   ", startTrim: " + currentMover.dataset.startTrim +
    //   ", endTrim: " + currentMover.dataset.endTrim;
  }

  function stopMoveDiv() {
    //document.querySelector('.debug').innerHTML = "moved";
    window.removeEventListener('mousemove', moveDiv)
  }
}


function makeResizableDiv(div) {
  const offset_x = document.querySelector('.daw-wrapper').offsetLeft;
  const element = document.querySelector(div);
  const resizers = document.querySelectorAll(div + ' .resizer')
  const minimum_size = 60;
  const maximum_size = 432;
  const min_left = 108 + offset_x;
  const max_right = 540 + offset_x;
  let original_width = 0;
  let original_height = 0;
  let original_x_left = 0;
  let original_y = 0;
  let original_x_right = 0;
  let original_mouse_x = 0;
  let original_mouse_y = 0;
  let mouseOffsetRight = 0;
  let mouseOffsetLeft = 0;
  let originalColor = "";
  let error_color  = "#bc1413";

  for (let i = 0;i < resizers.length; i++) {
    const currentResizer = resizers[i];
    originalColor = currentResizer.style.backgroundColor;
    currentResizer.addEventListener('mousedown', function(e) {
      e.preventDefault()
      e.stopPropagation();
      original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
      //console.log(original_width);
      original_x_left = element.getBoundingClientRect().left;
      original_x_right = element.getBoundingClientRect().right;
      //console.log(original_x_left + ", " + original_x_right);
      original_mouse_x = e.pageX;
      mouseOffsetRight = original_x_right - original_mouse_x; // get distance between mouse click and resizer's outer edge
      mouseOffsetLeft = original_mouse_x - original_x_left;
      //console.log("mouseOffsetLeft: " + mouseOffsetLeft + ", mouseOffsetRight: " + mouseOffsetRight);
      window.addEventListener('mousemove', resize)
      window.addEventListener('mouseup', stopResize)
    })

    function resize(e)
    {
      if (currentResizer.classList.contains('bottom-right') || currentResizer.classList.contains('side-right'))
      {
        // Get right edge position in pixels and parse
        let originalTrim = parseFloat(element.style.right); //548 offset_x + min_left + max_width
        //console.log("originalTrim: " + originalTrim);

        if (Number.isNaN(originalTrim))
        {
          originalTrim = max_right; //548
        }
        // Get current clip's trimmed duration in seconds
        let startTrim = parseFloat(element.dataset.endTrim); //90
        let newTrim = 0.0; //initialize new trim variable
        mouseX = e.pageX + mouseOffsetRight; // current click-drag position
        // Clamp mouse position input to right edge
        if (mouseX > max_right)
        {
          mouseX = max_right;
        }
        original_mouse_x = original_x_right;
        //console.log("ogMouseX: " + original_mouse_x);
        // Calculate new width of div
        const width = original_width - (original_x_right - mouseX);
        //console.log("width: " + width);

        //check that width is in bounds
        if (width >= minimum_size && width <= maximum_size)
        {
          // Trim duration if not exceeding max time
          if (startTrim <= 0)
          {
            startTrim = 0;
          }
          else if (startTrim >= masterDuration)
          {
            startTrim = masterDuration;
          }
          //console.log("start trim: " + startTrim);
          newTrim = parseFloat(startTrim - masterDuration * ((originalTrim - mouseX) / maximum_size));

          if (newTrim <= masterDuration && newTrim >= 0)
          {
            element.dataset.endTrim = newTrim;
            element.style.width = width + 'px';
            element.style.right = original_x_left + width + 'px';
          }

          if (masterDuration - newTrim < .01)
          {
            resizers.forEach (function(_resizer, _index, _arr)
            {
             let r = resizers[_index];
             if (r.classList.contains('side-right') || r.classList.contains('bottom-right'))
              {
                r.style.backgroundColor = error_color;
              }
            })
          }
          else
          {
            resizers.forEach (function(_resizer, _index, _arr)
            {
             let r = resizers[_index];
             if (r.classList.contains('side-right') || r.classList.contains('bottom-right'))
              {
                r.style.backgroundColor = originalColor;
              }
            })
          }

        }
      } // End Right Resizers Conditionals
      else if (currentResizer.classList.contains('bottom-left') || currentResizer.classList.contains('side-left'))
      {
        let originalTrim = parseFloat(element.getBoundingClientRect().left);
        if (originalTrim === "" || Number.isNaN(originalTrim))
        {
          originalTrim = min_left; //116
        }
        //console.log("originalTrim: " + originalTrim);
        let startTrim = parseFloat(element.dataset.startTrim);
        //console.log("st: " + startTrim); //0
        let newTrim = 0.0;

        //get current mouse X position
        mouseX = e.pageX - mouseOffsetLeft; // current click-drag position
        //clamp mouseX to left edge of draggable area
        if (mouseX <= min_left) { mouseX = min_left;}
        //console.log("mouseX: " + mouseX);
        //calculate current resizable element width
        let width = original_x_right - (mouseX);
        //console.log("oxr: " + original_x_right);
        //console.log("width: " + width);
        //Check if width is in bounds
        if (width >= minimum_size && width <= maximum_size )
        {
          //left = mouseX;
          //
          if (mouseX < min_left) {
            element.style.left = (mouseX - offset_x)  + 'px'; //116
            newTrim = startTrim;
            //console.log("mouseX: " + mouseX + ", newTrim: " + newTrim);
            element.dataset.startTrim = newTrim;
          }
          else if (mouseX >= min_left)
          {
            newTrim = (startTrim + masterDuration * ((mouseX - originalTrim) / maximum_size)).toFixed(4);
            //clamp trim to duration range 0-90
            if (newTrim > masterDuration)
            {
              newTrim = masterDuration;
            }
            else if ( newTrim <= 0 )
            {
              newTrim = 0;
            }
            //console.log("mouseX: " + mouseX + ", newTrim: " + newTrim);

            if (element.dataset.startTrim != newTrim && element.dataset.startTrim >= 0 )
            {
              element.dataset.startTrim = newTrim;
              element.style.left = (mouseX - offset_x) + 'px';
              //console.log("left: " + left);
              element.dataset.playheadOffset = parseFloat(((mouseX - min_left) / maximum_size) * masterDuration);
              element.style.width = width + 'px';
              element.querySelector(".waveform").style.backgroundPosition = -4.8 * newTrim + "px, 50%";
              //console.log(newTrim.toFixed(2) + "px, 0px");
            }

              // Color resizers red if at end of audio clip length
              if (newTrim < .001)
              {
                resizers.forEach (function(_resizer, _index, _arr)
                {
                  let r = resizers[_index];
                  if (r.classList.contains('side-left') || r.classList.contains('bottom-left'))
                  {
                    r.style.backgroundColor = error_color;
                  }
                })
              }
              else
              {
                resizers.forEach (function(_resizer, _index, _arr)
                {
                 let r = resizers[_index];
                 if (r.classList.contains('side-left') || r.classList.contains('bottom-left'))
                  {
                    r.style.backgroundColor = originalColor;
                  }
                })
              }
          }
        }
      } // End Left Resizers Conditionals


      // document.querySelector('.debug').innerHTML =
      //   "offset: "  + element.dataset.playheadOffset +
      //   ", startTrim: " + element.dataset.startTrim +
      //   ", endTrim: " + element.dataset.endTrim;
      //console.log("exit endTrim: " + element.dataset.endTrim);
    } // End function resize

    function stopResize() {
      resizers.forEach (function(_resizer, _index, _arr) {
        _resizer.style.backgroundColor = originalColor;
      })
      window.removeEventListener('mousemove', resize)
    }
  }
}

//Initialize App
const tracks = ['track0', 'track1', 'track2', 'track3']

window.onload = function() {
  init();
  for (var i=0; i < tracks.length; i++) {
    div = tracks[i];
    makeResizableDiv("#" + div)
    makeMoveableDiv("#" + div)
  }
}
