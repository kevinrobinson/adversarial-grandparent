var _ = window._;
var IMAGENET_CLASSES = window.IMAGENET_CLASSES;

const SEEKING_ZERO = (window.location.search.indexOf('?seekzero') === 0);
const SHOULD_NOTIFY = (window.location.search.indexOf('?notify') === 0);

const targetClassName = Object.values(IMAGENET_CLASSES)[3];

async function main() {
  // load model before anything
  const model = await window.mobilenet.load();
  
  // state
  var aborted = false;
  var i = 0;
  var foundClassNames = {};
  
  function newline() {
    const br = document.createElement('br');
    document.querySelector('#out').appendChild(br);
  }
  
  // loop
  async function iteration(parent) {
    // explore
    const TOP_K = Object.keys(IMAGENET_CLASSES).length;
    const EXPLORATIONS = 10; // essentially tunes the level of feedback during iterations
    const paths = await Promise.all(_.range(0, EXPLORATIONS).map(async n => {
      // try different mutations here
      // const mutant = rectMutation(parent);
      const mutant = pixelMutation(parent);
      const predictions = await model.classify(mutant, TOP_K);
      
      // highest not yet found
      // const prediction = predictions.filter(prediction => !foundClassNames[prediction.className])[0];
      // const p = prediction.probability;
      // const className = prediction.className;
      
      // find targetClassName
      const prediction = predictions.filter(prediction => prediction.className === targetClassName)[0];
      const p = prediction.probability;
      const className = prediction.className;
            
      return {mutant, predictions, p, className, n};
    }));
    const debug = paths.map(path => { return {p: path.p, className: path.className }; });
    const choice = (SEEKING_ZERO ? _.minBy: _.maxBy)(paths, path => path.p);
    const {mutant, p, predictions, className, n} = choice;
    
    // decide
    i++;
    const next = action(foundClassNames, {i, p, className, mutant, parent});
    
    // render
    const blockEl = createBlockEl(i, choice, paths, next);
    document.querySelector('#out').appendChild(blockEl);
    
    // act
    if (aborted) {
      return;
    }
    if (next.wat === 'done') {
      return;
    }
    if (next.wat === 'found') {
      foundClassNames[next.params.className] = true;
      console.log('> found' + next.params.className);
      notify({
        i,
        p,
        predictions,
        className: next.params.className,
        dataURL: mutant.toDataURL(),
        config: {EXPLORATIONS}
      });
      newline();
      return iteration(await newClipartMutation());
    }
    if (next.wat === 'continue') {
      return iteration(next.params.mutant);
    }
    if (next.wat === 'diverge') {
      newline();
      return iteration(await newClipartMutation());
    }
  }

  // abort, start with new image
  document.querySelector('#own-image').addEventListener('click', async e => {
    e.preventDefault();
    const url = prompt("What image URL?\n\neg: https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-25%20at%2012.26.04%20PM.png?v=1564071974428");
  if (!url) return;  
    
    window.history.pushState({}, '', '?url=' + encodeURIComponent(url));
    // hacky restart
    aborted = true;
    setTimeout(async () => {
      i = 0;
      foundClassNames = {};
      aborted = false;
      newline();
      iteration(await fromImageURL(url));
    }, 1000);
  });

  // startup
  if (window.location.search.indexOf('?url=') === 0) {
    const url = decodeURIComponent(window.location.search.slice(5));
    iteration(await fromImageURL(url));
  } else {
    iteration(await newClipartMutation());
  }
}


function action(foundClassNames, params) {
  const {i, p, className, mutant, parent} = params;
  if (i > 1000) return {wat: 'done'};
  if (SEEKING_ZERO && p < 0.05) return {wat:'found', params};
  if (!SEEKING_ZERO && p > 0.99) return {wat:'found', params};
  if (!foundClassNames[className]) return {wat:'continue', params};
  return {wat:'diverge', params}
}


function createBlockEl(i, choice, paths, next) {
  const {mutant, p, predictions, className, n} = choice;
  
  const blockEl = document.createElement('div');
  blockEl.classList.add('Block');

  // render explorations
  const exploreEl = document.createElement('div');
  exploreEl.classList.add('Block-explore');
  paths.filter(path => path.n !== n).forEach(path => {
    path.mutant.style.width = Math.ceil(200 / (paths.length -1)) + 'px';
    path.mutant.style.height = Math.ceil(200 / (paths.length - 1)) + 'px';
    exploreEl.appendChild(path.mutant);
  });
  // exploreEl.style.zoom = 
  blockEl.appendChild(exploreEl);

  // mutant
  const mutantEl = document.createElement('div');
  mutantEl.classList.add('Block-mutant');
  // mutantEl.style.opacity = p;
  mutantEl.appendChild(mutant);
  const json = JSON.stringify({
    i,
    wat: next.wat,
    p,
    predictions
  }, null, 2);

  // label and line
  const labelEl = document.createElement('div');
  labelEl.classList.add('Block-label');
  labelEl.style.opacity = SEEKING_ZERO ? 1-p : p;
  labelEl.innerText = p.toFixed(3) + '  ' + className;
  labelEl.title = json;
  mutantEl.appendChild(labelEl);

  const line = document.createElement('div');
  line.classList.add('Block-line');
  line.style.width = Math.round(200 * p).toFixed(0) + 'px';
  mutantEl.appendChild(line);

  // debug
  // const pre = document.createElement('pre');
  // pre.innerHTML = json;
  // pre.style['overflow'] = 'hidden';
  // div.appendChild(pre);

  blockEl.appendChild(mutantEl);
  
  return blockEl;
}


function createMutantCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  canvas.style.width = '200px';
  canvas.style.height = '200px';
  const ctx = canvas.getContext('2d');
  return {canvas, ctx};
}


// discard input altogether
async function newClipartMutation(parent = null, options = {}) {
  const {canvas, ctx} = createMutantCanvas();
  
  // https://picsum.photos/200/200?i
  const img = new Image();
  const i = Math.random();
  return new Promise((resolve, reject) => {
    img.onload = async function() {
      status('making trouble!');
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    }
    img.crossOrigin = 'Anonymous';
    status('starting up...');
    img.src = `https://picsum.photos/200/200?${i}`
  });
}

async function fromImageURL(url) {
  const img = new Image();
  return new Promise((resolve, reject) => {
    img.onload = function() {
      const {canvas, ctx} = createMutantCanvas();
      
      // unsmart resizing
      ctx.drawImage(img,
        0, 0,   // Start at 70/20 pixels from the left and the top of the image (crop),
        img.width, img.height,   // "Get" a `50 * 50` (w * h) area from the source image (crop),
        0, 0,     // Place the result at 0, 0 in the canvas,
        200, 200); // With as width / height: 100 * 100 (scale)
      resolve(canvas);
    };
    img.crossOrigin = 'Anonymous';
    img.src = url;
  });
}

// modify pixels
function pixelMutation(parent, options = {}) {
  const pixels = options.pixels || 10;
  const modRange = options.modRange || 255/4;
  const opacityRange = options.opacityRange || 255/4;
  const dx = options.dx || 3;
  const dy = options.dy || 3;
  
  const {canvas, ctx} = createMutantCanvas();
  const data = parent.getContext('2d').getImageData(0, 0, 200, 200);
  ctx.putImageData(data, 0, 0);

  _.range(0, pixels).forEach(n => {
    const x = Math.round(Math.random() * canvas.width);
    const y = Math.round(Math.random() * canvas.height);
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data  
    const deltaX = Math.round(Math.random() * dx);
    const deltaY = Math.round(Math.random() * dy);
    const color = rgbaify([
      clampAndRound((r-modRange) + (Math.random()* modRange*2)),
      clampAndRound((g-modRange) + (Math.random()* modRange*2)),
      clampAndRound((b-modRange) + (Math.random()* modRange*2)),
      Math.round(Math.random()* opacityRange)
    ]);
    ctx.fillStyle = color;
    ctx.fillRect(x+deltaX, y+deltaY, 1, 1);
  });
  
  return canvas;
}

// color rectangles
function rectMutation(parent, options = {}) {
  const draws = options.draws || 1;
  const min = options.min || 1;
  const range = options.range || 2;
  
  const {canvas, ctx} = createMutantCanvas();
  const data = parent.getContext('2d').getImageData(0, 0, 200, 200);
  ctx.putImageData(data, 0, 0);
  
  // draw colored rects
  _.range(0, draws).forEach(i => {
    const color = pickMutantColor(canvas, ctx, options);  
    ctx.fillStyle = color;
    const w = Math.round(Math.random() * range) + min;
    const x = Math.round((canvas.width - w) * Math.random());
    const y = Math.round((canvas.height - w) * Math.random());
    ctx.fillRect(x, y, w, w);
  });
  
  return canvas;
}

function pickMutantColor(canvas, ctx, options = {}) {
  const mode = options.mode || 'drawn-and-modified';
  
  // with color drawn from image
  if (mode === 'drawn') {
    return rgbaify(sampleColor(canvas, ctx).concat([
      Math.round(Math.random()*255/4) // err towards less strong
    ]));
  }

  // color drawn from image and modified (eg, 1/4th)
  if (mode === 'drawn-and-modified') {
    const [r,g,b] = sampleColor(canvas, ctx);
    const data = parent.getContext('2d').getImageData(0, 0, 200, 200);
    ctx.putImageData(data, 0, 0);
    const modRange = 255/4;
    return rgbaify([
      clampAndRound((r-modRange) + (Math.random()* modRange*2)),
      clampAndRound((g-modRange) + (Math.random()* modRange*2)),
      clampAndRound((b-modRange) + (Math.random()* modRange*2)),
      Math.round(Math.random()*255/4) // err towards less strong
    ]);
  }

  // white, transparent-ish
  if (mode === 'white-ish') {
    return rgbaify([
      255,
      255,
      255,
      Math.round(Math.random()*255/4) // err towards less strong
    ]);
  }
  
  // random, transparent-ish
  return rgbaify([
    Math.round(Math.random()*255),
    Math.round(Math.random()*255),
    Math.round(Math.random()*255),
    1
  ]);
}

function clampAndRound(r) {
  return Math.round(Math.max(0, Math.min(r, 255)));
}

function sampleColor(canvas, ctx) {
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixelCount = frame.data.length / 4;
  const i = Math.round(Math.random() * pixelCount);
  return [
    frame.data[i * 4 + 0],
    frame.data[i * 4 + 1],
    frame.data[i * 4 + 2]
  ];
}

function rgbaify(quad) {
  return `rgba(${quad[0]},${quad[1]},${quad[2]},${quad[3]})`;
}

function status(msg) {
  document.querySelector('#status').innerText = msg;
}

function notify(json) {
  if (!SHOULD_NOTIFY) return;
  
  return fetch('/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(json)
  }).catch(err => console.error('notify failed', err, json));
}

main();