async function main() {
  // const img = document.createElement('img');
  // img.src = 
  
  const original = document.getElementById('img');
  original.crossOrigin = 'Anonymous';
  const model = await window.mobilenet.load();
  
  var i = 0;
  async function iteration() {
    const img = document.createElement('img');
    img.crossOrigin = 'Anonymous';
    img.width = 200;
    img.height = 200;
    const canvas = mutate(img);
    
    img.onload = async () => {
      const predictions = await model.classify(img);
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.height = '200px';
      const pre = document.createElement('pre');
      pre.innerHTML = JSON.stringify({i, predictions}, null, 2);
      pre.style['overflow-y'] = 'hidden';
      div.appendChild(img);
      div.appendChild(canvas);
      div.appendChild(pre);
      document.querySelector('#out').appendChild(div);
      i++;
      if (i < 3) iteration();
    };
    
    img.src = original.src;
  }
  iteration();
}

function mutate(img) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = rgbaify([
    Math.round(Math.random()*255),
    Math.round(Math.random()*255),
    Math.round(Math.random()*255),
    1
  ]);
  const x = Math.round(canvas.width * Math.random());
  const y = Math.round(canvas.width * Math.random());
  const r = Maht.ra
  ctx.fillRect(x, y, 10, 10);
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