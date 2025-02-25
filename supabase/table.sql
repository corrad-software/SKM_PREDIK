-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS public.organization_relationships CASCADE;
DROP TABLE IF EXISTS public.financial_entries CASCADE;
DROP TABLE IF EXISTS public.statement_group_items CASCADE;
DROP TABLE IF EXISTS public.financial_statements CASCADE;
DROP TABLE IF EXISTS public.reference_files CASCADE;
DROP TABLE IF EXISTS public.statement_groups CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.ledger_generation_jobs CASCADE;

-- Create tables in order of dependencies

-- 1. Base table for organizations
create table
  public.organizations (
    id uuid not null default gen_random_uuid (),
    name text not null,
    description text null,
    bank_account text null,
    created_by uuid null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
    status text null default 'active'::text,
    organization_type text not null default 'parent'::text,
    constraint organizations_pkey primary key (id),
    constraint organizations_created_by_fkey foreign key (created_by) references auth.users (id),
    constraint organizations_type_check check (
      (
        organization_type = any (
          array['parent'::text, 'child'::text]
        )
      )
    )
  ) tablespace pg_default;

-- 2. Organization relationships
create table
  public.organization_relationships (
    id uuid not null default gen_random_uuid (),
    parent_id uuid not null,
    child_id uuid not null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
    constraint organization_relationships_pkey primary key (id),
    constraint organization_relationships_parent_fkey foreign key (parent_id) references organizations (id) on delete cascade,
    constraint organization_relationships_child_fkey foreign key (child_id) references organizations (id) on delete cascade,
    constraint organization_relationships_unique unique (parent_id, child_id)
  ) tablespace pg_default;

-- 3. Reference files table (needs to be before financial_statements)
create table
  public.reference_files (
    id uuid not null default gen_random_uuid (),
    statement_id uuid null,
    file_name text not null,
    file_path text not null,
    file_url text null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
    constraint reference_files_pkey primary key (id)
  ) tablespace pg_default;

-- 4. Financial statements
create table
  public.financial_statements (
    id uuid not null default gen_random_uuid (),
    organization_id uuid null,
    state text null,
    year_current integer null,
    year_previous integer null,
    audited_by text null,
    reviewed_by text null,
    file_name text not null,
    file_path text not null,
    statement_type text not null,
    uploaded_at timestamp with time zone null default now(),
    created_by uuid null,
    status text null default 'active'::text,
    updated_at timestamp with time zone null,
    analysis_result jsonb null,
    reference_file_id uuid null,
    constraint financial_statements_pkey primary key (id),
    constraint financial_statements_created_by_fkey foreign key (created_by) references auth.users (id),
    constraint financial_statements_reference_file_id_fkey foreign key (reference_file_id) references reference_files (id) on delete set null,
    constraint financial_statements_organization_id_fkey foreign key (organization_id) references organizations (id) on delete cascade,
    constraint financial_statements_statement_type_check check (
      (
        statement_type = any (
          array[
            'kunci_kira_kira'::text,
            'imbangan_duga'::text,
            'ledger'::text,
            'bank_reconciliation'::text
          ]
        )
      )
    )
  ) tablespace pg_default;

-- 5. Add the statement_id foreign key to reference_files after financial_statements exists
ALTER TABLE public.reference_files
ADD CONSTRAINT reference_files_statement_id_fkey 
FOREIGN KEY (statement_id) REFERENCES financial_statements (id) ON DELETE CASCADE;

-- 6. Financial entries
create table public.financial_entries (
    id uuid not null default gen_random_uuid (),
    statement_id uuid null,
    section text not null,
    label text not null,
    amount_current numeric(15, 2) null,
    amount_previous numeric(15, 2) null,
    year_current integer not null,
    year_previous integer not null,
    is_total boolean null default false,
    parent_section text null,
    sort_order integer null,
    created_at timestamp with time zone null default now(),
    constraint financial_entries_pkey primary key (id),
    constraint financial_entries_statement_id_fkey foreign key (statement_id) references financial_statements (id) on delete cascade
) tablespace pg_default;

-- 7. Statement groups
create table
  public.statement_groups (
    id uuid not null default gen_random_uuid (),
    name text not null,
    description text null,
    user_id uuid null,
    organization_id uuid not null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
    constraint statement_groups_pkey primary key (id),
    constraint statement_groups_organization_id_fkey foreign key (organization_id) references organizations (id) on delete cascade
  ) tablespace pg_default;

-- 8. Statement group items
create table
  public.statement_group_items (
    id uuid not null default gen_random_uuid (),
    group_id uuid not null,
    statement_id uuid not null,
    statement_type text not null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    constraint statement_group_items_pkey primary key (id),
    constraint statement_group_items_group_type_unique unique (group_id, statement_type),
    constraint statement_group_items_group_id_fkey foreign key (group_id) references statement_groups (id) on delete cascade,
    constraint statement_group_items_statement_id_fkey foreign key (statement_id) references financial_statements (id) on delete cascade,
    constraint statement_group_items_statement_type_check check (
      (
        statement_type = any (
          array[
            'kunci_kira_kira'::text,
            'imbangan_duga'::text,
            'ledger'::text,
            'bank_reconciliation'::text
          ]
        )
      )
    )
  ) tablespace pg_default;

-- Create ledger_generation_jobs table
create table
  public.ledger_generation_jobs (
    id uuid not null default gen_random_uuid (),
    group_id uuid not null,
    status text not null default 'pending',
    result jsonb null,
    error text null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
    constraint ledger_generation_jobs_pkey primary key (id),
    constraint ledger_generation_jobs_group_id_fkey foreign key (group_id) references statement_groups (id) on delete cascade,
    constraint ledger_generation_jobs_status_check check (
      status = any (array['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])
    )
  ) tablespace pg_default;

-- Create indexes for better query performance
create index if not exists idx_organizations_created_by on public.organizations using btree (created_by) tablespace pg_default;
create index if not exists idx_organization_relationships_parent_id on public.organization_relationships using btree (parent_id) tablespace pg_default;
create index if not exists idx_organization_relationships_child_id on public.organization_relationships using btree (child_id) tablespace pg_default;
create index if not exists idx_statement_groups_user_id on public.statement_groups using btree (user_id) tablespace pg_default;
create index if not exists idx_statement_groups_organization_id on public.statement_groups using btree (organization_id) tablespace pg_default;
create index if not exists idx_statement_group_items_group_id on public.statement_group_items using btree (group_id) tablespace pg_default;
create index if not exists idx_statement_group_items_statement_id on public.statement_group_items using btree (statement_id) tablespace pg_default;
create index if not exists idx_ledger_generation_jobs_group_id on public.ledger_generation_jobs using btree (group_id) tablespace pg_default;
create index if not exists idx_ledger_generation_jobs_status on public.ledger_generation_jobs using btree (status) tablespace pg_default;