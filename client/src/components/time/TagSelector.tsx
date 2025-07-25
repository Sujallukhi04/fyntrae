import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Tag {
  id: string;
  name: string;
}

interface TagSelectorPopoverProps {
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagId: string, checked: boolean) => void;
  onAddTag?: () => void;
  onCreateFirstTag?: () => void;
  tagLoading?: boolean;
  runningTimer: boolean;
  text?: string;
  className?: string;
}

export const TagSelectorPopover = ({
  tags,
  selectedTags,
  onTagToggle,
  onAddTag,
  onCreateFirstTag,
  tagLoading = false,
  runningTimer,
  text = "",
  className = "",
}: TagSelectorPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild disabled={runningTimer}>
        <Button variant={text ? "outline" : "ghost"} className={`${className}`}>
          <Tag
            className={`h-5 w-5 ${
              selectedTags.length > 0 ? "text-primary" : "text-muted-foreground"
            }`}
          />
          {text &&
            (selectedTags.length > 0 ? `${selectedTags.length} Tags` : "Tags")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Tags</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onAddTag}
            >
              <Plus className="h-3 w-3 mr-1 " />
              Add
            </Button>
          </div>

          <Separator className="my-2" />

          <div className="max-h-48 overflow-y-auto">
            {tagLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : tags && tags.length > 0 ? (
              <div className="space-y-1">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) =>
                          onTagToggle(tag.id, Boolean(checked))
                        }
                      />
                      <span className="text-sm font-medium">{tag.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tags found</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs"
                  onClick={onCreateFirstTag}
                >
                  Create your first tag
                </Button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
