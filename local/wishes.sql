--
-- PostgreSQL database dump
--

\restrict heSHdZd1M3HwDvkXgEmz5aNjfyobk0oeFi2hREONLo7yI6MyW6Zf4AGuDv1pE05

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 18.4

-- Started on 2026-08-27 16:21:56

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 34609)
-- Name: wishes; Type: TABLE; Schema: public; Owner: app-133
--

CREATE TABLE public.wishes (
    id integer NOT NULL,
    family_id integer NOT NULL,
    title character varying(255) NOT NULL,
    star_cost integer,
    is_persistent boolean DEFAULT false NOT NULL,
    created_by integer NOT NULL,
    fulfilled_at timestamp without time zone,
    fulfilled_for_child_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wishes OWNER TO "app-133";

--
-- TOC entry 229 (class 1259 OID 34608)
-- Name: wishes_id_seq; Type: SEQUENCE; Schema: public; Owner: app-133
--

CREATE SEQUENCE public.wishes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wishes_id_seq OWNER TO "app-133";

--
-- TOC entry 3436 (class 0 OID 0)
-- Dependencies: 229
-- Name: wishes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: app-133
--

ALTER SEQUENCE public.wishes_id_seq OWNED BY public.wishes.id;


--
-- TOC entry 3278 (class 2604 OID 34612)
-- Name: wishes id; Type: DEFAULT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.wishes ALTER COLUMN id SET DEFAULT nextval('public.wishes_id_seq'::regclass);


--
-- TOC entry 3430 (class 0 OID 34609)
-- Dependencies: 230
-- Data for Name: wishes; Type: TABLE DATA; Schema: public; Owner: app-133
--

COPY public.wishes (id, family_id, title, star_cost, is_persistent, created_by, fulfilled_at, fulfilled_for_child_id, created_at) FROM stdin;
9	1	Nový plyšák	50	f	2	\N	\N	2026-06-02 18:39:35.639347
\.


--
-- TOC entry 3437 (class 0 OID 0)
-- Dependencies: 229
-- Name: wishes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: app-133
--

SELECT pg_catalog.setval('public.wishes_id_seq', 11, true);


--
-- TOC entry 3282 (class 2606 OID 34616)
-- Name: wishes wishes_pkey; Type: CONSTRAINT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.wishes
    ADD CONSTRAINT wishes_pkey PRIMARY KEY (id);


--
-- TOC entry 3283 (class 2606 OID 34667)
-- Name: wishes wishes_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.wishes
    ADD CONSTRAINT wishes_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3284 (class 2606 OID 34662)
-- Name: wishes wishes_family_id_families_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.wishes
    ADD CONSTRAINT wishes_family_id_families_id_fk FOREIGN KEY (family_id) REFERENCES public.families(id);


--
-- TOC entry 3285 (class 2606 OID 34672)
-- Name: wishes wishes_fulfilled_for_child_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.wishes
    ADD CONSTRAINT wishes_fulfilled_for_child_id_users_id_fk FOREIGN KEY (fulfilled_for_child_id) REFERENCES public.users(id);


-- Completed on 2026-08-27 16:21:56

--
-- PostgreSQL database dump complete
--

\unrestrict heSHdZd1M3HwDvkXgEmz5aNjfyobk0oeFi2hREONLo7yI6MyW6Zf4AGuDv1pE05

