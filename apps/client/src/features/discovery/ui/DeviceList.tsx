import type { DeviceDto } from '@zap/shared';
import { Avatar } from '../../../shared/ui/Avatar';
import { useDiscoveryStore } from '../model/discoveryStore';
import { getDeviceId } from '../../../services';

const TYPE_LABEL: Record<string, string> = {
  mac: 'Mac',
  ios: 'iOS',
  android: 'Android',
  windows: 'Windows',
  linux: 'Linux',
  unknown: '',
};

function DeviceCard({ device }: { device: DeviceDto }) {
  const { selectedDeviceId, selectDevice } = useDiscoveryStore();
  const isSelected = selectedDeviceId === device.id;

  return (
    <button
      onClick={() => selectDevice(isSelected ? null : device.id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isSelected
          ? 'bg-blue-50 ring-2 ring-blue-500'
          : 'bg-white hover:bg-stone-50'
      }`}
    >
      <Avatar name={device.name} />
      <div className="flex-1 text-left">
        <p className="font-medium text-stone-800">{device.name}</p>
        <p className="text-xs text-stone-400">
          {TYPE_LABEL[device.type] ?? device.type}
        </p>
      </div>
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          isSelected ? 'bg-blue-500' : 'bg-emerald-400'
        }`}
      />
    </button>
  );
}

export function DeviceList() {
  const allDevices = useDiscoveryStore((s) => s.devices);
  const myId = getDeviceId();
  const devices = allDevices.filter((d) => d.id !== myId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-stone-500">주변 기기</h3>
        <span className="text-xs text-stone-400">{devices.length}대 발견</span>
      </div>
      {devices.length === 0 ? (
        <p className="text-center py-8 text-stone-400 text-sm">
          같은 Wi-Fi에 연결된 기기를 찾는 중...
        </p>
      ) : (
        <div className="space-y-1">
          {devices.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
        </div>
      )}
    </div>
  );
}
