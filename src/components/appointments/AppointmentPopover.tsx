import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Edit, Calendar, Clock, User, Stethoscope, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AppointmentPopoverProps {
  appointment: any;
  anchor: HTMLElement | null;
  onClose: () => void;
  onEdit: (appointment: any) => void;
}

const statusColors = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-info/10 text-info border-info/20",
  attended: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-muted text-muted-foreground border-border",
};

const statusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  attended: "Atendido",
  cancelled: "Cancelado",
  no_show: "No asistió",
};

const AppointmentPopover = ({
  appointment,
  anchor,
  onClose,
  onEdit,
}: AppointmentPopoverProps) => {
  if (!appointment || !anchor) return null;

  const handleEdit = () => {
    onEdit(appointment);
    onClose();
  };

  return (
    <Popover open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }} />
      </PopoverTrigger>
      <PopoverContent 
        className="w-80" 
        align="start"
        side="right"
        sideOffset={5}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">Detalles del Turno</h3>
              <Badge
                variant="outline"
                className={`mt-1 ${statusColors[appointment.status as keyof typeof statusColors]}`}
              >
                {statusLabels[appointment.status as keyof typeof statusLabels]}
              </Badge>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3 text-sm">
            {/* Patient */}
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">
                  {appointment.patient?.first_name} {appointment.patient?.last_name}
                </div>
                {appointment.patient?.phone && (
                  <div className="text-muted-foreground text-xs">
                    Tel: {appointment.patient.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Doctor */}
            <div className="flex items-start gap-3">
              <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">
                  Dr/a. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                </div>
                {appointment.doctor?.specialty && (
                  <div className="text-muted-foreground text-xs">
                    {appointment.doctor.specialty}
                  </div>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                {format(new Date(appointment.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>{appointment.time.substring(0, 5)}</div>
            </div>

            {/* Reason */}
            {appointment.reason && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-muted-foreground">{appointment.reason}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t">
            <Button onClick={handleEdit} className="w-full" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar Turno
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AppointmentPopover;
