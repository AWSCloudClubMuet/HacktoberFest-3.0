create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  major text not null,
  semester int not null check (semester between 1 and 12),
  bio text,
  skills text[] not null default '{}',
  email text,
  password_hash text
);

create unique index if not exists users_email_unique_idx on users (lower(email));

create table if not exists gigs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 10 and 2000),
  type text not null check (type in ('Offering', 'Requesting')),
  category text not null check (category in ('Programming', 'Design', 'Writing', 'Tutoring')),
  payment_type text not null check (payment_type in ('Paid', 'SkillSwap', 'Free')),
  budget numeric,
  deadline date not null,
  status text not null default 'Open'
    check (status in ('Open', 'In Progress', 'Completed', 'Expired', 'Cancelled')),
  accepted_applicant_id uuid,
  created_at timestamptz not null default now(),
  constraint gigs_user_id_fkey foreign key (user_id) references users(id) on delete cascade,
  constraint gigs_accepted_applicant_id_fkey foreign key (accepted_applicant_id) references users(id),
  constraint gigs_payment_budget_check check (
    (payment_type = 'Paid' and budget is not null and budget > 0) or
    (payment_type <> 'Paid' and budget is null)
  )
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null,
  applicant_id uuid not null,
  message text not null check (char_length(message) between 5 and 500),
  status text not null default 'Pending'
    check (status in ('Pending', 'Accepted', 'Rejected')),
  created_at timestamptz not null default now(),
  constraint applications_gig_id_fkey foreign key (gig_id) references gigs(id) on delete cascade,
  constraint applications_applicant_id_fkey foreign key (applicant_id) references users(id) on delete cascade,
  constraint applications_gig_applicant_unique unique (gig_id, applicant_id)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null,
  reviewer_id uuid not null,
  reviewee_id uuid not null,
  rating int not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  constraint reviews_gig_id_fkey foreign key (gig_id) references gigs(id) on delete cascade,
  constraint reviews_reviewer_id_fkey foreign key (reviewer_id) references users(id),
  constraint reviews_reviewee_id_fkey foreign key (reviewee_id) references users(id),
  constraint reviews_gig_reviewer_unique unique (gig_id, reviewer_id),
  constraint reviews_different_users_check check (reviewer_id <> reviewee_id)
);

create index if not exists gigs_category_idx on gigs(category);
create index if not exists gigs_status_idx on gigs(status);
create index if not exists gigs_user_id_idx on gigs(user_id);
create index if not exists gigs_created_at_idx on gigs(created_at desc);
create index if not exists applications_gig_id_idx on applications(gig_id);
create index if not exists applications_applicant_id_idx on applications(applicant_id);
create index if not exists reviews_reviewee_id_idx on reviews(reviewee_id);
create index if not exists reviews_gig_id_idx on reviews(gig_id);

create or replace function accept_applicant(
  p_application_id uuid,
  p_owner_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_application applications%rowtype;
  v_gig gigs%rowtype;
  v_rejected_ids uuid[];
begin
  select * into v_application
  from applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'APPLICATION_NOT_FOUND';
  end if;

  select * into v_gig
  from gigs
  where id = v_application.gig_id
  for update;

  if v_gig.user_id <> p_owner_id then
    raise exception 'NOT_GIG_OWNER';
  end if;

  if v_gig.status <> 'Open' or v_gig.deadline < current_date then
    raise exception 'GIG_NOT_OPEN';
  end if;

  select * into v_application
  from applications
  where id = p_application_id;

  if v_application.status <> 'Pending' then
    raise exception 'APPLICATION_NOT_PENDING';
  end if;

  update applications
  set status = 'Accepted'
  where id = v_application.id;

  with rejected as (
    update applications
    set status = 'Rejected'
    where gig_id = v_gig.id
      and id <> v_application.id
      and status = 'Pending'
    returning id
  )
  select coalesce(array_agg(id), '{}') into v_rejected_ids from rejected;

  update gigs
  set status = 'In Progress',
      accepted_applicant_id = v_application.applicant_id
  where id = v_gig.id
  returning * into v_gig;

  return jsonb_build_object(
    'application', jsonb_build_object(
      'id', v_application.id,
      'gig_id', v_application.gig_id,
      'applicant_id', v_application.applicant_id,
      'status', 'Accepted'
    ),
    'gig', jsonb_build_object(
      'id', v_gig.id,
      'status', v_gig.status,
      'accepted_applicant_id', v_gig.accepted_applicant_id
    ),
    'rejected_application_ids', to_jsonb(v_rejected_ids)
  );
end;
$$;

alter table users enable row level security;
alter table gigs enable row level security;
alter table applications enable row level security;
alter table reviews enable row level security;

revoke all on function accept_applicant(uuid, uuid) from public;
revoke all on function accept_applicant(uuid, uuid) from anon;
revoke all on function accept_applicant(uuid, uuid) from authenticated;
grant execute on function accept_applicant(uuid, uuid) to service_role;
