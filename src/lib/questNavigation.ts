import { NPCS_LIVE, CLASSES, RACE_CLASSES, type ClassId, type Education, type HeroData, type NpcId } from './game';
import { MAIN_ORDER, mainRequirement, pendingDelivery } from './journey';
import { cityForRace, cityPortal, goddardExit, GODDARD_BOOLE, isRacialCity, RACIAL_CITIES, trainerPosition, type RacialCity } from './kingdomCities';
import { CAMPAIGN_BOSSES, MONSTERS, REGIONS, campaignGate, monsterRequirement, nextRegion, regionRequirement } from './campaign';
import { GATHER_NODES, type QuestObjective } from './quests';
import { INSTANCES, instanceRequirement, type InstanceId } from './instances';
import { overlandRoads, roadItinerary, roadTo } from './overland';
import { findPath } from './navigation';

export type GuideTarget = { npc: NpcId } | { trainer: ClassId }
  | { objective: Exclude<QuestObjective, { type: 'talk' }> | 'trial' }
  | { road: RacialCity; from: HeroData['region'] } | { monster: string } | { instance: InstanceId } | { region: HeroData['region']; via?: 'portal' };
export type GuideWorld = { education: Education; slain?: Record<string, number>; gathered?: Record<string, number>; now?: number };
export type GuideRequest = { target: GuideTarget; heroId: string };
export type MapPin = { target: GuideTarget; name: string; point: [number, number] };
type GuideStop = MapPin & { overland?: boolean; portal?: RacialCity | 'goddard'; campaign?: HeroData['region']; leaveInstance?: boolean; gather?: string; monster?: string; enterInstance?: InstanceId };

export function regionPins(region: HeroData['region']): MapPin[] {
  const npcs: MapPin[] = region === 'aurora' ? NPCS_LIVE.map(({ id, name, x, z }) => ({ target: { npc: id }, name, point: [x, z] })) : [];
  if (region === 'goddard') return [{ target: { npc: 'eldrin' }, name: 'Boole', point: [...GODDARD_BOOLE] }];
  if (!isRacialCity(region)) return [];
  const trainers: MapPin[] = RACE_CLASSES[RACIAL_CITIES[region].race].map((id, index) => ({
    target: { trainer: id },
    name: `${index % 2 ? 'Mestra' : 'Mestre'} de ${CLASSES[id].name}`,
    point: [...trainerPosition(region, index)!],
  }));
  return [...npcs, ...trainers];
}

export function guideStop(hero: HeroData, target: GuideTarget, world?: GuideWorld): GuideStop | undefined {
  if (hero.dead) return;
  const region = hero.region, time = world?.now ?? 0;
  const nearest = <T extends { x: number; z: number }>(candidates: T[]) => candidates.sort((a,b) =>
    Math.hypot(hero.position[0]-a.x,hero.position[1]-a.z)-Math.hypot(hero.position[0]-b.x,hero.position[1]-b.z))[0];
  let destination: HeroData['region'] = 'aurora';

  if ('npc' in target || 'trainer' in target) {
    const matches = (pin: MapPin) => 'npc' in target
      ? 'npc' in pin.target && target.npc === pin.target.npc
      : 'trainer' in pin.target && target.trainer === pin.target.trainer;
    destination = 'trainer' in target ? cityForRace(hero.race) : 'aurora';
    if (!hero.instance && ('npc' in target || region === destination)) {
      const local = regionPins(region).find(matches);
      if (local) return local;
    }
    if (!regionPins(destination).some(matches)) return;
  } else if ('road' in target) {
    const road=roadTo(region,target.road);
    if (!road || hero.instance || target.from!==region) return;
    return {target,name:`Estrada · ${REGIONS[road.to].name}`,point:road.end,overland:true};
  } else if ('region' in target) {
    destination = target.region;
  } else if ('instance' in target) {
    if (hero.instance === target.instance) return;
    const place = INSTANCES[target.instance];
    destination = place.region;
    if (!hero.instance && region === destination && world && !instanceRequirement(hero, world.education.completed, target.instance)) {
      return { target, name: place.name, point: [place.x,place.z], enterInstance: target.instance };
    }
  } else if ('objective' in target && target.objective !== 'trial' && target.objective.type === 'collect') {
    const { node } = target.objective;
    if (!hero.instance && region === 'aurora') {
      if (node === 'crystal' && !world?.education.completed.includes('variables')) return;
      const found = nearest(GATHER_NODES.filter(n=>n.node===node && (world?.gathered?.[n.id]??0)<=time));
      if (found) return { target, name: node==='herb'?'Erva brilhante':'Cristal de runa', point: [found.x,found.z], gather: found.id };
    }
  } else {
    const fixed = 'monster' in target ? MONSTERS.find(m=>m.id===target.monster) : undefined;
    const objective = 'objective' in target ? target.objective : undefined;
    destination = fixed?.region ?? (objective==='trial'?cityForRace(hero.race):'aurora');
    if (region === destination && (!hero.instance || fixed?.instance===hero.instance)) {
      const found = nearest(MONSTERS.filter(m => m.region===destination && (m.instance??null)===(hero.instance??null)
        && (world?.slain?.[m.id]??0)<=time && (!world || !monsterRequirement(hero,world.education,m.id))
        && (fixed ? m.id===fixed.id : objective==='trial' ? !m.boss&&m.level<=3 : objective?.type==='kill' &&
          (objective.ids ? objective.ids.includes(m.id) : !!objective.kinds?.includes(m.kind)))));
      if (found) return { target, name: found.name, point: [found.x,found.z], monster: found.id };
      if (fixed && !hero.instance && fixed.instance && world && !instanceRequirement(hero,world.education.completed,fixed.instance)) {
        const place = INSTANCES[fixed.instance];
        return { target, name: place.name, point: [place.x,place.z], enterInstance: fixed.instance };
      }
    }
  }

  if (hero.instance) return { target, name: 'Saída da masmorra', point: [0,10], leaveInstance: true };
  if (region === destination) return;
  if ('region' in target && target.via !== 'portal') {
    const next=roadItinerary(region,destination)[1];
    const road=next && roadTo(region,next);
    if (road) return {target,name:`Estrada · ${REGIONS[road.to].name}`,point:road.end,overland:true};
  }
  const order = ['aurora','ruins','frontier','heart'];
  const index = order.indexOf(region), goal = order.indexOf(destination);
  const campaign = index >= 0 && goal > index ? nextRegion(region)
    : campaignGate(region,'aurora') ? 'aurora' : undefined;
  if (campaign && (!world || !regionRequirement(hero,world.education,campaign))) {
    return { target, name: `Portal: ${REGIONS[campaign].name}`, point: campaignGate(region,campaign)!, campaign };
  }
  if (region === 'goddard') {
    const exit = isRacialCity(destination) ? destination : 'aurora';
    return { target, name: `Portal: ${RACIAL_CITIES[exit].name}`, point: [...goddardExit(exit)], portal: exit };
  }
  if (isRacialCity(region) && region!=='aurora' || region==='aurora'&&(isRacialCity(destination)||destination==='goddard')) {
    return { target, name: 'Portal para Goddard', point: [...cityPortal(region)], portal: 'goddard' };
  }
}

export function areaDestinations(region: HeroData['region']): MapPin[] {
  const exits: MapPin[] = overlandRoads(region).map(road=>({target:{road:road.to,from:region},name:`Estrada · ${REGIONS[road.to].name}`,point:road.end}));
  const next = nextRegion(region);
  if (next) exits.push({ target: { region: next }, name: REGIONS[next].name, point: campaignGate(region,next)! });
  if (campaignGate(region,'aurora')) exits.push({ target: { region: 'aurora' }, name: REGIONS.aurora.name, point: campaignGate(region,'aurora')! });
  if (isRacialCity(region)) exits.push({ target: { region: 'goddard' }, name: 'Goddard', point: [...cityPortal(region)] });
  if (region==='goddard') for (const id of Object.keys(RACIAL_CITIES) as RacialCity[]) {
    exits.push({ target: { region: id }, name: REGIONS[id].name, point: [...goddardExit(id)] });
  }
  for (const [id,place] of Object.entries(INSTANCES) as [InstanceId, (typeof INSTANCES)[InstanceId]][]) {
    if (place.region===region) exits.push({ target: { instance: id }, name: place.name, point: [place.x,place.z] });
  }
  return exits;
}

export function nextCampaignBoss(hero: HeroData, education: Education) {
  const id = CAMPAIGN_BOSSES.find(boss => !hero.defeatedBosses.includes(boss));
  const monster = MONSTERS.find(m => m.id===id);
  if (!monster) return;
  const lock = regionRequirement(hero,education,monster.region)
    ?? monsterRequirement({ ...hero, region: monster.region, instance: null },education,monster.id);
  return { monster, lock };
}

export function routeToPoint(position: [number, number], point: [number, number], hero: HeroData) {
  const region = hero.instance ? 'instance' : hero.region;
  // Round the approach points before measuring interaction range, just as findPath does.
  const candidates = Array.from({ length: 16 }, (_, i): [number, number] => {
    const angle = i * Math.PI / 8;
    return [Math.round(point[0] + Math.cos(angle) * 2.6), Math.round(point[1] + Math.sin(angle) * 2.6)];
  }).filter(([x, z]) => Math.hypot(x - point[0], z - point[1]) < 3.2);
  return candidates.map(candidate => findPath(position, candidate, region))
    .filter(route => route.length).sort((a, b) => a.length - b.length)[0] ?? [];
}

export function currentMainObjective(hero: HeroData, education: Education) {
  const delivery = pendingDelivery(education, 'main').find(id => MAIN_ORDER.includes(id));
  if (delivery) return { lesson: delivery, stage: 'deliver' } as const;
  const next = MAIN_ORDER.find(id => !education.completed.includes(id));
  if (!next) return { stage: 'done' } as const;
  const lock = mainRequirement(hero, education, next);
  return lock ? { lesson: next, stage: 'locked', lock } as const : { lesson: next, stage: 'start' } as const;
}
