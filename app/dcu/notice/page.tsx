"use client";

import BroadcastComposer from "../_components/BroadcastComposer";

export default function NoticePage() {
  return (
    <BroadcastComposer kind="notice" title="Send Notice" activeKey="notice" apiPath="/api/dcu/notice" />
  );
}
