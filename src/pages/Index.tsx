import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Stethoscope, Calendar, Users, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/5 to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo and Title */}
          <div className="flex justify-center mb-8">
            <div className="rounded-full bg-primary/10 p-6">
              <Stethoscope className="h-16 w-16 text-primary" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground">
              TurnosClinic
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema de gestión de turnos médicos simple y eficiente para consultorios y clínicas pequeñas
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Registrarse
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="bg-card p-6 rounded-lg border">
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Gestión de Turnos</h3>
              <p className="text-muted-foreground text-sm">
                Crea, edita y cancela turnos con facilidad. Vista diaria por médico.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="rounded-full bg-accent/10 p-3 w-fit mx-auto mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Base de Pacientes</h3>
              <p className="text-muted-foreground text-sm">
                Registra y busca pacientes rápidamente. Toda la información en un solo lugar.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="rounded-full bg-success/10 p-3 w-fit mx-auto mb-4">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Estados en Tiempo Real</h3>
              <p className="text-muted-foreground text-sm">
                Actualiza el estado de los turnos: confirmado, atendido, cancelado, etc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
