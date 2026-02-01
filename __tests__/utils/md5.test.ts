import { md5 } from '../../src/utils/md5';
import CryptoJS from 'crypto-js';

describe('md5', () => {
  it('should return MD5 hash of string', () => {
    const input = 'hello world';
    const expected = CryptoJS.MD5(input).toString();
    expect(md5(input)).toBe(expected);
  });

  it('should handle empty string', () => {
    const input = '';
    const expected = CryptoJS.MD5(input).toString();
    expect(md5(input)).toBe(expected);
  });
});
