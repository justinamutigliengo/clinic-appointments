import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, LogOut, Users, Stethoscope } from "lucide-react";
import AppointmentsTable from "@/components/appointments/AppointmentsTable";
import AppointmentFilters from "@/components/appointments/AppointmentFilters";
import AppointmentDialog from "@/components/appointments/AppointmentDialog";
import { format } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setIsDialogOpen(true);
  };

  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAppointment(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Stethoscope className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">TurnosClinic</h1>
                <p className="text-sm text-muted-foreground">Panel de Control</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/patients")}
              >
                <Users className="h-4 w-4 mr-2" />
                Pacientes
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Filters Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Agenda de Turnos</h2>
            </div>
            <Button onClick={handleNewAppointment}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Turno
            </Button>
          </div>

          <AppointmentFilters
            selectedDate={selectedDate}
            selectedDoctor={selectedDoctor}
            onDateChange={setSelectedDate}
            onDoctorChange={setSelectedDoctor}
          />

          {/* Appointments Table */}
          <AppointmentsTable
            selectedDate={selectedDate}
            selectedDoctor={selectedDoctor}
            onEdit={handleEditAppointment}
          />
        </div>
      </main>

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        appointment={editingAppointment}
        defaultDate={selectedDate}
      />
    </div>
  );
};

export default Dashboard;
