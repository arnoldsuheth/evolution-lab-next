const sides = [-1, 1] as const;
const rows = [-9, -15, -22];

export default function NullarionSanctum() {
  return <group name="Santuário de Nullarion">
    <mesh position={[2,.035,-17]} rotation={[-Math.PI/2,0,0]} receiveShadow raycast={()=>null}>
      <planeGeometry args={[20,22]} />
      <meshStandardMaterial color="#30243e" roughness={.88} />
    </mesh>
    <mesh position={[2,.047,-19]} rotation={[-Math.PI/2,0,0]} raycast={()=>null}>
      <ringGeometry args={[4.6,4.85,48]} />
      <meshBasicMaterial color="#d88c72" />
    </mesh>
    {sides.flatMap(side=>rows.map(z=><group key={`${side}:${z}`} position={[2+side*8,0,z]}>
      <mesh position={[0,2.25,0]} castShadow raycast={()=>null}><cylinderGeometry args={[.56,.83,4.5,6]} /><meshStandardMaterial color="#4d3e59" roughness={.82} /></mesh>
      <mesh position={[0,4.9,0]} raycast={()=>null}><octahedronGeometry args={[.56]} /><meshStandardMaterial color="#c891f4" emissive="#a94ce8" emissiveIntensity={.8} /></mesh>
    </group>))}
    <group position={[2,0,-28]}>
      <mesh position={[0,4,0]} raycast={()=>null}><boxGeometry args={[17,8,.75]} /><meshStandardMaterial color="#46334f" roughness={.92} /></mesh>
      <mesh position={[0,4,.42]} raycast={()=>null}><octahedronGeometry args={[1.55]} /><meshStandardMaterial color="#b078db" emissive="#6d328d" emissiveIntensity={.85} /></mesh>
    </group>
  </group>;
}
