export const FLYING_MOUNTS = [
  {id:"griffin",name:"Grifo Real",body:"#9b724e",wing:"#d8b078",beak:"#ebbc69"},
  {id:"manticore",name:"Mantícora Rubra",body:"#a35746",wing:"#653d49",beak:"#d48855"},
  {id:"owl",name:"Coruja Lunar",body:"#a2afbb",wing:"#d6dcde",beak:"#c3a676"},
  {id:"hippogriff",name:"Hipogrifo de Ferro",body:"#6d788a",wing:"#b4bec6",beak:"#bc9c62"},
  {id:"dragonfly",name:"Libélula Mecânica",body:"#b17f4e",wing:"#72bfc5",beak:"#e4c178"},
] as const;
export type FlyingMountId = typeof FLYING_MOUNTS[number]["id"];
export const FLYING_MOUNT_PRICE = 1500;
export const MOUNT_VENDOR = [9,-3] as const;
