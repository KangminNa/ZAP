import os from 'node:os';

function getLocalLanIp(): string {
  for (const addrs of Object.values(os.networkInterfaces())) {
    if (!addrs) continue;
    for (const iface of addrs) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const LOCAL_LAN_IP = getLocalLanIp();

/**
 * 127.0.0.1 / ::1 접속이면 서버의 실제 LAN IP로 치환.
 * 같은 Wi-Fi의 다른 기기(LAN IP)와 같은 NetworkPrefix에 묶이게 한다.
 */
export function resolveIp(reqIp: string): string {
  const cleaned = reqIp.replace(/^::ffff:/, '');
  if (cleaned === '127.0.0.1' || cleaned === '::1') {
    return LOCAL_LAN_IP;
  }
  return cleaned;
}

export { LOCAL_LAN_IP };
