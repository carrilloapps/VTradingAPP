import { md5 } from '@/utils/md5';

describe('md5', () => {
  it('should calculate the MD5 hash of a string', () => {
    // Known MD5 hashes
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
    expect(md5('world')).toBe('7d793037a0760186574b0282f2f435e7');
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5('123456')).toBe('e10adc3949ba59abbe56e057f20f883e');
  });

  it('should be consistent', () => {
    const input = 'consistent-value';
    expect(md5(input)).toBe(md5(input));
  });
});
