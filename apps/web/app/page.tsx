import React from "react";
import { api } from "~/trpc/server";
import HomeClient from "~/components/HomeClient";

export default async function Home() {
  let serverStatus = "unknown";
  try {
    const res = await api.health.getHealth.query();
    serverStatus = res.status;
  } catch {
    serverStatus = "offline";
  }

  return <HomeClient serverStatus={serverStatus} />;
}
