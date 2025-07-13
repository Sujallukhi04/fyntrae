import { Ban, CircleCheck, Clock, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemType: string;
  onPageChange: (page: number) => void;
}

export const getStatusBadge = (status: string | boolean) => {
  if (status === "Active" || status === true) {
    return (
      <Badge variant="outline" className=" text-green-500 ">
        <CircleCheck className="w-4 h-4 mr-1" />
        Active
      </Badge>
    );
  } else if (status === "Inactive" || status === false) {
    return (
      <Badge variant="outline" className=" text-red-500 ">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  } else if (status === "PENDING") {
    return (
      <Badge variant="outline" className=" text-yellow-500 ">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  } else if (status === "EXPIRED") {
    return (
      <Badge variant="outline" className=" text-gray-600 ">
        <Ban className="w-3 h-3 mr-1" />
        Expired
      </Badge>
    );
  }
  return null;
};

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemType,
  onPageChange,
}) => (
  <div className="flex items-center justify-end md:justify-between">
    <div className="hidden md:flex md:items-center md:space-x-2">
      <p className="text-sm text-muted-foreground">
        Total {totalItems} {itemType}
      </p>
    </div>
    <div className="flex items-center space-x-2">
      <p className="text-sm text-muted-foreground">
        Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
      </p>
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
        >
          Next
        </Button>
      </div>
    </div>
  </div>
);

export default PaginationControls;
