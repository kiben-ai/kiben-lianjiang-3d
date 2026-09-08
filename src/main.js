import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createWorld,project,unproject} from './world.js';
import './style.css';
const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene=new T.Scene();scene.background=new T.Color('#d7e5df');scene.fog=new T.FogExp2('#d7e5df',.00075);
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});}catch(e){$('#loading-text').textContent='当前浏览器无法启动 WebGL，请使用支持3D的浏览器。';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;$('#scene').appendChild(renderer.domElement);
renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','连江县交互式三维地图：拖动旋转，滚轮缩放，方向键旋转，Home返回县城');
const camera=new T.PerspectiveCamera(38,innerWidth/innerHeight,.015,3600),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=.6;controls.maxDistance=1400;controls.minPolarAngle=.06;controls.maxPolarAngle=Math.PI*.465;controls.rotateSpeed=.6;controls.zoomSpeed=.9;controls.autoRotateSpeed=.5;
const hemi=new T.HemisphereLight('#f9f6e4','#788875',2.0);scene.add(hemi);const sun=new T.DirectionalLight('#fff1d1',3.0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.004;sun.shadow.bias=-.00008;sun.shadow.camera.near=.01;sun.shadow.camera.far=500;scene.add(sun,sun.target);const fill=new T.DirectionalLight('#cadfdc',.5);fill.position.set(-30,20,-20);scene.add(fill);
const vec=(lon,lat,y)=>{let [x,z]=project(lon,lat);return new T.Vector3(x,y??Math.max(.03,world.height(x,z)),z);};
let world;
try{world=await createWorld(scene,t=>$('#loading-text').textContent=t);}catch(e){$('#loading-text').textContent='地图数据载入失败，请刷新重试。';console.error(e);throw e;}
const places={
 city:{name:'凤城县城',sub:'敖江环抱的下游平原',tag:'FENGCHENG · AO RIVER',p:[119.537,26.206],offset:[27,35,44],description:'敖江从西侧进入平原，绕过县城南缘，在东侧折向东北。凤城的街巷与住宅沿着这片河谷平原展开。',meta:'县城道路与建筑轮廓：OpenStreetMap'},
 region:{name:'连江山海全景',sub:'真实高程 · 区域视图',tag:'LIANJIANG · REGIONAL LANDSCAPE',p:[119.655,26.288],offset:[0,620,680],description:'连江县城位于西南侧敖江下游平原，琯头在县城南面，黄岐半岛向东北延伸。罗源湾位于半岛北侧，闽江口位于连江南部。',meta:'地理窗口含周边地区；不代表行政边界'},
 estate:{name:'敖江路88号',sub:'滨江悦公馆 · 重点建筑',tag:'NO. 88 · AOJIANG ROAD',p:[119.54473,26.20202],y:world.estateBase+.4,offset:[1.8,1.7,2.6],description:'一栋浅色住宅主楼与低层院落围合抬板庭园。连续阳台、竖向框架和屋顶挑檐，构成这座侨乡住宅的外观。',meta:'敖江路 × 玉荷东路东南角 · 地块8,428㎡\n效果图参考模型；楼层和尺寸为估算',close:[1.1,.8,1.7]},
 river:{name:'敖江与江滨公园',sub:'绕城弯道 · 两岸生活',tag:'AO RIVER · RIVERSIDE',p:[119.533,26.1958],offset:[10,13,17],description:'县城南面的江滨公园沿敖江展开，江对岸是江南镇。解放大桥、玉泉大桥和鳌峰大桥连接两岸；这里的河道保留实际弯曲形态。',meta:'水域、桥位与公园轮廓均来自地图数据'},
 pagoda:{name:'含光塔',sub:'敖江东岸 · 含光生态公园',tag:'HANGUANG · EAST BANK',p:[119.55254,26.20481],y:world.pagodaBase+.15,offset:[2.2,2.5,3.4],description:'含光塔位于县城东侧、敖江东岸。塔、寺院与含光生态公园相邻，与河西的城市街区隔江相望。',meta:'落点取自地图建筑轮廓；塔身细部为概括建模'},
 qingzhi:{name:'青芝山',sub:'琯头镇 · 闽江口北侧',tag:'QINGZHI · GUANTOU',p:[119.540,26.151],offset:[15,16,21],description:'青芝山位于琯头一带，以岩洞、奇石和常绿林地著称。它在连江县城南面，靠近闽江口北侧，呈现连江南部的低山地貌。',meta:'山体使用实际高程；景区范围近似定位'},
 huangqi:{name:'黄岐半岛',sub:'黄岐渔港 · 向海而生',tag:'HUANGQI · FISHING PORT',p:[119.878405,26.322],offset:[25,30,40],description:'黄岐半岛位于连江东北部、罗源湾南侧。山岭、港湾与海岸村落交错，黄岐渔港面向半岛南侧海湾。',meta:'实际高程与港区道路；未测建筑仅作低层体量示意'},
 government:{name:'连江县人民政府',sub:'凤城镇八一六北路81号',tag:'LIANJIANG GOVERNMENT',p:[119.5398,26.2148],offset:[5,7,9],description:'连江县人民政府位于福州市连江县凤城镇八一六北路81号，是县城公共服务与城市治理的核心地标。',meta:'地址：福州市连江县凤城镇八一六北路81号'},
 kuilong:{name:'魁龙坊',sub:'古街石牌坊 · 四柱三间五楼',tag:'KUILONG ARCHWAY',p:[119.5322,26.1991],offset:[3,4,5],description:'连江古街代表性石牌坊，四柱三间五楼，浮雕包含花鸟、人物与瑞兽，周边保留古民居和传统店铺。',meta:'历史街区地标；牌坊细部为概括建模'},
 wenbita:{name:'文笔塔',sub:'文笔山 · 九层仿古塔',tag:'WENBI PAGODA',p:[119.548,26.220],y:world.height(...project(119.548,26.220))+.02,offset:[3,4,6],description:'文笔山上的新建仿古八角九层楼阁式塔，高49.9米，设电梯和观景台；夜间灯光倒映江面。',meta:'高度按公开资料49.9米建模；位置与山体为地图核对示意'},
 kuilongDistrict:{name:'魁龙坊历史街区',sub:'古街保护更新 · ICONIC Awards',tag:'KUILONG HISTORIC QUARTER',p:[119.5328,26.1995],offset:[8,9,12],description:'以保护和更新历史公共空间为核心，保留传统生活场景。2024年保护更新项目获德国ICONIC Awards BEST OF BEST至尊奖。',meta:'历史街区范围为示意；项目奖项信息按公开资料'},
 qida:{name:'奇达村',sub:'旗冠顶下 · 海上养殖',tag:'QIDA · COASTAL VILLAGE',p:[119.868,26.373],offset:[16,19,28],description:'奇达村位于安凯乡，村落紧贴山海。旗冠顶在村庄西南侧，海湾中的渔排反映连江沿海渔业与养殖业的地方特征。',meta:'养殖区范围取自地图；渔排为区域内示意模型'}
};
const destinationKeys=['estate','government','kuilong','wenbita','kuilongDistrict','river','pagoda','qingzhi','huangqi','qida'];
$('#destinations').innerHTML=destinationKeys.map((k,i)=>`<button class="destination" data-go="${k}"><span class="number">0${i+1}</span><span>${places[k].name}<small>${places[k].sub}</small></span><span class="arrow">↗</span></button>`).join('');
let current='city',transition=null,touring=false,timeMode='day',frame=0;
const targetFor=p=>vec(p.p[0],p.p[1],p.y);
function flyTo(key,instant=false,close=false){const p=places[key];if(!p)return;current=key;stopOrbit();const target=targetFor(p),offset=new T.Vector3(...(close&&p.close?p.close:p.offset));if(innerWidth<=500&&key!=='estate'&&key!=='pagoda')offset.multiplyScalar(1.35);if(innerWidth>800){target.x-=key==='region'?35:key==='city'?4:0;}const pos=target.clone().add(offset);
 transition={start:performance.now(),from:camera.position.clone(),to:pos,fromTarget:controls.target.clone(),toTarget:target,duration:instant||reduced?0:1500};
 if(instant){camera.position.copy(pos);controls.target.copy(target);controls.update();transition=null;}
 document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===key));$('#view-name').textContent=p.name;document.body.dataset.place=key;
 $('#detail').hidden=key==='city'||key==='region';$('#detail-title').textContent=p.name;$('#detail-kicker').textContent=p.tag;$('#detail-copy').textContent=p.description;$('#detail-meta').textContent=p.meta;$('#detail-action').hidden=key!=='estate';
 labels.forEach(l=>l.el.classList.toggle('active',l.key===key));
}
const labelSpecs=[
 ...destinationKeys.map(k=>({key:k,name:places[k].name,p:places[k].p,y:k==='estate'?world.estateBase+world.estateHeight+.12:k==='pagoda'?world.pagodaBase+.42:undefined,max:k==='estate'?160:k==='pagoda'?120:1600,type:k==='estate'?'estate':''})),
 {key:'city',name:'凤城 · 连江县城',p:places.city.p,min:95},
 {name:'江南镇',p:[119.529,26.184],max:170},{name:'敖江镇',p:[119.53994,26.20876],max:170},
 {name:'江滨公园',p:[119.5304,26.19504],max:55},{name:'玉荷东路',p:[119.5448,26.20259],max:9},{name:'敖江路',p:[119.5434,26.2035],max:14},
 {name:'解放大桥',p:[119.53676,26.19503],max:80},{name:'鳌峰大桥',p:[119.54657,26.19684],max:80},{name:'玉泉大桥',p:[119.52546,26.19284],max:75},
 {name:'旗冠顶',p:[119.8575,26.3689],max:90},{name:'黄岐渔港',p:[119.879,26.317],max:140},
 {name:'浦口',p:[119.582,26.247],min:100},{name:'东岱',p:[119.591,26.242],min:100},{name:'琯头',p:[119.561,26.132],min:70},
 {name:'罗 源 湾',p:[119.71,26.425],type:'water',min:200,y:.02},{name:'闽 江 口',p:[119.62,26.115],type:'water',min:110,y:.02},
 {name:'敖 江',p:[119.5488,26.2028],type:'water',max:160,y:.02},{name:'台 湾 海 峡',p:[119.947,26.268],type:'water',min:180,y:.02}
];
const labels=labelSpecs.map(s=>{const el=document.createElement(s.key?'button':'span');el.className=`map-label ${s.type||''}`;el.textContent=s.name;if(s.key){el.setAttribute('aria-label',`前往${s.name}`);el.addEventListener('click',()=>flyTo(s.key));}$('#labels').append(el);return {...s,el,position:vec(...s.p,s.y)};});
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>flyTo(b.dataset.go)));$('.brand').addEventListener('click',e=>{e.preventDefault();flyTo('city');});$('#detail-action').onclick=()=>flyTo('estate',false,true);$('#close-detail').onclick=()=>$('#detail').hidden=true;

$('#layers-button').onclick=()=>{const el=$('#layers');el.hidden=!el.hidden;$('#layers-button').setAttribute('aria-expanded',String(!el.hidden));};
$('#show-buildings').onchange=e=>world.buildings.visible=e.target.checked;$('#show-roads').onchange=e=>world.roads.visible=e.target.checked;$('#show-trees').onchange=e=>world.trees.visible=e.target.checked;$('#show-labels').onchange=e=>$('#labels').hidden=!e.target.checked;
const palettes={day:{sky:'#d7e5df',sun:'#fff1d1',hemi:'#f9f6e4',ground:'#788875',sunI:3,hemiI:2,exposure:1.15,offset:[-40,65,38]},sunset:{sky:'#dfd6c7',sun:'#ffb476',hemi:'#fbe0c2',ground:'#807a65',sunI:3.5,hemiI:1.5,exposure:1.06,offset:[-65,24,30]},night:{sky:'#142f36',sun:'#a3c5d3',hemi:'#b6c9d0',ground:'#304c45',sunI:.7,hemiI:.75,exposure:.95,offset:[-35,65,25]}};
function setTime(mode){timeMode=mode;document.body.dataset.time=mode;const p=palettes[mode];scene.background.set(p.sky);scene.fog.color.set(p.sky);sun.color.set(p.sun);sun.intensity=p.sunI;hemi.color.set(p.hemi);hemi.groundColor.set(p.ground);hemi.intensity=p.hemiI;renderer.toneMappingExposure=p.exposure;world.setNight(mode==='night'?1:0);document.querySelectorAll('[data-time]').forEach(b=>{b.classList.toggle('active',b.dataset.time===mode);b.setAttribute('aria-pressed',String(b.dataset.time===mode));});}
document.querySelectorAll('button[data-time]').forEach(b=>b.onclick=()=>setTime(b.dataset.time));
function stopOrbit(){touring=false;controls.autoRotate=false;$('#tour').textContent='▷ 环绕';$('#tour').classList.remove('active');$('#tour').setAttribute('aria-pressed','false');}
$('#tour').onclick=()=>{touring=!touring;transition=null;controls.autoRotate=touring;$('#tour').textContent=touring?'Ⅱ 暂停':'▷ 环绕';$('#tour').classList.toggle('active',touring);$('#tour').setAttribute('aria-pressed',String(touring));};
controls.addEventListener('start',()=>{transition=null;stopOrbit();});
function zoom(f){transition=null;stopOrbit();const v=camera.position.clone().sub(controls.target);v.setLength(T.MathUtils.clamp(v.length()*f,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(v);}
$('#zoom-in').onclick=()=>zoom(.76);$('#zoom-out').onclick=()=>zoom(1.32);
function orient(top=false){transition=null;stopOrbit();const len=camera.position.distanceTo(controls.target);camera.position.copy(controls.target).add(new T.Vector3(0,top?len:len*.65,top?.02:len*.76));}
$('#north').onclick=()=>orient();$('#top').onclick=()=>orient(true);
let toastTimer;function toast(s){$('#toast').textContent=s;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2500);}
$('#capture').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download=`连江-${places[current].name}-${timeMode}.png`;a.href=renderer.domElement.toDataURL('image/png');a.click();toast('场景图片已保存');};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('请使用浏览器全屏功能');}};
const pointer=new T.Vector2(),ray=new T.Raycaster();let down;
renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);const hits=ray.intersectObject(world.buildings,true);if(!hits.length)return;let o=hits[0].object;while(o){if(o.userData.place){flyTo(o.userData.place);return;}o=o.parent;}const p=hits[0].point;if(Math.hypot(p.x-world.pagodaPos[0],p.z-world.pagodaPos[1])<.1)flyTo('pagoda');});
renderer.domElement.addEventListener('keydown',e=>{if(e.key==='Home'){e.preventDefault();flyTo('city');}else if(e.key==='+'||e.key==='=')zoom(.8);else if(e.key==='-')zoom(1.25);else if(e.key.startsWith('Arrow')){e.preventDefault();transition=null;stopOrbit();const sp=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));if(e.key==='ArrowLeft')sp.theta-=.12;if(e.key==='ArrowRight')sp.theta+=.12;if(e.key==='ArrowUp')sp.phi=Math.max(.06,sp.phi-.1);if(e.key==='ArrowDown')sp.phi=Math.min(Math.PI*.465,sp.phi+.1);camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(sp));}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#layers').hidden=true;$('#layers-button').setAttribute('aria-expanded','false');$('#detail').hidden=true;stopOrbit();}});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const v=new T.Vector3(),projected=new T.Vector3();
function updateLabels(){const occupied=[],distance=camera.position.distanceTo(controls.target);const sorted=[...labels].sort((a,b)=>(b.key===current)-(a.key===current));for(const l of sorted){const anchor=l.position;projected.copy(anchor).project(camera);const x=(projected.x*.5+.5)*innerWidth,y=(-projected.y*.5+.5)*innerHeight;
 let show=projected.z>-1&&projected.z<1&&x>12&&x<innerWidth-25&&y>80&&y<innerHeight-90&&distance>=(l.min||0)&&distance<=(l.max||Infinity);
 if(innerWidth>500&&x<280&&y<innerHeight-110)show=false;if(innerWidth<=500&&y<180&&x<innerWidth-60)show=false;
 const w=l.el.offsetWidth||100,rect={x:x-w/2,y:y-26,w:w+10,h:38};if(show&&occupied.some(r=>rect.x<r.x+r.w&&rect.x+rect.w>r.x&&rect.y<r.y+r.h&&rect.y+rect.h>r.y))show=false;
 if(show){occupied.push(rect);l.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;}
 l.el.hidden=!show;
 }}
function animate(t){requestAnimationFrame(animate);if(transition){let a=transition.duration?Math.min(1,(t-transition.start)/transition.duration):1;a=a*a*(3-2*a);camera.position.lerpVectors(transition.from,transition.to,a);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,a);if(a===1)transition=null;}
 controls.update();const distance=camera.position.distanceTo(controls.target);camera.near=T.MathUtils.clamp(distance/40,.01,35);camera.updateProjectionMatrix();scene.fog.density=distance>220?.00075:distance>30?.0028:.016;
 const extent=T.MathUtils.clamp(distance*.6,2,100);sun.target.position.copy(controls.target);sun.position.copy(controls.target).add(new T.Vector3(...palettes[timeMode].offset));const sc=sun.shadow.camera;sc.left=-extent;sc.right=extent;sc.top=extent;sc.bottom=-extent;sc.updateProjectionMatrix();sun.shadow.normalBias=distance<8?.001:.009;
 world.update(t*.001,!reduced);renderer.render(scene,camera);
 if(frame++%3===0){updateLabels();const offset=v.copy(camera.position).sub(controls.target);$('#compass').style.transform=`rotate(${-Math.atan2(offset.x,offset.z)*180/Math.PI}deg)`;const h=camera.position.y*100;$('#camera-height').textContent=h<1000?`视点海拔 ${Math.round(h)} m`:`视点海拔 ${(h/1000).toFixed(1)} km`;
 const meterPerPixel=2*distance*Math.tan(camera.fov*Math.PI/360)/innerHeight*100;const raw=meterPerPixel*90,pow=10**Math.floor(Math.log10(raw)),nice=[1,2,5,10].map(n=>n*pow).reduce((a,b)=>Math.abs(a-raw)<Math.abs(b-raw)?a:b);$('#scale-line').style.width=`${nice/meterPerPixel}px`;$('#scale-text').textContent=(nice>=1000?`${nice/1000} km`:`${nice} m`)+' · 视心';
 }
}
flyTo('city',true);setTime('day');$('#loading').hidden=true;requestAnimationFrame(animate);
// Read-only diagnostics for local verification.
window.__LIANJIANG__={stats:world.stats,units:'1 scene unit = 100 metres; horizontal and vertical identical',estate:{position:unproject(...world.estatePos),heightMetres:world.estateHeight*100,estimated:true},get camera(){return {position:camera.position.toArray(),target:controls.target.toArray(),place:current};},get render(){return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
