import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: any;
}

const PatientDialog = ({ open, onOpenChange, patient }: PatientDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dni: "",
    phone: "",
    email: "",
    date_of_birth: "",
  });

  useEffect(() => {
    if (open && patient) {
      setFormData({
        first_name: patient.first_name || "",
        last_name: patient.last_name || "",
        dni: patient.dni || "",
        phone: patient.phone || "",
        email: patient.email || "",
        date_of_birth: patient.date_of_birth || "",
      });
    } else if (open && !patient) {
      setFormData({
        first_name: "",
        last_name: "",
        dni: "",
        phone: "",
        email: "",
        date_of_birth: "",
      });
    }
  }, [open, patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = patient
      ? await supabase.from("patients").update(formData).eq("id", patient.id)
      : await supabase.from("patients").insert(formData);

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: patient ? "No se pudo actualizar el paciente" : "No se pudo crear el paciente",
      });
    } else {
      toast({
        title: patient ? "Paciente actualizado" : "Paciente creado",
        description: patient
          ? "El paciente fue actualizado exitosamente"
          : "El paciente fue creado exitosamente",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{patient ? "Editar Paciente" : "Nuevo Paciente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Apellido *</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>DNI</Label>
              <Input
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Nacimiento</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Teléfono *</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : patient ? "Actualizar" : "Crear Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDialog;
