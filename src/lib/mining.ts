import type {RegionId} from './campaign';
import type {InstanceId} from './instances';
type Vein = {id:string;x:number;z:number;item:string;name:string;color:string;region?:RegionId;instance?:InstanceId};
export const PICKAXE_ID = "miners-pickaxe";
export const ORE_VEINS: Vein[] = [
  { id: "vein-copper-west", x: -17, z: 8, item: "mat-ore-1", name: "Veio de cobre", color: "#cf8b60" },
  { id: "vein-copper-south", x: -10, z: 19, item: "mat-ore-1", name: "Veio de cobre", color: "#cf8b60" },
  { id: "vein-iron-forest", x: -10, z: -19, item: "mat-ore-5", name: "Veio de ferro", color: "#aeb8c0" },
  { id:"vein-iron-forge", x:-8,z:1,item:"mat-ore-1",name:"Veio de cobre da Geada",color:"#cc9877",region:"iron-forge",instance:"frost-cave" },
  { id:"vein-gnome", x:12,z:5,item:"mat-ore-1",name:"Veio de cobre",color:"#cf8b60",region:"gnomolandia" },
  { id:"vein-orc", x:12,z:4,item:"mat-ore-5",name:"Veio de ferro rubro",color:"#b77755",region:"ogrimmar" },
  { id:"vein-elf", x:-12,z:5,item:"mat-ore-1",name:"Veio de cobre do bosque",color:"#cf8b60",region:"bosque" },
];
