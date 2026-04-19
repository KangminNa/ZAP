import { create } from 'zustand';
import type { DeviceDto } from '@zap/shared';

interface DiscoveryState {
  devices: DeviceDto[];
  selectedDeviceId: string | null;
  setDevices: (devices: DeviceDto[]) => void;
  selectDevice: (id: string | null) => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  devices: [],
  selectedDeviceId: null,
  setDevices: (devices) => set({ devices }),
  selectDevice: (id) => set({ selectedDeviceId: id }),
}));
