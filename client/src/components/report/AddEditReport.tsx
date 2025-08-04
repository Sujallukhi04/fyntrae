// import React, { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
//   DialogClose,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { toast } from "sonner";
// import { useOrganization } from "@/providers/OrganizationProvider";

// interface TimeEntryModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (data: {}) => Promise<void>;
//   loading?: boolean;
//   mode: "add" | "edit";
//   initialData?: any;
//   filters?: {
//     projectId?: string;
//     taskId?: string;
//     tagIds?: string;
//     clientId?: string;
//     startDate: Date;
//     endDate: Date;
//   };
// }

// export const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
//   isOpen,
//   onClose,
//   onSubmit,
//   loading = false,
//   mode,
//   initialData,
//   filters,
// }) => {
//   const { organization } = useOrganization();
//   const [description, setDescription] = useState(
//     initialData?.description || ""
//   );
//   const [name, setName] = useState(initialData?.name || "");
//   const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);

//   useEffect(() => {
//     if (initialData) {
//     }

//     if (isOpen && !initialData) {
//     }
//   }, [isOpen, initialData]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     if (startTime >= endTime) {
//       toast.error("Start time must be before end time.");
//       return;
//     }

//     if (endTime > new Date()) {
//       toast.error("End time cannot be in the future.");
//       return;
//     }

//     const projectid = projectId.split(":")[0] || null;
//     const taskId = projectId.split(":")[1] || null;

//     onSubmit({
//       description,
//       projectId: projectid,
//       taskId,
//       start: startTime,
//       end: endTime,
//       tagIds: selectedTags,
//       billable,
//     });
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-md w-full">
//         <DialogHeader>
//           <DialogTitle>
//             {mode === "add" ? "Save the report" : "Edit the report"}
//           </DialogTitle>
//           <DialogDescription></DialogDescription>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div className="flex-1 flex flex-col gap-2">
//             <Label htmlFor="name">Description</Label>
//             <Input
//               id="description"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               placeholder="What did you work on?"
//               className="py-4 w-full"
//             />
//           </div>

//           <DialogFooter className="mt-4">
//             <DialogClose asChild>
//               <Button
//                 type="button"
//                 variant="outline"
//                 disabled={loading}
//                 onClick={onClose}
//               >
//                 Cancel
//               </Button>
//             </DialogClose>
//             <Button type="submit" disabled={loading || runningTimer}>
//               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               {mode === "add" ? "Create Time Entry" : "Save Changes"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// };
