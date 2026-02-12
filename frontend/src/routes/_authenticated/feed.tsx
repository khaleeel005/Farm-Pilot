import { createFileRoute } from "@tanstack/react-router";
import { FeedManagement } from "@/components/feed-management";

export const Route = createFileRoute("/_authenticated/feed")({
  component: FeedPage,
});

function FeedPage() {
  return <FeedManagement />;
}
