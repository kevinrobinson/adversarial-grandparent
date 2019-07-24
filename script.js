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
  async function iteration(parent) {
    const mutants = [0, 1, 2, 3, 4, 5].map(n => mutate(parent));
    const ps = mutants.map(async mutant => {
      const predictions = await model.classify(mutant);
      // const tigerCat = predictions.filter(p => p.className === 'tiger cat')[0];
      // const p = tigerCat ? tigerCat.probability : 0;
      const p = predictions[0].probability;
      return p;
    });
    const index = Ma
    
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.height = '200px';
    const pre = document.createElement('pre');
    pre.innerHTML = JSON.stringify({i, p, predictions}, null, 2);
    pre.style['overflow-y'] = 'hidden';
    div.appendChild(mutant);
    div.appendChild(pre);
    document.querySelector('#out').appendChild(div);
    
    i++;
    if (i > 1000) return;
    if (p > 0.10) return iteration(mutant);
    iteration(parent);
  }
  iteration(seed);
}

function mutate(parent) {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  canvas.style.width = '200px';
  canvas.style.height = '200px';
  const ctx = canvas.getContext('2d');
  
  // ctx.drawImage(img, 0, 0);
  const data = parent.getContext('2d').getImageData(0, 0, 200, 200);
  ctx.putImageData(data, 0, 0);
  
  ctx.fillStyle = rgbaify([
    Math.round(Math.random()*255),
    Math.round(Math.random()*255),
    Math.round(Math.random()*255),
    1
  ]);
  const r = Math.round(Math.random() * 10) + 10;
  const x = Math.round((canvas.width - r) * Math.random());
  const y = Math.round((canvas.height - r) * Math.random());
  ctx.fillRect(x, y, r, r);
  
  return canvas;
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

main();