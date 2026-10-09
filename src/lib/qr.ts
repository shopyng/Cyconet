/**
 * Small byte-mode QR encoder used by the certificate PDF.
 *
 * Certificate verification URLs are short enough for QR versions 1–4 with
 * medium error correction. Keeping this little encoder local means the printed
 * credential does not depend on a third-party image service or a browser-only
 * canvas implementation.
 */

const TOTAL_CODEWORDS = [0, 26, 44, 70, 100] as const;
const ECC_CODEWORDS_PER_BLOCK = [0, 10, 16, 26, 18] as const;
const NUM_ERROR_CORRECTION_BLOCKS = [0, 1, 1, 1, 2] as const;
const ALIGNMENT_POSITIONS = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
] as const;

/** Returns a square matrix where true means a dark module. */
export function makeQrMatrix(text: string): boolean[][] {
  const data = new TextEncoder().encode(text);
  let version = 1;

  while (version < TOTAL_CODEWORDS.length) {
    const dataCodewords = getDataCodewords(version);
    // Byte mode: mode (4) + byte count (8 for versions 1–9) + payload.
    if (4 + 8 + data.length * 8 <= dataCodewords * 8) break;
    version += 1;
  }

  if (version >= TOTAL_CODEWORDS.length) {
    throw new Error('Verification URL is too long for the certificate QR code.');
  }

  const codewords = makeCodewords(data, version);
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () =>
    Array<boolean | null>(size).fill(null),
  );

  drawFunctionPatterns(modules, version);
  drawCodewords(modules, codewords, 0);
  drawFormatBits(modules, 0);

  return modules.map((row) => row.map((value) => value === true));
}

function getDataCodewords(version: number): number {
  return (
    TOTAL_CODEWORDS[version] -
    ECC_CODEWORDS_PER_BLOCK[version] * NUM_ERROR_CORRECTION_BLOCKS[version]
  );
}

function makeCodewords(data: Uint8Array, version: number): Uint8Array {
  const capacity = getDataCodewords(version);
  const bits: number[] = [];

  appendBits(bits, 0b0100, 4); // byte mode
  appendBits(bits, data.length, 8);
  for (const byte of data) appendBits(bits, byte, 8);

  const totalBits = capacity * 8;
  appendBits(bits, 0, Math.min(4, totalBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j += 1) value = (value << 1) | bits[i + j];
    bytes.push(value);
  }

  for (let pad = 0xec; bytes.length < capacity; pad ^= 0xec ^ 0x11) bytes.push(pad);

  const blockCount = NUM_ERROR_CORRECTION_BLOCKS[version];
  const eccLength = ECC_CODEWORDS_PER_BLOCK[version];
  const shortBlockDataLength = Math.floor(capacity / blockCount);
  const blocks: { data: Uint8Array; ecc: Uint8Array }[] = [];
  let offset = 0;

  for (let i = 0; i < blockCount; i += 1) {
    const length = shortBlockDataLength + (i >= blockCount - (capacity % blockCount) ? 1 : 0);
    const block = new Uint8Array(bytes.slice(offset, offset + length));
    offset += length;
    blocks.push({ data: block, ecc: reedSolomonCompute(block, eccLength) });
  }

  const result: number[] = [];
  const longestData = Math.max(...blocks.map((block) => block.data.length));
  for (let i = 0; i < longestData; i += 1) {
    for (const block of blocks) if (i < block.data.length) result.push(block.data[i]);
  }
  for (let i = 0; i < eccLength; i += 1) {
    for (const block of blocks) result.push(block.ecc[i]);
  }

  return Uint8Array.from(result);
}

function appendBits(target: number[], value: number, count: number): void {
  for (let i = count - 1; i >= 0; i -= 1) target.push((value >>> i) & 1);
}

function reedSolomonMultiply(x: number, y: number): number {
  let result = 0;
  while (y > 0) {
    if ((y & 1) !== 0) result ^= x;
    x = (x << 1) ^ ((x & 0x80) !== 0 ? 0x11d : 0);
    y >>>= 1;
  }
  return result;
}

function reedSolomonCompute(data: Uint8Array, degree: number): Uint8Array {
  const divisor = new Uint8Array(degree);
  divisor[degree - 1] = 1;
  let root = 1;

  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < divisor.length; j += 1) {
      divisor[j] = reedSolomonMultiply(divisor[j], root);
      if (j + 1 < divisor.length) divisor[j] ^= divisor[j + 1];
    }
    root = reedSolomonMultiply(root, 2);
  }

  const remainder = new Uint8Array(degree);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[degree - 1] = 0;
    for (let i = 0; i < degree; i += 1) {
      remainder[i] ^= reedSolomonMultiply(divisor[i], factor);
    }
  }
  return remainder;
}

function drawFunctionPatterns(modules: (boolean | null)[][], version: number): void {
  const size = modules.length;

  drawFinderPattern(modules, 3, 3);
  drawFinderPattern(modules, size - 4, 3);
  drawFinderPattern(modules, 3, size - 4);

  const positions = ALIGNMENT_POSITIONS[version];
  for (const y of positions) {
    for (const x of positions) {
      if (modules[y][x] !== null) continue;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          modules[y + dy][x + dx] = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
        }
      }
    }
  }

  for (let i = 8; i < size - 8; i += 1) {
    if (modules[6][i] === null) modules[6][i] = i % 2 === 0;
    if (modules[i][6] === null) modules[i][6] = i % 2 === 0;
  }

  // Reserve the format-information modules before placing data.
  drawFormatBits(modules, 0);
  modules[size - 8][8] = true;
}

function drawFinderPattern(modules: (boolean | null)[][], cx: number, cy: number): void {
  const size = modules.length;
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      modules[y][x] = distance === 3 || distance <= 1;
    }
  }
}

function drawFormatBits(modules: (boolean | null)[][], mask: number): void {
  const size = modules.length;
  const data = mask; // M-level error correction is 00 in the format field.
  let rem = data;
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;

  for (let i = 0; i < 15; i += 1) {
    const dark = ((bits >>> i) & 1) !== 0;
    if (i < 6) modules[i][8] = dark;
    else if (i < 8) modules[i + 1][8] = dark;
    else modules[size - 15 + i][8] = dark;

    if (i < 8) modules[8][size - i - 1] = dark;
    else if (i < 9) modules[8][15 - i] = dark;
    else modules[8][15 - i - 1] = dark;
  }
  modules[size - 8][8] = true;
}

function drawCodewords(
  modules: (boolean | null)[][],
  codewords: Uint8Array,
  mask: number,
): void {
  const size = modules.length;
  let bitIndex = 0;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    const upward = ((right + 1) & 2) === 0;

    for (let vert = 0; vert < size; vert += 1) {
      const y = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        if (modules[y][x] !== null) continue;

        const dark =
          bitIndex < codewords.length * 8 &&
          ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0;
        bitIndex += 1;
        modules[y][x] = dark ^ maskCondition(mask, x, y);
      }
    }
  }
}

function maskCondition(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return ((((x * y) % 2) + ((x * y) % 3)) % 2) === 0;
    default:
      return ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0;
  }
}
