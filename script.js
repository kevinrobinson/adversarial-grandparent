var _ = window._;

const SEEKING_ZERO = (window.location.search.indexOf('?seekzero') === 0);

function createSeed() {
  const original = document.getElementById('img');
  original.crossOrigin = 'Anonymous';
  const seed = document.createElement('canvas');
  seed.width = 200;
  seed.height = 200;
  seed.style.width = '200px';
  seed.style.height = '200px';
  // seed.getContext('2d').drawImage(original, 0, 0);
  return seed;
}

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
    const EXPLORATIONS = 50; // essentially tunes the level of feedback during iterations
    const paths = await Promise.all(_.range(0, EXPLORATIONS).map(async n => {
      const mutant = await mutate(parent);
      const predictions = await model.classify(mutant);
      
      // highest not yet found
      const prediction = predictions.filter(prediction => !foundClassNames[prediction.className])[0];
      const p = prediction.probability;
      const className = prediction.className;
            
      return {mutant, predictions, p, className, n};
    }));
    const debug = paths.map(path => { return {p: path.p, className: path.className }; });
    const {mutant, p, predictions, className, n} = (SEEKING_ZERO ? _.minBy: _.maxBy)(paths, path => path.p);
    
    // decide
    i++;
    const next = action(foundClassNames, {i, p, className, mutant, parent});
    
    // render
    const blockEl = document.createElement('div');
    blockEl.classList.add('Block');
    document.querySelector('#out').appendChild(blockEl);
    
    // render explorations
    const exploreEl = document.createElement('div');
    exploreEl.classList.add('Block-explore');
    paths.filter(path => path.n !== n).forEach(path => {
      path.mutant.style.width = Math.ceil(200 / (EXPLORATIONS -1)) + 'px';
      path.mutant.style.height = Math.ceil(200 / (EXPLORATIONS - 1)) + 'px';
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
    
    async function rotate() {
      newline();
      iteration(await mutate(next.params.parent, {forceClipart:true})); 
    }
    
    // act
    if (aborted) return;
    if (next.wat === 'done') return;
    if (next.wat === 'found') {
      foundClassNames[next.params.className] = true;
      console.log('> found' + next.params.className);
      return rotate();
    }
    if (next.wat === 'continue') return iteration(next.params.mutant);
    // if (next.wat === 'abandon') return iteration(next.params.parent);
    if (next.wat === 'diverge') return rotate();
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
    iteration(await (mutate(createSeed(), {forceClipart:true})));
  }
}

function action(foundClassNames, params) {
  const {i, p, className, mutant, parent} = params;
  if (i > 1000) return {wat: 'done'};
  if (SEEKING_ZERO && p < 0.05) return {wat:'found', params};
  if (!SEEKING_ZERO && p > 0.99) return {wat:'found', params};
  if (!foundClassNames[className]) return {wat:'continue', params};
  // return {wat:'abandon', params};
  return {wat:'diverge', params}
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

async function mutate(parent, options = {}) {
  const {canvas, ctx} = createMutantCanvas();
  
  // ctx.drawImage(img, 0, 0);
  const data = parent.getContext('2d').getImageData(0, 0, 200, 200);
  ctx.putImageData(data, 0, 0);
  
  // branch for more diversity
  if (options.forceClipart) {
    await clipartMutation(canvas, ctx);
  } else {
    rectMutation(canvas, ctx);
  }
  return canvas;
}

async function clipartMutation(canvas, ctx) {
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

// color rectangles
function rectMutation(canvas, ctx, options = {}) {
  const draws = options.draws || 1;
  const min = options.min || 1;
  const range = options.range || 1;
  
  _.range(0, draws).forEach(i => {
    // draw colored rect
    const color = pickMutantColor(canvas, ctx, options);  
    ctx.fillStyle = color;
    const w = Math.round(Math.random() * range) + min;
    const x = Math.round((canvas.width - w) * Math.random());
    const y = Math.round((canvas.height - w) * Math.random());
    ctx.fillRect(x, y, w, w);
  });
}

function pickMutantColor(canvas, ctx, options = {}) {
  const mode = options.mode || 'random';
  
  // with color drawn from image
  if (mode === 'drawn') {
    return rgbaify(sampleColor(canvas, ctx).concat([
      Math.round(Math.random()*255/4) // err towards less strong
    ]));
  }

  // color drawn from image and modified (eg, 1/5th)
  if (mode === 'drawn-and-modified') {
    const [r,g,b] = sampleColor(canvas, ctx);
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

// https://stackoverflow.com/questions/2303690/resizing-an-image-in-an-html5-canvas

/**
 * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
 * 
 * @param {HtmlElement} canvas
 * @param {int} width
 * @param {int} height
 * @param {boolean} resize_canvas if true, canvas will be resized. Optional.
 */
function resample(canvas, width, height, resize_canvas) {
    var width_source = canvas.width;
    var height_source = canvas.height;
    width = Math.round(width);
    height = Math.round(height);

    var ratio_w = width_source / width;
    var ratio_h = height_source / height;
    var ratio_w_half = Math.ceil(ratio_w / 2);
    var ratio_h_half = Math.ceil(ratio_h / 2);

    var ctx = canvas.getContext("2d");
    var img = ctx.getImageData(0, 0, width_source, height_source);
    var img2 = ctx.createImageData(width, height);
    var data = img.data;
    var data2 = img2.data;

    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            var x2 = (i + j * width) * 4;
            var weight = 0;
            var weights = 0;
            var weights_alpha = 0;
            var gx_r = 0;
            var gx_g = 0;
            var gx_b = 0;
            var gx_a = 0;
            var center_y = (j + 0.5) * ratio_h;
            var yy_start = Math.floor(j * ratio_h);
            var yy_stop = Math.ceil((j + 1) * ratio_h);
            for (var yy = yy_start; yy < yy_stop; yy++) {
                var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
                var center_x = (i + 0.5) * ratio_w;
                var w0 = dy * dy; //pre-calc part of w
                var xx_start = Math.floor(i * ratio_w);
                var xx_stop = Math.ceil((i + 1) * ratio_w);
                for (var xx = xx_start; xx < xx_stop; xx++) {
                    var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
                    var w = Math.sqrt(w0 + dx * dx);
                    if (w >= 1) {
                        //pixel too far
                        continue;
                    }
                    //hermite filter
                    weight = 2 * w * w * w - 3 * w * w + 1;
                    var pos_x = 4 * (xx + yy * width_source);
                    //alpha
                    gx_a += weight * data[pos_x + 3];
                    weights_alpha += weight;
                    //colors
                    if (data[pos_x + 3] < 255)
                        weight = weight * data[pos_x + 3] / 250;
                    gx_r += weight * data[pos_x];
                    gx_g += weight * data[pos_x + 1];
                    gx_b += weight * data[pos_x + 2];
                    weights += weight;
                }
            }
            data2[x2] = gx_r / weights;
            data2[x2 + 1] = gx_g / weights;
            data2[x2 + 2] = gx_b / weights;
            data2[x2 + 3] = gx_a / weights_alpha;
        }
    }
    //clear and resize canvas
    if (resize_canvas === true) {
        canvas.width = width;
        canvas.height = height;
    } else {
        ctx.clearRect(0, 0, width_source, height_source);
    }

    //draw
    ctx.putImageData(img2, 0, 0);
}

function rgbaify(quad) {
  return `rgba(${quad[0]},${quad[1]},${quad[2]},${quad[3]})`;
}

// function greenify(canvas, ctx, colors) {
//   const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
//   let l = frame.data.length / 4;

//   // console.log('frame.data', frame.data);
//   for (let i = 0; i < l; i++) {
//     let r = frame.data[i * 4 + 0];
//     let g = frame.data[i * 4 + 1];
//     let b = frame.data[i * 4 + 2];
//     if (matchesAny(r, g, b, colors)) {
//       // console.log('matches!')
//       // frame.data[i * 4 + 0] = 0;
//       // frame.data[i * 4 + 1] = 0;
//       // frame.data[i * 4 + 2] = 0;
//       frame.data[i * 4 + 3] = 0;
//     }
//     // if (i % 10 === 0) {
//     //   console.log('i', i, r, g, b);
//     // }
//   }
//   ctx.putImageData(frame, 0, 0);
// }

function status(msg) {
  document.querySelector('#status').innerText = msg;
}

main();