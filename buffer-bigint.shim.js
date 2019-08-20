/*
https://github.com/nodejs/node/blob/ed8fc7e/lib/internal/buffer.js
*/

function checkBounds(buf, offset, byteLength) {
    if (buf[offset] === undefined || buf[offset + byteLength] === undefined)
        boundsError(offset, buf.length - (byteLength + 1));
}

function checkInt(value, min, max, buf, offset, byteLength) {
    if (value > max || value < min) {
        const n = typeof min === 'bigint' ? 'n' : '';
        let range;
        if (byteLength > 3) {
            if (min === 0 || min === 0n) {
                range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`;
            } else {
                range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
                    `${(byteLength + 1) * 8 - 1}${n}`;
            }
        } else {
            range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new RangeError('value', range, value);
    }
    checkBounds(buf, offset, byteLength);
}

function boundsError(value, length, type) {
    if (Math.floor(value) !== value) {
        throw new RangeError(type || 'offset', 'an integer', value);
    }

    if (length < 0)
        throw new RangeError();

    throw new RangeError(type || 'offset',
        `>= ${type ? 1 : 0} and <= ${length}`,
        value);
}

function readBigUInt64LE(offset = 0) {
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined)
        boundsError(offset, this.length - 8);

    const lo = first +
        this[++offset] * 2 ** 8 +
        this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 24;

    const hi = this[++offset] +
        this[++offset] * 2 ** 8 +
        this[++offset] * 2 ** 16 +
        last * 2 ** 24;

    return BigInt(lo) + (BigInt(hi) << 32n);
}

function readBigUInt64BE(offset = 0) {
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined)
        boundsError(offset, this.length - 8);

    const hi = first * 2 ** 24 +
        this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 8 +
        this[++offset];

    const lo = this[++offset] * 2 ** 24 +
        this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 8 +
        last;

    return (BigInt(hi) << 32n) + BigInt(lo);
}

function readBigInt64LE(offset = 0) {
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined)
        boundsError(offset, this.length - 8);

    const val = this[offset + 4] +
        this[offset + 5] * 2 ** 8 +
        this[offset + 6] * 2 ** 16 +
        (last << 24); // Overflow
    return (BigInt(val) << 32n) +
        BigInt(first +
            this[++offset] * 2 ** 8 +
            this[++offset] * 2 ** 16 +
            this[++offset] * 2 ** 24);
}

function readBigInt64BE(offset = 0) {
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined)
        boundsError(offset, this.length - 8);

    const val = (first << 24) + // Overflow
        this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 8 +
        this[++offset];
    return (BigInt(val) << 32n) +
        BigInt(this[++offset] * 2 ** 24 +
            this[++offset] * 2 ** 16 +
            this[++offset] * 2 ** 8 +
            last);
}

function writeBigU_Int64LE(buf, value, offset, min, max) {
    checkInt(value, min, max, buf, offset, 7);

    let lo = Number(value & 0xffffffffn);
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    let hi = Number(value >> 32n & 0xffffffffn);
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    return offset;
}

function writeBigUInt64LE(value, offset = 0) {
    return writeBigU_Int64LE(this, value, offset, 0n, 0xffffffffffffffffn);
}

function writeBigU_Int64BE(buf, value, offset, min, max) {
    checkInt(value, min, max, buf, offset, 7);

    let lo = Number(value & 0xffffffffn);
    buf[offset + 7] = lo;
    lo = lo >> 8;
    buf[offset + 6] = lo;
    lo = lo >> 8;
    buf[offset + 5] = lo;
    lo = lo >> 8;
    buf[offset + 4] = lo;
    let hi = Number(value >> 32n & 0xffffffffn);
    buf[offset + 3] = hi;
    hi = hi >> 8;
    buf[offset + 2] = hi;
    hi = hi >> 8;
    buf[offset + 1] = hi;
    hi = hi >> 8;
    buf[offset] = hi;
    return offset + 8;
}

function writeBigUInt64BE(value, offset = 0) {
    return writeBigU_Int64BE(this, value, offset, 0n, 0xffffffffffffffffn);
}

function writeBigInt64LE(value, offset = 0) {
    return writeBigU_Int64LE(
        this, value, offset, -0x8000000000000000n, 0x7fffffffffffffffn);
}

function writeBigInt64BE(value, offset = 0) {
    return writeBigU_Int64BE(
        this, value, offset, -0x8000000000000000n, 0x7fffffffffffffffn);
}


Buffer.prototype.readBigUInt64LE = readBigUInt64LE;
Buffer.prototype.readBigUInt64BE = readBigUInt64BE;
Buffer.prototype.readBigInt64LE = readBigInt64LE;
Buffer.prototype.readBigInt64BE = readBigInt64BE;
Buffer.prototype.writeBigUInt64LE = writeBigUInt64LE;
Buffer.prototype.writeBigUInt64BE = writeBigUInt64BE;
Buffer.prototype.writeBigInt64LE = writeBigInt64LE;
Buffer.prototype.writeBigInt64BE = writeBigInt64BE;
