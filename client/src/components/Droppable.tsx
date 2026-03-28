import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";

interface DroppableProps {
  id: string | number;
  children: ReactNode;
}

export function Droppable({ id, children }: DroppableProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} className="w-full">
      {children}
    </div>
  );
}
