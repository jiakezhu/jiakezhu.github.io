import { createStoryTerminals } from './story-world-terminals.js?v=8';
import * as T from './vendor/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { OrbitControls } from './story-vendor/controls/OrbitControls.js';
import { GLTFLoader } from './story-vendor/loaders/GLTFLoader.js';
import { DRACOLoader } from './story-vendor/loaders/DRACOLoader.js';
import { KTX2Loader } from './story-vendor/loaders/KTX2Loader.js';
import { Reflector } from './story-vendor/objects/Reflector.js';
import { EffectComposer } from './story-vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './story-vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './story-vendor/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from './story-vendor/postprocessing/ShaderPass.js';
import { SMAAPass } from './story-vendor/postprocessing/SMAAPass.js';
import { OutputPass } from './story-vendor/postprocessing/OutputPass.js';
import { TextGeometry } from './story-vendor/geometries-TextGeometry.js';
import { FontLoader } from './story-vendor/loaders-FontLoader.js';

// Complete scene and baked art from Jesse Zhou's Ramen-Shop, adapted locally for Jiake's Story.
// Source attribution and asset provenance: images/story-ramen/ATTRIBUTION.md.
export async function createStoryWorld(canvas,{onPick,onHover,onFailure,onEffect,onCredits,onExit,onRead,reduced}) {
  const base=new URL('../images/story-ramen/',document.baseURI);
  const asset=path=>new URL(path,base).href;
  const vendor=path=>new URL('./story-vendor/'+path,import.meta.url).href;
  const small=matchMedia('(max-width:700px)').matches;
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,small?1.5:2));
  renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene();scene.background=new T.Color('#000000');
  const camera=new T.PerspectiveCamera(75,1,.1,80);
  const defaultPosition=new T.Vector3(-11.1,-1,-7.6),defaultTarget=new T.Vector3(0,0,-1);
  camera.position.copy(defaultPosition);
  const controls=new OrbitControls(camera,canvas);
  controls.target.copy(defaultTarget);controls.enableDamping=true;controls.dampingFactor=.075;
  controls.enablePan=false;controls.rotateSpeed=.8;controls.zoomSpeed=.7;
  controls.minDistance=7;controls.maxDistance=22;controls.minPolarAngle=Math.PI*.17;controls.maxPolarAngle=Math.PI*.51;
  const draco=new DRACOLoader().setDecoderPath(vendor('draco/')).setWorkerLimit(2);
  const gltf=new GLTFLoader().setDRACOLoader(draco);
  const ktx=new KTX2Loader().setTranscoderPath(vendor('basis/')).setWorkerLimit(2).detectSupport(renderer);
  const loadTexture=async path=>{const tx=await ktx.loadAsync(asset(path));tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return tx;};
  const bakedNames=['ramenShop','machines','floor','misc','graphics'];
  const [shop,hologram,...textures]=await Promise.all([
    gltf.loadAsync(asset('models/ramenShop/glTF/ramenShop.gltf')),
    gltf.loadAsync(asset('models/ramenShop/glTF/ramenHologram.gltf')),
    ...bakedNames.map(name=>loadTexture(`textures/baked/${name}Baked${name==='graphics'?'512':'1024'}.ktx2`)),
    ...['dishMatCap','fanMatCap','neonBlueMatCap','neonGreenMatCap'].map(name=>loadTexture(`textures/matcaps/${name}.ktx2`)),
    loadTexture('textures/screens/vendingMachineScreens/vendingMachineMenu.ktx2'),
    loadTexture('textures/screens/vendingMachineScreens/project1.ktx2'),
    loadTexture('textures/screens/aboutMeScreens/bigScreenAbout.ktx2')
  ]);
  draco.dispose();ktx.dispose();
  const model=shop.scene;model.position.y=-3;scene.add(model);
  const objects={};model.traverse(object=>{if(object.isMesh)objects[object.name]=object;});
  for(let i=0;i<bakedNames.length;i++) {
    const name=bakedNames[i];objects[name==='floor'?'floor':name+'Joined'].material=new T.MeshBasicMaterial({map:textures[i]});
  }
  // The old owner name is baked into this small floor-atlas region, as well as existing as a mesh.
  // Restore only that lettering footprint from its surrounding light field; retain the source ground elsewhere.
  const floorSurface=objects.floor.material;
  floorSurface.onBeforeCompile=shader=>{
    const clearOwner=`
      vec2 ownerMin=vec2(582.0,402.0)/1024.0, ownerMax=vec2(651.0,516.0)/1024.0;
      if(all(greaterThan(vMapUv,ownerMin))&&all(lessThan(vMapUv,ownerMax))){
        vec2 t=(vMapUv-ownerMin)/(ownerMax-ownerMin);
        vec3 c00=texture2D(map,ownerMin).rgb;
        vec3 c10=texture2D(map,vec2(ownerMax.x,ownerMin.y)).rgb;
        vec3 c01=texture2D(map,vec2(ownerMin.x,ownerMax.y)).rgb;
        vec3 c11=texture2D(map,ownerMax).rgb;
        vec3 clean=mix(mix(c00,c10,t.x),mix(c01,c11,t.x),t.y);
        vec2 edge=min(vMapUv-ownerMin,ownerMax-vMapUv);
        float blend=smoothstep(0.0,6.0/1024.0,edge.x)*smoothstep(0.0,14.0/1024.0,edge.y);
        sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,clean,blend);
      }
    `;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',clearOwner+'\n diffuseColor *= sampledDiffuseColor;'));
  };
  floorSurface.customProgramCacheKey=()=> 'jiake-clean-owner-floor-v1';
  const basic=color=>new T.MeshBasicMaterial({color});
  const palette={green:basic('#1EFF51'),red:basic('#FF0033'),white:basic('#FFFFFF'),black:basic('#000000'),pink:basic('#FF2FD5'),blue:basic('#01DDFF'),orange:basic('#FF5100'),redLED:basic('#FF112B'),greenLED:basic('#00FF00')};
  const materialGroups={
    green:['greenSignSquare','chinese'],red:['projectsRed','articlesRed','arcadeToken'],white:['projectsWhite','articlesWhite','whiteButton','vendingMachineLight','lampLights'],
    black:['jZhouBlack','aboutMeBlack','creditsBlack'],pink:['jZhouPink'],blue:['aboutMeBlue','blueLights'],orange:['creditsOrange','yellowRightLight'],redLED:['redLED'],greenLED:['greenLED']
  };
  for(const [key,names] of Object.entries(materialGroups))for(const name of names)objects[name].material=palette[key];
  const glowing={neonYellow:'#FFF668',neonPink:'#FF3DCB',neonBlue:'#00BBFF',poleLight:'#FF5EF1',neonGreen:'#56FF54',portalLight:'#00BBFF',storageLight:'#00BBFF',arcadeRim:'#00BBFF'};
  const bloomObjects=new Set();for(const [name,color] of Object.entries(glowing)){objects[name].material=basic(color);bloomObjects.add(objects[name]);}
  for(const name of ['chinese','whiteButton','redLED','greenLED'])bloomObjects.add(objects[name]);
  objects.dish.material=new T.MeshMatcapMaterial({matcap:textures[5],side:T.DoubleSide});objects.dishStand.material=objects.dish.material;
  objects.fan1.material=new T.MeshMatcapMaterial({matcap:textures[6]});objects.fan2.material=objects.fan1.material;
  // Keep the complete model and its original UVs. Only identity and content surfaces change.
  await document.fonts.ready;
  const [font,signFont]=await Promise.all(['helvetiker_regular.typeface.json','helvetiker_bold.typeface.json'].map(async name=>new FontLoader().parse(await fetch(vendor(name)).then(r=>r.json()))));
  model.updateMatrixWorld(true);
  const nameBounds=new T.Box3().setFromObject(objects.jesseZhouJoined),nameCenter=nameBounds.getCenter(new T.Vector3());
  objects.jesseZhouJoined.removeFromParent();
  const identity=new T.Group();identity.rotation.set(-Math.PI/2,0,-Math.PI/2);identity.position.copy(nameCenter);scene.add(identity);
  const floorInk=basic('#e4efef'),floorCaptionInk=basic('#c4d9dc');
  function floorLine(text,size,y,typeface=font,material=floorCaptionInk){
    const geometry=new TextGeometry(text,{font:typeface,size,depth:.006,curveSegments:10,bevelEnabled:false});geometry.computeBoundingBox();
    const width=geometry.boundingBox.max.x-geometry.boundingBox.min.x;if(width>2.95)geometry.scale(2.95/width,2.95/width,1);
    const line=new T.Mesh(geometry,material);line.position.set(-1.475,y,.008);line.userData.section='growth';identity.add(line);
  }
  floorLine('JIAKE ZHU',.31,.38,signFont,floorInk);
  floorLine('Tencent Cloud | Technology, Product & Business',.105,.08);
  floorLine('AI tools for sales, languages and everyday life',.105,-.10);
  floorLine('Chinese / English / French / Spanish',.105,-.28);
  const identityHit=new T.Mesh(new T.PlaneGeometry(3.12,1.22),basic('#000000'));identityHit.position.set(0,.24,0);identityHit.visible=false;identityHit.userData.section='growth';identity.add(identityHit);
  const makeCanvas=(ratio,draw)=>{
    const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024/ratio);draw(c.getContext('2d'),c.width,c.height);
    const tx=new T.CanvasTexture(c);tx.flipY=false;tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=8;return tx;
  };
  // Replace the original lettering while retaining the neon frame, chopsticks and every surrounding prop.
  const pinkGeometry=objects.neonPink.geometry.clone(),pinkPositions=pinkGeometry.attributes.position,oldIndices=pinkGeometry.index.array,keep=[];
  const isOldLetter=i=>pinkPositions.getX(i)>-1.93&&pinkPositions.getX(i)<1.91&&pinkPositions.getY(i)>-.81&&pinkPositions.getY(i)<-.23&&pinkPositions.getZ(i)>.22&&pinkPositions.getZ(i)<.28;
  for(let i=0;i<oldIndices.length;i+=3)if(!(isOldLetter(oldIndices[i])&&isOldLetter(oldIndices[i+1])&&isOldLetter(oldIndices[i+2])))keep.push(oldIndices[i],oldIndices[i+1],oldIndices[i+2]);
  pinkGeometry.setIndex(keep);objects.neonPink.geometry=pinkGeometry;
  // A layered enamel face and solid, bevelled letter cores stay legible in the wide view.
  const signCase=new T.Mesh(new RoundedBoxGeometry(4.44,1.00,.14,3,.028),basic('#24465c'));
  signCase.position.set(0,-.535,.29);objects.neonPink.add(signCase);
  const signFace=makeCanvas(4.38/.91,(ctx,w,h)=>{
    const wash=ctx.createLinearGradient(0,0,0,h);wash.addColorStop(0,'#214b63');wash.addColorStop(.38,'#163b55');wash.addColorStop(1,'#0c233a');ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
    const sheen=ctx.createLinearGradient(0,0,w,h);sheen.addColorStop(0,'#6bc6d22b');sheen.addColorStop(.5,'#a7e6ec08');sheen.addColorStop(1,'#00172b00');ctx.fillStyle=sheen;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#8cccd43d';ctx.lineWidth=2;ctx.strokeRect(8,8,w-16,h-16);
  });signFace.flipY=true;
  const face=new T.Mesh(new T.PlaneGeometry(4.38,.91),new T.MeshBasicMaterial({map:signFace}));face.position.set(0,-.535,.365);objects.neonPink.add(face);
  function signLetter(text,size,typeface,materials,y,z){
    const geometry=new TextGeometry(text,{font:typeface,size,depth:.020,curveSegments:14,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:3});geometry.computeBoundingBox();geometry.translate(-(geometry.boundingBox.min.x+geometry.boundingBox.max.x)/2,0,0);
    const mesh=new T.Mesh(geometry,materials);mesh.position.set(0,y,z);objects.neonPink.add(mesh);return mesh;
  }
  const mainLetter=signLetter('JIAKE ZHU',.47,signFont,[basic('#fff8e8'),basic('#65c0cd')],-.635,.38);
  mainLetter.userData.bloomMaterial=basic('#57c9ee');bloomObjects.add(mainLetter);
  signLetter('S T O R Y   C O R N E R',.105,font,basic('#94e4e9'),-.889,.38);
  // White lamp cores with a separate pink halo avoid flat, saturated magenta globes.
  objects.poleLight.material=basic('#fff3fc');objects.poleLight.userData.bloomMaterial=basic('#e85cc4');
  objects.jZhouBlack.visible=false;
  const badge=makeCanvas(1,(ctx,w,h)=>{ctx.fillStyle='#ff2fd5';ctx.fillRect(0,0,w,h);ctx.fillStyle='#10131b';for(let i=0;i<23;i++){if(i%4!==1)ctx.fillRect(115+i*35,140,9+(i%3)*5,365);}ctx.font='700 93px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText('JIAKE ZHU',w/2,735);});badge.flipY=true;
  const badgeMesh=new T.Mesh(new T.PlaneGeometry(.65,.65),new T.MeshBasicMaterial({map:badge}));badgeMesh.rotation.y=-Math.PI/2;badgeMesh.position.x=-.043;badgeMesh.userData.section='growth';objects.jZhouPink.add(badgeMesh);
  const signCanvas=(title,subtitle,color='#a4eefd',ratio=1.63)=>makeCanvas(ratio,(ctx,w,h)=>{
    ctx.fillStyle='#04141d';ctx.fillRect(0,0,w,h);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(25,25,w-50,h-50);
    ctx.fillStyle=color;let size=74;ctx.font=`600 ${size}px "Jiake Rounded","PingFang SC",sans-serif`;while(ctx.measureText(title).width>w*.85){size-=2;ctx.font=`600 ${size}px "Jiake Rounded","PingFang SC",sans-serif`;}
    ctx.textAlign='center';ctx.fillText(title,w/2,h*.43);
    ctx.fillStyle='#a0b9c7';ctx.font='27px "Jiake Rounded","PingFang SC",sans-serif';ctx.fillText(subtitle,w/2,h*.60,w*.86);
    ctx.font='18px monospace';ctx.fillStyle=color;ctx.fillText('JIAKE ZHU  /  MY STORY  /  ENTER',w/2,h-65);
  });
  const photo=async(path,ratio)=>{const image=await new T.TextureLoader().loadAsync(path);return makeCanvas(ratio,(ctx,w,h)=>{
    ctx.fillStyle='#08151c';ctx.fillRect(0,0,w,h);const scale=Math.min(w/image.image.width,h/image.image.height),dw=image.image.width*scale,dh=image.image.height*scale;ctx.drawImage(image.image,(w-dw)/2,(h-dh)/2,dw,dh);image.dispose();
  });};
  const comicPages=await Promise.all([1,2,3,4].map(n=>photo(new URL(`../images/comic/page-${String(n).padStart(2,'0')}-small.webp`,document.baseURI).href,1.63)));
  const covers=await Promise.all([...document.querySelectorAll('.journal-card-cover img')].slice(0,6).map(img=>photo(img.src,1.17)));
  const vendingCovers=await Promise.all([...document.querySelectorAll('.journal-card-cover img')].slice(0,6).map(img=>photo(img.src,.854)));
  const slides=[],screenMaterials={};
  function screen(name,images,{duration=8}={}) {
    // Upstream screen UVs occupy rotated atlas strips. Normalize only the personal content surfaces.
    const geometry=objects[name].geometry.clone();geometry.computeBoundingBox();const bounds=geometry.boundingBox,position=geometry.attributes.position,uv=new Float32Array(position.count*2);
    const fraction=(value,min,max)=>(value-min)/(max-min);
    for(let i=0;i<position.count;i++){
      if(name==='sideScreen'){uv[i*2]=fraction(position.getZ(i),bounds.min.z,bounds.max.z);uv[i*2+1]=1-fraction(position.getX(i),bounds.min.x,bounds.max.x);}
      else if(['vendingMachineScreen','easelFrontGraphic'].includes(name)){uv[i*2]=fraction(position.getX(i),bounds.min.x,bounds.max.x);uv[i*2+1]=1-fraction(position.getY(i),bounds.min.y,bounds.max.y);}
      else {uv[i*2]=fraction(position.getX(i),bounds.min.x,bounds.max.x);uv[i*2+1]=fraction(position.getZ(i),bounds.min.z,bounds.max.z);}
    }
    geometry.setAttribute('uv',new T.BufferAttribute(uv,2));objects[name].geometry=geometry;
    const material=new T.ShaderMaterial({uniforms:{imageA:{value:images[0]},imageB:{value:images[1]||images[0]},progress:{value:0}},
      vertexShader:'varying vec2 screenUv;void main(){screenUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec2 screenUv;uniform sampler2D imageA;uniform sampler2D imageB;uniform float progress;
      void main(){vec3 color=mix(texture2D(imageA,screenUv).rgb,texture2D(imageB,screenUv).rgb,progress);gl_FragColor=vec4(color,1.);
      #include <colorspace_fragment>
      }`
    });
    objects[name].material=material;screenMaterials[name]=material;if(images.length>1)slides.push({material,images,duration,offset:slides.length*2.1});
  }
  screen('bigScreen',[signCanvas('朱佳科 / JIAKE ZHU','Multidisciplinary · Multilingual · Multi-industry')]);
  screen('vendingMachineScreen',[signCanvas('AI 作品集','Choose a bottle to explore','#98ffb4',.854)]);
  screen('arcadeScreen',[signCanvas('小朱还在想','Essays & questions worth sharing','#ffad6d',1.14)]);
  screen('sideScreen',[signCanvas('ALWAYS DAY ONE.','你好，我是朱佳科。','#a4eefd',3.9),signCanvas('STAY CURIOUS.','把好奇心写成故事。','#ff9ce6',3.9)],{duration:9});
  screen('smallScreen1',covers.slice(0,3));screen('smallScreen2',covers.slice(3,6));
  screen('easelFrontGraphic',[signCanvas('拖动环顾小店','点击招牌，打开我的故事。','#c7d7c3',.6)]);
  // The original scene's six small moving displays are retained, including its chroma-key treatment.
  const videos=[];
  for(const name of ['littleTVScreen','tallScreen','tvScreen','smallScreen3','smallScreen4','smallScreen5']) {
    const video=document.createElement('video');video.src=asset(`textures/videosTextures/${name}.mp4`);video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';
    const tx=new T.VideoTexture(video);tx.flipY=false;tx.colorSpace=T.SRGBColorSpace;
    objects[name].material=new T.ShaderMaterial({transparent:true,uniforms:{image:{value:tx}},
      vertexShader:'varying vec2 screenUv;void main(){screenUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec2 screenUv;uniform sampler2D image;void main(){vec4 color=texture2D(image,screenUv);float key=step(color.r+.2,color.g)*step(color.b+.2,color.g);gl_FragColor=vec4(color.rgb,1.-key);
      #include <colorspace_fragment>
      }`
    });
    videos.push(video);if(!reduced.matches)video.play().catch(()=>{});
  }
  const positions=[];hologram.scene.traverse(mesh=>{if(mesh.isMesh)positions.push(...mesh.geometry.attributes.position.array);});
  const hologramGeometry=new T.BufferGeometry();hologramGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  const holo=new T.Points(hologramGeometry,new T.PointsMaterial({size:.013,color:'#00ffff',transparent:true,opacity:.9,depthWrite:false}));
  holo.scale.setScalar(.0225);holo.position.set(-.1,2,-.95);scene.add(holo);bloomObjects.add(holo);
  const grid=new T.Mesh(new T.CircleGeometry(.68,48),new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},
    vertexShader:'varying vec2 gridUv;void main(){gridUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 gridUv;uniform float time;void main(){vec2 p=gridUv+vec2(sin(time*.3),cos(time*.2))*.1;float a=max(step(.92,fract(p.x*24.)),step(.92,fract(p.y*24.)));float b=max(step(.87,fract(p.x*8.)),step(.87,fract(p.y*8.)));gl_FragColor=vec4(.05,.9,1.,max(a*.5,b)*.8);}'
  }));grid.rotation.x=-Math.PI/2;grid.position.set(-.13,2.15,-.95);scene.add(grid);bloomObjects.add(grid);
  const mirror=new Reflector(new T.CircleGeometry(25,64),{textureWidth:small?512:1024,textureHeight:small?512:1024,clipBias:.003,color:0x777777});
  mirror.rotation.x=-Math.PI/2;mirror.position.y=-2.8;mirror.material.transparent=true;mirror.material.depthWrite=false;
  mirror.material.fragmentShader=mirror.material.fragmentShader.replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4( blendOverlay( base.rgb, color ), 0.04 )');scene.add(mirror);
  // Original-style selective neon bloom: the baked walls never enter the bloom pass.
  const bloomComposer=new EffectComposer(renderer);bloomComposer.renderToScreen=false;
  bloomComposer.addPass(new RenderPass(scene,camera));bloomComposer.addPass(new UnrealBloomPass(new T.Vector2(1,1),.35,.25,0));
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const combine=new ShaderPass(new T.ShaderMaterial({uniforms:{baseTexture:{value:null},bloomTexture:{value:bloomComposer.renderTarget2.texture}},
    vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 v;uniform sampler2D baseTexture;uniform sampler2D bloomTexture;void main(){gl_FragColor=vec4(texture2D(baseTexture,v).rgb+texture2D(bloomTexture,v).rgb,1.);}'
  }),'baseTexture');composer.addPass(combine);composer.addPass(new OutputPass());composer.addPass(new SMAAPass(1,1));
  const dark=new T.MeshBasicMaterial({color:'#000000'}),blackPoints=new T.PointsMaterial({color:'#000000',size:.013}),saved=new Map();
  function render(){
    mirror.visible=false;
    scene.traverse(mesh=>{if(!mesh.isMesh&&!mesh.isPoints)return;if(mesh.userData.bloomMaterial){saved.set(mesh,mesh.material);mesh.material=mesh.userData.bloomMaterial;}else if(!bloomObjects.has(mesh)){saved.set(mesh,mesh.material);mesh.material=mesh.isPoints?blackPoints:dark;}});
    bloomComposer.render();for(const [mesh,material] of saved)mesh.material=material;saved.clear();mirror.visible=true;composer.render();
  }
  const sectionNames={journal:['projectsRed','projectsWhite','vendingMachineScreen','smallScreen1','smallScreen2'],wechat:['articlesRed','articlesWhite','arcadeScreen','sideScreen'],growth:['aboutMeBlack','aboutMeBlue','bigScreen','tvScreen','littleTVScreen','tallScreen','smallScreen3','smallScreen4','smallScreen5']};
  const hoverLetters=['projectsWhite','articlesWhite','aboutMeBlack'];for(const name of hoverLetters)objects[name].material=objects[name].material.clone();
  for(const [id,names] of Object.entries(sectionNames))for(const name of names)objects[name].userData.section=id;
  identity.userData.section='growth';objects.jZhouBlack.userData.section='growth';objects.jZhouPink.userData.section='growth';objects.creditsBlack.userData.section='credits';objects.creditsOrange.userData.section='credits';
  const hitTargets=[];
  function hitbox(x,y,z,w,h,d,id){const box=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));box.position.set(x,y,z);box.userData.section=id;box.userData.hitbox=true;box.visible=false;scene.add(box);hitTargets.push(box);}
  hitbox(1.15,-1.1,2.1,1.6,3.1,1.6,'journal');hitbox(-.58,-1.5,2.25,1.3,2.9,1.8,'wechat');
  hitbox(0,4,-1,2,2,2,'hologram');
  const ray=new T.Raycaster(),pointer=new T.Vector2();
  let width=0,height=0,transition=null,focused=null,down=null,hover=null,active=true,dirty=true,last=0,raf=0,burst=0;
  const focusViews={journal:{position:[1.15,-1.2,4.2],target:[1.15,-1.2,1.7]},wechat:{position:[-.6,-1.05,3.8],target:[-.6,-1.05,2.2]},growth:{position:[.66,3.8,2.2],target:[.66,3.8,.7]}};
  function focus(id){focused=id;terminals.open(id);const sourceView=focusViews[id],view=sourceView?{position:[...sourceView.position],target:[...sourceView.target]}:null;if(view&&width<700){if(id==='journal')view.position[2]=5.0;if(id==='growth')view.position[2]=5.1;}controls.enabled=false;transition={from:camera.position.clone(),targetFrom:controls.target.clone(),to:view?new T.Vector3(...view.position):defaultPosition.clone(),targetTo:view?new T.Vector3(...view.target):defaultTarget.clone(),start:performance.now(),duration:reduced.matches?0:1500};controls.minDistance=!view?7:id==='journal'?2:id==='wechat'?1.5:1;controls.maxDistance=!view?22:id==='journal'?(width<700?4.2:3.5):id==='wechat'?2.5:(width<700?5:2.2);controls.enableRotate=!view;camera.clearViewOffset();camera.updateProjectionMatrix();dirty=true;}
  function resize(){width=canvas.clientWidth;height=canvas.clientHeight;renderer.setSize(width,height,false);bloomComposer.setSize(width,height);composer.setSize(width,height);camera.aspect=width/height;
    if(width<700){camera.fov=75;defaultPosition.set(-15,2,-11.5);}else{camera.fov=75;defaultPosition.set(-11.1,-1,-7.6);}
    camera.clearViewOffset();if(!focused&&!transition){camera.position.copy(defaultPosition);controls.target.copy(defaultTarget);}if(transition&&!focused)transition.to.copy(defaultPosition);camera.updateProjectionMatrix();dirty=true;}
  function pick(event){const bounds=canvas.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);ray.setFromCamera(pointer,camera);
    const hits=ray.intersectObjects([...model.children,identity,...hitTargets],true);return hits[0]?.object.userData.section||null;
  }
  function updateHover(id){hover=id;onHover(['hologram','credits'].includes(id)?null:id);for(const name of hoverLetters){objects[name].material.color.set(id===objects[name].userData.section?'#f6ef9b':name==='aboutMeBlack'?'#000000':'#ffffff');}canvas.style.setProperty('cursor',id?'pointer':'grab','important');dirty=true;}
  updateHover(null);
  canvas.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY};});
  canvas.addEventListener('pointerup',event=>{if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<7){const id=pick(event);if(id==='hologram'){burst=performance.now();onEffect?.('hologram');}else if(id==='credits'){onEffect?.('click');onCredits?.();}else if(id&&id!==focused)onPick(id);}down=null;});
  canvas.addEventListener('pointercancel',()=>{down=null;});canvas.addEventListener('pointermove',event=>{if(down)return;const id=pick(event);if(id!==hover)updateHover(id);});canvas.addEventListener('pointerleave',()=>updateHover(null));controls.addEventListener('change',()=>{dirty=true;});
  const terminals=await createStoryTerminals({renderer,camera,canvas,objects,materials:screenMaterials,sourceTextures:textures.slice(9),onExit,onRead,onEffect,reduced});
  const initialHolo=hologramGeometry.attributes.position.array.slice();
  function tick(now){raf=requestAnimationFrame(tick);if(!active||document.hidden)return;const delta=Math.min(.05,(now-last)/1000);last=now;
    if(transition){const p=transition.duration?T.MathUtils.clamp((now-transition.start)/transition.duration,0,1):1,k=p*p*(3-2*p);camera.position.lerpVectors(transition.from,transition.to,k);controls.target.lerpVectors(transition.targetFrom,transition.targetTo,k);camera.lookAt(controls.target);dirty=true;if(p===1){transition=null;controls.enabled=true;}}
    if(!reduced.matches){objects.fan1.rotation.y=-now*.003;objects.fan2.rotation.y=-now*.003;objects.dish.rotation.y=Math.sin(now*.0005)*.4-Math.PI*.2;holo.rotation.y-=delta*.25;grid.material.uniforms.time.value=now*.001;
      for(const slide of slides){const phase=(now*.001+slide.offset)/slide.duration,index=Math.floor(phase)%slide.images.length;slide.material.uniforms.imageA.value=slide.images[index];slide.material.uniforms.imageB.value=slide.images[(index+1)%slide.images.length];slide.material.uniforms.progress.value=T.MathUtils.smoothstep(phase%1,.86,1);}
      if(burst){const t=(now-burst)/1900,amount=Math.sin(Math.min(t,1)*Math.PI);const positions=hologramGeometry.attributes.position.array;for(let i=0;i<positions.length;i+=3){positions[i]=initialHolo[i]+Math.sin(i*1.23)*amount*34;positions[i+1]=initialHolo[i+1]*(1-amount*.8);positions[i+2]=initialHolo[i+2]+Math.cos(i*2.31)*amount*34;}hologramGeometry.attributes.position.needsUpdate=true;if(t>=1)burst=0;}
      dirty=true;
    }
    if(!transition)controls.update();if(terminals.tick(now,Boolean(transition)))dirty=true;if(dirty){render();dirty=false;}
  }
  function setActive(value){active=value;dirty=true;last=performance.now();for(const video of videos){if(value&&!reduced.matches)video.play().catch(()=>{});else video.pause();}}
  reduced.addEventListener('change',()=>{setActive(active);dirty=true;});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(raf);setActive(false);onFailure();});
  resize();controls.update();requestAnimationFrame(tick);
  canvas.dataset.sceneSource='Ramen-Shop';canvas.dataset.sceneMeshes=String(Object.keys(objects).length);canvas.dataset.sceneAngles='360';
  return {focus,reset:()=>focus(null),resize,setActive,back:()=>terminals.back(),refresh:()=>terminals.refresh()};
}
