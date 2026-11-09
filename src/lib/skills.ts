import { promotionRank } from "./journey";
import type { ClassId, HeroData } from './game';
export type Passive={attack?:number;defense?:number;hp?:number;mp?:number;stamina?:number;companion?:number;craftDiscount?:number;lifesteal?:number};
export type Skill={id:string;classId:ClassId;branch:number;tier:number;name:string;minLevel:number;maxRank:number;parent?:string;kind:'active'|'passive';resource:'mp'|'stamina';cost:number;cooldown:number;description:string;passive?:Passive;damage:number;heal:number;guard:number;stun:number;bleed:number;restore:number;buff?:{kind:'attack'|'defense';amount:number;duration:number}};
const names:Record<ClassId,string[][]>={
 paladin:[['Disciplina da Lâmina','Golpe do Juramento','Vigor Consagrado','Sentença Radiante','Martelo da Aurora'],['Mestre do Escudo','Bastião Sagrado','Armadura da Fé','Repreensão','Juramento Imortal'],['Devoção','Toque Restaurador','Fonte de Mana','Nova Sagrada','Farol da Aurora']],
 warrior:[['Força Bruta','Corte Furioso','Sede de Batalha','Ruptura','Fúria do Colosso'],['Disciplina Marcial','Aparar','Vigor do Combatente','Contra-ataque','Última Resistência'],['Passos de Guerra','Investida','Fôlego do Duelista','Redemoinho','Golpe do Campeão']],
 hunter:[['Olho do Falcão','Tiro Preciso','Mira Paciente','Disparo Perfurante','Chuva de Flechas'],['Vínculo Selvagem','Ataque Coordenado','Companheiro Feroz','Chamado da Alcateia','Guardião do Bosque'],['Rastreador','Armadilha de Raízes','Resistência da Trilha','Tiro de Contenção','Emboscada Perfeita']],
 engineer:[['Forja Eficiente','Impacto do Martelo','Artesão da Aurora','Sobrecarga','Engenho Supremo'],['Blindagem Modular','Barreira Mecânica','Placas Reforçadas','Pulso de Repulsão','Fortaleza Portátil'],['Inventividade','Injeção de Energia','Bateria Expandida','Descarga Rúnica','Núcleo de Tempestade']],
 mage:[['Foco Arcano','Lança de Runas','Poder dos Elementos','Explosão Estelar','Cometa do Eclipse'],['Manto Protetor','Escudo de Cristal','Reserva de Vida','Prisão Arcana','Refúgio das Estrelas'],['Conhecimento Antigo','Sifão de Mana','Fonte Arcana','Tempestade Rúnica','Convergência']],
 hacker:[['Precisão Sombria','Ataque Furtivo','Lâminas Afiadas','Corte Hemorrágico','Execução Silenciosa'],['Passos Silenciosos','Cortina de Fumaça','Reflexos Sombrios','Desarme','Véu das Sombras'],['Sabotagem','Pulso de Interferência','Fôlego Incansável','Brecha Estratégica','Código Fantasma']],
 prophet:[['Fé Serena','Prece da Vida','Mãos Restauradoras','Renovação','Milagre da Aurora'],['Voz Inspiradora','Bênção da Coragem','Comunhão','Hino da Vigília','Aliança Sagrada'],['Disciplina da Luz','Selo Protetor','Espírito Resiliente','Purificação','Santuário']],
 duelist:[['Duas Lâminas','Corte Cruzado','Ritmo das Espadas','Dança Cortante','Tempestade de Aço'],['Equilíbrio','Passo Evasivo','Reflexos de Duelo','Ripostar','Dança Intocável'],['Olhar Preciso','Estocada','Técnica Perfeita','Ferida Aberta','Toque Final']],
 shaman:[['Voz da Tempestade','Raio Ancestral','Força dos Elementos','Chama Tribal','Fúria do Trovão'],['Comunhão Espiritual','Sopro dos Espíritos','Vigor Ancestral','Cura da Terra','Grande Renovação'],['Tradição dos Totens','Totem da Coragem','Raízes da Tribo','Totem Guardião','Pacto Ancestral']],
};
export const SKILLS:Record<string,Skill>={};
for(const classId of Object.keys(names)as ClassId[])for(let branch=0;branch<3;branch++)for(let tier=0;tier<5;tier++){
 const active=tier===1||tier===3||tier===4;
 const resource=classId==='warrior'||classId==='hunter'||classId==='hacker'||classId==='duelist'?'stamina':'mp';
 const passive:Passive=branch===0?{attack:2+tier}:branch===1?{defense:2+tier}:resource==='mp'?{mp:8+tier*3}:{stamina:7+tier*3};
 if(classId==='hunter'&&branch===1) {passive.companion=3+tier;passive.defense=1;}
 if(classId==='engineer'&&branch===0) passive.craftDiscount=3;
 if(tier===2&&branch===1)passive.hp=12;
 if(classId==='warrior'&&tier===2&&branch===0)passive.lifesteal=2;
 const defending=(branch===1&&classId!=='hunter'&&classId!=='shaman'&&classId!=='prophet')||(classId==='prophet'&&branch===2);const healing=(classId==='prophet'&&branch===0)||(classId==='shaman'&&branch===1)||(classId==='paladin'&&branch===2)||(classId==='engineer'&&branch===2&&tier===1)||(classId==='mage'&&branch===2&&tier===1);
 const stun=active&&(branch===1||classId==='hunter'&&branch===2||classId==='hacker'&&branch===2)?1:0;
 const damage=!active?0:healing?.3:defending?.7:1.35+tier*.28;
 const heal=active&&healing?.2+tier*.025:active&&defending&&tier===4?.12:0;
 const guard=active&&defending?.3+tier*.05:0;
 const bleed=active&&(classId==='hacker'&&branch===0||classId==='warrior'&&branch===0||classId==='duelist'&&branch===2)&&tier>=3?.25:0;
 const restore=active&&healing?.12:0;
 const id=`${classId}-${branch}-${tier}`;
 const buff=active&&((classId==='prophet'&&branch===1)||(classId==='shaman'&&branch===2))?{kind:(tier===3?'defense':'attack') as 'attack'|'defense',amount:5+tier*3,duration:25+tier*5}:undefined;
 const description=active?[damage?`Dano ${Math.round(damage*100)}% do ATQ`:null,heal?`cura ${Math.round(heal*100)}% da vida máxima`:null,guard?`reduz a próxima reação em ${Math.round(guard*100)}%`:null,stun?'impede a próxima reação':null,bleed?'sangramento por 2 ações':null,restore?'recupera parte da reserva':null,buff?`bênção +${buff.amount} ${buff.kind==='attack'?'ATQ':'DEF'} por ${buff.duration}s`:null].filter(Boolean).join(' · '):Object.entries(passive).map(([k,v])=>`+${v} ${({attack:'ATQ',defense:'DEF',hp:'HP máximo',mp:'MP máximo',stamina:'EST máxima',companion:'dano do companheiro',craftDiscount:'% de desconto de fabricação',lifesteal:'% de roubo de vida'}as Record<string,string>)[k]}`).join(' · ');
 SKILLS[id]={id,classId,branch,tier,name:names[classId][branch][tier],minLevel:[2,8,16,28,42][tier],maxRank:active?3:5,parent:tier?`${classId}-${branch}-${tier-1}`:undefined,kind:active?'active':'passive',resource,cost:active?12+tier*5:0,cooldown:active?4+tier*2:0,description,passive:active?undefined:passive,damage,heal,guard,stun,bleed,restore,buff};
}
export function skillRank(hero:HeroData,id:string){return Math.max(0,Math.min(SKILLS[id]?.maxRank??0,Math.floor(hero.skills?.[id]??0)));}
export function spentSkillPoints(hero:HeroData){return Object.values(SKILLS).filter(s=>s.classId===hero.classId).reduce((n,s)=>n+skillRank(hero,s.id),0)+hero.talents.reduce((a,b)=>a+b,0);}
export function availableSkillPoints(hero:HeroData){return Math.max(0,hero.level-1-spentSkillPoints(hero));}
export function skillRequirement(hero:HeroData,id:string):string|undefined{
 const s=SKILLS[id];if(!s)return'Habilidade desconhecida';if(hero.dead)return'Personagem encerrado';if(hero.classInitiated===false)return'Conclua a iniciação com o treinador';if(s.classId!==hero.classId)return'Habilidade de outra classe';const rank=skillRank(hero,id);
 if(rank>=s.maxRank)return'Grau máximo';if(hero.level<s.minLevel+rank*2)return`Requer nível ${s.minLevel+rank*2}`;
 if(promotionRank(hero)<Math.max(0,s.tier-1))return`Requer promoção de nível ${Math.max(0,s.tier-1)*20}`;
 if(s.parent&&skillRank(hero,s.parent)<2)return'Requer grau 2 na habilidade anterior';if(!availableSkillPoints(hero))return'Sem pontos disponíveis';
 return undefined;
}
export function effectiveSkillRank(hero:HeroData,id:string):number{
 const s=SKILLS[id];if(!s||hero.classInitiated===false||s.classId!==hero.classId||hero.level<s.minLevel||spentSkillPoints(hero)>Math.max(0,hero.level-1))return 0;
 if(promotionRank(hero)<Math.max(0,s.tier-1))return 0;
 if(s.parent&&effectiveSkillRank(hero,s.parent)<2)return 0;
 return Math.min(skillRank(hero,id),1+Math.floor((hero.level-s.minLevel)/2));
}
export function passiveBonuses(hero:HeroData):Required<Passive>{const total={attack:0,defense:0,hp:0,mp:0,stamina:0,companion:0,craftDiscount:0,lifesteal:0};for(const s of Object.values(SKILLS)){if(s.classId!==hero.classId||s.kind!=='passive'||hero.level<s.minLevel)continue;const rank=effectiveSkillRank(hero,s.id);for(const [key,value]of Object.entries(s.passive??{}))total[key as keyof typeof total]+=value*rank;}total.craftDiscount=Math.min(35,total.craftDiscount);total.lifesteal=Math.min(20,total.lifesteal);return total;}
