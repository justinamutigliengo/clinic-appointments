import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Plus, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (patient: any) => void;
}

const PatientSearchDialog = ({ open, onOpenChange, onSelect }: PatientSearchDialogProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    dni: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (open && searchTerm) {
      searchPatients();
    }
  }, [searchTerm, open]);

  const searchPatients = async () => {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,dni.ilike.%${searchTerm}%`)
      .limit(10);

    setPatients(data || []);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("patients")
      .insert(newPatient)
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el paciente",
      });
    } else {
      toast({
        title: "Paciente creado",
        description: "El paciente fue creado exitosamente",
      });
      onSelect(data);
      setShowNewPatient(false);
      setNewPatient({
        first_name: "",
        last_name: "",
        dni: "",
        phone: "",
        email: "",
      });
    }
  };

  if (showNewPatient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={newPatient.first_name}
                  onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  value={newPatient.last_name}
                  onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>DNI</Label>
              <Input
                value={newPatient.dni}
                onChange={(e) => setNewPatient({ ...newPatient, dni: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input
                value={newPatient.phone}
                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newPatient.email}
                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNewPatient(false)}>
                Volver
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Paciente"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar Paciente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, apellido o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {searchTerm && (
            <>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {patients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No se encontraron pacientes</p>
                  </div>
                ) : (
                  patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => onSelect(patient)}
                      className="w-full text-left p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2 mt-1">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.dni && `DNI: ${patient.dni}`}
                            {patient.dni && patient.phone && " - "}
                            Tel: {patient.phone}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowNewPatient(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Paciente
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientSearchDialog;
