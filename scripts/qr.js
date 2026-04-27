// Tiny self-contained QR encoder (model-agnostic, version 1-10, byte mode, level M).
// Public API: window.WO_qrMatrix(text) -> { size, data: bool[][] }
// Adapted minimal QR implementation. Returns a 2D matrix of dark/light modules.
(function () {
  // Galois field tables
  const EXP = new Array(512), LOG = new Array(256);
  (function () {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gMul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }
  function rsGenPoly(n) {
    let p = [1];
    for (let i = 0; i < n; i++) {
      const np = new Array(p.length + 1).fill(0);
      for (let j = 0; j < p.length; j++) {
        np[j] ^= p[j];
        np[j + 1] ^= gMul(p[j], EXP[i]);
      }
      p = np;
    }
    return p;
  }
  function rsEncode(data, ecLen) {
    const gen = rsGenPoly(ecLen);
    const res = new Array(ecLen).fill(0);
    const buf = data.concat(res);
    for (let i = 0; i < data.length; i++) {
      const c = buf[i];
      if (c !== 0) {
        for (let j = 0; j < gen.length; j++) {
          buf[i + j] ^= gMul(gen[j], c);
        }
      }
    }
    return buf.slice(data.length);
  }

  // QR data-codeword capacities for level M, versions 1..10. Per ISO/IEC 18004
  // Annex 1, Table 9 (data codewords = total codewords − EC codewords × blocks).
  const CAP_BYTE_M = [16, 28, 44, 64, 86, 108, 124, 154, 182, 216];
  const TOTAL_CW   = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
  const EC_PER_BLK_M = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  const BLOCKS_M    = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  // Alignment-pattern centre coordinates per version (Annex E). Index = version-1.
  const ALIGN_POS = [
    [],           // v1
    [6, 18],      // v2
    [6, 22],      // v3
    [6, 26],      // v4
    [6, 30],      // v5
    [6, 34],      // v6
    [6, 22, 38],  // v7
    [6, 24, 42],  // v8
    [6, 26, 46],  // v9
    [6, 28, 50],  // v10
  ];

  function pickVersion(byteLen) {
    for (let v = 1; v <= 10; v++) {
      // header overhead: 4 bits mode + length bits (8 for v1-9, 16 for v10)
      const lenBits = v >= 10 ? 16 : 8;
      const need = Math.ceil((4 + lenBits + byteLen * 8 + 4) / 8);
      if (need <= CAP_BYTE_M[v - 1]) return v;
    }
    throw new Error('text too long for QR v1-10');
  }

  function buildBitstream(text, version) {
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xc0 | (c >> 6)); bytes.push(0x80 | (c & 0x3f)); }
      else { bytes.push(0xe0 | (c >> 12)); bytes.push(0x80 | ((c >> 6) & 0x3f)); bytes.push(0x80 | (c & 0x3f)); }
    }
    const lenBits = version >= 10 ? 16 : 8;
    const bits = [];
    function push(val, n) {
      for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1);
    }
    push(0b0100, 4); // byte mode
    push(bytes.length, lenBits);
    for (const b of bytes) push(b, 8);
    // terminator
    const cap = CAP_BYTE_M[version - 1] * 8;
    const term = Math.min(4, cap - bits.length);
    for (let i = 0; i < term; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    // pad bytes
    const pad = [0xec, 0x11];
    let pi = 0;
    while (bits.length < cap) { push(pad[pi++ % 2], 8); }
    // to bytes
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      let v = 0;
      for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
      data.push(v);
    }
    return data;
  }

  function interleave(data, version) {
    const blocks = BLOCKS_M[version - 1];
    const ecLen = EC_PER_BLK_M[version - 1];
    const totalCw = TOTAL_CW[version - 1];
    const dataCw = CAP_BYTE_M[version - 1];
    const shortBlk = Math.floor(dataCw / blocks);
    const longBlks = dataCw % blocks;
    const dBlocks = [];
    const eBlocks = [];
    let off = 0;
    for (let i = 0; i < blocks; i++) {
      const sz = shortBlk + (i >= blocks - longBlks ? 1 : 0);
      const blk = data.slice(off, off + sz);
      off += sz;
      dBlocks.push(blk);
      eBlocks.push(rsEncode(blk, ecLen));
    }
    const out = [];
    const maxD = Math.max(...dBlocks.map(b => b.length));
    for (let i = 0; i < maxD; i++) {
      for (let b = 0; b < blocks; b++) {
        if (i < dBlocks[b].length) out.push(dBlocks[b][i]);
      }
    }
    for (let i = 0; i < ecLen; i++) {
      for (let b = 0; b < blocks; b++) out.push(eBlocks[b][i]);
    }
    return out; // length should equal totalCw
  }

  function makeMatrix(version) {
    const size = 17 + 4 * version;
    const m = []; const r = [];
    for (let i = 0; i < size; i++) { m.push(new Array(size).fill(null)); r.push(new Array(size).fill(false)); }
    function setF(x, y, v) { m[y][x] = v ? 1 : 0; r[y][x] = true; }
    // finder + separators
    function finder(cx, cy) {
      for (let dy = -1; dy <= 7; dy++) for (let dx = -1; dx <= 7; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const inOuter = (dx === 0 || dx === 6 || dy === 0 || dy === 6) && dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
        const inInner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        if (dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6) {
          setF(x, y, inOuter || inInner ? 1 : 0);
        } else {
          setF(x, y, 0); // separator
        }
      }
    }
    finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
    // alignment patterns
    const aligns = ALIGN_POS[version - 1];
    for (const ay of aligns) for (const ax of aligns) {
      // skip if overlapping finders
      if ((ax < 8 && ay < 8) || (ax > size - 9 && ay < 8) || (ax < 8 && ay > size - 9)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const v = (Math.abs(dx) === 2 || Math.abs(dy) === 2 || (dx === 0 && dy === 0)) ? 1 : 0;
        setF(ax + dx, ay + dy, v);
      }
    }
    // timing
    for (let i = 8; i < size - 8; i++) {
      setF(i, 6, i % 2 === 0 ? 1 : 0);
      setF(6, i, i % 2 === 0 ? 1 : 0);
    }
    // dark module
    setF(8, size - 8, 1);
    // reserve format areas (will fill later)
    for (let i = 0; i <= 8; i++) {
      if (!r[8][i]) { m[8][i] = 0; r[8][i] = true; }
      if (!r[i][8]) { m[i][8] = 0; r[i][8] = true; }
    }
    for (let i = 0; i < 8; i++) {
      m[8][size - 1 - i] = 0; r[8][size - 1 - i] = true;
      m[size - 1 - i][8] = 0; r[size - 1 - i][8] = true;
    }
    // version info area for v>=7
    if (version >= 7) {
      for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
        m[i][size - 11 + j] = 0; r[i][size - 11 + j] = true;
        m[size - 11 + j][i] = 0; r[size - 11 + j][i] = true;
      }
    }
    return { m, r, size };
  }

  function placeData(grid, codewords) {
    const { m, r, size } = grid;
    const bits = [];
    for (const cw of codewords) for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
    let bi = 0;
    let upward = true;
    for (let col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (let i = 0; i < size; i++) {
        const y = upward ? size - 1 - i : i;
        for (let dx = 0; dx < 2; dx++) {
          const x = col - dx;
          if (!r[y][x]) {
            m[y][x] = bi < bits.length ? bits[bi++] : 0;
            r[y][x] = true;
          }
        }
      }
      upward = !upward;
    }
  }

  function maskFn(id, x, y) {
    switch (id) {
      case 0: return ((x + y) % 2) === 0;
      case 1: return (y % 2) === 0;
      case 2: return (x % 3) === 0;
      case 3: return ((x + y) % 3) === 0;
      case 4: return ((Math.floor(y / 2) + Math.floor(x / 3)) % 2) === 0;
      case 5: return ((x * y) % 2 + (x * y) % 3) === 0;
      case 6: return (((x * y) % 2 + (x * y) % 3) % 2) === 0;
      case 7: return (((x + y) % 2 + (x * y) % 3) % 2) === 0;
    }
    return false;
  }

  function applyMask(grid, dataMask, id) {
    const { m, size } = grid;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (dataMask[y][x] && maskFn(id, x, y)) m[y][x] ^= 1;
    }
  }

  function dataMaskOf(grid) {
    const { r, size } = grid;
    // r marks reserved cells (true for function patterns + format area).
    // Build a "data" mask which is the inverse: cells we placed data into.
    // But r is true for everything reserved including data we placed... so we
    // need a separate tracker. Recompute by re-running placement geometry.
    const fn = []; for (let i = 0; i < size; i++) fn.push(new Array(size).fill(false));
    // mark function patterns again
    function mark(cx, cy, w, h) {
      for (let yy = cy; yy < cy + h; yy++) for (let xx = cx; xx < cx + w; xx++) {
        if (xx >= 0 && yy >= 0 && xx < size && yy < size) fn[yy][xx] = true;
      }
    }
    mark(0, 0, 9, 9); mark(size - 8, 0, 8, 9); mark(0, size - 8, 9, 8);
    // timing
    for (let i = 0; i < size; i++) { fn[6][i] = true; fn[i][6] = true; }
    // alignment
    const aligns = ALIGN_POS[grid.version - 1] || [];
    for (const ay of aligns) for (const ax of aligns) {
      if ((ax < 8 && ay < 8) || (ax > size - 9 && ay < 8) || (ax < 8 && ay > size - 9)) continue;
      mark(ax - 2, ay - 2, 5, 5);
    }
    if (grid.version >= 7) {
      mark(0, size - 11, 6, 3); mark(size - 11, 0, 3, 6);
    }
    // build inverse
    const dm = []; for (let i = 0; i < size; i++) dm.push(new Array(size).fill(false));
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) dm[y][x] = !fn[y][x];
    return dm;
  }

  // BCH for format info
  function bchFormat(data) {
    let d = data << 10;
    const g = 0b10100110111;
    for (let i = 14; i >= 10; i--) {
      if ((d >> i) & 1) d ^= g << (i - 10);
    }
    return ((data << 10) | d) ^ 0b101010000010010;
  }

  function placeFormat(grid, ecLevel, maskId) {
    const { m, size } = grid;
    const data = (ecLevel << 3) | maskId;
    const bits = bchFormat(data);
    function bit(i) { return (bits >> i) & 1; }

    // Vertical strip (column 8): one full 15-bit copy of the format info.
    // Bit i lands at:  rows 0..5 for i=0..5, rows 7..8 for i=6..7 (skipping the
    // timing pattern at row 6), then rows size-7..size-1 for i=8..14.
    for (let i = 0; i < 15; i++) {
      const row = i < 6 ? i : (i < 8 ? i + 1 : size - 15 + i);
      m[row][8] = bit(i);
    }
    // Horizontal strip (row 8): the second copy of the same 15 bits.
    // Bit i lands at:  cols size-1..size-8 for i=0..7, col 7 for i=8 (skipping
    // the timing pattern at col 6), then cols 5..0 for i=9..14.
    for (let i = 0; i < 15; i++) {
      const col = i < 8 ? size - 1 - i : (i === 8 ? 7 : 14 - i);
      m[8][col] = bit(i);
    }
    // Dark module — always 1.
    m[size - 8][8] = 1;
  }

  function score(grid) {
    const { m, size } = grid;
    let s = 0;
    // rule 1: runs
    for (let y = 0; y < size; y++) {
      let run = 1;
      for (let x = 1; x < size; x++) {
        if (m[y][x] === m[y][x - 1]) { run++; }
        else { if (run >= 5) s += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) s += 3 + (run - 5);
    }
    for (let x = 0; x < size; x++) {
      let run = 1;
      for (let y = 1; y < size; y++) {
        if (m[y][x] === m[y - 1][x]) { run++; }
        else { if (run >= 5) s += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) s += 3 + (run - 5);
    }
    return s;
  }

  window.WO_qrMatrix = function (text) {
    const version = pickVersion(new TextEncoder().encode(text).length);
    const data = buildBitstream(text, version);
    const cws = interleave(data, version);
    const grid = makeMatrix(version);
    grid.version = version;
    placeData(grid, cws);
    const dm = dataMaskOf(grid);
    let best = null;
    for (let id = 0; id < 8; id++) {
      // clone
      const g2 = { m: grid.m.map(r => r.slice()), r: grid.r.map(r => r.slice()), size: grid.size, version };
      applyMask(g2, dm, id);
      placeFormat(g2, 0b00, id); // EC level M = 0b00? actually format bits: L=01,M=00,Q=11,H=10
      const sc = score(g2);
      if (!best || sc < best.sc) best = { sc, g: g2 };
    }
    const out = [];
    for (let y = 0; y < best.g.size; y++) {
      const row = [];
      for (let x = 0; x < best.g.size; x++) row.push(best.g.m[y][x] === 1);
      out.push(row);
    }
    return { size: best.g.size, data: out };
  };
})();
