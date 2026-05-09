import { Outlet } from "react-router";

export function PublicLayout() {
  return (
    <main className="min-h-screen bg-background">
      <Outlet />
    </main>
  );
}
