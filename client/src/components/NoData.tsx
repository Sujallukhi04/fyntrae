// components/NoData.tsx
import { Inbox } from "lucide-react";

const NoData = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
    <Inbox className="w-12 h-12 mb-4" />
    <p className="text-sm   ">{message}</p>
  </div>
);

export default NoData;
