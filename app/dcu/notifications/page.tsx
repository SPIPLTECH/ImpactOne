"use client";

import BroadcastComposer from "../_components/BroadcastComposer";

export default function NotificationsPage() {
  return (
    <BroadcastComposer
      kind="notification"
      title="Send Notification"
      activeKey="notifications"
      apiPath="/api/dcu/notifications"
    />
  );
}
