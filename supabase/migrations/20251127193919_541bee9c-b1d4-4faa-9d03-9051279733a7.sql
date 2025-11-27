-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'attended', 'cancelled', 'no_show')),
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients
-- Authenticated users can view all patients
CREATE POLICY "Authenticated users can view patients"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert patients
CREATE POLICY "Authenticated users can insert patients"
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update patients
CREATE POLICY "Authenticated users can update patients"
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for doctors
-- Authenticated users can view all active doctors
CREATE POLICY "Authenticated users can view doctors"
  ON public.doctors
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert doctors
CREATE POLICY "Authenticated users can insert doctors"
  ON public.doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update doctors
CREATE POLICY "Authenticated users can update doctors"
  ON public.doctors
  FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for appointments
-- Authenticated users can view appointments
CREATE POLICY "Authenticated users can view appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert appointments
CREATE POLICY "Authenticated users can insert appointments"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update appointments
CREATE POLICY "Authenticated users can update appointments"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete appointments
CREATE POLICY "Authenticated users can delete appointments"
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_patients_dni ON public.patients(dni);
CREATE INDEX idx_doctors_active ON public.doctors(active);
CREATE INDEX idx_doctors_user_id ON public.doctors(user_id);

-- Insert some sample doctors for testing
INSERT INTO public.doctors (first_name, last_name, specialty, phone, email, active) VALUES
  ('María', 'González', 'Medicina General', '+54 11 1234-5678', 'mgonzalez@clinic.com', true),
  ('Carlos', 'Rodríguez', 'Pediatría', '+54 11 2345-6789', 'crodriguez@clinic.com', true),
  ('Ana', 'Martínez', 'Cardiología', '+54 11 3456-7890', 'amartinez@clinic.com', true);