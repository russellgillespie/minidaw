// Web Audio Code

const logLevel = 'info'; // debug // info // none //

let ctx;

const gainScale = 3;

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
  if (playAll.dataset.playing === 'true') {
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
playAll.dataset.playing = false;

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

window.addEventListener('keydown', (event) => {
  if (event.keyCode === 32) {
    // if ( logLevel === "debug" ) console.log('pressed spacebar')
    if (playAll.dataset.playing === 'false') {
      playAllTracks();
    } else if (playAll.dataset.playing === 'true') {
      pauseAllTracks();
    }
  }

  if (event.keyCode === 13) {
    // if ( logLevel === "debug" ) console.log('pressed return key')
    if (playAll.dataset.playing === 'true') {
      pauseAllTracks();
    }
    setTimeout(function() {
      playheadTime = resetTime(playheadTime);
      playheadElement.innerHTML = formatTime(playheadTime);
      // playheadOffset.value = playheadTime;
      playheadSlider.value = playheadTime;
    }, 10);
  };
}, false);

pauseAll.addEventListener('click', function() {
  pauseAllTracks();
}, false);

pauseAll.addEventListener('touchstart', function(event) {
  event.preventDefault();
  pauseAllTracks();
}, false);

returnAll.addEventListener('click', () => {
  // if ( logLevel === "debug" ) console.log('returnALL clicked')
  if (playAll.dataset.playing === 'true') {
    pauseAllTracks();
  }
  setTimeout(function() {
    playheadTime = resetTime(playheadTime);
    playheadElement.innerHTML = formatTime(playheadTime);
    playheadSlider.value = playheadTime;
  }, 10);
  // if ( logLevel === "debug" ) console.log("playheadTime: " + playheadTime);
});

returnAll.addEventListener('touchstart', (event) => {
  event.preventDefault();
  // if ( logLevel === "debug" ) console.log('returnALL clicked')
  if (playAll.dataset.playing === 'true') {
    pauseAllTracks();
  }
  setTimeout(function() {
    playheadTime = resetTime(playheadTime);
    playheadElement.innerHTML = formatTime(playheadTime);
    playheadSlider.value = playheadTime;
  }, 10);
  // if ( logLevel === "debug" ) console.log("playheadTime: " + playheadTime);
});

// /Add event listeners for gain and pan changes
// Gain Sliders
volumeControlAll.addEventListener('input', function() {
  gainNodeAll.gain.linearRampToValueAtTime(this.value * this.value * gainScale, ctx.currentTime + 0.001);
}, false);

panControlAll.addEventListener('input', function() {
  panNodeAll.pan.setValueAtTime(this.value, 0, ctx.currentTime);
}, false);

urls.forEach(function(_url, _index, _urls) {
  // volumeControls
  volumeControls[_index].addEventListener('input', function() {
    gainNodes[_index].gain.linearRampToValueAtTime(this.value * this.value * gainScale, ctx.currentTime + 0.001);
    // if ( logLevel === "debug" ) console.log(gainNodes[0].gain.value);
  }, false);
  panControls[_index].addEventListener('input', function() {
    panNodes[_index].pan.setValueAtTime(this.value, 0, ctx.currentTime);
  }, false);
});


// // FUNCTION DECLARATIONS

function init() {
  if ( logLevel === 'info' || 'debug') console.log('Initializing MiniDaw v1.0b');
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
      currentTrack.dataset.playheadOffset = 0;
    };
    if (currentTrack.dataset.startTrim === undefined) {
      currentTrack.dataset.startTrim = 0;
    };
    if (currentTrack.dataset.endTrim === undefined) {
      currentTrack.dataset.endTrim = masterDuration;
    };
  }
  // Add event listeners for audio data loaded and populate duration elements
}

function finishedLoading(bufferList) {
  // if ( logLevel === "debug" ) console.log(bufferList);
  bufferList.forEach(function(_buffer, _index, _bufferList) {
    sources[_index] = ctx.createBufferSource();
    buffers[_index] = _bufferList[_index];
    sources[_index].buffer = buffers[_index];
    sources[_index].connect(ctx.destination);
  });
  loaded = true;
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
    // if ( logLevel === "debug" ) console.log(startTime);
    setTimeout(
        function() {
        // if ( logLevel === "debug" ) console.log('updating timer value');
        // if ( logLevel === "debug" ) console.log('playheadTime: ' + playheadTime);
          playheadTime = (ctx.currentTime - startTime + playheadStartTime);
          _displayElement.innerHTML = formatTime(playheadTime * 1000);
          const newPlayheadTime = parseFloat(playheadTime.toFixed(3));
          if (playheadSliderJustClicked = 'false') {
            playheadSlider.value = newPlayheadTime;
          // playheadOffset.value = newPlayheadTime;
          }
          // if ( logLevel === "debug" ) console.log(typeof(playheadSlider.value));

          // if ( CheckIfPlaying(_buttons) )
          if (playheadRunning === 'true') {
          // if ( logLevel === "debug" ) console.log('recursive call');
            updatePlayheadTime(_displayElement, _increment, _buttons);
          } else {
            playheadRunning = 'false';
          // if ( logLevel === "debug" ) console.log('inner playhead time: ' + playheadTime);
          }
        }, _increment);
  }
}

function resetTime(_value) {
  return 0;
}

// function updateInput (target, val) {
//   const element = document.getElementById(target)
//   if (element.value != val) {
//     // if ( logLevel === "debug" ) console.log(typeof(element.value));
//     element.value = val
//   }
// }

function formatTime(_time) {
  const hun = 10;
  const sec = hun * 100;
  const min = sec * 60;
  const hr = min * 60;

  let hours = Math.trunc(_time / hr);
  // if ( logLevel === "debug" ) console.log(_time % hr);
  let minutes = Math.trunc((_time % hr) / min);
  // if ( logLevel === "debug" ) console.log(_time % min);
  let seconds = Math.trunc((_time % min) / sec);
  // if ( logLevel === "debug" ) console.log(_time % sec);
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
  // if ( logLevel === "debug" ) console.log(bufferList[_index]);
  sources[_index].connect(_node);
  // if ( logLevel === "debug" ) console.log(sources[_index]);
}

function playTrack(_index, _playheadOffset) {
  resumeContext();
  createSource(_index, panNodes[_index]);
  const currentTrack = document.querySelector('#track' + _index);
  const trackOffset = parseFloat(currentTrack.dataset.playheadOffset);
  let trackStartTrim = parseFloat(currentTrack.dataset.startTrim);
  const trackEndTrim = parseFloat(currentTrack.dataset.endTrim);

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
  // if ( logLevel === "debug" ) console.log(panNodeAll);
  // if ( logLevel === "debug" ) console.log(panNodes[_index]);
  // FadeIn
  // const initialGain = gainNodes[_index].gain.value
  // if ( logLevel === "debug" ) console.log("initialGain: " + initialGain)
  // if ( logLevel === "debug" ) console.log("when " + (wh));
  // if ( logLevel === "debug" ) console.log(gainNodes[_index].gain.setTargetAtTime);

  // if ( logLevel === "debug" ) console.log('FadeIn Index: ' + _index)
  if (fadeIns[_index].value > 0) {
    try {
      gainNodes[_index].gain.linearRampToValueAtTime(0, ctx.currentTime);
      // if ( logLevel === "debug" ) console.log("resetGain: " + gainNodes[_index].gain.value);
      gainNodes[_index].gain.linearRampToValueAtTime(volumeControls[_index].value, wh + parseFloat(fadeIns[_index].value), 0.8);
    } catch (error) {
      // if ( logLevel === "debug" ) console.log('track_' + [_index] + 'fade in: ' + error)
      gainNodes[_index].gain.setValueAtTime(volumeControls[_index].value, ctx.currentTime);
    }
  }

  // if ( logLevel === "debug" ) console.log("fadeOut" + [_index] + ": " + (wh + dur - parseFloat(fadeOuts[_index].value)));
  // Schedule Fade Out for Current Track
  if (fadeOuts[_index].value > 0) {
    try {
      gainNodes[_index].gain.linearRampToValueAtTime(0.0, wh + dur - parseFloat(fadeOuts[_index].value), 0.8);
    } catch (error) {
      // if ( logLevel === "debug" ) console.log('track_' + [_index] + 'fade out: ' + error)
      gainNodes[_index].gain.setValueAtTime(volumeControls[_index].value, ctx.currentTime);
    }
  }
}

function pauseTrack(_index) {
  // if ( logLevel === "debug" ) console.log('pausing track ' + _index)
  sources[_index].stop();
}

// Handle pressing of the playAllTracks Button
function playAllTracks() {
  // if ( logLevel === "debug" ) console.log('playAllTracks function running')
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
      playheadStartTime = playheadSlider.valueAsNumber;
      urls.forEach(function(_url, _index, _urls) {
        playTrack(_index, playheadTime);
      });

      // Schedule Master Fade In
      if (fadeInAll.value > 0) {
        try {
          gainNodeAll.gain.linearRampToValueAtTime(0, ctx.currentTime);
          // if ( logLevel === "debug" ) console.log("resetGain: " + gainNodeAll.gain.value);
          // if ( logLevel === "debug" ) console.log("fadeAll target Time: " + (ctx.currentTime - playheadStartTime + parseFloat(fadeInAll.value)));
          gainNodeAll.gain.linearRampToValueAtTime(volumeControlAll.value, ctx.currentTime - playheadStartTime + parseFloat(fadeInAll.value), 0.8);
        } catch (error) {
          // if ( logLevel === "debug" ) console.log('master fade in: ' + error)
          gainNodeAll.gain.setValueAtTime(volumeControlAll.value, ctx.currentTime);
        }
      }

      // Schedule MasterFade out
      if (fadeOutAll.value > 0) {
        try {
          gainNodeAll.gain.linearRampToValueAtTime(0, masterDuration - playheadStartTime - parseFloat(fadeOutAll.value), 0.8);
        } catch (error) {
          // if ( logLevel === "debug" ) console.log('master fade out: ' + error)
          gainNodeAll.gain.linearRampToValueAtTime(0, masterDuration - playheadStartTime - parseFloat(fadeOutAll.value), 0.8);
        }
      }

      playAll.dataset.playing = 'true';
      playheadRunning = 'true';
      startTime = ctx.currentTime;
      updatePlayheadTime(playheadElement, timerIncrement, buttons);
    } else {
      // if ( logLevel === "debug" ) console.log('Audio is already playing')
    }
  } else {
    alert('Audio files still loading. Please wait.');
  }
}

function pauseAllTracks() {
  urls.forEach(function(_url, _index, _urls) {
    sources[_index].stop();
    // if ( logLevel === "debug" ) console.log(gainNodes[_index]);
    gainNodes[_index].gain.cancelScheduledValues(ctx.currentTime);
    // if ( logLevel === "debug" ) console.log(volumeControls[_index].value)
    gainNodes[_index].gain.setValueAtTime(volumeControls[_index].value, ctx.currentTime);
  });
  gainNodeAll.gain.cancelScheduledValues(ctx.currentTime);
  gainNodeAll.gain.setValueAtTime(volumeControlAll.value, ctx.currentTime);
  if (playAll.dataset.playing == 'true') {
    playAll.dataset.playing = 'false';
    playheadRunning = 'false';
  } else {
    // if ( logLevel === "debug" ) console.log('Audio is not currently playing')
  }
}

// function cacheGainValues (_gainCache) {
//   urls.forEach(function (_url, _index, _urls) {
//     _gainCache.push(gainNodes[_index].gain.value)
//   })
//   return gainCache
// }

// function resetGainValues (_gainCache) {
//   urls.forEach(function (_url, _index, _urls) {
//     gainNode[_index].gain.setValueAtTime(_gainCache[_index], 0)
//   })
// }

function unlockAudioContext(ctx) {
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

function makeMoveableDiv(div) {
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
    let newPos = parseInt(originalXLeft - (originalMouseX - e.pageX) - offsetX);
    const moverWidth = parseFloat(getComputedStyle(currentMover, null).getPropertyValue('width').replace('px', ''));
    // if ( logLevel === "debug" ) console.log("moverWidth: " + moverWidth);
    // if ( logLevel === "debug" ) console.log("newPos: " + newPos);
    // if ( logLevel === "debug" ) console.log(moverWidth + newPos);
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
    // if ( logLevel === "debug" ) console.log("right: " + currentMover.style.right);

    currentMover.dataset.playheadOffset = parseFloat(((newPos - minLeft) / maximumSize) * masterDuration).toFixed(2); // milliseconds
    // if ( logLevel === "debug" ) console.log("offset: " + currentMover.dataset.playheadOffset);
  }

  function stopMoveDiv() {
    window.removeEventListener('mousemove', moveDiv);
  }
}

function makeResizableDiv(div) {
  const offsetX = document.querySelector('.daw-wrapper').offsetLeft;
  const element = document.querySelector(div);
  const resizers = document.querySelectorAll(div + ' .resizer');
  const minimumSize = 60;
  const maximumSize = 432;
  const minLeft = 108 + offsetX;
  const maxRight = 540 + offsetX;
  let originalWidth = 0;
  // const originalHeight = 0
  let originalXLeft = 0;
  // const originalY = 0
  let originalXRight = 0;
  let originalMouseX = 0;
  // const originalMouseY = 0
  let mouseOffsetRight = 0;
  let mouseOffsetLeft = 0;
  let originalColor = '';
  const errorColor = '#bc1413';

  for (let i = 0; i < resizers.length; i++) {
    const currentResizer = resizers[i];
    originalColor = currentResizer.style.backgroundColor;
    currentResizer.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      originalWidth = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
      // if ( logLevel === "debug" ) console.log(originalWidth);
      originalXLeft = element.getBoundingClientRect().left;
      originalXRight = element.getBoundingClientRect().right;
      // if ( logLevel === "debug" ) console.log(originalXLeft + ", " + originalXRight);
      originalMouseX = e.pageX;
      mouseOffsetRight = originalXRight - originalMouseX; // get distance between mouse click and resizer's outer edge
      mouseOffsetLeft = originalMouseX - originalXLeft;
      // if ( logLevel === "debug" ) console.log("mouseOffsetLeft: " + mouseOffsetLeft + ", mouseOffsetRight: " + mouseOffsetRight);
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
    });

    function resize(e) {
      let mouseX = 0;
      if (currentResizer.classList.contains('bottom-right') || currentResizer.classList.contains('side-right')) {
        // Get right edge position in pixels and parse
        let originalTrim = parseFloat(element.style.right); // 548 offsetX + minLeft + max_width
        // if ( logLevel === "debug" ) console.log("originalTrim: " + originalTrim);

        if (Number.isNaN(originalTrim)) {
          originalTrim = maxRight; // 548
        }
        // Get current clip's trimmed duration in seconds
        let startTrim = parseFloat(element.dataset.endTrim); // 90
        let newTrim = 0.0; // initialize new trim variable
        mouseX = e.pageX + mouseOffsetRight; // current click-drag position
        // Clamp mouse position input to right edge
        if (mouseX > maxRight) {
          mouseX = maxRight;
        }
        originalMouseX = originalXRight;
        // if ( logLevel === "debug" ) console.log("ogMouseX: " + originalMouseX);
        // Calculate new width of div
        const width = originalWidth - (originalXRight - mouseX);
        // if ( logLevel === "debug" ) console.log("width: " + width);

        // check that width is in bounds
        if (width >= minimumSize && width <= maximumSize) {
          // Trim duration if not exceeding max time
          if (startTrim <= 0) {
            startTrim = 0;
          } else if (startTrim >= masterDuration) {
            startTrim = masterDuration;
          }
          // if ( logLevel === "debug" ) console.log("start trim: " + startTrim);
          newTrim = parseFloat(startTrim - masterDuration * ((originalTrim - mouseX) / maximumSize));

          if (newTrim <= masterDuration && newTrim >= 0) {
            element.dataset.endTrim = newTrim;
            element.style.width = width + 'px';
            element.style.right = originalXLeft + width + 'px';
          }

          if (masterDuration - newTrim < 0.01) {
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
      else if (currentResizer.classList.contains('bottom-left') || currentResizer.classList.contains('side-left')) {
        let originalTrim = parseFloat(element.getBoundingClientRect().left);
        if (originalTrim === '' || Number.isNaN(originalTrim)) {
          originalTrim = minLeft; // 116
        }
        // if ( logLevel === "debug" ) console.log("originalTrim: " + originalTrim);
        const startTrim = parseFloat(element.dataset.startTrim);
        // if ( logLevel === "debug" ) console.log("st: " + startTrim); //0
        let newTrim = 0.0;

        // get current mouse X position
        mouseX = e.pageX - mouseOffsetLeft; // current click-drag position
        // clamp mouseX to left edge of draggable area
        if (mouseX <= minLeft) {
          mouseX = minLeft;
        }
        // if ( logLevel === "debug" ) console.log("mouseX: " + mouseX);
        // calculate current resizable element width
        const width = originalXRight - (mouseX);
        // if ( logLevel === "debug" ) console.log("oxr: " + originalXRight);
        // if ( logLevel === "debug" ) console.log("width: " + width);
        // Check if width is in bounds
        if (width >= minimumSize && width <= maximumSize) {
          // left = mouseX;
          //
          if (mouseX < minLeft) {
            element.style.left = (mouseX - offsetX) + 'px'; // 116
            newTrim = startTrim;
            // if ( logLevel === "debug" ) console.log("mouseX: " + mouseX + ", newTrim: " + newTrim);
            element.dataset.startTrim = newTrim;
          } else if (mouseX >= minLeft) {
            newTrim = (startTrim + masterDuration * ((mouseX - originalTrim) / maximumSize)).toFixed(4);
            // clamp trim to master duration range
            if (newTrim > masterDuration) {
              newTrim = masterDuration;
            } else if (newTrim <= 0) {
              newTrim = 0;
            }
            // if ( logLevel === "debug" ) console.log("mouseX: " + mouseX + ", newTrim: " + newTrim);

            if (element.dataset.startTrim != newTrim && element.dataset.startTrim >= 0) {
              element.dataset.startTrim = newTrim;
              element.style.left = (mouseX - offsetX) + 'px';
              // if ( logLevel === "debug" ) console.log("left: " + left);
              element.dataset.playheadOffset = parseFloat(((mouseX - minLeft) / maximumSize) * masterDuration);
              element.style.width = width + 'px';
              const bgPos = element.dataset.startTrim;
              // if ( logLevel === "debug" ) console.log(bgPos)
              element.querySelector('.waveform').style.backgroundPosition = -bgPos * 1.224 + 'px, 50%';
              // if ( logLevel === "debug" ) console.log(newTrim.toFixed(2) + "px, 0px");
            }

            // Color resizers red if at end of audio clip length
            if (newTrim < 0.001) {
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
        }
      } // End Left Resizers Conditionals

      // if ( logLevel === "debug" ) console.log("exit endTrim: " + element.dataset.endTrim);
    } // End function resize

    function stopResize() {
      resizers.forEach(function(_resizer, _index, _arr) {
        _resizer.style.backgroundColor = originalColor;
      });
      window.removeEventListener('mousemove', resize);
    }
  }
}


// // Initialize App
const tracks = ['track0', 'track1', 'track2', 'track3', 'track4'];

window.onload = function() {
  init();
  for (let i = 0; i < tracks.length; i++) {
    const div = tracks[i];
    makeResizableDiv('#' + div);
    makeMoveableDiv('#' + div);
  }
};
