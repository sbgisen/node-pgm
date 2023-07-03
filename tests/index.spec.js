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
      assert.equal(pgm.descriptor, 'P5')
      assert.equal(pgm.comment, '# CREATOR: map_saver.cpp 0.050 m/pix')
      assert.equal(pgm.width, 4000)
      assert.equal(pgm.height, 4000)
    })

    it('read gimp binary PGM', () => {
      const file = fs.readFileSync(srcDir + 'gimp_binary.pgm')
      const pgm = readPgmSync(file)
      assert.instanceOf(pgm, PGM)
      assert.equal(pgm.descriptor, 'P5')
      assert.equal(pgm.comment, '# Created by GIMP version 2.10.34 PNM plug-in')
      assert.equal(pgm.width, 480)
      assert.equal(pgm.height, 320)
    })

    it('read gimp ascii PGM', () => {
      const file = fs.readFileSync(srcDir + 'gimp_ascii.pgm')
      const pgm = readPgmSync(file)
      assert.instanceOf(pgm, PGM)
      assert.equal(pgm.descriptor, 'P2')
      assert.equal(pgm.comment, '# Created by GIMP version 2.10.34 PNM plug-in')
      assert.equal(pgm.width, 480)
      assert.equal(pgm.height, 320)
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

  describe('make new file and read', () => {
    it('new binary PGM', () => {
      const w = 240; const h = 360
      const pgm = new PGM(w, h)
      makeData(pgm)
      const buf = writePgmSync(pgm)
      fs.writeFileSync(destDir + '/output_binary.pgm', buf)
      // read
      const pgm2 = readPgmSync(buf)
      assert.equal(pgm2.descriptor, 'P5')
      assert.equal(pgm2.comment, '')
      assert.equal(pgm2.width, 240)
      assert.equal(pgm2.height, 360)
    })
    it('new ascii PGM', () => {
      const w = 480; const h = 120
      const pgm = new PGM(w, h)
      makeData(pgm)
      pgm.descriptor = 'P2'
      const buf = writePgmSync(pgm)
      fs.writeFileSync(destDir + '/output_ascii.pgm', buf)
      // read
      const pgm2 = readPgmSync(buf)
      assert.equal(pgm2.descriptor, 'P2')
      assert.equal(pgm2.comment, '')
      assert.equal(pgm2.width, 480)
      assert.equal(pgm2.height, 120)
    })
  })

  describe('change descriptor', () => {
    it('P5 to P2', () => {
      const file = fs.readFileSync(srcDir + 'gimp_binary.pgm')
      const pgm = readPgmSync(file)
      pgm.descriptor = 'P2'
      const buf = writePgmSync(pgm)
      const srcBuf = fs.readFileSync(srcDir + 'gimp_ascii.pgm')
      assert.isTrue(buf.equals(srcBuf))
    })
    it('P2 to P5', () => {
      const file = fs.readFileSync(srcDir + 'gimp_ascii.pgm')
      const pgm = readPgmSync(file)
      pgm.descriptor = 'P5'
      const buf = writePgmSync(pgm)
      const srcBuf = fs.readFileSync(srcDir + 'gimp_binary.pgm')
      assert.isTrue(buf.equals(srcBuf))
    })
    it('set unsupported descriptor', () => {
      const file = fs.readFileSync(srcDir + 'gimp_ascii.pgm')
      const pgm = readPgmSync(file)
      expect(() => {
        pgm.descriptor = 'P3'
        writePgmSync(pgm)
      })
        .to.throw(Error, 'unsupported descriptor: P3')
    })
  })

  describe('multiline comment', () => {
    it('read binary PGM', () => {
      const file = fs.readFileSync(srcDir + 'multiline_comment.pgm')
      const pgm = readPgmSync(file)
      assert.instanceOf(pgm, PGM)
      assert.equal(pgm.descriptor, 'P5')
      assert.equal(pgm.comment, '# test comment\n# CREATOR: map_saver.cpp\n# test comment\n# test comment\n# test comment')
      assert.equal(pgm.width, 500)
      assert.equal(pgm.height, 360)
    })
    it('read and write binary PGM', () => {
      const file = fs.readFileSync(srcDir + 'multiline_comment.pgm')
      const pgm = readPgmSync(file)
      const buf = writePgmSync(pgm)
      fs.writeFileSync(destDir + '/output_multiline_comment.pgm', buf)
    })
  })

  describe('change size', () => {
    it('expand', () => {
      const file = fs.readFileSync(srcDir + 'gimp_binary.pgm')
      const pgm = readPgmSync(file)
      pgm.width += 200
      pgm.height += 400
      const buf = writePgmSync(pgm)
      fs.writeFileSync(destDir + '/output_expand.pgm', buf)
    })
    it('cut', () => {
      const file = fs.readFileSync(srcDir + 'gimp_binary.pgm')
      const pgm = readPgmSync(file)
      pgm.width -= 100
      pgm.height -= 50
      const buf = writePgmSync(pgm)
      fs.writeFileSync(destDir + '/output_cut.pgm', buf)
    })
    it('trim', () => {
      const file = fs.readFileSync(srcDir + 'gimp_binary.pgm')
      const pgm = readPgmSync(file)
      pgm.trim(50, 100, 100, 80)
      const buf = writePgmSync(pgm)
      fs.writeFileSync(destDir + '/output_trim.pgm', buf)
    })
  })
})

function makeData (pgm) {
  const w = pgm.width
  const h = pgm.height
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = Math.floor(x / w * y / h * 255)
      pgm.data.writeUInt8(c, y * w + x)
    }
  }
}
