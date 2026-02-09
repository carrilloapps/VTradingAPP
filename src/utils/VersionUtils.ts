/**
 * Utility for version string comparison (e.g., "1.0.0")
 */
export const VersionUtils = {
  /**
   * Compares two semantic version strings.
   * Returns:
   *  1 if v1 > v2
   * -1 if v1 < v2
   *  0 if v1 === v2
   */
  compare(v1: string, v2: string): number {
    if (!v1 || !v2) return 0;

    const v1Parts = v1.split('.').map(part => parseInt(part, 10) || 0);
    const v2Parts = v2.split('.').map(part => parseInt(part, 10) || 0);

    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
        const p1 = v1Parts[i] || 0;
        const p2 = v2Parts[i] || 0;

        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }

    return 0;
  },

  /**
   * Returns true if current version is lower than required version
   */
  isLower(current: string, required: string): boolean {
    return this.compare(current, required) === -1;
  },

  /**
   * Returns true if current version is at least the required version
   */
  isAtLeast(current: string, required: string): boolean {
    const result = this.compare(current, required);
    return result === 0 || result === 1;
  },
};
