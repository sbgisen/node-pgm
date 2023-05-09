# node-pgm

This is a simple Reader/Writer for PGM (Portable Graymap) image files.

## Usage

To use this module, import it into your code:

```js
import { PGM, readPgmSync, writePgmSync } from 'node-pgm'
```

### Creating a New PGM Instance

To create a new PGM, simply create a new instance of the PGM class. This creates a PGM with a width of 240px and a height of 360px, fills it with a gradient and saves it with the file name `out.pgm`.

```js
import * as fs from 'fs'
import { PGM, writePgmSync } from 'node-pgm'

// create a PGM
const w = 240; const h = 360
const pgm = new PGM(w, h)

// fill with gradient
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const c = Math.floor(x / w * y / h * 255)
    pgm.data.writeUInt8(c, y * w + x)
  }
}

// save
const buf = writePgmSync(pgm)
fs.writeFileSync('out.pgm', buf)
```

### Reading and Writing PGM Files

To read a PGM file, use the readPgmSync function:

```js
import * as fs from 'fs'
import { readPgmSync } from 'node-pgm'
const buffer = fs.readFileSync('myimage.pgm')
const pgm = readPgmSync(buffer)
```

To get the image header, use the getHeader function:

```js
const header = pgm.getHeader()
console.log(header.width)
console.log(header.height)
```

To write a PGM file, use the writePgmSync function:

```js
import * as fs from 'fs'
import { writePgmSync } from 'node-pgm'
const buffer = writePgmSync(pgm);
fs.writeFileSync('newimage.pgm', buffer);
```

## Example

It reads `src.pgm`, inverts the colors and changes the descriptor and saves it to `out.pgm`.

```js
import * as fs from 'fs'
import { readPgmSync, writePgmSync } from 'node-pgm'

// read
const file = fs.readFileSync('src.pgm')
const pgm = readPgmSync(file)
// invert the colors
const w = meta.width; const h = meta.height
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = y * w + x
    const c = 255 - pgm.data.readUInt8(i)
    pgm.data.writeUInt8(c, i)
  }
}
// change descriptor from P5 to P2
pgm.setDescriptor('P2')

// save
const buf = writePgmSync(pgm)
fs.writeFileSync('out.pgm', buf)
```

## API

### `PGM` Class
Class for creating PGM.

- `constructor(width: number, height: number)` - Creates a new PGM instance with the specified width and height.
- `setDescriptor(descriptor: string)` - Sets the descriptor for the PGM instance ('P5' or 'P2').
- `getHeader(): Object` - Gets the header for the PGM instance, including the width, height, descriptor, comment, and maximum gray value.

### `readPgmSync(buffer: Buffer): PGM`
Take a PGM format buffer and return a PGM object.

### `writePgmSync(pgm: PGM): Buffer`
Take a PGM object and return a PGM format buffer.

## License
This module is available under the MIT License.