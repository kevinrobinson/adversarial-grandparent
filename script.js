async function main() {
  // const img = document.createElement('img');
  // img.src = 
  
  const original = document.getElementById('img');
  original.crossOrigin = 'Anonymous';
  const model = await window.mobilenet.load();
  
  var i = 0;
  async function iteration() {
    const img = document.getElementById('img');
    img.crossOrigin = 'Anonymous';
    
    img.onload = async () => {
      const predictions = await model.classify(img);
      const div = document.createElement('div');
      div.innerHTML = JSON.stringify({i, predictions});
      div.appendChild(img);
      document.body.appendChild(div);
      if (i < 3) iteration();
    };
    
    img.src = original.src;
  }
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