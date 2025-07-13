import { Inbox } from "lucide-react";

const NoData = ({
  message,
  icon: Icon = Inbox,
}: {
  message: string;
  icon?: React.ElementType;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
    <Icon className="w-12 h-12 mb-4" />
    <p className="text-sm">{message}</p>
  </div>
);
export default NoData;
