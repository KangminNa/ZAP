export class NetworkPrefix {
  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  /** IP 주소에서 파생 (IPv4 /24 또는 IPv6 /64). */
  static fromIp(ip: string): NetworkPrefix {
    const cleaned = ip.replace(/^::ffff:/, '');
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      if (parts.length !== 4) throw new Error(`[NetworkPrefix] invalid IPv4: ${ip}`);
      return new NetworkPrefix(parts.slice(0, 3).join('.'));
    }
    const v6 = cleaned.split(':').slice(0, 4).join(':');
    return new NetworkPrefix(v6);
  }

  /** 저장소 복원용: 이미 계산된 prefix 문자열을 그대로 사용. */
  static fromValue(value: string): NetworkPrefix {
    if (!value) throw new Error('[NetworkPrefix] empty value');
    return new NetworkPrefix(value);
  }

  equals(other: NetworkPrefix): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
