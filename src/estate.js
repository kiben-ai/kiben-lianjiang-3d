import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Dimensions below are visual estimates in metres. The site boundary is OSM way 1332571761.
export function createEstate(){
 const group=new T.Group(),batches=new Map(),dummy=new T.Object3D();
 const mat=(color,opts={})=>new T.MeshStandardMaterial({color,roughness:.7,...opts});
 const m={stone:mat('#ebe9df'),edge:mat('#c7c7bb'),glass:mat('#567b85',{metalness:.5,roughness:.22}),frame:mat('#6b7778'),bronze:mat('#927653'),wood:mat('#745941'),dark:mat('#354f54'),grass:mat('#81986a'),leaf:mat('#547956'),path:mat('#d2c9b3'),light:mat('#ffdfa0',{emissive:'#ffcd80',emissiveIntensity:0})};
 const cube=new T.BoxGeometry(1,1,1);
 function shape(geo,material,x,y,z,sx=1,sy=1,sz=1,rot=0){dummy.position.set(x/100,y/100,z/100);dummy.scale.set(sx/100,sy/100,sz/100);dummy.rotation.set(0,rot,0);dummy.updateMatrix();let g=geo.clone().applyMatrix4(dummy.matrix);if(g.index)g=g.toNonIndexed();if(!batches.has(material))batches.set(material,[]);batches.get(material).push(g);}
 const box=(x,y,z,w,h,d,ma,rot=0)=>shape(cube,ma,x,y,z,w,h,d,rot);
 // 5 m garden deck, ground-level parking, two visually separate residential wings.
 box(0,2.4,0,62,4.8,112,m.edge);box(0,4.95,0,62,.3,112,m.path);
 box(0,5.2,20,30,.25,43,m.grass);
 const floorH=3.15,levels=23,start=7;
 box(0,start+levels*floorH/2,-22,29,levels*floorH,20,m.glass);
 box(0,start+levels*floorH/2,-24,4,levels*floorH,19,m.stone);
 box(-13.4,start+levels*floorH/2,-22,1.3,levels*floorH,20.7,m.stone);box(13.4,start+levels*floorH/2,-22,1.3,levels*floorH,20.7,m.stone);
 for(let f=0;f<=levels;f++){
  const y=start+f*floorH;box(0,y,-22,30,.26,21,m.stone);
  if(f===levels)continue;
  // Deep front balconies, thin guardrails, and continuous horizontal slab edges.
  for(const x of [-7.3,7.3]){
   box(x,y,-9.6,11,.24,4.2,m.stone);box(x,y+1,-7.6,10.8,.8,.12,m.glass);box(x,y+1.45,-7.6,10.8,.06,.13,m.frame);
   box(x-5.4,y+1.55,-9.5,.24,3.1,4,m.stone);box(x+5.4,y+1.55,-9.5,.24,3.1,4,m.stone);
  }
  for(const x of [-10,-5,5,10]){box(x,y+1.6,-32.1,.18,2.9,.15,m.frame);box(x,y+1.6,-11.85,.18,2.9,.15,m.frame);}
  for(const z of [-29,-25,-21,-17]){box(-14.6,y+1.6,z,.15,2.9,.15,m.frame);box(14.6,y+1.6,z,.15,2.9,.15,m.frame);}
  if(f%3!==1)for(const x of [-8,8])box(x,y+1.45,-11.83,3.6,1.8,.12,m.light);
 }
 const top=start+levels*floorH;
 for(const x of [-8,8]){box(x,top+1.7,-22,.65,3.2,18,m.stone);box(x,top+3.2,-21,16.4,.7,25,m.stone);box(x,top+2.8,-21,15,.12,23,m.wood);}
 box(0,6.2,-19,31,2.5,19,m.dark);
 // Four courtyard villas, estimated from the published project rendering.
 for(const [x,z] of [[-21,8],[-21,32],[21,8],[21,32]]){
  box(x,10,z,12,10,16,m.stone);box(x,9,z+8.1,9,5,.2,m.glass);box(x,14.2,z+7.9,8,2,.2,m.glass);
  box(x,15,z,13,.35,17,m.edge);box(x,15.6,z-3,8,1.2,7,m.edge);
  const roof=new T.CylinderGeometry(0,1,1,4);shape(roof,m.dark,x,17,z-2,9,3,11,Math.PI/4);
  box(x,8,z+11,13,.25,4,m.path);
 }
 // Rounded clubhouse canopy / elevated entrance court.
 const canopy=new T.Shape();const w=25,d=8,r=2;canopy.moveTo(-w+r,-d);canopy.lineTo(w-r,-d);canopy.quadraticCurveTo(w,-d,w,-d+r);canopy.lineTo(w,d-r);canopy.quadraticCurveTo(w,d,w-r,d);canopy.lineTo(-w+r,d);canopy.quadraticCurveTo(-w,d,-w,d-r);canopy.lineTo(-w,-d+r);canopy.quadraticCurveTo(-w,-d,-w+r,-d);
 const cg=new T.ExtrudeGeometry(canopy,{depth:.6,bevelEnabled:false});cg.rotateX(-Math.PI/2);shape(cg,m.bronze,0,10.8,48);box(0,7.8,47,46,5.6,13,m.glass);box(0,10.95,48,39,.2,11,m.dark);
 for(let i=0;i<12;i++)box(0,.2+i*.4,58-i*.8,18,.4,2,m.path);
 for(const z of [-48,-36,-24,-12,0,12,24,36,48])for(const x of [-29,29]){box(x,7,z,.18,4,.18,m.bronze);box(x,9.1,z,.6,.3,.6,m.light);}
 for(const [x,z] of [[-10,15],[8,15],[-10,31],[8,31],[26,-43],[-25,-42],[25,49],[-25,49]]){
  box(x,6.5,z,.35,3,.35,m.wood);shape(new T.IcosahedronGeometry(1,1),m.leaf,x,8.9,z,2.7,2.9,2.7);
 }
 for(let i=0;i<4;i++)box(-6+i*4,5.6,25,2.5,.7,.7,m.wood);
 box(0,5.4,7,14,.3,8,m.path);box(0,5.6,7,9,.2,4,m.glass);
 // Retaining-wall joints and parking openings keep the base legible at pedestrian scale.
 for(let z=-48;z<50;z+=5){box(-31.05,2.3,z,.1,2.8,3.5,m.dark);box(31.05,2.3,z,.1,2.8,3.5,m.dark);}
 for(const [ma,gs] of batches){const merged=mergeGeometries(gs);const mesh=new T.Mesh(merged,ma);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);gs.forEach(g=>g.dispose());}
 group.name='敖江路88号 · 效果图参考模型';group.userData.place='estate';
 return {group,setNight:n=>m.light.emissiveIntensity=n?.75:0,height:(top+3.55)/100};
}
