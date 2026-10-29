/* Pinned typing and subtle head motion. Props stay fixed; greeting has no arm layer. */
(() => {
  const VERTEX = `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
      gl_Position = vec4(position, 0., 1.);
    }`;
  const FRAGMENT = `
    precision highp float;
    varying vec2 uv;
    uniform sampler2D roomTexture, waveTexture, catTexture;
    uniform float time, typing, turned, blinking, beat, daylight;
    uniform vec4 keys;
    float pin(vec2 p, vec2 center, vec2 radius) {
      vec2 d = (p - center) / radius;
      float r = dot(d,d);
      return (1. - smoothstep(.62, 1., r)) * exp(-r * 1.8);
    }
    vec2 commonWarp(vec2 p) {
      vec2 q = p;
      float breath = sin(time * 1.35);
      // Neck, elbows and the edge of the illustration stay pinned.
      float shoulder = pin(p, vec2(226.,559.), vec2(162.,204.));
      q.y -= shoulder * breath * 1.6;
      float head = pin(p, vec2(213.,314.), vec2(146.,158.));
      float nod = breath * 1.0 + (1. - turned) * typing * sin(beat * 6.28318) * 1.4;
      q -= head * vec2(sin(time * .8) * 1.5, nod);
      // Alternating fingertip strokes, followed by smaller palm and wrist motion.
      float work = (1. - turned) * typing;
      q.y -= work * keys.x * pin(p, vec2(539.,679.), vec2(22.,26.));
      q.y -= work * keys.y * pin(p, vec2(439.,652.), vec2(20.,24.));
      q.y -= work * keys.z * pin(p, vec2(525.,656.), vec2(24.,23.));
      q.y -= work * keys.w * pin(p, vec2(425.,638.), vec2(22.,22.));
      float nearPalm = pin(p, vec2(476.,673.), vec2(73.,53.));
      float farPalm = pin(p, vec2(387.,643.), vec2(61.,43.));
      q.y -= work * (nearPalm * (keys.x + keys.z) * .18 + farPalm * (keys.y + keys.w) * .16);
      return q;
    }
    vec4 patch(sampler2D tex, vec2 p, vec2 origin, vec2 size) {
      vec2 t = (p - origin) / size;
      if (t.x < 0. || t.y < 0. || t.x > 1. || t.y > 1.) return vec4(0.);
      return texture2D(tex,t);
    }
    vec4 over(vec4 base, vec4 top) {
      float a = top.a + base.a * (1. - top.a);
      vec3 rgb = (top.rgb * top.a + base.rgb * base.a * (1. - top.a)) / max(a,.0001);
      return vec4(rgb,a);
    }
    float lamp(vec2 p, vec2 center, float phase) {
      vec2 d = (p-center)/18.;
      return exp(-dot(d,d)*2.) * (.6 + .4 * sin(time*1.9+phase));
    }
    void main() {
      vec2 p = uv * 1024., q = commonWarp(p);
      vec4 color = texture2D(roomTexture,q/1024.);
      if (turned > .5) color = over(color,patch(waveTexture,q,vec2(48.,180.),vec2(512.,690.)));
      if (blinking > .5) color = over(color,patch(catTexture,q,vec2(576.,582.),vec2(284.,184.)));
      float glow = lamp(p,vec2(650.,111.),0.) + lamp(p,vec2(700.,125.),1.2)
        + lamp(p,vec2(758.,117.),2.4) + lamp(p,vec2(813.,99.),3.6) + lamp(p,vec2(870.,78.),4.8);
      color.rgb += vec3(1.,.55,.15) * glow * mix(.11,.035,daylight);
      gl_FragColor = color;
    }`;

  function create(scene) {
    const stage = scene.querySelector('.dk-stage'), canvas = document.createElement('canvas');
    canvas.className = 'dk-motion-canvas';canvas.setAttribute('aria-hidden','true');
    const gl = canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,preserveDrawingBuffer:true});
    if (!gl) return null;
    function compile(type,source) {
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    }
    let program;
    try {
      program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,VERTEX));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FRAGMENT));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch(error) {console.warn('Desk motion could not start:',error.message);return null;}
    gl.useProgram(program);
    const geometry=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,geometry);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const names=['time','typing','turned','blinking','beat','daylight','keys'];
    const uniforms=Object.fromEntries(names.map(name=>[name,gl.getUniformLocation(program,name)]));
    const textures=['roomTexture','waveTexture','catTexture'].map((name,i)=>{
      const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(program,name),i);return texture;
    });
    stage.append(canvas);
    let active=false,ready=false,raf=0,last=0,ticket=0,keyIndex=0;
    const state={typing:false,turned:false,blinking:false,theme:'night',beat:0,beatAt:0};
    const presses=[-Infinity,-Infinity,-Infinity,-Infinity], sequence=[0,1,2,1,0,3,2,1];
    function resize() {
      const resolution=Math.min(1024,Math.max(512,Math.ceil(scene.clientWidth*Math.min(devicePixelRatio||1,1.5))));
      if(canvas.width!==resolution){canvas.width=resolution;canvas.height=resolution;gl.viewport(0,0,resolution,resolution);}
    }
    function render(now) {
      if(!ready) return;
      resize();gl.useProgram(program);
      const time=now/1000;
      gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.typing,state.typing?1:0);gl.uniform1f(uniforms.turned,state.turned?1:0);
      gl.uniform1f(uniforms.blinking,state.blinking?1:0);gl.uniform1f(uniforms.daylight,state.theme==='day'?1:0);
      gl.uniform1f(uniforms.beat,state.beat+(now-state.beatAt)/1000/(60/90));
      const keys=presses.map(t=>{const k=(now-t)/145;return k>0&&k<1?-Math.sin(k*Math.PI)*8:0;});
      gl.uniform4f(uniforms.keys,...keys);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      scene.classList.add('has-motion');
    }
    function frame(now) {
      raf=0;if(!active||!ready)return;
      if(now-last>=32){last=now;render(now);}
      raf=requestAnimationFrame(frame);
    }
    function start() {if(active&&ready&&!raf)raf=requestAnimationFrame(frame);}
    async function setSources(sources) {
      const own=++ticket;
      const images=await Promise.all([sources.room,sources.wave,sources.cat].map(async src=>{
        const img=new Image();img.src=src;await img.decode();return img;
      })).catch(()=>null);
      if(!images||own!==ticket)return false;
      images.forEach((image,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);});
      ready=true;if(active)render(performance.now());start();return true;
    }
    function setActive(on) {
      active=on;cancelAnimationFrame(raf);raf=0;
      if(on){last=0;start();}else scene.classList.remove('has-motion');
    }
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;setActive(false);});
    return {
      setSources,setActive,
      setState(next){Object.assign(state,next);if('beat' in next)state.beatAt=performance.now();},
      press(now){const key=sequence[keyIndex++%sequence.length];presses[key]=now;return key;},

    };
  }
  window.HeroDeskMotion={create};
})();
