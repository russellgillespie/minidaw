// Web Audio Code

const logLevel = 'debug'; // debug // info // none //

let ctx;

const gainScale = 3.4;

let listener = '';

let bufferLoader;
const buffers = [];
const sources = [];

const buttons = [];
const volumeControls = [];
const panControls = [];
const gainNodes = [];
const panNodes = [];
const fadeIns = [];
const fadeOuts = [];

let gainNodeAll;
let panNodeAll;
let masterGainAutomationCurve = new Float32Array(353);
masterGainAutomationCurve.forEach((item, i) =>{
  //console.log(item);
  masterGainAutomationCurve[i] = 0.5;
});
//console.log(masterGainAutomationCurve);

// Production urls
const urls = [
  './audio/DTNN_AMBI BUS.mp3',
  './audio/DTNN_INTERVIEW BUS.mp3',
  './audio/DTNN_MUSIC BUS.mp3',
  './audio/DTNN_SFX BUS.mp3',
  './audio/DTNN_STUDIO BUS.mp3',
];



// Global States
// let playheadSliderJustClicked = 'false';
let loaded = false;


// ////REFACTOR//////
// Initialize Timing Variables
let playheadTime = 0;
let startTime = 0;
let playheadStartTime = 0;
const timerIncrement = 10; // milliseconds
let playheadRunning = 'false';
// Get reference to playhead
const playheadElement = document.querySelector('#playhead');
const playheadSlider = document.querySelector('#playheadSlider');
// Format playhead time text
playheadElement.innerHTML = formatTime(0);

playheadSlider.addEventListener('input', function() {
  // updateInput('playheadOffset', this.valueAsNumber.toFixed(3));
  playheadTime = this.value;
  playheadElement.innerHTML = formatTime(this.value * 1000);
  if (playAll.dataset.playing === 'true' ) {
    volumeControlAll.gain = masterGainAutomationCurve[Math.ceil(playheadTime)];
    pauseAllTracks();
    playAllTracks();
  }
}, false);

// / / HTML ELEMENT REFERENCES ////
// / ///REFACTOR//////
// / /Get references to Playback buttons and add to buttons array

// Master Track
const returnAll = document.querySelector('#returnAll');
const pauseAll = document.querySelector('#pauseAll');
const playAll = document.querySelector('#playAll');
playAll.dataset.playing = 'false';
playAll.dataset.volumeChanging = 'false';
playAll.dataset.baseGain = 0.5;

const masterDuration = 353;

// Get references to volume/gain slider elements
// Get references to pan slider elements
// Get references to fadeIn elements
// Get references to fadeOut elements
const volumeControlAll = document.querySelector('#gainAll');
const panControlAll = document.querySelector('#panAll');
const fadeInAll = document.querySelector('#fadeInAll');
const fadeOutAll = document.querySelector('#fadeOutAll');

urls.forEach(function(_url, _index, _urls) {
  // volumeControls
  volumeControls.push(document.querySelector('#gain' + _index));
  // panControl
  panControls.push(document.querySelector('#pan' + _index));
  // fadeInControls
  fadeIns.push(document.querySelector('#fadeIn' + _index));
  // fadeOutControls
  fadeOuts.push(document.querySelector('#fadeOut' + _index));
});


// // EVENT LISTENERS

// Master Track
playAll.addEventListener('click', function() {
  playAllTracks();
}, false);

window.addEventListener('keyup', (event) => {
  if (event.keyCode === 32) {
    // if ( logLevel === "debug" ) { console.log('pressed spacebar'); }
    if (playAll.dataset.playing === 'false') {
      playAllTracks();
    } else if (playAll.dataset.playing === 'true') {
      pauseAllTracks();
    }
  }

  if (event.keyCode === 13) {
    // if ( logLevel === "debug" ) { console.log('pressed return key'); }
    if (playAll.dataset.playing === 'true') {
      pauseAllTracks();
    }
    setTimeout(function() {
      playheadTime = resetTime(playheadTime);
      playheadElement.innerHTML = formatTime(playheadTime);
      // playheadOffset.value = playheadTime;
      playheadSlider.value = playheadTime;
    }, 10);
  }
}, false);

pauseAll.addEventListener('click', function() {
  pauseAllTracks();
}, false);

pauseAll.addEventListener('touchstart', function(event) {
  event.preventDefault();
  pauseAllTracks();
}, false);

returnAll.addEventListener('click', () => {
  // if ( logLevel === "debug" ) { console.log('returnALL clicked'); }
  if (playAll.dataset.playing === 'true') {
    pauseAllTracks();
  }
  setTimeout(function() {
    playheadTime = resetTime(playheadTime);
    playheadElement.innerHTML = formatTime(playheadTime);
    playheadSlider.value = playheadTime;
  }, 10);
  // if ( logLevel === "debug" ) { console.log("playheadTime: " + playheadTime); }
});

returnAll.addEventListener('touchstart', (event) => {
  event.preventDefault();
  // if ( logLevel === "debug" ) { console.log('returnALL clicked'); }
  if (playAll.dataset.playing === 'true') {
    pauseAllTracks();
  }
  setTimeout(function() {
    playheadTime = resetTime(playheadTime);
    playheadElement.innerHTML = formatTime(playheadTime);
    playheadSlider.value = playheadTime;
  }, 10);
  // if ( logLevel === "debug" ) { console.log("playheadTime: " + playheadTime); }
});

// /Add event listeners for gain and pan changes
// Gain Sliders
volumeControlAll.addEventListener('input', function() {
  gainNodeAll.gain.linearRampToValueAtTime(this.value**1 * gainScale, ctx.currentTime + 0.1);
  playAll.dataset.baseGain = this.value;
  // console.log("VCA baseGain: " + playAll.dataset.baseGain);
  masterGainAutomationCurve = fadeInAllAutomationHandler(masterGainAutomationCurve, fadeInAll.value, fadeOutAll.value, playAll.dataset.baseGain);
}, false);

volumeControlAll.addEventListener('onchange', function() {
  playAll.dataset.volumeChanging = 'true';
}, false);

volumeControlAll.addEventListener('mouseup', function() {
  playAll.dataset.volumeChanging = 'false';
}, false);

panControlAll.addEventListener('input', function() {
  panNodeAll.pan.setValueAtTime(this.value, 0, ctx.currentTime);
}, false);

urls.forEach(function(_url, _index, _urls) {
  // volumeControls
  volumeControls[_index].addEventListener('input', function() {
    gainNodes[_index].gain.linearRampToValueAtTime(this.value * this.value * gainScale, ctx.currentTime + 0.001);
    // if ( logLevel === "debug" ) { console.log(gainNodes[0].gain.value); }
  }, false);
  panControls[_index].addEventListener('input', function() {
    panNodes[_index].pan.setValueAtTime(this.value, 0, ctx.currentTime);
  }, false);
});


// // FUNCTION DECLARATIONS

function init() {
  if ( logLevel === 'info' || 'debug') { console.log('Initializing MiniDaw v1.0b'); }
  // Fix up prefixing
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  ctx = new AudioContext();
  listener = ctx.listener;
  listener.setOrientation(0, 0, -1, 0, 1, 0);
  bufferLoader = new BufferLoader(ctx, urls, finishedLoading);
  bufferLoader.load();

  initRouting();
  unlockAudioContext(ctx);

  for (let i = 0; i < urls.length; i++) {
    const currentTrack = document.querySelector('#track' + i);
    if (currentTrack.dataset.playheadOffset === undefined) {
      currentTrack.dataset.playheadOffset = 0.0;
    }
    if (currentTrack.dataset.startTrim === undefined) {
      currentTrack.dataset.startTrim = 0.0;
    }
    if (currentTrack.dataset.endTrim === undefined) {
      currentTrack.dataset.endTrim = masterDuration;
    }
    if (currentTrack.dataset.trimmedStart === undefined) {
      currentTrack.dataset.trimmedStart = 0.0;
    }
    if (currentTrack.dataset.trimmedEnd === undefined) {
      currentTrack.dataset.trimmedEnd = 0.0;
    }
  }
  // Add event listeners for audio data loaded and populate duration elements
  // Get the modal
  var modal = document.getElementById("myModal");

  // Get the button that opens the modal
  var btn = document.getElementById("myBtn");

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  // When the user clicks the button, open the modal
  btn.onclick = function() {
    modal.style.display = "block";
  }

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
  //alert("Note for beginners: First, listen to the piece as it is by playing the master track. Then try “trimming” different elements and moving them from their current positions by dragging the waveform. After that, you can try fader controls and volume to shape each track.")
}

function finishedLoading(bufferList) {
  // if ( logLevel === "debug" ) { console.log(bufferList); }
  bufferList.forEach(function(_buffer, _index, _bufferList) {
    sources[_index] = ctx.createBufferSource();
    buffers[_index] = _bufferList[_index];
    sources[_index].buffer = buffers[_index];
    sources[_index].connect(ctx.destination);
  });
  loaded = true;
  bufferList.forEach(function(_buffer, _index, _bufferlist) {
  });
}



function initRouting() {
  // Create Master Gain Node and Pan Node then connect
  gainNodeAll = ctx.createGain();
  panNodeAll = ctx.createStereoPanner();
  panNodeAll.connect(gainNodeAll).connect(ctx.destination);

  // Create and Route all Basic Tracks
  urls.forEach(function(_url, _index, _urls) {
    panNodes[_index] = ctx.createStereoPanner();
    gainNodes[_index] = ctx.createGain();
    gainNodes[_index].gain.value = volumeControls[_index].valueAsNumber * volumeControls[_index].valueAsNumber * gainScale;
    panNodes[_index].connect(gainNodes[_index]).connect(panNodeAll);
  });
}

function updatePlayheadTime(_displayElement, _increment, _buttons) {
  if (playheadRunning === 'true') {
    setTimeout(
        function() {
        // if ( logLevel === "debug" ) { console.log('updating timer value'); }
        // if ( logLevel === "debug" ) { console.log('playheadTime: ' + playheadTime); }
          playheadTime = (ctx.currentTime - startTime + playheadStartTime);


          // if ( logLevel === "debug" ) { "Updating playheadTime to : " + console.log(playheadTime); }
          _displayElement.innerHTML = formatTime(playheadTime * 1000);
          const newPlayheadTime = parseFloat(playheadTime.toFixed(3));


          if (playAll.dataset.volumeChanging == 'true' ) {
            masterGainAutomationCurve = fadeInAllAutomationHandler(masterGainAutomationCurve, fadeInAll.value, fadeOutAll.value, playAll.dataset.baseGain);
          }
            volumeControlAll.value = masterGainAutomationCurve[Math.ceil(playheadTime)]
          // }

          if (playheadSliderJustClicked = 'false') {
            playheadSlider.value = newPlayheadTime;
          // playheadOffset.value = newPlayheadTime;
          }
          // if ( logLevel === "debug" ) { console.log(typeof(playheadSlider.value)); }

          // if ( CheckIfPlaying(_buttons) );
          if (playheadRunning === 'true') {
          // if ( logLevel === "debug" ) { console.log('recursive call'); }
            updatePlayheadTime(_displayElement, _increment, _buttons);
            if (playheadTime >= 353 ) {
              pauseAllTracks();
            }
          } else {
            playheadRunning = 'false';
            volumeControlAll.value = playAll.dataset.baseGain;
          // if ( logLevel === "debug" ) { console.log('inner playhead time: ' + playheadTime); }
          }




        }, _increment);
  }
}

function resetTime(_value) {
  return 0;
}

// function updateInput (target, val) {
//   const element = document.getElementById(target);
//   if (element.value != val) {
//     // if ( logLevel === "debug" ) { console.log(typeof(element.value)); }
//     element.value = val
//   }
// }

function formatTime(_time) {
  const hun = 10;
  const sec = hun * 100;
  const min = sec * 60;
  const hr = min * 60;

  let hours = Math.trunc(_time / hr);
  // if ( logLevel === "debug" ) { console.log(_time % hr); }
  let minutes = Math.trunc((_time % hr) / min);
  // if ( logLevel === "debug" ) { console.log(_time % min); }
  let seconds = Math.trunc((_time % min) / sec);
  // if ( logLevel === "debug" ) { console.log(_time % sec); }
  let hundredths = Math.trunc((_time % sec) / hun);

  if (hours < 10) {
    hours = '0' + hours;
  }
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  if (hundredths < 10) {
    hundredths = '0' + hundredths;
  }

  return (minutes + ':' + seconds + ':' + hundredths);
}

function resumeContext() {
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

// Overwrite sources array elements and populate their buffers with corresponding values from buffers array
function createSource(_index, _node) {
  sources[_index] = ctx.createBufferSource();
  sources[_index].buffer = buffers[_index];
  // if ( logLevel === "debug" ) { console.log(bufferList[_index]); }
  sources[_index].connect(_node);
  // if ( logLevel === "debug" ) { console.log(sources[_index]); }
}

function playTrack(_index, _playheadOffset) {
  if ( logLevel === "info" ) { console.log("Playing track: " + _index); }

  resumeContext();
  createSource(_index, panNodes[_index]);

  let currentTrack = document.querySelector('#track' + _index);
  let trackOffset = parseFloat(currentTrack.dataset.playheadOffset);
  let trackStartTrim = parseFloat(currentTrack.dataset.startTrim);
  let trackEndTrim = parseFloat(currentTrack.dataset.endTrim);
  // console.log(currentTrack.dataset);

  let wh = ctx.currentTime + trackOffset - _playheadOffset;
  if (wh < 0) {
    wh = 0;
  }
  let off = _playheadOffset - trackOffset + trackStartTrim;
  if (off < 0) {
    off = 0;
  }
  let dur = trackEndTrim - off;
  if (dur < 0) {
    dur = 0;
  }

  if (trackStartTrim < 0) {
    trackStartTrim = 0;
  }
  sources[_index].start(wh, off, dur);
  // if ( logLevel === "debug" ) { console.log(panNodeAll); }
  // if ( logLevel === "debug" ) { console.log(panNodes[_index]); }
  // FadeIn
  // const initialGain = gainNodes[_index].gain.value
  // if ( logLevel === "debug" ) { console.log("initialGain: " + initialGain); }
  // if ( logLevel === "debug" ) { console.log("when " + (wh)); }
  // if ( logLevel === "debug" ) { console.log(gainNodes[_index].gain.setTargetAtTime); }

  // HANDLE FADES
  // if ( logLevel === "debug" ) { console.log('FadeIn Index: ' + _index); }
  if (fadeIns[_index].value > 0) {
      if ( logLevel === "debug" ) { console.log('Fading in track ' + _index); }
    try {
      gainNodes[_index].gain.cancelScheduledValues(ctx.currentTime);
      gainNodes[_index].gain.setValueAtTime(0, ctx.currentTime);
      gainNodes[_index].gain.setValueAtTime(0, wh);
      console.log("wh: " + wh);
      console.log(gainNodes[_index].gain.value);
      // if ( logLevel === "debug" ) { console.log("resetGain: " + gainNodes[_index].gain.value); }
      if ( _playheadOffset < parseFloat(fadeIns[_index].value) ) {
        gainNodes[_index].gain.linearRampToValueAtTime(volumeControls[_index].value**2 * gainScale, wh + parseFloat(fadeIns[_index].value));
      } else {
        gainNodes[_index].gain.linearRampToValueAtTime(volumeControls[_index].value**2 * gainScale, wh + .1);
      }
      console.log(gainNodes[_index].gain.value);

    } catch (error) {
      if ( logLevel === "debug" ) { console.log('track_' + [_index] + 'fade in: ' + error); }
      console.log(error);
      gainNodes[_index].gain.setValueAtTime(volumeControls[_index].value**2 * gainScale, ctx.currentTime);
    }
  }

  // if ( logLevel === "debug" ) { console.log("fadeOut" + [_index] + ": " + (wh + dur - parseFloat(fadeOuts[_index].value))); }
  // Schedule Fade Out for Current Track
  if (fadeOuts[_index].value > 0) {
      if ( logLevel === "debug" ) { console.log('fading out track ' + _index); }
    try {
      if (masterDuration - _playheadOffset > parseFloat(fadeOuts[_index].value)) {
        gainNodes[_index].gain.linearRampToValueAtTime(0.0, wh + dur - parseFloat(fadeOuts[_index].value));
      } else {
        let fadeLerp = (masterDuration - _playheadOffset) / parseFloat(fadeOuts[_index].value);
        gainNodes[_index].gain.linearRampToValueAtTime(volumeControls[_index].value * gainScale * fadeLerp, wh + dur);
      }
    } catch (error) {
      console.log(error);
      // if ( logLevel === "debug" ) { console.log('track_' + [_index] + 'fade out: ' + error); }
      gainNodes[_index].gain.setValueAtTime(volumeControls[_index].value * gainScale, ctx.currentTime);
    }
  }
}

function pauseTrack(_index) {
  if ( logLevel === "info" ) { console.log('pausing track ' + _index); }
  sources[_index].stop();
}

// Handle pressing of the playAllTracks Button
function playAllTracks() {
  if ( logLevel === "info" ) { console.log('playAllTracks function running'); }
  // Check if audio files have fully loaded otherwise alert user to wait
  if (loaded) {
    // Check whether there is audio currently playing
    if (playAll.dataset.playing == 'false') {
      // Loop through each track and pause playback
      urls.forEach(function(_button, _index, _buttons) {
        if (playAll.dataset.playing === 'true') {
          pauseTrack(_index);
        }
      });

      // playheadStartTime = playheadSlider.valueAsNumber;
      playheadStartTime = (playheadSlider.valueAsNumber > masterDuration) ? masterDuration : playheadSlider.valueAsNumber;

      urls.forEach(function(_url, _index, _urls) {
        playTrack(_index, playheadTime);
      });

      // console.log(ctx.currentTime);
      // console.log(playheadStartTime);

      // Populate automation curve for master track gain
      let automationOffset = Math.ceil(playheadStartTime);

      gainNodeAll.gain.cancelScheduledValues(ctx.currentTime);
      try {
        // console.log(masterGainAutomationCurve[automationOffset]);
        if (masterDuration - automationOffset > 0) {
          gainNodeAll.gain.linearRampToValueAtTime(masterGainAutomationCurve[automationOffset]**1 * gainScale, ctx.currentTime + .1);
        }
      } catch (error) {
        console.log(error);
      }

      masterGainAutomationCurve = fadeInAllAutomationHandler(masterGainAutomationCurve, fadeInAll.value, fadeOutAll.value, playAll.dataset.baseGain);
      // console.log(masterGainAutomationCurve);
      // console.log(automationBuffer);

      // Schedule all automation for master gain
      masterGainAutomationCurve.forEach((item, i) => {

        //console.log("i + pst: " + i + " : " + playheadStartTime);

        //gainNodeAll.gain.linearRampToValueAtTime(masterGainAutomationCurve[automationOffset]**1 * gainScale, ctx.currentTime + .1);
        try {
          // console.log(masterGainAutomationCurve[automationOffset]);
          if (masterDuration - automationOffset > 0) {
            gainNodeAll.gain.linearRampToValueAtTime(masterGainAutomationCurve[automationOffset]**1 * gainScale, ctx.currentTime + .1);
          }
        } catch (error) {
          console.log(error);
        }

        //console.log("automationOffset: " + automationOffset);
        // if (i == 353) {
        //   gainNodeAll.gain.cancelScheduledValues(ctx.currentTime);
        //   gainNodeAll.gain = playAll.dataset.baseGain;
        // } else
        if (i == automationOffset ) {
          gainNodeAll.gain.cancelScheduledValues(ctx.currentTime);
          gainNodeAll.gain.linearRampToValueAtTime(masterGainAutomationCurve[i]**1 * gainScale, ctx.currentTime + .1);
        } else if (i > automationOffset ) {
          gainNodeAll.gain.linearRampToValueAtTime(masterGainAutomationCurve[i]**1 * gainScale, ctx.currentTime + i - automationOffset);
        } else if (i <= automationOffset) {
          //console.log("Skipping automation for past node: " + i + " : " + masterGainAutomationCurve[i] * gainScale);
        } else {
          // Handle errors
          //console.log("Unexpected array index state.");
        }

      });


      // if (playheadStartTime >= fadeInAll.value) {
      //   console.log("Playhead Start is after fadeIn.");
      //   gainNodeAll.gain.value = volumeControlAll.value;
      // } else {
      //   console.log("Playhead Start is before fadeIn. Attempting fadeIn.");
      //   //gainNodeAll.gain.value = 0;
      //   let interruptGain = volumeControlAll.value * playheadStartTime / fadeInAll.value;
      //   gainNodeAll.gain.setValueAtTime(interruptGain, ctx.currentTime);
      //   volumeControlAll.value = gainNodeAll.gain.value;
      //   console.log("interruptGain: " + interruptGain);
      //   //gainNodeAll.gain.linearRampToValueAtTime(volumeControlAll.value, ctx.currentTime + fadeInAll.value - playheadStartTime);
      //   console.log(gainNodeAll.gain.value);
      // }

      //gainNodeAll.gain.linearRampToValueAtTime(volumeControlAll.value, ctx.currentTime - playheadStartTime + parseFloat(fadeInAll.value));

      // gainNodeAll.gain.linearRampToValueAtTime(volumeControlAll.value, ctx.currentTime + masterDuration - playheadStartTime - parseFloat(fadeOutAll.value));
      // gainNodeAll.gain.linearRampToValueAtTime(0, ctx.currentTime - playheadStartTime + masterDuration);

      //gainNodeAll.gain.cancelScheduledValues(ctx.currentTime - playheadStartTime + masterDuration + 1);


      //////////////REFACTOR MASTER FADES
      // // Schedule Master Fade In
      // if (fadeInAll.value > 0) {
      //   try {
      //     //gainNodeAll.gain.linearRampToValueAtTime(0, ctx.currentTime);
      //     // if ( logLevel === "debug" ) { console.log("resetGain: " + gainNodeAll.gain.value);
      //     // if ( logLevel === "debug" ) { console.log("fadeAll target Time: " + (ctx.currentTime - playheadStartTime + parseFloat(fadeInAll.value)));
      //     gainNodeAll.gain.setvalueAtTime(0, ctx.currentTime);
      //     gainNodeAll.gain.linearRampToValueAtTime(volumeControlAll.value, ctx.currentTime - playheadStartTime + parseFloat(fadeInAll.value), 0.8);
      //   } catch (error) {
      //     // if ( logLevel === "debug" ) { console.log('master fade in: ' + error); }
      //     gainNodeAll.gain.setValueAtTime(volumeControlAll.value, ctx.currentTime);
      //   }
      // }
      //
      // // Schedule MasterFade out
      // if (fadeOutAll.value > 0) {
      //
      //   try {
      //     // gainNodeAll.gain.linearRampToValueAtTime(0, masterDuration - playheadStartTime - parseFloat(fadeOutAll.value), 0.8);
      //     gainNodeAll.gain.cancelScheduledValues(ctx.currentTime);
      //     gainNodeAll.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + masterDuration - playheadStartTime);
      //     console.log("Tried Fade All Out");
      //
      //   } catch (error) {
      //     console.log(error);
      //     // if ( logLevel === "debug" ) { console.log('master fade out: ' + error); }
      //     // gainNodeAll.gain.linearRampToValueAtTime(0, masterDuration - playheadStartTime - parseFloat(fadeOutAll.value), 0.8);
      //   }
      // }
      //////////////REFACTOR MASTER FADES END

      playAll.dataset.playing = 'true';
      playheadRunning = 'true';
      startTime = ctx.currentTime;
      updatePlayheadTime(playheadElement, timerIncrement, buttons);
    } else {
      // if ( logLevel === "debug" ) { console.log('Audio is already playing'); }
    }
  } else {
    alert('Audio files still loading. Please wait.');
  }
}

function pauseAllTracks() {
  if ( logLevel === "info" ) { console.log('Pausing all tracks'); }

  urls.forEach(function(_url, _index, _urls) {
    try {
      sources[_index].stop();
    } catch (error) {
      console.log("Audio has not started playback yet.");
    }
    // if ( logLevel === "debug" ) { console.log(gainNodes[_index]); }
    gainNodes[_index].gain.cancelScheduledValues(ctx.currentTime);
    // if ( logLevel === "debug" ) { console.log(volumeControls[_index].value); }
    gainNodes[_index].gain.linearRampToValueAtTime(volumeControls[_index].value, ctx.currentTime + .1);
  });

  gainNodeAll.gain.cancelScheduledValues(ctx.currentTime);
  // console.log(playAll.dataset.baseGain);
  gainNodeAll.gain.linearRampToValueAtTime(playAll.dataset.baseGain**1 * gainScale, ctx.currentTime + .1);
  if (playAll.dataset.volumeChanging == 'false' ) {
    volumeControlAll.value = playAll.dataset.baseGain;
  }

  if (playAll.dataset.playing == 'true') {
    playAll.dataset.playing = 'false';
    playheadRunning = 'false';
  } else {
    // if ( logLevel === "debug" ) { console.log('Audio is not currently playing'); }
  }

}

// function cacheGainValues (_gainCache) {
//   urls.forEach(function (_url, _index, _urls) {
//     _gainCache.push(gainNodes[_index].gain.value);
//   });
//   return _gainCache
// }
//
// function resetGainValues (_gainCache) {
//   urls.forEach(function (_url, _index, _urls) {
//     gainNode[_index].gain.setValueAtTime(_gainCache[_index], 0);
//   });
// }
//
// function resetGainConrolValues (_gainCache) {
//   urls.forEach(function (_url, _index, _urls) {
//     gainNode[_index].gain.setValueAtTime(_gainCache[_index], );
//   });
// }

function fadeInAllAutomationHandler (_automationArray, _fadeInTime, _fadeOutTime, _gain=0.5) {
  if ( logLevel === "info" ) { console.log("Populating automation array buffer"); }
  _automationArray.forEach((item, i) => {
    if (i < _fadeInTime && _fadeInTime > 0) {
      _automationArray[i] = parseFloat(_gain * i  / fadeInAll.value).toFixed(2);
      // console.log(_automationArray[i]);
    } else if ( i > masterDuration - _fadeOutTime  && _fadeOutTime > 0){
      _automationArray[i] = parseFloat(_gain * (masterDuration - i) / fadeOutAll.value).toFixed(2);
      // console.log(_automationArray[i]);
    } else {
      _automationArray[i] = parseFloat(_gain).toFixed(2);
      // console.log(_automationArray[i]);
    }
  });
  // console.log(_automationArray);
  return _automationArray;
}

function unlockAudioContext(ctx) {
  if ( logLevel === "info" ) { console.log('unlocking audioContext'); }
  if (ctx.state !== 'suspended') return;
  const b = document.body;
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
  events.forEach((e) => b.addEventListener(e, unlock, false));
  function unlock() {
    ctx.resume().then(clean);
  }
  function clean() {
    events.forEach((e) => b.removeEventListener(e, unlock));
  }
}

// Function for managing moveable regions
function makeMoveableDiv(div) {
  if ( logLevel === "info" ) { console.log('enabling region div move'); }
  const offsetX = document.querySelector('.daw-wrapper').offsetLeft;
  const movers = document.querySelectorAll(div);
  let currentMover = '';
  let originalXLeft = 0;
  let originalMouseX = 0;
  // const newMouseX = 0
  const maxRight = 540;
  const minLeft = 108;
  const maximumSize = 432;
  // const timelineMaxTime = masterDuration
  for (let i = 0; i < movers.length; i++) {
    currentMover = movers[i];
    currentMover.addEventListener('mousedown', function(e) {
      e.preventDefault();
      // document.querySelector('.debug').innerHTML = "clicked, originalMouseX: " + originalMouseX;
      originalXLeft = currentMover.getBoundingClientRect().left;
      originalMouseX = e.pageX;
      window.addEventListener('mousemove', moveDiv);
      window.addEventListener('mouseup', stopMoveDiv);
    });
  }

  function moveDiv(e) {
    if ( logLevel === "info" ) { console.log('moving region div'); }
    let newPos = parseInt(originalXLeft - (originalMouseX - e.pageX) - offsetX);
    const moverWidth = parseFloat(getComputedStyle(currentMover, null).getPropertyValue('width').replace('px', ''));
    // if ( logLevel === "debug" ) { console.log("moverWidth: " + moverWidth); }
    // if ( logLevel === "debug" ) { console.log("newPos: " + newPos); }
    // if ( logLevel === "debug" ) { console.log(moverWidth + newPos); }
    if (newPos < minLeft) {
      newPos = minLeft;
    }
    if (newPos + moverWidth > maxRight) {
      newPos = maxRight - moverWidth;
    }
    if (newPos + moverWidth == NaN) {
      newPos = minLeft;
    }
    currentMover.style.left = newPos + 'px';
    currentMover.style.right = (newPos + parseFloat(currentMover.style.width)) + 'px';
    // if ( logLevel === "debug" ) { console.log("right: " + currentMover.style.right); }

    currentMover.dataset.playheadOffset = parseFloat(((newPos - minLeft) / maximumSize) * masterDuration).toFixed(2); // milliseconds
    // if ( logLevel === "debug" ) { console.log("offset: " + currentMover.dataset.playheadOffset); }
  }

  function stopMoveDiv() {
    if ( logLevel === "info" ) { console.log('stopping region div move'); }

    window.removeEventListener('mousemove', moveDiv);
  }
}

// Function for managing resizeable regions
function makeResizableDiv(div) {
  if ( logLevel === "info" ) { console.log('enabling region div resizing'); }

  const offsetX = document.querySelector('.daw-wrapper').offsetLeft;
  const element = document.querySelector(div);
  const resizers = document.querySelectorAll(div + ' .resizer');

  const minimumSize = 60;
  const maximumSize = 432;
  const minLeft = 108 + offsetX;
  const maxRight = 540 + offsetX;
  let originalWidth = 0;
  let originalXLeft = 0;
  let originalXRight = 0;
  let originalMouseX = 0;
  let mouseOffsetRight = 0;
  let mouseOffsetLeft = 0;
  let cacheTrim = 0;
  let total = parseFloat(element.dataset.endTrim) + parseFloat(element.dataset.trimmedEnd);

  // let newDataPlayhead = element.dataset.playheadOffset;
  // let newDataStartTrim = element.dataset.startTrim;
  // let newDataEndTrim = element.dataset.endTrim;
  // let newDataTrimmedEnd = element.dataset.trimmedEnd;
  // let newDataTrimmedStart = element.dataset.trimmedStart;

  let originalColor = '';
  const errorColor = '#bc1413';

  for (let i = 0; i < resizers.length; i++) {
    const currentResizer = resizers[i];
    originalColor = currentResizer.style.backgroundColor;
    currentResizer.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();

      originalWidth = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
      // if ( logLevel === "debug" ) { console.log("originalWidth: " + originalWidth); }

      originalXLeft = element.getBoundingClientRect().left;
      originalXRight = element.getBoundingClientRect().right;
      // if ( logLevel === "debug" ) { console.log(originalXLeft + ", " + originalXRight); }

      originalMouseX = e.pageX;
      mouseOffsetRight = originalXRight - originalMouseX; // get distance between mouse click and resizer's outer edge
      mouseOffsetLeft = originalMouseX - originalXLeft;

      // if ( logLevel === "debug" ) { console.log("mouseOffsetLeft: " + mouseOffsetLeft + ", mouseOffsetRight: " + mouseOffsetRight); }
      //console.log("Total: " + (mouseOffsetLeft + mouseOffsetRight));
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
    });

    function resize(e) {
    if ( logLevel === "info" ) { console.log('resizing region div'); }

      let mouseX = 0;
      //console.log("mouseX: " + mouseX);
      //console.log(element.dataset);


      // HANDLE RIGHT RESIZER
      if (currentResizer.classList.contains('bottom-right') || currentResizer.classList.contains('side-right')) {
        if ( logLevel === "info" ) { console.log('handling right resizer'); }

        // Get right edge position in pixels and parse
        let originalResizerPos = parseFloat(element.style.right); // 548 offsetX + minLeft + max_width
        if ( logLevel === "debug" ) { console.log("originalResizerPos: " + originalResizerPos); }

        if (Number.isNaN(originalResizerPos)) {
          originalResizerPos = parseFloat(maxRight); // 548

        }
        // Get current clip's trimmed duration in seconds
        cacheTrim = parseFloat(element.dataset.endTrim); // 90
        console.log("startTrim: " + cacheTrim);
        let newTrim = 0.0; // initialize new trim variable

        // get current mouse X position
        mouseX = e.pageX + mouseOffsetRight; // current click-drag position
        // Clamp mouse position input to right edge
        if (mouseX > maxRight) {
          mouseX = maxRight;
        }
        if ( logLevel === "debug" ) { console.log("mouseX: " + mouseX); }

        originalMouseX = originalXRight;
        // if ( logLevel === "debug" ) { console.log("ogMouseX: " + originalMouseX); }
        // Calculate new width of div
        let width = originalWidth - (originalXRight - mouseX);


        // Check if width is in bounds
        if (width < minimumSize) {
          width = minimumSize
        }
        if (width > maximumSize) {
          width = maximumSize
        }
        // if ( logLevel === "debug" ) { console.log("width: " + width); }
        if (width >= minimumSize && width <= maximumSize) {

          // Trim duration if not exceeding max time
          if (cacheTrim <= 0) {
            cacheTrim = 0;
          } else if (cacheTrim >= masterDuration) {
            cacheTrim = masterDuration;
          }
          if ( logLevel === "debug" ) { console.log("cacheTrim: " + cacheTrim); }
          newTrim = parseFloat(cacheTrim - (originalResizerPos - mouseX) * (masterDuration  / maximumSize));

          // console.log("startTrim: " + cacheTrim);
          // console.log("masterDuration: " + masterDuration);
          // console.log("originalResizerPos: " + originalResizerPos);
          // console.log("mouseX: " + mouseX);
          // console.log("maximumSize: " + maximumSize);
          // console.log("newTrim: " + newTrim);

          // If trim is in bounds apply resize transformation
          if (newTrim <= masterDuration ) {
            element.dataset.endTrim = newTrim
            console.log("te: " + element.dataset.trimmedEnd);
            element.dataset.trimmedEnd = parseFloat(element.dataset.trimmedEnd) + (cacheTrim - newTrim);

            console.log("newTrim: " + newTrim);
            console.log("trimmedEnd: " + parseFloat(element.dataset.trimmedEnd));

            total = parseFloat(element.dataset.trimmedEnd) + parseFloat(element.dataset.endTrim)
            console.log("Total: " + total);
            // newDataEndTrim = newTrim;
          }

          // if (newTrim >= masterDuration - 0.5) {
          //    newTrim = masterDuration
          //  }
          // if (newTrim <= 0.5) {
          //   newTrim = 0
          // }


          //
          // if ( total <= masterDuration && parseFloat(element.dataset.trimmedEnd) >= 0){
          if (newTrim < masterDuration) {
            element.style.width = width + 'px';
            element.style.right = originalXLeft + width + 'px';
            // console.log("newTrim: " + newTrim);
          }

          if (mouseX = maxRight && e.pageX + mouseOffsetRight > maxRight) {
            width = maxRight - element.style.left;
          }

          // Color resizers red if at end of audio clip length
          if (masterDuration - newTrim <= 0) {
            resizers.forEach(function(_resizer, _index, _arr) {
              const r = resizers[_index];
              if (r.classList.contains('side-right') || r.classList.contains('bottom-right')) {
                r.style.backgroundColor = errorColor;
              }
            });
          } else {
            resizers.forEach(function(_resizer, _index, _arr) {
              const r = resizers[_index];
              if (r.classList.contains('side-right') || r.classList.contains('bottom-right')) {
                r.style.backgroundColor = originalColor;
              }
            });
          }
        }

      } // End Right Resizers Conditionals
      // HANDLE LEFT RESIZER
      else if (currentResizer.classList.contains('bottom-left') || currentResizer.classList.contains('side-left')) {
        if ( logLevel === "info" ) { console.log('handling left resizer'); }

        // Get right edge position in pixels and parse
        let originalResizerPos = parseFloat(element.getBoundingClientRect().left);
        // if ( logLevel === "debug" ) { console.log("originalResizerPos: " + originalResizerPos); }
        if (originalResizerPos === '' || Number.isNaN(originalResizerPos)) {
          originalResizerPos = parseFloat(minLeft); // 116
        }
        // if ( logLevel === "debug" ) { console.log("originalResizerPos: " + originalResizerPos); }
        let cacheTrim = parseFloat(element.dataset.startTrim);
        // if ( logLevel === "debug" ) { console.log("st: " + cacheTrim); } //0
        let newTrim = 0.0;

        // get current mouse X position
        mouseX = e.pageX - mouseOffsetLeft; // current click-drag position

        // clamp mouseX to left edge of draggable area
        if (mouseX <= minLeft) {
          mouseX = minLeft;
        }
        // if ( logLevel === "debug" ) { console.log("mouseX: " + mouseX); }


        // calculate current resizable element width
        let width = originalXRight - (mouseX);

        // Check if width is in bounds
        if (width < minimumSize){ width = minimumSize }
        if (width > maximumSize){ width = maximumSize }
        if ( logLevel === "debug" ) { console.log("width: " + width); }

        // if (width >= minimumSize && width <= maximumSize) {
          // Check if mouse is left of border
          if (mouseX < minLeft) {
            // set left edge of region div to left border of track arrange area
            element.style.left = (mouseX - offsetX) + 'px'; // 116
            // cache new trim value
            newTrim = cacheTrim;
            // if ( logLevel === "debug" ) { console.log("mouseX: " + mouseX + ", newTrim: " + newTrim); }
            // Set audio buffer's endpoint trim data
            element.dataset.startTrim = newTrim;
            // Check if mouse is within the left border
          } else if (mouseX >= minLeft && mouseX + minimumSize <= maximumSize) {
            newTrim = (cacheTrim + masterDuration * ((mouseX - originalResizerPos) / maximumSize)).toFixed(4);
            // clamp trim to master duration range
            if (newTrim > masterDuration) {
              newTrim = masterDuration;
            } else if (newTrim <= 0) {
              newTrim = 0;
            }
            // if ( logLevel === "debug" ){ console.log("mouseX: " + mouseX + ", newTrim: " + newTrim); }

            if (element.dataset.startTrim != newTrim && element.dataset.startTrim >= 0) {
              element.dataset.startTrim = newTrim;
              // if ( logLevel === "debug") { console.log(element.style.left); }
              element.style.left = (mouseX - offsetX) + 'px';
              // if ( logLevel === "debug" ) { console.log("left: " + element.style.left); }

              element.dataset.playheadOffset = parseFloat(((mouseX - minLeft) / maximumSize) * masterDuration);
              element.style.width = width + 'px';
              const bgPos = element.dataset.startTrim;
              // if ( logLevel === "debug" ) { console.log(bgPos); }
              element.querySelector('.waveform').style.backgroundPosition = -bgPos * 1.224 + 'px, 50%';
              // if ( logLevel === "debug" ) { console.log(typeof(newTrim)); }
              // if ( logLevel === "debug" ) { console.log("newTrim: " + parseFloat(newTrim).toFixed(2) + "px, 0px"); }
            }

            // Color resizers red if at end of audio clip length
            if (masterDuration - newTrim <= 0) {
              resizers.forEach(function(_resizer, _index, _arr) {
                const r = resizers[_index];
                if (r.classList.contains('side-left') || r.classList.contains('bottom-left')) {
                  r.style.backgroundColor = errorColor;
                }
              });
            } else {
              resizers.forEach(function(_resizer, _index, _arr) {
                const r = resizers[_index];
                if (r.classList.contains('side-left') || r.classList.contains('bottom-left')) {
                  r.style.backgroundColor = originalColor;
                }
              });
            }
          }
        // }
      } // End Left Resizers Conditionals

      // if ( logLevel === "debug" ) { console.log("exit endTrim: " + element.dataset.endTrim); }
    } // End function resize

    function stopResize() {
      if ( logLevel === "info" ) { console.log('stopping resize'); }
      resizers.forEach(function(_resizer, _index, _arr) {
        _resizer.style.backgroundColor = originalColor;
      });
      window.removeEventListener('mousemove', resize);
      // console.log(element.dataset);
      if (playAll.dataset.playing === 'true') {
        pauseAllTracks();
        playAllTracks();
      }
    }

  }
}

function updateTrackDataset(_element, _playheadOffset, _startTrim, _endTrim) {
  _element.dataset.playheadOffset = _playheadOffset;
  _element.dataset.startTrim = _startTrim;
  _element.dataset.endTrim = _endTrim;

  if ( logLevel === "debug" ) { console.log(_element.dataset); }
}


// // Initialize App
const tracks = ['track0', 'track1', 'track2', 'track3', 'track4'];

window.onload = function() {
  if ( logLevel === "info" ) { console.log('window did load'); }
  init();
  for (let i = 0; i < tracks.length; i++) {
    const div = tracks[i];
    makeResizableDiv('#' + div);
    makeMoveableDiv('#' + div);
  }
}
