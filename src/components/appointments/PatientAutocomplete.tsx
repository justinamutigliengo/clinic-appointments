import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dni: string | null;
  phone: string;
  email: string | null;
}

interface PatientAutocompleteProps {
  value: Patient | null;
  onChange: (patient: Patient | null) => void;
  onNewPatientClick: (searchTerm: string) => void;
}

export function PatientAutocomplete({
  value,
  onChange,
  onNewPatientClick,
}: PatientAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchPatients = async () => {
      if (searchTerm.length < 2) {
        setPatients([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,dni.ilike.%${searchTerm}%`
        )
        .limit(10);

      if (!error && data) {
        setPatients(data);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const formatPatientLabel = (patient: Patient) => {
    const name = `${patient.first_name} ${patient.last_name}`;
    return patient.dni ? `${name} - ${patient.dni}` : name;
  };

  const handleSelect = (patient: Patient) => {
    onChange(patient);
    setOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm("");
  };

  const handleNewPatient = () => {
    onNewPatientClick(searchTerm);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-2 p-3 rounded-md border border-border bg-muted/50">
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {formatPatientLabel(value)}
            </p>
            <p className="text-sm text-muted-foreground">Tel: {value.phone}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-left font-normal"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Buscar paciente por nombre o DNI...
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <CommandList>
                {loading && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Buscando...
                  </div>
                )}
                {!loading && searchTerm.length >= 2 && patients.length === 0 && (
                  <CommandEmpty>No se encontraron pacientes.</CommandEmpty>
                )}
                {!loading && patients.length > 0 && (
                  <CommandGroup>
                    {patients.map((patient) => (
                      <CommandItem
                        key={patient.id}
                        value={patient.id}
                        onSelect={() => handleSelect(patient)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value?.id === patient.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <p className="font-medium">
                            {formatPatientLabel(patient)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tel: {patient.phone}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {searchTerm.length >= 2 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem onSelect={handleNewPatient}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="font-medium">Nuevo paciente</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
