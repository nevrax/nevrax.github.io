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
  globalThis.FamilySpace={scene};
})();
