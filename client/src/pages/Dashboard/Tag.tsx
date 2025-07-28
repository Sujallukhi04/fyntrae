import TagTable from "@/components/tags/TagTable";
import AddTagModal from "@/components/tags/AddTagModal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useTime from "@/hooks/useTime";
import { useAuth } from "@/providers/AuthProvider";
import { Plus, TagIcon, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const Tag = () => {
  const { user } = useAuth();
  const {
    getTags,
    tags,
    createTag,
    deleteTag,
    createTagLoading,
    deleteTagLoading,
  } = useTime();
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    if (user?.currentTeamId) {
      getTags(user?.currentTeamId);
    }
  }, [user?.currentTeamId]);

  // Filter tags by search
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateTag = async (tagName: string) => {
    if (!user?.currentTeamId) return;
    await createTag(user.currentTeamId, tagName);
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!user?.currentTeamId) return;
    await deleteTag(user.currentTeamId, tagId);
  };

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <div className="flex flex-col gap-3 pb-1 pt-2">
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Tags</h1>
          </div>
          <Button
            className="w-full md:w-auto"
            variant="outline"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Tag
          </Button>
        </div>
        <Separator className="mb-4" />

        <div className="flex items-center gap-2 px-5">
          <div className="relative w-full max-w-xs">
            <Input
              type="text"
              placeholder="Search tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="px-5 ">
          <TagTable
            tags={filteredTags}
            onDelete={handleDeleteTag}
            deleteLoading={deleteTagLoading}
          />
        </div>
      </div>
      <AddTagModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateTag}
        loading={createTagLoading}
      />
    </div>
  );
};

export default Tag;
