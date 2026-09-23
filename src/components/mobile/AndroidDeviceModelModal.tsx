import React, { useState } from 'react';
import {
  Smartphone,
  RotateCw,
  X,
  Volume2,
  Power,
  Maximize2,
  Download,
  Share2,
} from 'lucide-react';
import { AndroidMobileView } from './AndroidMobileView.tsx';
import { CurrentUser, Organization } from '../../types/index.ts';

interface AndroidDeviceModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: CurrentUser | null;
  organization: Organization | null;
  onNavigate: (module: string, params?: any) => void;
}

export const AndroidDeviceModelModal: React.FC<AndroidDeviceModelModalProps> = ({
  isOpen,
  onClose,
  user,
  organization,
  onNavigate,
}) => {
  const [deviceModel, setDeviceModel] = useState<'pixel' | 'galaxy'>('pixel');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col items-center max-h-[98vh] w-full max-w-xl">
        {/* Top Control Bar of the Android Simulator */}
        <div className="mb-2 flex w-full items-center justify-between px-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-sky-400" />
            <span className="font-bold text-white">Android Mobile Preview Simulator</span>
            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-mono text-sky-300">
              {deviceModel === 'pixel' ? 'Google Pixel 9 Pro' : 'Galaxy S24 Ultra'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeviceModel(deviceModel === 'pixel' ? 'galaxy' : 'pixel')}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
            >
              Switch Device
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Physical Android Hardware Phone Frame */}
        <div className="relative mx-auto flex items-center justify-center p-2">
          {/* External Hardware Buttons (Volume & Power) */}
          <div className="absolute -left-1.5 top-28 h-12 w-1.5 rounded-l bg-slate-700 shadow-md" />
          <div className="absolute -left-1.5 top-44 h-12 w-1.5 rounded-l bg-slate-700 shadow-md" />
          <div className="absolute -right-1.5 top-36 h-14 w-1.5 rounded-r bg-slate-700 shadow-md" />

          {/* Android Device Outer Bezel */}
          <div
            className={`relative overflow-hidden border-[10px] border-slate-800 bg-slate-950 shadow-2xl transition-all duration-300 ${
              deviceModel === 'pixel'
                ? 'rounded-[44px] ring-2 ring-slate-700/60 w-[360px] sm:w-[390px] h-[720px] sm:h-[780px]'
                : 'rounded-[36px] ring-2 ring-slate-700/60 w-[370px] sm:w-[400px] h-[730px] sm:h-[790px]'
            }`}
          >
            {/* Top Speaker Ear-piece */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-14 rounded-full bg-slate-800 z-40" />

            {/* Android Touch Screen Display */}
            <div className="h-full w-full overflow-hidden">
              <AndroidMobileView
                user={user}
                organization={organization}
                onNavigate={(mod, params) => {
                  onNavigate(mod, params);
                  onClose();
                }}
                onClosePreview={onClose}
                isStandaloneSimulator={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
