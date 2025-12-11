import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { resetAndSeed } from "../db/seed";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export function ResetTheDbDialog() {
  const [open, setOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await resetAndSeed();
      setOpen(false);
      // Reload the page to reflect the reset data
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset database:", error);
      // alert("Failed to reset the database. Please try again.");
      toast.error("Failed to reset the database. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset the db</DialogTitle>
          <DialogDescription>
            This will reset the database to its initial seed data. All of your
            current changes will be permanently lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isResetting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={isResetting}
          >
            <Trash2 /> {isResetting ? "Resetting..." : "Reset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
