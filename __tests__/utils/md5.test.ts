import { md5 } from '../../src/utils/md5';

describe('md5', () => {
  it('should calculate the MD5 hash of a string', () => {
    // "hello" -> 5d41402abc4b2a76b9719d911017c592
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  it('should handle empty string', () => {
    // "" -> d41d8cd98f00b204e9800998ecf8427e
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('should handle special characters', () => {
    // "123" -> 202cb962ac59075b964b07152d234b70
    expect(md5('123')).toBe('202cb962ac59075b964b07152d234b70');
  });
});
