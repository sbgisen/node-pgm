/**
 * Class for creating PGM (Portable Graymap) image files.
 */
export class PGM {
  #width
  #height
  #descriptor = 'P5'
  #maxValue = 255

  /**
   * Creates a new PGM instance.
   * @param {number} width - The width of the image.
   * @param {number} height - The height of the image.
   */
  constructor (width, height) {
    this.#width = width
    this.#height = height
    this.comment = ''
    this.data = Buffer.alloc(width * height)
  }

  /**
   * Sets the descriptor for the image.
   * @param {string} descriptor - The descriptor to set ('P5' or 'P2').
   * @throws {Error} If an unsupported descriptor is provided.
   */
  setDescriptor (descriptor) {
    if (!['P5', 'P2'].includes(descriptor)) {
      throw new Error('unsupported descriptor: ' + descriptor)
    }
    this.#descriptor = descriptor
  }

  /**
   * Gets the image header.
   * @returns {Object} An object containing the image header.
   * @property {number} width - The width of the image.
   * @property {number} height - The height of the image.
   * @property {string} descriptor - The descriptor of the image.
   * @property {string} comment - A comment for the image.
   * @property {number} maxValue - The maximum gray value of the image.
   */
  getHeader () {
    return {
      width: this.#width,
      height: this.#height,
      descriptor: this.#descriptor,
      comment: this.comment,
      maxValue: this.#maxValue
    }
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
        pgm.setDescriptor(descriptor)
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
  const hdr = pgm.getHeader()
  const DescriptorBuf = Buffer.from(hdr.descriptor)
  const commentBuf = Buffer.from(hdr.comment)
  const sizeBuf = Buffer.from(hdr.width.toString() + ' ' + hdr.height.toString())
  const maxValueBuf = Buffer.from(hdr.maxValue.toString())
  const ln = Buffer.from([0x0A])
  const data = hdr.descriptor === 'P2' ? _binaryToAscii(pgm.data) : pgm.data
  return Buffer.concat([
    DescriptorBuf, ln,
    commentBuf, ln,
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
