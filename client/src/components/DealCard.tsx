import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Eye } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DealCardProps {
  id: number;
  contactName: string;
  propertyTitle?: string;
  value?: number;
  stage: string;
  onViewDetails: (id: number) => void;
}

export function DealCard({ id, contactName, propertyTitle, value, stage, onViewDetails }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formattedValue = value ? `ETB ${(value / 1000000).toFixed(1)}M` : "No value";

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`border border-border hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${isDragging ? "shadow-lg" : ""}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm truncate">{contactName}</h4>
              {propertyTitle && <p className="text-xs text-muted-foreground truncate mt-1">{propertyTitle}</p>}
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Value</span>
              <span className="text-sm font-medium text-foreground">{formattedValue}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Badge variant="outline" className="text-xs flex-1 justify-center">
                {stage}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onViewDetails(id)}>
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
