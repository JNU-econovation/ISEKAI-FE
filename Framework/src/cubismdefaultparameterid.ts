/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

/**
 * @brief 파라미터 ID의 기본값을 유지하는 상수<br>
 *         기본값의 사양은 아래 설명서를 기반으로 합니다<br>
 *         https://docs.live2d.com/cubism-editor-manual/standard-parametor-list/
 */
export const CubismDefaultParameterId = Object.freeze<Record<string, string>>({
  // 파트 ID
  HitAreaPrefix: 'HitArea',
  HitAreaHead: 'Head',
  HitAreaBody: 'Body',
  PartsIdCore: 'Parts01Core',
  PartsArmPrefix: 'Parts01Arm_',
  PartsArmLPrefix: 'Parts01ArmL_',
  PartsArmRPrefix: 'Parts01ArmR_',
  // 파라미터 ID
  ParamAngleX: 'ParamAngleX',
  ParamAngleY: 'ParamAngleY',
  ParamAngleZ: 'ParamAngleZ',
  ParamEyeLOpen: 'ParamEyeLOpen',
  ParamEyeLSmile: 'ParamEyeLSmile',
  ParamEyeROpen: 'ParamEyeROpen',
  ParamEyeRSmile: 'ParamEyeRSmile',
  ParamEyeBallX: 'ParamEyeBallX',
  ParamEyeBallY: 'ParamEyeBallY',
  ParamEyeBallForm: 'ParamEyeBallForm',
  ParamBrowLY: 'ParamBrowLY',
  ParamBrowRY: 'ParamBrowRY',
  ParamBrowLX: 'ParamBrowLX',
  ParamBrowRX: 'ParamBrowRX',
  ParamBrowLAngle: 'ParamBrowLAngle',
  ParamBrowRAngle: 'ParamBrowRAngle',
  ParamBrowLForm: 'ParamBrowLForm',
  ParamBrowRForm: 'ParamBrowRForm',
  ParamMouthForm: 'ParamMouthForm',
  ParamMouthOpenY: 'ParamMouthOpenY',
  ParamCheek: 'ParamCheek',
  ParamBodyAngleX: 'ParamBodyAngleX',
  ParamBodyAngleY: 'ParamBodyAngleY',
  ParamBodyAngleZ: 'ParamBodyAngleZ',
  ParamBreath: 'ParamBreath',
  ParamArmLA: 'ParamArmLA',
  ParamArmRA: 'ParamArmRA',
  ParamArmLB: 'ParamArmLB',
  ParamArmRB: 'ParamArmRB',
  ParamHandL: 'ParamHandL',
  ParamHandR: 'ParamHandR',
  ParamHairFront: 'ParamHairFront',
  ParamHairSide: 'ParamHairSide',
  ParamHairBack: 'ParamHairBack',
  ParamHairFluffy: 'ParamHairFluffy',
  ParamShoulderY: 'ParamShoulderY',
  ParamBustX: 'ParamBustX',
  ParamBustY: 'ParamBustY',
  ParamBaseX: 'ParamBaseX',
  ParamBaseY: 'ParamBaseY',
  ParamNONE: 'NONE:'
});

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismdefaultparameterid';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const HitAreaBody = $.CubismDefaultParameterId.HitAreaBody;
  export const HitAreaHead = $.CubismDefaultParameterId.HitAreaHead;
  export const HitAreaPrefix = $.CubismDefaultParameterId.HitAreaPrefix;
  export const ParamAngleX = $.CubismDefaultParameterId.ParamAngleX;
  export const ParamAngleY = $.CubismDefaultParameterId.ParamAngleY;
  export const ParamAngleZ = $.CubismDefaultParameterId.ParamAngleZ;
  export const ParamArmLA = $.CubismDefaultParameterId.ParamArmLA;
  export const ParamArmLB = $.CubismDefaultParameterId.ParamArmLB;
  export const ParamArmRA = $.CubismDefaultParameterId.ParamArmRA;
  export const ParamArmRB = $.CubismDefaultParameterId.ParamArmRB;
  export const ParamBaseX = $.CubismDefaultParameterId.ParamBaseX;
  export const ParamBaseY = $.CubismDefaultParameterId.ParamBaseY;
  export const ParamBodyAngleX = $.CubismDefaultParameterId.ParamBodyAngleX;
  export const ParamBodyAngleY = $.CubismDefaultParameterId.ParamBodyAngleY;
  export const ParamBodyAngleZ = $.CubismDefaultParameterId.ParamBodyAngleZ;
  export const ParamBreath = $.CubismDefaultParameterId.ParamBreath;
  export const ParamBrowLAngle = $.CubismDefaultParameterId.ParamBrowLAngle;
  export const ParamBrowLForm = $.CubismDefaultParameterId.ParamBrowLForm;
  export const ParamBrowLX = $.CubismDefaultParameterId.ParamBrowLX;
  export const ParamBrowLY = $.CubismDefaultParameterId.ParamBrowLY;
  export const ParamBrowRAngle = $.CubismDefaultParameterId.ParamBrowRAngle;
  export const ParamBrowRForm = $.CubismDefaultParameterId.ParamBrowRForm;
  export const ParamBrowRX = $.CubismDefaultParameterId.ParamBrowRX;
  export const ParamBrowRY = $.CubismDefaultParameterId.ParamBrowRY;
  export const ParamBustX = $.CubismDefaultParameterId.ParamBustX;
  export const ParamBustY = $.CubismDefaultParameterId.ParamBustY;
  export const ParamCheek = $.CubismDefaultParameterId.ParamCheek;
  export const ParamEyeBallForm = $.CubismDefaultParameterId.ParamEyeBallForm;
  export const ParamEyeBallX = $.CubismDefaultParameterId.ParamEyeBallX;
  export const ParamEyeBallY = $.CubismDefaultParameterId.ParamEyeBallY;
  export const ParamEyeLOpen = $.CubismDefaultParameterId.ParamEyeLOpen;
  export const ParamEyeLSmile = $.CubismDefaultParameterId.ParamEyeLSmile;
  export const ParamEyeROpen = $.CubismDefaultParameterId.ParamEyeROpen;
  export const ParamEyeRSmile = $.CubismDefaultParameterId.ParamEyeRSmile;
  export const ParamHairBack = $.CubismDefaultParameterId.ParamHairBack;
  export const ParamHairFluffy = $.CubismDefaultParameterId.ParamHairFluffy;
  export const ParamHairFront = $.CubismDefaultParameterId.ParamHairFront;
  export const ParamHairSide = $.CubismDefaultParameterId.ParamHairSide;
  export const ParamHandL = $.CubismDefaultParameterId.ParamHandL;
  export const ParamHandR = $.CubismDefaultParameterId.ParamHandR;
  export const ParamMouthForm = $.CubismDefaultParameterId.ParamMouthForm;
  export const ParamMouthOpenY = $.CubismDefaultParameterId.ParamMouthOpenY;
  export const ParamNONE = $.CubismDefaultParameterId.ParamNONE;
  export const ParamShoulderY = $.CubismDefaultParameterId.ParamShoulderY;
  export const PartsArmLPrefix = $.CubismDefaultParameterId.PartsArmLPrefix;
  export const PartsArmPrefix = $.CubismDefaultParameterId.PartsArmPrefix;
  export const PartsArmRPrefix = $.CubismDefaultParameterId.PartsArmRPrefix;
  export const PartsIdCore = $.CubismDefaultParameterId.PartsIdCore;
}