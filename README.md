# adversarial-grandparent
grab random images, mobilenet them, and throw pixels on top until mobilenet is super confident.  low budget adversarial images

check out images in assets for examples, or just let it run

or use your own image urls, [like messi](https://adversarial-grandparent.glitch.me/?url=https%3A%2F%2Fcdn.glitch.com%2F7fcf14f2-d9c4-4b34-a78e-e77543df038a%252FScreen%2520Shot%25202019-07-25%2520at%252012.26.04%2520PM.png%3Fv%3D1564071974428) or *[turn me against myself](https://adversarial-grandparent.glitch.me/?url=https%3A%2F%2Fcdn.glitch.com%2F7fcf14f2-d9c4-4b34-a78e-e77543df038a%252Fcat.png%3Fv%3D1563990068178)

see also https://glitch.com/edit/#!/chickadee-hubris, which messes with every image until mobilenet thinks it is a chickadee.  it's slower so not quite as fun to watch, but maybe makes the point better :)

## notes
throw the data at ngraph to see generations and branches as a tree.  could interactively add pruning/exploration advice.

search should look for things it can start low and raise high, report on the largest change, now it's just stumbling along finding stuff.

try being more subtle and swapping or mutating pixels instead of drawing random colors.

## knobs to fiddle with
- number of explorations (for small changes, stay shallow but for bigger ones deeper can help)
- how many draws per mutation, their size, opacity
- whether color is drawn from image or random
- remix the code to fiddle with the mutations! (try `EXPLORATIONS = n`, `rectMutation`, `pickMutantColor`)
- pixel mutations, rect mutations

## screenshots.  i can haz...
### television
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2F300-television.png?v=1564001586808)

### canoe
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2F300-canoe.png?v=1564001590903)

### platypus
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2F300-platypus.png?v=1564001604227)

## some older specific examples
### umbrella | 61 > 99
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-24%20at%202.50.11%20PM.png?v=1563994426096)
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-24%20at%202.50.17%20PM.png?v=1563994425804)

### bow | 50 > 99
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-24%20at%202.51.58%20PM.png?v=1563994426235)
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-24%20at%202.52.02%20PM.png?v=1563994424766)

### spider web | 33 > 99
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-24%20at%203.22.17%20PM.png?v=1563996337732)
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-24%20at%203.22.25%20PM.png?v=1563996336730)

### knot | 68 > 99
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-24%20at%203.28.38%20PM.png?v=1563996646036)
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-24%20at%203.28.48%20PM.png?v=1563996645432)

### projectiles, missiles | 47 > 96
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2Fmissile-before.png?v=1563994148164)
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2Fmissile-after.png?v=1563994148224)

### seashore | 55 > 75
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-24%20at%202.53.23%20PM.png?v=1563994424658)
![](https://cdn.glitch.com/7fcf14f2-d9c4-4b34-a78e-e77543df038a%2FScreen%20Shot%202019-07-24%20at%202.53.27%20PM.png?v=1563994424721)
