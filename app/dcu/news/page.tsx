"use client";

import BroadcastComposer from "../_components/BroadcastComposer";

export default function NewsPage() {
  return (
    <BroadcastComposer kind="news" title="Send News" activeKey="news" apiPath="/api/dcu/news" />
  );
}
