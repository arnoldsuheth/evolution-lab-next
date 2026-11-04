export const BODY_TRAITS = [
 {name:'Esguio',height:1.02,shoulders:.88,waist:.84,arms:.86,legs:.92,stance:.21},
 {name:'Atlético',height:1,shoulders:1.12,waist:.87,arms:1.08,legs:1.03,stance:.25},
 {name:'Robusto',height:.95,shoulders:1.08,waist:1.14,arms:1.15,legs:1.12,stance:.29},
 {name:'Longilíneo',height:1.12,shoulders:.96,waist:.92,arms:.91,legs:.9,stance:.22},
 {name:'Compacto',height:.89,shoulders:1.02,waist:1.02,arms:1.03,legs:1.08,stance:.27},
 {name:'Ombros largos',height:1.03,shoulders:1.24,waist:.92,arms:1.1,legs:.96,stance:.26},
] as const;
export const FACE_TRAITS = [
 {name:'Oval',width:1,height:1,jaw:.9,chin:1,temples:1,cheeks:1},
 {name:'Quadrado',width:1.06,height:.96,jaw:1.22,chin:.9,temples:1,cheeks:.95},
 {name:'Alongado',width:.88,height:1.15,jaw:.84,chin:1.15,temples:.95,cheeks:.91},
 {name:'Anguloso',width:.97,height:1.02,jaw:.78,chin:1.12,temples:1.1,cheeks:1.17},
 {name:'Arredondado',width:1.13,height:.9,jaw:1.05,chin:.85,temples:.97,cheeks:1.09},
 {name:'Marcante',width:1.02,height:1.06,jaw:1.15,chin:1.16,temples:.92,cheeks:1.12},
] as const;
export const NOSE_TRAITS = [
 {name:'Reto',bridge:.2,width:.12,depth:.16,tip:.36,tilt:0},
 {name:'Aquilino',bridge:.27,width:.115,depth:.23,tip:.4,tilt:.22},
 {name:'Largo',bridge:.14,width:.23,depth:.14,tip:.36,tilt:0},
 {name:'Arredondado',bridge:.14,width:.17,depth:.22,tip:.4,tilt:-.08},
 {name:'Arrebitado',bridge:.12,width:.12,depth:.18,tip:.4,tilt:-.35},
 {name:'Longo',bridge:.29,width:.13,depth:.29,tip:.45,tilt:.1},
] as const;
export const BROW_NAMES=['Retas','Arqueadas','Espessas','Inclinadas','Finas','Marcadas'];
export const CREATOR_CAMERA={fov:36,distance:4.75,polar:Math.PI/2-.035,target:1.18} as const;
