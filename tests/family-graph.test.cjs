const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'family-relations-standalone.html'),'utf8');
function touchHarness(){
  const handlers={},angles=[];
  const context={plot:{addEventListener:(name,fn)=>handlers[name]=fn},use3d:true,rotation:0,dragged:false,rotate:v=>angles.push(v),setTimeout:fn=>fn()};
  vm.createContext(context);
  const start=html.indexOf('    let touchGesture = null;'),end=html.indexOf('    const saved =',start);
  assert.ok(start>0&&end>start);
  vm.runInContext(html.slice(start,end),context);
  let prevented=0;
  const event=(x,y)=>({touches:[{clientX:x,clientY:y}],cancelable:true,preventDefault:()=>prevented++});
  return {handlers,angles,event,prevented:()=>prevented};
}
test('vertical touch scroll is not intercepted, even with some horizontal movement',()=>{
  const h=touchHarness();h.handlers.touchstart(h.event(100,100));h.handlers.touchmove(h.event(105,150));h.handlers.touchend(h.event(105,150));
  assert.equal(h.prevented(),0);assert.equal(h.angles.length,0);
});
test('horizontal touch rotates while taps preserve native link behavior',()=>{
  const h=touchHarness();h.handlers.touchstart(h.event(100,100));h.handlers.touchend(h.event(100,100));assert.equal(h.prevented(),0);
  h.handlers.touchstart(h.event(100,100));h.handlers.touchmove(h.event(180,104));h.handlers.touchend(h.event(180,104));assert.equal(h.angles[0],52);assert.equal(h.prevented(),2);
});
test('spatial edges do not depend on label dimensions, focus, or label placement',()=>{
  const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'assets/js/family-space.js'),'utf8'),c);
  const {scene,edge}=c.FamilySpace;
  for(const width of [320,390,700,960])for(let angle=0;angle<=1080;angle+=15){
    const space=scene(width,430,angle);
    const before=edge(space,'father','narrator',50);
    space.labels={father:{width:900,x:500,y:900},narrator:{height:500}};
    assert.equal(edge(space,'father','narrator',50),before);
    assert.ok(!/NaN|Infinity/.test(before));
  }
  assert.equal(edge(scene(390,430,0),'father','narrator',50),edge(scene(390,430,1080),'father','narrator',50));
  assert.ok(html.includes("plot.style.touchAction = 'pan-y'"));
  assert.ok(!html.includes("box:element('rect'"));
});
