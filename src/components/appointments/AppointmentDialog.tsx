import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, isWeekend } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PatientAutocomplete } from "./PatientAutocomplete";
import { NewPatientMiniDialog } from "./NewPatientMiniDialog";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: any;
  defaultDate?: Date;
}

const AppointmentDialog = ({ open, onOpenChange, appointment, defaultDate }: AppointmentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [newPatientSearchTerm, setNewPatientSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    date: defaultDate || new Date(),
    time: "09:00",
    doctor_id: "",
    status: "pending",
    reason: "",
  });

  useEffect(() => {
    if (open) {
      fetchDoctors();
      if (appointment) {
        setFormData({
          date: new Date(appointment.date),
          time: appointment.time.substring(0, 5),
          doctor_id: appointment.doctor_id,
          status: appointment.status,
          reason: appointment.reason || "",
        });
        setSelectedPatient(appointment.patient);
      } else {
        setFormData({
          date: defaultDate || new Date(),
          time: "09:00",
          doctor_id: "",
          status: "pending",
          reason: "",
        });
        setSelectedPatient(null);
      }
    }
  }, [open, appointment, defaultDate]);

  const fetchDoctors = async () => {
    const { data } = await supabase
      .from("doctors")
      .select("*")
      .eq("active", true)
      .order("last_name");
    if (data) setDoctors(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar un paciente",
      });
      return;
    }

    if (!formData.doctor_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar un médico",
      });
      return;
    }

    // Check for weekend
    if (isWeekend(formData.date)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pueden agendar turnos los fines de semana",
      });
      return;
    }

    setLoading(true);

    // Check for existing appointment at same date/time/doctor
    const dateStr = format(formData.date, "yyyy-MM-dd");
    let existingQuery = supabase
      .from("appointments")
      .select("id")
      .eq("date", dateStr)
      .eq("time", formData.time)
      .eq("doctor_id", formData.doctor_id)
      .neq("status", "cancelled");

    if (appointment) {
      existingQuery = existingQuery.neq("id", appointment.id);
    }

    const { data: existingAppointments } = await existingQuery;

    if (existingAppointments && existingAppointments.length > 0) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Horario no disponible",
        description: "Ya existe un turno para ese médico en la fecha y hora seleccionadas",
      });
      return;
    }

    const appointmentData = {
      patient_id: selectedPatient.id,
      doctor_id: formData.doctor_id,
      date: dateStr,
      time: formData.time,
      status: formData.status,
      reason: formData.reason,
    };

    const { error } = appointment
      ? await supabase.from("appointments").update(appointmentData).eq("id", appointment.id)
      : await supabase.from("appointments").insert(appointmentData);

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: appointment ? "No se pudo actualizar el turno" : "No se pudo crear el turno",
      });
    } else {
      toast({
        title: appointment ? "Turno actualizado" : "Turno creado",
        description: appointment ? "El turno fue actualizado exitosamente" : "El turno fue creado exitosamente",
      });
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{appointment ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <PatientAutocomplete
                value={selectedPatient}
                onChange={setSelectedPatient}
                onNewPatientClick={(searchTerm) => {
                  setNewPatientSearchTerm(searchTerm);
                  setShowNewPatientDialog(true);
                }}
              />
            </div>

            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label>Médico *</Label>
              <Select
                value={formData.doctor_id}
                onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar médico" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr/a. {doctor.first_name} {doctor.last_name} - {doctor.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({ ...formData, date })}
                      disabled={(date) => isWeekend(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Hora *</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="attended">Atendido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no_show">No asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Motivo de consulta</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Ej: Control general, dolor de cabeza, etc."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : appointment ? "Actualizar" : "Crear Turno"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <NewPatientMiniDialog
        open={showNewPatientDialog}
        onOpenChange={setShowNewPatientDialog}
        onPatientCreated={(patient) => {
          setSelectedPatient(patient);
          setShowNewPatientDialog(false);
        }}
        initialSearchTerm={newPatientSearchTerm}
      />
    </>
  );
};

export default AppointmentDialog;
