import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserState = {
  fullName: string;
  matricNumber: string;
  academicPath: string;
  setProfile: (payload: Partial<Pick<UserState, "fullName" | "matricNumber" | "academicPath">>) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      fullName: "Student",
      matricNumber: "",
      academicPath: "",
      setProfile: (payload) => set((state) => ({ ...state, ...payload }))
    }),
    { name: "campuslab-user" }
  )
);
