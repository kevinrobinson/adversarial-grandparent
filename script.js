var _ = window._;

const SEEKING_ZERO = true;

async function main() {
  const model = await window.mobilenet.load();
  
  const original = document.getElementById('img');
  original.crossOrigin = 'Anonymous';
  const seed = document.createElement('canvas');
  seed.width = 200;
  seed.height = 200;
  seed.style.width = '200px';
  seed.style.height = '200px';
  // seed.getContext('2d').drawImage(original, 0, 0);
  
  var i = 0;
  var foundClassNames = {};
  async function iteration(parent) {
    // explore
    const EXPLORATIONS = 20; // essentially tunes the level of feedback during iterations
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
    
    // act
    if (next.wat === 'done') return;
    if (next.wat === 'found') {
      foundClassNames[next.params.className] = true;
      console.log('> found' + next.params.className);
      return iteration(await mutate(next.params.parent, {forceClipart:true})); 
    }
    if (next.wat === 'continue') return iteration(next.params.mutant);
    // if (next.wat === 'abandon') return iteration(next.params.parent);
    if (next.wat === 'diverge') return iteration(await mutate(next.params.parent, {forceClipart:true})); 
  }
  iteration(await (mutate(seed, {forceClipart:true})));
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

async function mutate(parent, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  canvas.style.width = '200px';
  canvas.style.height = '200px';
  const ctx = canvas.getContext('2d');
  
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

// color rectangles
function rectMutation(canvas, ctx, options = {}) {
  const min = options.min || 1;
  const range = options.range || 3;
  
  const pixels = options.pixels || 1;
  _.range(0, pixels).forEach(i => {
    ctx.fillStyle = rgbaify([
      Math.round(Math.random()*255),
      Math.round(Math.random()*255),
      Math.round(Math.random()*255),
      Math.round(Math.random()*255/4) // err towards less strong
    ]);
    const r = Math.round(Math.random() * range) + min;
    const x = Math.round((canvas.width - r) * Math.random());
    const y = Math.round((canvas.height - r) * Math.random());
    ctx.fillRect(x, y, r, r);
  });
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