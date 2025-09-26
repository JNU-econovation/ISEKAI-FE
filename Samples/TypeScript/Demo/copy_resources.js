/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

"use strict";
const fs = require('fs');
const publicResources = [
  {src: '../../../Core', dst: './public/Core'},
  {src: '../../Resources', dst: './public/Resources'},
];

publicResources.forEach((e)=>{if (fs.existsSync(e.dst)) fs.rmSync(e.dst, { recursive: true })});
publicResources.forEach((e)=>fs.cpSync(e.src, e.dst, {recursive: true}));
