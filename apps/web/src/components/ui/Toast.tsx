import { Toaster } from "react-hot-toast";

export function ToastHost() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2400,
        style: {
          borderRadius: "14px",
          background: "#111827",
          color: "#F8FAFC",
          border: "1px solid #1F2937"
        }
      }}
    />
  );
}
