import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface StoreContextType {
  followedStores: string[];
  followStore: (storeId: string) => void;
  unfollowStore: (storeId: string) => void;
  isFollowing: (storeId: string) => boolean;
  toggleFollow: (storeId: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [followedStores, setFollowedStores] = useState<string[]>(() => {
    const saved = localStorage.getItem("followedStores");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("followedStores", JSON.stringify(followedStores));
  }, [followedStores]);

  const followStore = (storeId: string) => {
    setFollowedStores((prev) => {
      if (!prev.includes(storeId)) {
        return [...prev, storeId];
      }
      return prev;
    });
  };

  const unfollowStore = (storeId: string) => {
    setFollowedStores((prev) => prev.filter((id) => id !== storeId));
  };

  const isFollowing = (storeId: string) => {
    return followedStores.includes(storeId);
  };

  const toggleFollow = (storeId: string) => {
    if (isFollowing(storeId)) {
      unfollowStore(storeId);
    } else {
      followStore(storeId);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        followedStores,
        followStore,
        unfollowStore,
        isFollowing,
        toggleFollow,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
