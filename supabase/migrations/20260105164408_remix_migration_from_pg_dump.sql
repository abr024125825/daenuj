CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: application_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.application_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'waitlisted'
);


--
-- Name: opportunity_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.opportunity_status AS ENUM (
    'draft',
    'published',
    'completed'
);


--
-- Name: time_slot; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.time_slot AS ENUM (
    'morning',
    'afternoon',
    'evening'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'supervisor',
    'volunteer'
);


--
-- Name: generate_badge_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_badge_code() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  code TEXT;
BEGIN
  code := upper(substr(md5(random()::text), 1, 6));
  RETURN code;
END;
$$;


--
-- Name: generate_certificate_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_certificate_number() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  cert_number TEXT;
BEGIN
  cert_number := 'CSDC-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('certificate_seq')::TEXT, 6, '0');
  RETURN cert_number;
END;
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.user_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    'volunteer'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'volunteer');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.user_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.user_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: academic_semesters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_semesters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    academic_year text NOT NULL,
    semester_number integer NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    is_schedule_open boolean DEFAULT true,
    schedule_closed_at timestamp with time zone,
    schedule_closed_by uuid,
    CONSTRAINT academic_semesters_semester_number_check CHECK (((semester_number >= 1) AND (semester_number <= 3)))
);


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    opportunity_id uuid NOT NULL,
    volunteer_id uuid NOT NULL,
    registration_id uuid NOT NULL,
    check_in_time timestamp with time zone DEFAULT now() NOT NULL,
    check_in_method text DEFAULT 'qr_code'::text,
    manual_token text,
    recorded_by uuid,
    check_out_time timestamp with time zone
);


--
-- Name: badge_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badge_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    volunteer_id uuid NOT NULL,
    opportunity_id uuid NOT NULL,
    registration_id uuid NOT NULL,
    checkout_code text NOT NULL,
    checkout_time timestamp with time zone,
    checkout_condition text,
    checkout_confirmed_at timestamp with time zone,
    checkout_confirmed_by uuid,
    return_code text,
    return_time timestamp with time zone,
    return_condition text,
    return_confirmed_at timestamp with time zone,
    return_confirmed_by uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT badge_transactions_checkout_condition_check CHECK ((checkout_condition = ANY (ARRAY['good'::text, 'damaged'::text]))),
    CONSTRAINT badge_transactions_return_condition_check CHECK ((return_condition = ANY (ARRAY['good'::text, 'damaged'::text, 'lost'::text]))),
    CONSTRAINT badge_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'checked_out'::text, 'returned'::text, 'lost'::text])))
);


--
-- Name: certificate_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.certificate_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: certificate_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    template_html text NOT NULL,
    is_default boolean DEFAULT false,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: certificate_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    certificate_id uuid,
    verified_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address text,
    user_agent text
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    volunteer_id uuid NOT NULL,
    opportunity_id uuid NOT NULL,
    template_id uuid,
    hours numeric NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    certificate_number text NOT NULL
);


--
-- Name: evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    volunteer_id uuid NOT NULL,
    opportunity_id uuid NOT NULL,
    type text NOT NULL,
    ratings jsonb DEFAULT '[]'::jsonb NOT NULL,
    comments text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT evaluations_type_check CHECK ((type = ANY (ARRAY['volunteer_feedback'::text, 'supervisor_rating'::text])))
);


--
-- Name: faculties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faculties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: majors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.majors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text,
    is_read boolean DEFAULT false,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    location text NOT NULL,
    required_volunteers integer DEFAULT 1 NOT NULL,
    faculty_restriction uuid,
    status public.opportunity_status DEFAULT 'draft'::public.opportunity_status NOT NULL,
    qr_code_active boolean DEFAULT false,
    qr_code_token text,
    qr_closed_at timestamp with time zone,
    qr_closed_by uuid,
    qr_reopen_reason text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    supervisor_id uuid,
    access_password text,
    access_password_set_by uuid,
    access_password_set_at timestamp with time zone,
    target_interests text[] DEFAULT '{}'::text[]
);


--
-- Name: opportunity_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunity_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    opportunity_id uuid NOT NULL,
    volunteer_id uuid NOT NULL,
    status public.application_status DEFAULT 'pending'::public.application_status NOT NULL,
    registered_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_at timestamp with time zone,
    approved_by uuid,
    auto_approved boolean DEFAULT false,
    withdrawn_at timestamp with time zone,
    withdrawal_reason text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role public.user_role DEFAULT 'volunteer'::public.user_role NOT NULL,
    is_active boolean DEFAULT true,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: training_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT training_content_type_check CHECK ((type = ANY (ARRAY['text'::text, 'video'::text, 'quiz'::text])))
);


--
-- Name: training_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    is_required boolean DEFAULT false,
    order_index integer DEFAULT 0,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: training_quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_quiz_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid NOT NULL,
    question text NOT NULL,
    question_type text DEFAULT 'multiple_choice'::text NOT NULL,
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    correct_answer text NOT NULL,
    points integer DEFAULT 1,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: training_quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_quizzes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    passing_score integer DEFAULT 70 NOT NULL,
    time_limit_minutes integer,
    max_attempts integer DEFAULT 3,
    is_required boolean DEFAULT true,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: volunteer_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteer_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    first_name text NOT NULL,
    father_name text NOT NULL,
    grandfather_name text NOT NULL,
    family_name text NOT NULL,
    university_email text NOT NULL,
    phone_number text NOT NULL,
    university_id text NOT NULL,
    faculty_id uuid NOT NULL,
    major_id uuid NOT NULL,
    academic_year text NOT NULL,
    emergency_contact_name text NOT NULL,
    emergency_contact_phone text NOT NULL,
    skills text[] DEFAULT '{}'::text[],
    interests text[] DEFAULT '{}'::text[],
    previous_experience text,
    motivation text NOT NULL,
    availability jsonb DEFAULT '[]'::jsonb,
    status public.application_status DEFAULT 'pending'::public.application_status NOT NULL,
    rejection_reason text,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: volunteer_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteer_courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    volunteer_id uuid NOT NULL,
    semester_id uuid NOT NULL,
    course_code text NOT NULL,
    course_name text NOT NULL,
    day_of_week text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    location text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_time_range CHECK ((end_time > start_time)),
    CONSTRAINT volunteer_courses_day_of_week_check CHECK ((day_of_week = ANY (ARRAY['Sunday'::text, 'Monday'::text, 'Tuesday'::text, 'Wednesday'::text, 'Thursday'::text, 'Friday'::text, 'Saturday'::text])))
);


--
-- Name: volunteer_quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteer_quiz_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    volunteer_id uuid NOT NULL,
    quiz_id uuid NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    passed boolean DEFAULT false NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);


--
-- Name: volunteer_training_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteer_training_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    volunteer_id uuid NOT NULL,
    course_id uuid NOT NULL,
    content_id uuid,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: volunteers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    application_id uuid NOT NULL,
    total_hours numeric DEFAULT 0,
    opportunities_completed integer DEFAULT 0,
    rating numeric(3,2),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    schedule_submitted_at timestamp with time zone,
    schedule_submitted_for_semester uuid
);


--
-- Name: academic_semesters academic_semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_semesters
    ADD CONSTRAINT academic_semesters_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_opportunity_id_volunteer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_opportunity_id_volunteer_id_key UNIQUE (opportunity_id, volunteer_id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: badge_transactions badge_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_transactions
    ADD CONSTRAINT badge_transactions_pkey PRIMARY KEY (id);


--
-- Name: badge_transactions badge_transactions_volunteer_id_opportunity_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_transactions
    ADD CONSTRAINT badge_transactions_volunteer_id_opportunity_id_key UNIQUE (volunteer_id, opportunity_id);


--
-- Name: certificate_templates certificate_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT certificate_templates_pkey PRIMARY KEY (id);


--
-- Name: certificate_verifications certificate_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_verifications
    ADD CONSTRAINT certificate_verifications_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_certificate_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_number_key UNIQUE (certificate_number);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_volunteer_id_opportunity_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_volunteer_id_opportunity_id_key UNIQUE (volunteer_id, opportunity_id);


--
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- Name: evaluations evaluations_volunteer_id_opportunity_id_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_volunteer_id_opportunity_id_type_key UNIQUE (volunteer_id, opportunity_id, type);


--
-- Name: faculties faculties_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_name_key UNIQUE (name);


--
-- Name: faculties faculties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_pkey PRIMARY KEY (id);


--
-- Name: majors majors_faculty_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.majors
    ADD CONSTRAINT majors_faculty_id_name_key UNIQUE (faculty_id, name);


--
-- Name: majors majors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.majors
    ADD CONSTRAINT majors_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: opportunity_registrations opportunity_registrations_opportunity_id_volunteer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_registrations
    ADD CONSTRAINT opportunity_registrations_opportunity_id_volunteer_id_key UNIQUE (opportunity_id, volunteer_id);


--
-- Name: opportunity_registrations opportunity_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_registrations
    ADD CONSTRAINT opportunity_registrations_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: training_content training_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_content
    ADD CONSTRAINT training_content_pkey PRIMARY KEY (id);


--
-- Name: training_courses training_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_courses
    ADD CONSTRAINT training_courses_pkey PRIMARY KEY (id);


--
-- Name: training_quiz_questions training_quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_quiz_questions
    ADD CONSTRAINT training_quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: training_quizzes training_quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_quizzes
    ADD CONSTRAINT training_quizzes_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: volunteer_applications volunteer_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT volunteer_applications_pkey PRIMARY KEY (id);


--
-- Name: volunteer_applications volunteer_applications_university_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT volunteer_applications_university_email_key UNIQUE (university_email);


--
-- Name: volunteer_applications volunteer_applications_university_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT volunteer_applications_university_id_key UNIQUE (university_id);


--
-- Name: volunteer_applications volunteer_applications_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT volunteer_applications_user_id_key UNIQUE (user_id);


--
-- Name: volunteer_courses volunteer_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_courses
    ADD CONSTRAINT volunteer_courses_pkey PRIMARY KEY (id);


--
-- Name: volunteer_quiz_attempts volunteer_quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_quiz_attempts
    ADD CONSTRAINT volunteer_quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: volunteer_training_progress volunteer_training_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_training_progress
    ADD CONSTRAINT volunteer_training_progress_pkey PRIMARY KEY (id);


--
-- Name: volunteer_training_progress volunteer_training_progress_volunteer_id_course_id_content__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_training_progress
    ADD CONSTRAINT volunteer_training_progress_volunteer_id_course_id_content__key UNIQUE (volunteer_id, course_id, content_id);


--
-- Name: volunteers volunteers_application_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_application_id_key UNIQUE (application_id);


--
-- Name: volunteers volunteers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_pkey PRIMARY KEY (id);


--
-- Name: volunteers volunteers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_user_id_key UNIQUE (user_id);


--
-- Name: idx_academic_semesters_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_semesters_active ON public.academic_semesters USING btree (is_active);


--
-- Name: idx_badge_transactions_opportunity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_badge_transactions_opportunity ON public.badge_transactions USING btree (opportunity_id);


--
-- Name: idx_badge_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_badge_transactions_status ON public.badge_transactions USING btree (status);


--
-- Name: idx_badge_transactions_volunteer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_badge_transactions_volunteer ON public.badge_transactions USING btree (volunteer_id);


--
-- Name: idx_certificate_verifications_certificate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificate_verifications_certificate_id ON public.certificate_verifications USING btree (certificate_id);


--
-- Name: idx_certificate_verifications_verified_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificate_verifications_verified_at ON public.certificate_verifications USING btree (verified_at DESC);


--
-- Name: idx_opportunities_supervisor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_supervisor ON public.opportunities USING btree (supervisor_id);


--
-- Name: idx_volunteer_courses_day_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volunteer_courses_day_time ON public.volunteer_courses USING btree (day_of_week, start_time, end_time);


--
-- Name: idx_volunteer_courses_semester_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volunteer_courses_semester_id ON public.volunteer_courses USING btree (semester_id);


--
-- Name: idx_volunteer_courses_volunteer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volunteer_courses_volunteer_id ON public.volunteer_courses USING btree (volunteer_id);


--
-- Name: idx_volunteers_schedule_semester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volunteers_schedule_semester ON public.volunteers USING btree (schedule_submitted_for_semester);


--
-- Name: academic_semesters update_academic_semesters_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_academic_semesters_updated_at BEFORE UPDATE ON public.academic_semesters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: volunteer_applications update_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.volunteer_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: badge_transactions update_badge_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_badge_transactions_updated_at BEFORE UPDATE ON public.badge_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: opportunities update_opportunities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: training_quizzes update_training_quizzes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_training_quizzes_updated_at BEFORE UPDATE ON public.training_quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: volunteer_courses update_volunteer_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_volunteer_courses_updated_at BEFORE UPDATE ON public.volunteer_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: volunteers update_volunteers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON public.volunteers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: academic_semesters academic_semesters_schedule_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_semesters
    ADD CONSTRAINT academic_semesters_schedule_closed_by_fkey FOREIGN KEY (schedule_closed_by) REFERENCES auth.users(id);


--
-- Name: attendance attendance_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id);


--
-- Name: attendance attendance_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.opportunity_registrations(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;


--
-- Name: badge_transactions badge_transactions_checkout_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_transactions
    ADD CONSTRAINT badge_transactions_checkout_confirmed_by_fkey FOREIGN KEY (checkout_confirmed_by) REFERENCES auth.users(id);


--
-- Name: badge_transactions badge_transactions_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_transactions
    ADD CONSTRAINT badge_transactions_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id);


--
-- Name: badge_transactions badge_transactions_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_transactions
    ADD CONSTRAINT badge_transactions_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.opportunity_registrations(id);


--
-- Name: badge_transactions badge_transactions_return_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_transactions
    ADD CONSTRAINT badge_transactions_return_confirmed_by_fkey FOREIGN KEY (return_confirmed_by) REFERENCES auth.users(id);


--
-- Name: badge_transactions badge_transactions_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_transactions
    ADD CONSTRAINT badge_transactions_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id);


--
-- Name: certificate_templates certificate_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT certificate_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: certificate_verifications certificate_verifications_certificate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_verifications
    ADD CONSTRAINT certificate_verifications_certificate_id_fkey FOREIGN KEY (certificate_id) REFERENCES public.certificates(id) ON DELETE CASCADE;


--
-- Name: certificates certificates_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id);


--
-- Name: certificates certificates_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id);


--
-- Name: certificates certificates_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;


--
-- Name: evaluations evaluations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: evaluations evaluations_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: evaluations evaluations_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;


--
-- Name: majors majors_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.majors
    ADD CONSTRAINT majors_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: opportunities opportunities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: opportunities opportunities_faculty_restriction_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_faculty_restriction_fkey FOREIGN KEY (faculty_restriction) REFERENCES public.faculties(id);


--
-- Name: opportunities opportunities_qr_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_qr_closed_by_fkey FOREIGN KEY (qr_closed_by) REFERENCES auth.users(id);


--
-- Name: opportunities opportunities_supervisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES auth.users(id);


--
-- Name: opportunity_registrations opportunity_registrations_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_registrations
    ADD CONSTRAINT opportunity_registrations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: opportunity_registrations opportunity_registrations_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_registrations
    ADD CONSTRAINT opportunity_registrations_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: opportunity_registrations opportunity_registrations_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_registrations
    ADD CONSTRAINT opportunity_registrations_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: training_content training_content_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_content
    ADD CONSTRAINT training_content_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE CASCADE;


--
-- Name: training_courses training_courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_courses
    ADD CONSTRAINT training_courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: training_quiz_questions training_quiz_questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_quiz_questions
    ADD CONSTRAINT training_quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.training_quizzes(id) ON DELETE CASCADE;


--
-- Name: training_quizzes training_quizzes_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_quizzes
    ADD CONSTRAINT training_quizzes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: volunteer_applications volunteer_applications_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT volunteer_applications_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id);


--
-- Name: volunteer_applications volunteer_applications_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT volunteer_applications_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.majors(id);


--
-- Name: volunteer_applications volunteer_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT volunteer_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: volunteer_applications volunteer_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT volunteer_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: volunteer_courses volunteer_courses_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_courses
    ADD CONSTRAINT volunteer_courses_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id) ON DELETE CASCADE;


--
-- Name: volunteer_courses volunteer_courses_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_courses
    ADD CONSTRAINT volunteer_courses_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;


--
-- Name: volunteer_quiz_attempts volunteer_quiz_attempts_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_quiz_attempts
    ADD CONSTRAINT volunteer_quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.training_quizzes(id) ON DELETE CASCADE;


--
-- Name: volunteer_quiz_attempts volunteer_quiz_attempts_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_quiz_attempts
    ADD CONSTRAINT volunteer_quiz_attempts_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;


--
-- Name: volunteer_training_progress volunteer_training_progress_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_training_progress
    ADD CONSTRAINT volunteer_training_progress_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.training_content(id) ON DELETE CASCADE;


--
-- Name: volunteer_training_progress volunteer_training_progress_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_training_progress
    ADD CONSTRAINT volunteer_training_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE CASCADE;


--
-- Name: volunteer_training_progress volunteer_training_progress_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_training_progress
    ADD CONSTRAINT volunteer_training_progress_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;


--
-- Name: volunteers volunteers_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.volunteer_applications(id);


--
-- Name: volunteers volunteers_schedule_submitted_for_semester_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_schedule_submitted_for_semester_fkey FOREIGN KEY (schedule_submitted_for_semester) REFERENCES public.academic_semesters(id);


--
-- Name: volunteers volunteers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications Admins can create notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: evaluations Admins can create supervisor ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create supervisor ratings" ON public.evaluations FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.user_role) AND (type = 'supervisor_rating'::text)));


--
-- Name: certificates Admins can delete certificates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete certificates" ON public.certificates FOR DELETE USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: evaluations Admins can delete evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete evaluations" ON public.evaluations FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: certificate_templates Admins can delete templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete templates" ON public.certificate_templates FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: badge_transactions Admins can manage badge transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage badge transactions" ON public.badge_transactions USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: certificates Admins can manage certificates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage certificates" ON public.certificates TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: training_content Admins can manage content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage content" ON public.training_content TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: training_courses Admins can manage courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage courses" ON public.training_courses TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: faculties Admins can manage faculties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage faculties" ON public.faculties TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: majors Admins can manage majors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage majors" ON public.majors TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: opportunities Admins can manage opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage opportunities" ON public.opportunities TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: training_quiz_questions Admins can manage quiz questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage quiz questions" ON public.training_quiz_questions USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: training_quizzes Admins can manage quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage quizzes" ON public.training_quizzes USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: opportunity_registrations Admins can manage registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage registrations" ON public.opportunity_registrations FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: academic_semesters Admins can manage semesters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage semesters" ON public.academic_semesters USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: certificate_templates Admins can manage templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage templates" ON public.certificate_templates TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: volunteers Admins can manage volunteers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage volunteers" ON public.volunteers TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: volunteer_applications Admins can update applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update applications" ON public.volunteer_applications FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: evaluations Admins can update evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update evaluations" ON public.evaluations FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: certificate_templates Admins can update templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update templates" ON public.certificate_templates FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: volunteer_applications Admins can view all applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all applications" ON public.volunteer_applications FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: volunteer_quiz_attempts Admins can view all attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all attempts" ON public.volunteer_quiz_attempts FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: attendance Admins can view all attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all attendance" ON public.attendance FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: volunteer_courses Admins can view all courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all courses" ON public.volunteer_courses FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: evaluations Admins can view all evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all evaluations" ON public.evaluations FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: opportunity_registrations Admins can view all registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all registrations" ON public.opportunity_registrations FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: user_roles Admins can view all user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR (auth.uid() = user_id)));


--
-- Name: volunteers Admins can view all volunteers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all volunteers" ON public.volunteers FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: certificate_verifications Admins can view verification logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view verification logs" ON public.certificate_verifications FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.user_role)))));


--
-- Name: certificate_verifications Anyone can log verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can log verifications" ON public.certificate_verifications FOR INSERT WITH CHECK (true);


--
-- Name: academic_semesters Anyone can view active semesters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active semesters" ON public.academic_semesters FOR SELECT USING (true);


--
-- Name: training_content Anyone can view content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view content" ON public.training_content FOR SELECT TO authenticated USING (true);


--
-- Name: training_courses Anyone can view courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view courses" ON public.training_courses FOR SELECT TO authenticated USING (true);


--
-- Name: faculties Anyone can view faculties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view faculties" ON public.faculties FOR SELECT USING (true);


--
-- Name: majors Anyone can view majors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view majors" ON public.majors FOR SELECT USING (true);


--
-- Name: opportunities Anyone can view published opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published opportunities" ON public.opportunities FOR SELECT TO authenticated USING (((status = 'published'::public.opportunity_status) OR public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'supervisor'::public.user_role)));


--
-- Name: training_quiz_questions Anyone can view quiz questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view quiz questions" ON public.training_quiz_questions FOR SELECT USING (true);


--
-- Name: training_quizzes Anyone can view quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view quizzes" ON public.training_quizzes FOR SELECT USING (true);


--
-- Name: certificate_templates Anyone can view templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view templates" ON public.certificate_templates FOR SELECT TO authenticated USING (true);


--
-- Name: attendance Attendance can be recorded; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Attendance can be recorded" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: attendance Supervisors can manage attendance for assigned opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Supervisors can manage attendance for assigned opportunities" ON public.attendance TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.opportunities o
  WHERE ((o.id = attendance.opportunity_id) AND ((o.supervisor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.user_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.opportunities o
  WHERE ((o.id = attendance.opportunity_id) AND ((o.supervisor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.user_role))))));


--
-- Name: opportunities Supervisors can view assigned opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Supervisors can view assigned opportunities" ON public.opportunities FOR SELECT TO authenticated USING (((supervisor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.user_role)));


--
-- Name: opportunity_registrations Supervisors can view registrations for assigned opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Supervisors can view registrations for assigned opportunities" ON public.opportunity_registrations FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.opportunities o
  WHERE ((o.id = opportunity_registrations.opportunity_id) AND ((o.supervisor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.user_role))))));


--
-- Name: volunteer_applications Users can insert own application; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own application" ON public.volunteer_applications FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: volunteer_applications Users can view own application; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own application" ON public.volunteer_applications FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: volunteers Users can view own volunteer record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own volunteer record" ON public.volunteers FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: badge_transactions Volunteers can confirm own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can confirm own transactions" ON public.badge_transactions FOR UPDATE USING ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: volunteer_courses Volunteers can manage own courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can manage own courses" ON public.volunteer_courses USING ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: volunteer_training_progress Volunteers can record progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can record progress" ON public.volunteer_training_progress FOR INSERT TO authenticated WITH CHECK ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: opportunity_registrations Volunteers can register; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can register" ON public.opportunity_registrations FOR INSERT TO authenticated WITH CHECK ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: evaluations Volunteers can submit feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can submit feedback" ON public.evaluations FOR INSERT TO authenticated WITH CHECK (((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))) AND (type = 'volunteer_feedback'::text)));


--
-- Name: volunteer_quiz_attempts Volunteers can submit quiz attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can submit quiz attempts" ON public.volunteer_quiz_attempts FOR INSERT WITH CHECK ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: volunteer_quiz_attempts Volunteers can view own attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can view own attempts" ON public.volunteer_quiz_attempts FOR SELECT USING ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: attendance Volunteers can view own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can view own attendance" ON public.attendance FOR SELECT TO authenticated USING ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: badge_transactions Volunteers can view own badge transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can view own badge transactions" ON public.badge_transactions FOR SELECT USING ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: certificates Volunteers can view own certificates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can view own certificates" ON public.certificates FOR SELECT TO authenticated USING ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: volunteer_courses Volunteers can view own courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can view own courses" ON public.volunteer_courses FOR SELECT USING ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: evaluations Volunteers can view own feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can view own feedback" ON public.evaluations FOR SELECT USING ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: volunteer_training_progress Volunteers can view own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can view own progress" ON public.volunteer_training_progress FOR SELECT TO authenticated USING ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: opportunity_registrations Volunteers can view own registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can view own registrations" ON public.opportunity_registrations FOR SELECT TO authenticated USING ((volunteer_id IN ( SELECT volunteers.id
   FROM public.volunteers
  WHERE (volunteers.user_id = auth.uid()))));


--
-- Name: academic_semesters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.academic_semesters ENABLE ROW LEVEL SECURITY;

--
-- Name: attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: badge_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.badge_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: certificate_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: certificate_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.certificate_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: certificates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

--
-- Name: evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: faculties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;

--
-- Name: majors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunity_registrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunity_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: training_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.training_content ENABLE ROW LEVEL SECURITY;

--
-- Name: training_courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

--
-- Name: training_quiz_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.training_quiz_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: training_quizzes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.training_quizzes ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: volunteer_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: volunteer_courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.volunteer_courses ENABLE ROW LEVEL SECURITY;

--
-- Name: volunteer_quiz_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.volunteer_quiz_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: volunteer_training_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.volunteer_training_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: volunteers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;