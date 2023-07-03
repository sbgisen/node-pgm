/**
 * Class for creating PGM (Portable Graymap) image files.
 */
export class PGM {
  #originalWidth
  /**
   * Creates a new PGM instance
   * @param {number} width - The width of the image
   * @param {number} height - The height of the image
   */
  constructor (width, height) {
    this.#originalWidth = width // for trimming
    this.width = width
    this.height = height
    this.comment = ''
    this.descriptor = 'P5'
    this.maxValue = 255
    this.data = Buffer.alloc(width * height)
  }

  /**
   * Trims the image to the specified dimensions and position
   * @param {number} x - The x-coordinate of the top-left corner
   * @param {number} y - The y-coordinate of the top-left corner
   * @param {number} width - The width
   * @param {number} height - The height
   */
  trim (x, y, width, height) {
    this.width = width
    this.height = height
    const newData = Buffer.alloc(width * height)
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const oldRow = row + y
        const oldCol = col + x
        const oldMapI = oldCol + (oldRow * this.#originalWidth)
        const mapI = col + (row * width)
        // Copy pixel data from the old position to the new position
        if (this.data.byteLength > oldMapI &&
          this.#originalWidth > col) {
          newData.writeUInt8(this.data.readUInt8(oldMapI), mapI)
        }
      }
    }
    this.#originalWidth = width
    this.data = newData
  }
}

/**
 * Reads a PGM format buffer and returns the PGM object
 * @param {Buffer} buffer - PGM format buffer
 * @returns {PGM} - PGM object
 */
export function readPgmSync (buffer) {
  let line, descriptor, pgm
  let lineNum = 1
  let offset = -1
  let comment = ''
  const p2Array = []
  // separate lines
  while (offset < buffer.byteLength - 1) {
    [line, offset] = _readLine(buffer, offset + 1)
    if (_isComment(line)) {
      if (comment.length > 0) comment += '\n'
      comment += line.toString()
    } else {
      // not comment
      if (lineNum === 1) {
        descriptor = line.toString()
      } else if (lineNum === 2) {
        // make pgm
        const [width, height] = _getSizefromBuffer(line)
        pgm = new PGM(width, height)
        _checkDescriptor(descriptor)
        pgm.descriptor = descriptor
      } else if (lineNum === 3) {
        // not use maxValue
        if (descriptor === 'P5') {
          pgm.data = buffer.subarray(offset + 1, buffer.byteLength)
          break
        }
      } else {
        // read ascii data
        p2Array.push(parseInt(line.toString(), 10))
      }
      lineNum++
    }
  }
  if (descriptor === 'P2') pgm.data = Buffer.from(p2Array)
  pgm.comment = comment
  return pgm
}

/**
 * Writes a PGM object to the PGM format buffer
 * @param {PGM} pgm - PGM object
 * @returns {Buffer} - PGM format buffer
 */
export function writePgmSync (pgm) {
  _checkDescriptor(pgm.descriptor)
  _resize(pgm)
  const DescriptorBuf = Buffer.from(pgm.descriptor)
  const commentBuf = pgm.comment ? Buffer.from(pgm.comment + '\n') : Buffer.alloc(0)
  const sizeBuf = Buffer.from(pgm.width.toString() + ' ' + pgm.height.toString())
  const maxValueBuf = Buffer.from(pgm.maxValue.toString())
  const ln = Buffer.from([0x0A])
  const data = pgm.descriptor === 'P2' ? _binaryToAscii(pgm.data) : pgm.data
  return Buffer.concat([
    DescriptorBuf, ln,
    commentBuf,
    sizeBuf, ln,
    maxValueBuf, ln,
    data])
}

function _readLine (buffer, offset = 0) {
  let i = offset
  for (i; i < buffer.byteLength; i++) {
    if (buffer.readUInt8(i) === 10) {
      const line = buffer.subarray(offset, i)
      return [line, i]
    }
  }
  return [buffer.subarray(offset, buffer.byteLength), i]
}

function _getSizefromBuffer (buf) {
  for (let i = 0; i < buf.byteLength; i++) {
    if (buf.readUInt8(i) === 32) {
      const width = parseInt(buf.subarray(0, i).toString(), 10)
      const height = parseInt(buf.subarray(i + 1, buf.byteLength).toString(), 10)
      return [width, height]
    }
  }
  throw new Error('incorrect format: no space in line 3')
}

function _binaryToAscii (buf) {
  let data = ''
  for (let i = 0; i < buf.byteLength; i++) {
    data += String(buf.readUInt8(i))
    data += '\n'
  }
  return Buffer.from(data)
}

function _isComment (bufLine) {
  const line = bufLine.toString()
  return line.length > 0 && line[0] === '#'
}

function _checkDescriptor (descriptor) {
  if (!['P5', 'P2'].includes(descriptor)) {
    throw new Error('unsupported descriptor: ' + descriptor)
  }
}

function _resize (pgm) {
  const size = pgm.width * pgm.height
  if (pgm.data.byteLength !== size) {
    pgm.trim(0, 0, pgm.width, pgm.height)
  }
  return pgm
}
