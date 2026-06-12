do $$
declare
  generation_ids uuid[];
  class_ids uuid[];
begin
  select array_agg(id order by year, created_at)
  into generation_ids
  from public.generations;

  while coalesce(array_length(generation_ids, 1), 0) < 3 loop
    insert into public.generations (name, year)
    values ('Pending Generation', 0);

    select array_agg(id order by year, created_at)
    into generation_ids
    from public.generations;
  end loop;

  update public.generations set name = 'Generation 2026', year = 2026 where id = generation_ids[1];
  update public.generations set name = 'Generation 2027', year = 2027 where id = generation_ids[2];
  update public.generations set name = 'Generation 2028', year = 2028 where id = generation_ids[3];

  delete from public.generations
  where id <> all(generation_ids[1:3]);

  select array_agg(id order by created_at, name)
  into class_ids
  from public.classes;

  while coalesce(array_length(class_ids, 1), 0) < 7 loop
    insert into public.classes (name, generation_id)
    values ('Pending Class', generation_ids[1]);

    select array_agg(id order by created_at, name)
    into class_ids
    from public.classes;
  end loop;

  update public.classes set name = 'Web 26 A', generation_id = generation_ids[1] where id = class_ids[1];
  update public.classes set name = 'Web 26 B', generation_id = generation_ids[1] where id = class_ids[2];
  update public.classes set name = 'Web 26 C', generation_id = generation_ids[1] where id = class_ids[3];
  update public.classes set name = 'Web 27 A', generation_id = generation_ids[2] where id = class_ids[4];
  update public.classes set name = 'Web 27 B', generation_id = generation_ids[2] where id = class_ids[5];
  update public.classes set name = 'Web 27 C', generation_id = generation_ids[2] where id = class_ids[6];
  update public.classes set name = 'SNAC', generation_id = generation_ids[3] where id = class_ids[7];

  delete from public.classes
  where id <> all(class_ids[1:7]);
end $$;
