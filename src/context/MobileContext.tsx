import React, { createContext, useContext, useState, useEffect } from 'react';

interface MobileContextType {
  isMobile: boolean;
  isSimulatedMobile: boolean;
  toggleSimulatedMobile: () => void;
  setSimulatedMobile: (val: boolean) => void;
}

const MobileContext = createContext<MobileContextType>({
  isMobile: false,
  isSimulatedMobile: false,
  toggleSimulatedMobile: () => {},
  setSimulatedMobile: () => {},
});

export const MobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSimulatedMobile, setSimulatedMobileState] = useState(false);
  const [isScreenMobile, setIsScreenMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsScreenMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSimulatedMobile = () => setSimulatedMobileState((prev) => !prev);
  const setSimulatedMobile = (val: boolean) => setSimulatedMobileState(val);

  const isMobile = isSimulatedMobile || isScreenMobile;

  return (
    <MobileContext.Provider
      value={{
        isMobile,
        isSimulatedMobile,
        toggleSimulatedMobile,
        setSimulatedMobile,
      }}
    >
      {children}
    </MobileContext.Provider>
  );
};

export const useMobile = () => useContext(MobileContext);
