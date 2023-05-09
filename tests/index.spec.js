import 'mocha'
import { assert, expect } from 'chai'
import * as fs from 'fs'
import { PGM, readPgmSync, writePgmSync } from '../src/index.js'
const srcDir = 'tests/files/'
const destDir = 'tests/outputs/'

describe('pgm', () => {
  before(() => {
    // clean dest directory
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true })
    }
    fs.mkdirSync(destDir)
  })

  describe('read', () => {
    it('read map_saver binary PGM', () => {
      const file = fs.readFileSync(srcDir + 'map_saver.pgm')
      const pgm = readPgmSync(file)
      assert.instanceOf(pgm, PGM)
      const meta = pgm.getHeader()
      assert.equal(meta.descriptor, 'P5')
      assert.equal(meta.comment, '# CREATOR: map_saver.cpp 0.050 m/pix')
      assert.equal(meta.width, 4000)
      assert.equal(meta.height, 4000)
    })

    it('read gimp binary PGM', () => {
      const file = fs.readFileSync(srcDir + 'gimp_binary.pgm')
      const pgm = readPgmSync(file)
      assert.instanceOf(pgm, PGM)
      const meta = pgm.getHeader()
      assert.equal(meta.descriptor, 'P5')
      assert.equal(meta.comment, '# Created by GIMP version 2.10.34 PNM plug-in')
      assert.equal(meta.width, 480)
      assert.equal(meta.height, 320)
    })

    it('read gimp ascii PGM', () => {
      const file = fs.readFileSync(srcDir + 'gimp_ascii.pgm')
      const pgm = readPgmSync(file)
      assert.instanceOf(pgm, PGM)
      const meta = pgm.getHeader()
      assert.equal(meta.descriptor, 'P2')
      assert.equal(meta.comment, '# Created by GIMP version 2.10.34 PNM plug-in')
      assert.equal(meta.width, 480)
      assert.equal(meta.height, 320)
    })

    it('read incorrect size format PGM', () => {
      const file = fs.readFileSync(srcDir + 'error_size.pgm')
      expect(() => readPgmSync(file))
        .to.throw(Error, 'incorrect format: no space in line 3')
    })

    it('read incorrect descriptor file', () => {
      const file = fs.readFileSync(srcDir + 'test.ppm')
      expect(() => readPgmSync(file))
        .to.throw(Error, 'unsupported descriptor: P6')
    })

    it('read not pgm file', () => {
      const file = fs.readFileSync(srcDir + 'test.png')
      expect(() => readPgmSync(file)).to.throw()
    })
  })

  describe('make new file', () => {
    it('make new binary PGM', () => {
      const w = 240; const h = 360
      const pgm = new PGM(w, h)
      makeData(pgm)
      const buf = writePgmSync(pgm)
      fs.writeFileSync(destDir + '/output_binary.pgm', buf)
    })
    it('make new ascii PGM', () => {
      const w = 480; const h = 120
      const pgm = new PGM(w, h)
      makeData(pgm)
      pgm.setDescriptor('P2')
      const buf = writePgmSync(pgm)
      fs.writeFileSync(destDir + '/output_ascii.pgm', buf)
    })
  })

  describe('change descriptor', () => {
    it('P5 to P2', () => {
      const file = fs.readFileSync(srcDir + 'gimp_binary.pgm')
      const pgm = readPgmSync(file)
      pgm.setDescriptor('P2')
      const buf = writePgmSync(pgm)
      const srcBuf = fs.readFileSync(srcDir + 'gimp_ascii.pgm')
      assert.isTrue(buf.equals(srcBuf))
    })
    it('P2 to P5', () => {
      const file = fs.readFileSync(srcDir + 'gimp_ascii.pgm')
      const pgm = readPgmSync(file)
      pgm.setDescriptor('P5')
      const buf = writePgmSync(pgm)
      const srcBuf = fs.readFileSync(srcDir + 'gimp_binary.pgm')
      assert.isTrue(buf.equals(srcBuf))
    })
    it('set unsupported descriptor', () => {
      const file = fs.readFileSync(srcDir + 'gimp_ascii.pgm')
      const pgm = readPgmSync(file)
      expect(() => pgm.setDescriptor('P3'))
        .to.throw(Error, 'unsupported descriptor: P3')
    })
  })

  describe('multiline comment', () => {
    it('read binary PGM', () => {
      const file = fs.readFileSync(srcDir + 'multiline_comment.pgm')
      const pgm = readPgmSync(file)
      assert.instanceOf(pgm, PGM)
      const meta = pgm.getHeader()
      assert.equal(meta.descriptor, 'P5')
      assert.equal(meta.comment, '# test comment\n# CREATOR: map_saver.cpp\n# test comment\n# test comment\n# test comment')
      assert.equal(meta.width, 500)
      assert.equal(meta.height, 360)
    })
    it('read and write binary PGM', () => {
      const file = fs.readFileSync(srcDir + 'multiline_comment.pgm')
      const pgm = readPgmSync(file)
      const buf = writePgmSync(pgm)
      fs.writeFileSync(destDir + '/output_multiline_comment.pgm', buf)
    })
  })
})

function makeData (pgm) {
  const header = pgm.getHeader()
  const w = header.width
  const h = header.height
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = Math.floor(x / w * y / h * 255)
      pgm.data.writeUInt8(c, y * w + x)
    }
  }
}
