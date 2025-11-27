import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, addWeeks, subWeeks, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import AppointmentPopover from "./AppointmentPopover";

interface WeeklyCalendarProps {
  selectedDate: Date;
  selectedDoctor: string;
  onEdit: (appointment: any) => void;
}

const statusColors = {
  pending: "bg-warning/20 border-warning/40 hover:bg-warning/30",
  confirmed: "bg-info/20 border-info/40 hover:bg-info/30",
  attended: "bg-success/20 border-success/40 hover:bg-success/30",
  cancelled: "bg-destructive/20 border-destructive/40 hover:bg-destructive/30",
  no_show: "bg-muted/50 border-muted hover:bg-muted/70",
};

const WeeklyCalendar = ({ selectedDate, selectedDoctor, onEdit }: WeeklyCalendarProps) => {
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const { toast } = useToast();

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    setWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }));
  }, [selectedDate]);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel("calendar-appointments")
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
  }, [weekStart, selectedDoctor]);

  const fetchAppointments = async () => {
    setLoading(true);
    const weekEnd = addDays(weekStart, 6);

    let query = supabase
      .from("appointments")
      .select(`
        *,
        patient:patients(*),
        doctor:doctors(*)
      `)
      .gte("date", format(weekStart, "yyyy-MM-dd"))
      .lte("date", format(weekEnd, "yyyy-MM-dd"))
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

  const getAppointmentForSlot = (day: Date, time: string) => {
    return appointments.find(
      (apt) =>
        apt.date === format(day, "yyyy-MM-dd") &&
        apt.time.substring(0, 5) === time
    );
  };

  const handlePreviousWeek = () => {
    setWeekStart(subWeeks(weekStart, 1));
  };

  const handleNextWeek = () => {
    setWeekStart(addWeeks(weekStart, 1));
  };

  const handleAppointmentClick = (appointment: any, event: React.MouseEvent<HTMLDivElement>) => {
    setSelectedAppointment(appointment);
    setPopoverAnchor(event.currentTarget);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-card rounded-lg border">
        <p className="text-muted-foreground">Cargando calendario...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-lg border overflow-hidden">
        {/* Week Navigation */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold">
            {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </h3>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b bg-muted/30">
              <div className="p-3 text-sm font-medium text-muted-foreground border-r">
                Hora
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 text-center border-r last:border-r-0",
                    format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") &&
                      "bg-primary/5"
                  )}
                >
                  <div className="text-sm font-medium">
                    {format(day, "EEE", { locale: es })}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") &&
                      "text-primary"
                  )}>
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="divide-y">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 min-h-[60px]">
                  <div className="p-2 text-sm text-muted-foreground border-r flex items-center justify-center">
                    {time}
                  </div>
                  {weekDays.map((day) => {
                    const appointment = getAppointmentForSlot(day, time);
                    return (
                      <div
                        key={`${day.toISOString()}-${time}`}
                        className="border-r last:border-r-0 p-1"
                      >
                        {appointment ? (
                          <div
                            onClick={(e) => handleAppointmentClick(appointment, e)}
                            className={cn(
                              "h-full p-2 rounded border-l-4 cursor-pointer transition-colors text-xs",
                              statusColors[appointment.status as keyof typeof statusColors]
                            )}
                          >
                            <div className="font-medium truncate">
                              {appointment.patient?.first_name} {appointment.patient?.last_name}
                            </div>
                            <div className="text-muted-foreground truncate text-[10px]">
                              Dr/a. {appointment.doctor?.last_name}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AppointmentPopover
        appointment={selectedAppointment}
        anchor={popoverAnchor}
        onClose={() => {
          setSelectedAppointment(null);
          setPopoverAnchor(null);
        }}
        onEdit={onEdit}
      />
    </>
  );
};

export default WeeklyCalendar;
