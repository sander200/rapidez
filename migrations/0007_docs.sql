alter table profiles add column if not exists circulation_photo text;

delete from messages where from_user like 'npc_%' or from_user like 'pax_%';
delete from trips where passenger_id like 'pax_%' or driver_id like 'npc_%';
delete from positions where user_id like 'npc_%' or user_id like 'pax_%';
delete from devices where user_id like 'npc_%' or user_id like 'pax_%';
delete from profiles where user_id like 'npc_%' or user_id like 'pax_%';
