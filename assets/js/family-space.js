/* Upright camera; yaw only. Coordinates and fit stay fixed during rotation. */
(() => {
  function scene(width, height, degrees, enabled = true) {
    const middle=width/2, centerY=height/2;
    const reach=Math.max(40,middle-(width<480?65:90)),depth=reach*.7;
    const world={
      father:{x:-reach,y:height*.29-centerY,z:-depth},
      daughter:{x:reach,y:height*.29-centerY,z:-depth},
      narrator:{x:-reach,y:height*.65-centerY,z:depth},
      widow:{x:reach,y:height*.65-centerY,z:depth},
      boy1:{x:0,y:42-centerY,z:depth*.45},
      boy2:{x:0,y:height-35-centerY,z:-depth*.45}
    };
    const radius=Math.max(...Object.values(world).map(p=>Math.hypot(p.x,p.z)));
    const camera=radius*7,fit=reach/(radius*camera/(camera-radius));
    const a=enabled?(degrees%360)*Math.PI/180:0,c=Math.cos(a),s=Math.sin(a);
    function project(p){
      if(!enabled)return {x:middle+p.x,y:centerY+p.y,z:0,scale:1};
      const x=p.x*c+p.z*s,z=-p.x*s+p.z*c;
      const perspective=camera/(camera+z);
      return {x:middle+x*fit*perspective,y:centerY+p.y*perspective,z,scale:perspective};
    }
    return {world,project,nodes:Object.fromEntries(Object.entries(world).map(([id,p])=>[id,project(p)]))};
  }
  function edge(space,from,to,bend=0){
    const a=space.world[from],b=space.world[to];
    let p0,p1,p2,p3;
    if(from===to){
      p0={x:a.x-8,y:a.y+6,z:a.z};p3={x:a.x+8,y:a.y+6,z:a.z};
      p1={x:a.x-80,y:a.y+80,z:a.z+35};p2={x:a.x+80,y:a.y+80,z:a.z+35};
    }else{
      p0=a;p3=b;
      p1={x:a.x+(b.x-a.x)/3,y:a.y+(b.y-a.y)/3,z:a.z+(b.z-a.z)/3+bend};
      p2={x:a.x+(b.x-a.x)*2/3,y:a.y+(b.y-a.y)*2/3,z:a.z+(b.z-a.z)*2/3+bend};
    }
    const [s,c1,c2,e]=[p0,p1,p2,p3].map(space.project);
    const trim=(p,q)=>{const dx=q.x-p.x,dy=q.y-p.y,n=Math.hypot(dx,dy)||1;return{x:p.x+dx/n*7,y:p.y+dy/n*7};};
    const start=trim(s,c1),end=trim(e,c2);
    return `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
  }
  globalThis.FamilySpace={scene,edge};
})();
