import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createEstate} from './estate.js';
export const ORIGIN=[119.54,26.205], UNIT=100;
const mx=111320*Math.cos(ORIGIN[1]*Math.PI/180)/UNIT,mz=111320/UNIT;
export const project=(lon,lat)=>[(lon-ORIGIN[0])*mx,(ORIGIN[1]-lat)*mz];
export const unproject=(x,z)=>[x/mx+ORIGIN[0],ORIGIN[1]-z/mz];
export const inside=(x,y,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
let seed=88;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const clamp=T.MathUtils.clamp;
export async function createWorld(scene,onProgress){
 const [regional,city,osm,river,coastal]=await Promise.all(['terrain','city-terrain','map','river','coastal'].map(async name=>{let r=await fetch(`./data/${name}.json`);if(!r.ok)throw new Error(`${name} 地理数据载入失败`);return r.json();}));
 const features=[...osm.elements,...coastal.elements],land=new T.Group(),buildings=new T.Group(),roads=new T.Group(),trees=new T.Group();scene.add(land);land.add(buildings,roads,trees);
 function sample(data,lon,lat){const [w,s,e,n]=data.bounds;const gx=clamp((lon-w)/(e-w)*(data.nx-1),0,data.nx-1.001),gz=clamp((n-lat)/(n-s)*(data.ny-1),0,data.ny-1.001),x=Math.floor(gx),z=Math.floor(gz),a=gx-x,b=gz-z,i=z*data.nx+x,h=data.heights;return T.MathUtils.lerp(T.MathUtils.lerp(h[i],h[i+1],a),T.MathUtils.lerp(h[i+data.nx],h[i+data.nx+1],a),b)/UNIT;}
 function height(x,z){const [lon,lat]=unproject(x,z),[w,s,e,n]=city.bounds;return sample(lon>w&&lon<e&&lat>s&&lat<n?city:regional,lon,lat);}
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.92,...extra});
 const m={road:mat('#86908a'),highway:mat('#a39982'),path:mat('#c1b69e'),park:mat('#8eaa73'),yard:mat('#b8bba1'),land:mat('#c1c4a5'),field:mat('#9fac78'),sand:mat('#c6bb9c'),water:mat('#76a9ad',{roughness:.35,metalness:.15}),white:mat('#eeebe0'),dark:mat('#4f6360'),roof:mat('#747f76'),stone:mat('#a1a999'),wood:mat('#74685a')};
 let night=0;const batches=new Map(),dummy=new T.Object3D();
 function bake(geo,material,parent=land){if(geo.index)geo=geo.toNonIndexed();if(!geo.attributes.uv)geo.setAttribute('uv',new T.BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));const key=material.uuid+parent.uuid;if(!batches.has(key))batches.set(key,{gs:[],material,parent});batches.get(key).gs.push(geo);}
 const cube=new T.BoxGeometry(1,1,1);
 function box(x,y,z,w,h,d,ma,parent=land,ry=0){dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,ry,0);dummy.updateMatrix();bake(cube.clone().applyMatrix4(dummy.matrix),ma,parent);}
 function polygon(points,ma,y=null,parent=land,holes=[]){if(points.length<3)return;const shape=new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z)));holes.forEach(h=>shape.holes.push(new T.Path(h.map(([x,z])=>new T.Vector2(x,-z)))));const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,y===null?Math.max(.025,height(p.getX(i),p.getZ(i)))+.014:y);g.computeVertexNormals();bake(g,ma,parent);}
 function ribbon(points,width,ma,parent=roads,bridge=false){if(points.length<2)return;const vertices=[];for(let i=1;i<points.length;i++){
  const [ax,az]=points[i-1],[bx,bz]=points[i],len=Math.hypot(bx-ax,bz-az);if(len<.00001)continue;const dx=-(bz-az)/len*width/2,dz=(bx-ax)/len*width/2;
  const steps=Math.max(1,Math.ceil(len/.3)),deck=Math.max(height(ax,az),height(bx,bz),.08)+.045;
  for(let j=0;j<steps;j++){const t=j/steps,u=(j+1)/steps,x=ax+(bx-ax)*t,z=az+(bz-az)*t,xx=ax+(bx-ax)*u,zz=az+(bz-az)*u;
   const v=[[x+dx,z+dz],[x-dx,z-dz],[xx+dx,zz+dz],[xx-dx,zz-dz]].map(([x,z])=>[x,bridge?deck:Math.max(.024,height(x,z))+.019,z]);vertices.push(...v[0],...v[1],...v[2],...v[2],...v[1],...v[3]);}
  if(bridge&&len>.3){for(let t=.2;t<1;t+=.25){const x=ax+(bx-ax)*t,z=az+(bz-az)*t;box(x,deck/2,z,width*.3,deck,width*.3,m.stone,roads);}}
 }
 if(vertices.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();bake(g,ma,parent);}}
 onProgress('正在雕刻真实高程与敖江河岸…');
 function terrainMesh(data,skipCity=false){const {bounds:[w,s,e,n],nx,ny}=data,geo=new T.PlaneGeometry((e-w)*mx,(n-s)*mz,nx-1,ny-1);geo.rotateX(-Math.PI/2);const c=project((w+e)/2,(n+s)/2);geo.translate(c[0],0,c[1]);let p=geo.attributes.position;const colors=[];let color=new T.Color(),plain=new T.Color('#b2bea0'),hill=new T.Color('#779567'),high=new T.Color('#526f52'),sand=new T.Color('#b9b49a');
  for(let i=0;i<p.count;i++){const y=data.heights[i]===0?-.03:data.heights[i]/UNIT;p.setY(i,y);color.copy(plain).lerp(hill,clamp(y/.85,0,1)).lerp(high,clamp((y-.9)/7,0,1));if(y<.02)color.copy(sand);const noise=Math.sin(p.getX(i)*2.6+p.getZ(i)*1.7)*Math.cos(p.getX(i)*.37-p.getZ(i)*.21);color.multiplyScalar(.98+noise*.025);colors.push(color.r,color.g,color.b);}
  if(skipCity){const old=geo.index.array,idx=[];const [cw,cs,ce,cn]=city.bounds;for(let i=0;i<old.length;i+=3){const k=old[i],j=old[i+1],l=old[i+2];const lon=(p.getX(k)+p.getX(j)+p.getX(l))/3/mx+ORIGIN[0],lat=ORIGIN[1]-(p.getZ(k)+p.getZ(j)+p.getZ(l))/3/mz;if(lon>cw&&lon<ce&&lat>cs&&lat<cn)continue;idx.push(k,j,l);}geo.setIndex(idx);}
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}));mesh.receiveShadow=true;mesh.name='连江实际高程';land.add(mesh);return mesh;
 }
 terrainMesh(regional,true);terrainMesh(city);
 const waterUniforms={time:{value:0},deep:{value:new T.Color('#7aabb0')},light:{value:new T.Color('#a5c7c4')},night:{value:0}};
 const waterMat=new T.ShaderMaterial({uniforms:waterUniforms,vertexShader:'varying vec3 vP;void main(){vec4 p=modelMatrix*vec4(position,1.);vP=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',fragmentShader:`varying vec3 vP;uniform float time;uniform vec3 deep;uniform vec3 light;uniform float night;void main(){vec2 p=vP.xz;float a=sin(p.x*7.+p.y*12.+time*.35);float b=sin(p.x*21.-p.y*8.-time*.6);float wave=a*.6+b*.4;vec3 c=mix(deep,light,.18+wave*.045);float glint=pow(max(0.,sin(p.x*12.+p.y*14.+sin(p.y*3.)+time*.5)),36.)*.025*(1.-night);c+=glint;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
 const water=new T.Mesh(new T.PlaneGeometry(2600,2600),waterMat);water.rotation.x=-Math.PI/2;water.position.y=.008;scene.add(water);
 const riverRings=river.outer.map(r=>r.map(p=>project(...p))),riverHoles=river.inner.map(r=>r.map(p=>project(...p)));
 // A tidal river polygon, with its actual islands retained. DEM masking opens the channel.
 riverRings.forEach(r=>polygon(r,waterMat,.015,land,riverHoles));
 function isRiver(x,z){return riverRings.some(p=>inside(x,z,p))&&!riverHoles.some(p=>inside(x,z,p));}
 const estateFeature=features.find(f=>f.tags.name==='滨江悦公馆');const estateRing=estateFeature.geometry.map(p=>project(p.lon,p.lat));
 const estatePos=project(119.54473,26.20202),estateBase=Math.max(.05,height(...estatePos));
 polygon(estateRing,m.yard,estateBase+.003);
 const parks=[];
 const pointOf=g=>g.map(p=>project(p.lon,p.lat));
 const roadsForCars=[];let buildingCount=0,knownHeight=0;
 // Actual OSM polygons keep block orientation, bridges, parks, and street hierarchy.
 for(const f of features){const t=f.tags,g=f.geometry;if(!g||g.length<2)continue;const pts=pointOf(g),closed=g[0].lat===g.at(-1).lat&&g[0].lon===g.at(-1).lon;
  if(t.building||t['building:part'])continue;
  if(closed&&(t.landuse||t.leisure||t.natural==='water')){
   if(t.natural==='water'){if(t.water!=='river')polygon(pts,m.water);}
   else if(t.leisure==='park'||t.leisure==='garden'||t.landuse==='grass'||t.landuse==='forest'){polygon(pts,m.park);parks.push(pts);}
   else if(t.landuse==='residential'||t.landuse==='commercial'||t.landuse==='industrial')polygon(pts,m.land);
   else if(t.landuse==='farmland'||t.landuse==='orchard')polygon(pts,m.field);
  }
  if(t.highway&&!['proposed','construction','steps'].includes(t.highway)&&t.tunnel!=='yes'){
   const highway=['motorway','trunk'].includes(t.highway),major=['primary','secondary','tertiary'].includes(t.highway),walk=['footway','path','cycleway','pedestrian'].includes(t.highway);
   const width=walk?.025:clamp((Number(t.lanes)|| (major?2:1))*3.2+2,4,25)/100;
   ribbon(pts,width,walk?m.path:highway?m.highway:m.road,roads,!!t.bridge);
   if(major&&pts.length>2&&!t.bridge)roadsForCars.push(pts);
  }
  if(t.railway==='rail')ribbon(pts,.025,m.dark,roads,!!t.bridge);
 }
 onProgress('正在重建县城街区与88号立面…');
 const facadeMats=['#d9d8c9','#c9c9b7','#e4dfd0','#b9c3b8','#d2c3a8'].map(c=>mat(c));
 const shaders=[];
 for(const ma of facadeMats){ma.onBeforeCompile=shader=>{shader.uniforms.uNight={value:night};shader.vertexShader='varying vec3 vBuildPos;varying vec3 vBuildNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBuildPos=position;vBuildNormal=normal;');shader.fragmentShader='varying vec3 vBuildPos;varying vec3 vBuildNormal;uniform float uNight;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 if(abs(vBuildNormal.y)<.6){float face=abs(vBuildNormal.x)>.6?vBuildPos.z:vBuildPos.x;vec2 uv=vec2(face/0.037,vBuildPos.y/0.032);vec2 cell=fract(uv);float win=step(.23,cell.x)*step(cell.x,.77)*step(.24,cell.y)*step(cell.y,.8);float rnd=fract(sin(dot(floor(uv),vec2(12.98,78.23)))*43758.5);vec3 glass=mix(vec3(.28,.4,.42),vec3(.39,.49,.49),rnd);diffuseColor.rgb=mix(diffuseColor.rgb,glass,win*.85);}`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 if(abs(vBuildNormal.y)<.6){float face=abs(vBuildNormal.x)>.6?vBuildPos.z:vBuildPos.x;vec2 uv=vec2(face/.037,vBuildPos.y/.032);vec2 cell=fract(uv);float win=step(.23,cell.x)*step(cell.x,.77)*step(.24,cell.y)*step(cell.y,.8);float rnd=fract(sin(dot(floor(uv),vec2(12.98,78.23)))*43758.5);totalEmissiveRadiance+=vec3(1.,.68,.29)*win*step(.67,rnd)*uNight*.85;}`);shaders.push(shader);};}
 for(const f of features){const t=f.tags,g=f.geometry;if(!t.building||!g||g.length<4||t.building==='no'||t.building==='construction')continue;const pts=pointOf(g),cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cz=pts.reduce((a,p)=>a+p[1],0)/pts.length;
  if(inside(cx,cz,estateRing)||isRiver(cx,cz))continue;
  const area=Math.abs(pts.reduce((a,p,i)=>{let q=pts[(i+1)%pts.length];return a+p[0]*q[1]-q[0]*p[1];},0)/2);
  if(area<.0001||area>5)continue;
  const actual=parseFloat(t.height||t['building:height']),levels=parseFloat(t['building:levels']);let h;
  if(actual>0){h=actual/100;knownHeight++;}else if(levels>0){h=(levels*3.1+.8)/100;knownHeight++;}else{h=(t.building==='house'||t.building==='detached'?9.6:t.building==='industrial'||t.building==='warehouse'?8:t.building==='apartments'?22:area>.06?18.6:12.4)/100;}
  h=clamp(h,.025,1.5);const base=Math.max(.03,height(cx,cz));
  if(t.name==='含光塔')continue;
  const shape=new T.Shape(pts.map(([x,z])=>new T.Vector2(x,-z))),geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1});geo.rotateX(-Math.PI/2);geo.translate(0,base,0);bake(geo,facadeMats[Math.floor(rand()*facadeMats.length)],buildings);buildingCount++;
 }
 const estate=createEstate();estate.group.position.set(estatePos[0],estateBase,estatePos[1]);estate.group.rotation.y=-.34;buildings.add(estate.group);
 // Hanguang Pagoda is on the east bank, not an island transplanted from another city.
 const pagodaPos=project(119.55254,26.20481),pagodaBase=Math.max(.03,height(...pagodaPos));
 for(let i=0;i<7;i++){const h=.043,r=.055-i*.004,y=pagodaBase+i*h;const g=new T.CylinderGeometry(r*.8,r*.85,h*.84,8);g.translate(pagodaPos[0],y+h/2,pagodaPos[1]);bake(g,m.sand,buildings);const roof=new T.CylinderGeometry(r*.65,r*1.18,.015,8);roof.translate(pagodaPos[0],y+h,pagodaPos[1]);bake(roof,m.stone,buildings);}
 // Street trees use mapped positions; park infill is decorative at 5–9 m high.
 const treePoints=[];
 for(const f of features)if(f.type==='node'&&f.tags.natural==='tree'){const [x,z]=project(f.lon,f.lat);if(!isRiver(x,z))treePoints.push([x,z,.05+rand()*.04]);}
 for(const poly of parks){const xs=poly.map(p=>p[0]),zs=poly.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);const count=Math.min(220,Math.ceil((maxX-minX)*(maxZ-minZ)*80));for(let i=0;i<count;i++){const x=minX+rand()*(maxX-minX),z=minZ+rand()*(maxZ-minZ);if(inside(x,z,poly)&&!isRiver(x,z)&&height(x,z)>.02)treePoints.push([x,z,.05+rand()*.035]);}}
 const treeMat=mat('#638355'),trunkMat=mat('#8c8062');
 const leaves=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),treeMat,treePoints.length),trunks=new T.InstancedMesh(new T.CylinderGeometry(.12,.16,1,5),trunkMat,treePoints.length);
 for(let i=0;i<treePoints.length;i++){const [x,z,h]=treePoints[i],y=Math.max(.03,height(x,z));dummy.rotation.set(0,rand()*6.28,0);dummy.position.set(x,y+h*.65,z);dummy.scale.set(h*.36,h*.49,h*.36);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new T.Color().setHSL(.22+rand()*.07,.18+rand()*.12,.32+rand()*.13));dummy.position.y=y+h*.2;dummy.scale.set(h*.4,h*.5,h*.4);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);}
 leaves.castShadow=true;trunks.castShadow=true;trees.add(leaves,trunks);
 // Modest working boats travel inside the measured lower river corridor.
 const moving=new T.Group();scene.add(moving);const boats=[];
 const route=features.find(f=>f.tags.waterway==='river'&&f.tags.name==='敖江')?.geometry;
 if(route){const pts=pointOf(route).filter(([x,z])=>x>-45&&x<55);const curve=new T.CatmullRomCurve3(pts.map(([x,z])=>new T.Vector3(x,.036,z)));for(let i=0;i<7;i++){const boat=new T.Group();const hull=new T.Mesh(new T.BoxGeometry(.05,.025,.17),m.dark);const cabin=new T.Mesh(new T.BoxGeometry(.04,.025,.055),m.white);cabin.position.set(0,.025,-.015);boat.add(hull,cabin);moving.add(boat);boats.push({boat,curve,phase:i/7});}}
 const cars=[];for(let i=0;i<Math.min(60,roadsForCars.length);i++){const pts=roadsForCars[Math.floor(rand()*roadsForCars.length)],curve=new T.CatmullRomCurve3(pts.map(([x,z])=>new T.Vector3(x,Math.max(.024,height(x,z))+.047,z)));const car=new T.Mesh(new T.BoxGeometry(.019,.016,.045),i%3?m.white:m.dark);moving.add(car);cars.push({car,curve,phase:rand()});}
 for(const {gs,material,parent} of batches.values()){if(!gs.length)continue;const merged=mergeGeometries(gs);if(!merged)throw new Error('场景几何合并失败');const mesh=new T.Mesh(merged,material);mesh.castShadow=parent===buildings;mesh.receiveShadow=true;mesh.frustumCulled=true;parent.add(mesh);gs.forEach(g=>g.dispose());}
 return {land,buildings,roads,trees,height,estatePos,estateBase,estateHeight:estate.height,pagodaPos,pagodaBase,stats:{buildings:buildingCount,knownHeight,trees:treePoints.length,roadFeatures:features.filter(f=>f.tags.highway&&f.geometry).length},
  setNight(value){night=value;shaders.forEach(s=>s.uniforms.uNight.value=value);estate.setNight(value);waterUniforms.night.value=value;waterUniforms.deep.value.set(value?'#173d49':'#7aabb0');waterUniforms.light.value.set(value?'#35616b':'#a5c7c4');},
  update(time,motion=true){waterUniforms.time.value=motion?time:0;boats.forEach(({boat,curve,phase})=>{const t=(phase+(motion?time*.002:0))%1,p=curve.getPoint(t);boat.position.copy(p);const q=curve.getTangent(t);boat.rotation.y=Math.atan2(q.x,q.z);boat.visible=isRiver(p.x,p.z);});cars.forEach(({car,curve,phase})=>{const t=(phase+(motion?time*.025:0))%1;car.position.copy(curve.getPoint(t));const q=curve.getTangent(t);car.rotation.y=Math.atan2(q.x,q.z);car.visible=roads.visible;});}
 };
}
