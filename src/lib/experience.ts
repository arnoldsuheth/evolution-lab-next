/** Matches withXp: level = floor(sqrt(total XP / 100)) + 1, capped at 60. */
export function experienceProgress(totalXp:number,level:number){
 const total=Number.isFinite(totalXp)?Math.max(0,totalXp):0;
 const currentLevel=Number.isFinite(level)?Math.max(1,Math.min(60,Math.floor(level))):1;
 const minimum=(currentLevel-1)**2*100,maximum=currentLevel**2*100;
 const capped=currentLevel===60,required=maximum-minimum;
 const earned=Math.max(0,Math.min(required,total-minimum));
 return {total,level:currentLevel,nextLevel:capped?null:currentLevel+1,earned:capped?required:earned,required,remaining:capped?0:Math.max(0,maximum-total),percent:capped?100:Math.floor(earned/required*100)};
}
