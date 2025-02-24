create table
  public.financial_statements (
    id uuid not null default gen_random_uuid (),
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
create table public.financial_entries (
    id uuid not null default gen_random_uuid (),
    statement_id uuid null,
    section text not null,
    label text not null,
    amount numeric(15, 2) null,
    is_total boolean null default false,
    parent_section text null,
    sort_order integer null,
    created_at timestamp with time zone null default now(),
    constraint financial_entries_pkey primary key (id),
    constraint financial_entries_statement_id_fkey foreign key (statement_id) references financial_statements (id) on delete cascade
) tablespace pg_default;
create table
  public.reference_files (
    id uuid not null default gen_random_uuid (),
    statement_id uuid null,
    file_name text not null,
    file_path text not null,
    file_url text null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
    constraint reference_files_pkey primary key (id),
    constraint reference_files_statement_id_fkey foreign key (statement_id) references financial_statements (id) on delete cascade
  ) tablespace pg_default;
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

create index if not exists idx_statement_group_items_group_id on public.statement_group_items using btree (group_id) tablespace pg_default;

create index if not exists idx_statement_group_items_statement_id on public.statement_group_items using btree (statement_id) tablespace pg_default;

create table
  public.statement_groups (
    id uuid not null default gen_random_uuid (),
    name text not null,
    description text null,
    user_id uuid null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
    constraint statement_groups_pkey primary key (id)
  ) tablespace pg_default;

create index if not exists idx_statement_groups_user_id on public.statement_groups using btree (user_id) tablespace pg_default;