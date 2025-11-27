import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AppointmentsTableProps {
  selectedDate: Date;
  selectedDoctor: string;
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

const AppointmentsTable = ({ selectedDate, selectedDoctor, onEdit }: AppointmentsTableProps) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, selectedDoctor]);

  const fetchAppointments = async () => {
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    let query = supabase
      .from("appointments")
      .select(`
        *,
        patient:patients(*),
        doctor:doctors(*)
      `)
      .eq("date", dateStr)
      .order("time", { ascending: true });

    if (selectedDoctor !== "all") {
      query = query.eq("doctor_id", selectedDoctor);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los turnos",
      });
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar el turno",
      });
    } else {
      toast({
        title: "Turno cancelado",
        description: "El turno fue cancelado exitosamente",
      });
      fetchAppointments();
    }
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando turnos...</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card rounded-lg border">
        <p className="text-muted-foreground mb-2">No hay turnos para esta fecha</p>
        <p className="text-sm text-muted-foreground">Crea un nuevo turno para comenzar</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Médico</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">
                  {appointment.time.substring(0, 5)}
                </TableCell>
                <TableCell>
                  {appointment.patient?.first_name} {appointment.patient?.last_name}
                </TableCell>
                <TableCell>
                  Dr/a. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                </TableCell>
                <TableCell>{appointment.reason || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[appointment.status as keyof typeof statusColors]}>
                    {statusLabels[appointment.status as keyof typeof statusLabels]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(appointment)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(appointment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar turno?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El turno será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Cancelar Turno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AppointmentsTable;
