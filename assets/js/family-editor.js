(() => {
  'use strict';
  const $ = id => document.getElementById(id), svg = $('graph');
  const original = {
    father:{name:'Tatăl povestitorului',x:-250,y:-150,z:-100},
    daughter:{name:'Fiica văduvei',x:230,y:-150,z:-100},
    narrator:{name:'Povestitorul',x:-250,y:45,z:110},
    widow:{name:'Văduva',x:230,y:45,z:110},
    boy1:{name:'Primul băiat',x:0,y:-40,z:-180},
    boy2:{name:'Al doilea băiat',x:0,y:205,z:180}
  };
  let people = structuredClone(original), angle = -20, mode3 = true, selected = '', active = -1;
  const facts = window.familyFacts, colors={blood:'#187d75',marriage:'#a35c25',derived:'#7851a9',extended:'#b23f68'};
  const dash={blood:'',marriage:'8 5',derived:'3 5',extended:'10 4 2 4'};
  try {
    const saved = JSON.parse(localStorage.getItem('family-layout-v1'));
    if(saved) for(const id of Object.keys(people)) {
      const p=saved[id];
      if(p && typeof p.name==='string' && ['x','y','z'].every(k=>Number.isFinite(p[k])&&Math.abs(p[k])<700)) people[id]={name:p.name.slice(0,55),x:p.x,y:p.y,z:p.z};
    }
  } catch {}
  function save(){try{localStorage.setItem('family-layout-v1',JSON.stringify(people));$('save-status').textContent='Modificările sunt salvate în acest browser.';}catch{$('save-status').textContent='Salvarea nu este disponibilă. Modificările rămân active până la închiderea paginii.';}}
  function el(tag,attrs={},text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
  function options(){for(const id of ['perspective','person']){const select=$(id),prev=select.value;select.replaceChildren();if(id==='perspective')select.add(new Option('Toată familia',''));for(const [key,p] of Object.entries(people))select.add(new Option(p.name,key));select.value=prev in people?prev:(id==='person'?'narrator':'');}}
  function project(p){const a=mode3?angle*Math.PI/180:0,c=Math.cos(a),s=Math.sin(a),z=mode3?-p.x*s+p.z*c:0;return{x:450+p.x*c+(mode3?p.z*s:0),y:285+p.y-z*.12,z};}
  function describe(f){return f.from===f.to?`${people[f.from].name}: ${f.role}.`:`${people[f.from].name} → ${people[f.to].name}: ${f.role}.`;}
  function choose(id){selected=id;active=-1;$('perspective').value=id;if(id) $('person').value=id;syncEditor();showPerson();draw();}
  function showPerson(){if(!selected){$('detail-title').textContent='Toată familia';$('detail').textContent='Selectează o persoană sau o legătură pentru explicații.';return;}$('detail-title').textContent=people[selected].name;$('detail').textContent=facts.filter(f=>f.from===selected||f.to===selected).map(describe).join('\n');}
  function syncEditor(){const p=people[$('person').value];$('name').value=p.name;$('depth').value=p.z;$('depth').disabled=!mode3;}
  function draw(){
    svg.replaceChildren();const defs=el('defs');
    for(const [kind,color] of Object.entries(colors)){const m=el('marker',{id:'arrow-'+kind,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'});m.append(el('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:color}));defs.append(m);}svg.append(defs);
    const points=Object.fromEntries(Object.entries(people).map(([id,p])=>[id,project(p)]));
    if(mode3){svg.append(el('path',{d:'M450 30 V560',stroke:'#b6c9bf','stroke-dasharray':'4 8',opacity:.5}));svg.append(el('ellipse',{cx:450,cy:515,rx:340,ry:45,fill:'none',stroke:'#cbdad1','stroke-dasharray':'4 7'}));}
    const enabled=new Set([...document.querySelectorAll('.filters input:checked')].map(e=>e.value));
    facts.forEach((f,index)=>{
      if(!enabled.has(f.kind))return;const a=points[f.from],b=points[f.to],related=!selected||f.from===selected||f.to===selected;
      let d;
      if(f.from===f.to)d=`M${a.x-50} ${a.y+23} C${a.x-150} ${a.y+140},${a.x+150} ${a.y+140},${a.x+50} ${a.y+23}`;
      else {const dx=b.x-a.x,dy=b.y-a.y,len=Math.max(1,Math.hypot(dx,dy));const trim=Math.min(1,Math.min(88/Math.max(.01,Math.abs(dx)),32/Math.max(.01,Math.abs(dy))));const start={x:a.x+dx*trim,y:a.y+dy*trim},end={x:b.x-dx*trim,y:b.y-dy*trim};const bend=f.kind==='blood'?0:f.kind==='marriage'?12:(f.kind==='extended'?58:32)*(f.from<f.to?1:-1);d=`M${start.x} ${start.y} Q${(a.x+b.x)/2-dy/len*bend} ${(a.y+b.y)/2+dx/len*bend} ${end.x} ${end.y}`;}
      const g=el('g',{class:'edge',tabindex:0,role:'button','aria-label':describe(f)});g.append(el('title',{},describe(f)));
      g.append(el('path',{d,stroke:colors[f.kind],'stroke-width':active===index?4:2,'stroke-dasharray':dash[f.kind],opacity:related?1:.12,class:'visible',...(f.kind!=='marriage'?{'marker-end':'url(#arrow-'+f.kind+')'}:{})}),el('path',{d,class:'hit'}));
      const activate=()=>{active=index;$('detail-title').textContent='Relația selectată';$('detail').textContent=describe(f);draw();};g.addEventListener('click',activate);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});svg.append(g);
    });
    Object.entries(points).sort((a,b)=>a[1].z-b[1].z).forEach(([id,p])=>{
      const node=el('g',{class:'node'+(selected===id?' selected':''),transform:`translate(${p.x} ${p.y})`,'data-person':id,tabindex:0,role:'button','aria-label':people[id].name});
      node.append(el('rect',{x:-90,y:-32,width:180,height:64,rx:12}));
      const words=people[id].name.split(' '),rows=[''];for(const word of words){if((rows.at(-1)+' '+word).trim().length>21&&rows.length<2)rows.push(word);else rows[rows.length-1]=(rows.at(-1)+' '+word).trim();}
      rows.forEach((line,i)=>node.append(el('text',{x:0,y:rows.length===1?5:-3+i*20},line)));
      node.addEventListener('click',()=>{if(!suppressClick)choose(id);});node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(id);}if($('editing').checked&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();people[id].x+=e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0;people[id].y+=e.key==='ArrowUp'?-10:e.key==='ArrowDown'?10:0;draw();save();}});svg.append(node);
    });
    $('angle').value=angle;$('degrees').textContent=angle+'°';$('view3').setAttribute('aria-pressed',mode3);$('view2').setAttribute('aria-pressed',!mode3);$('angle').disabled=!mode3;$('left').disabled=!mode3;$('right').disabled=!mode3;
  }
  let gesture=null,suppressClick=false;
  function coord(e){const pt=new DOMPoint(e.clientX,e.clientY);return pt.matrixTransform(svg.getScreenCTM().inverse());}
  svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;const id=e.target.closest('[data-person]')?.dataset.person;gesture={id:$('editing').checked?id:null,start:coord(e),last:coord(e),moved:false};suppressClick=false;});
  svg.addEventListener('pointermove',e=>{if(!gesture)return;const p=coord(e),dx=p.x-gesture.last.x,dy=p.y-gesture.last.y;if(Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>5)gesture.moved=true;if(!gesture.moved)return;svg.setPointerCapture(e.pointerId);if(gesture.id){const n=people[gesture.id],a=mode3?angle*Math.PI/180:0;n.x=Math.max(-330,Math.min(330,n.x+dx*Math.cos(a)));n.z=Math.max(-240,Math.min(240,n.z+dx*Math.sin(a)));n.y=Math.max(-220,Math.min(230,n.y+dy));}else if(mode3)angle=Math.round(((angle+dx*.45+540)%360)-180);gesture.last=p;draw();});
  function end(){if(!gesture)return;suppressClick=gesture.moved;if(gesture.id&&gesture.moved){$('person').value=gesture.id;syncEditor();save();}gesture=null;setTimeout(()=>suppressClick=false,0);}
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  $('perspective').addEventListener('change',()=>choose($('perspective').value));
  document.querySelectorAll('.filters input').forEach(i=>i.addEventListener('change',draw));
  $('angle').addEventListener('input',()=>{angle=Number($('angle').value);draw();});
  for(const [id,step] of [['left',-15],['right',15]])$(id).addEventListener('click',()=>{angle=((angle+step+540)%360)-180;draw();});
  for(const [id,value] of [['view3',true],['view2',false]])$(id).addEventListener('click',()=>{mode3=value;syncEditor();draw();});
  $('person').addEventListener('change',()=>choose($('person').value));
  $('name').addEventListener('input',()=>{people[$('person').value].name=$('name').value.trim()||original[$('person').value].name;options();draw();showPerson();save();});
  $('depth').addEventListener('input',()=>{people[$('person').value].z=Number($('depth').value);draw();save();});
  $('reset').addEventListener('click',()=>{people=structuredClone(original);angle=-20;active=-1;options();syncEditor();showPerson();draw();save();});
  options();syncEditor();draw();
})();
