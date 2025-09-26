/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

import { LogLevel } from '@framework/live2dcubismframework';

/**
 * 샘플 앱에 사용되는 상수
 */

// 캔버스 너비 및 높이 픽셀 값 또는 동적 화면 크기 ( 'Auto').
export const CanvasSize: { width: number; height: number } | 'auto' = 'auto';

// 캔버스 수
export const CanvasNum = 1;

// 화면
export const ViewScale = 1.0;
export const ViewMaxScale = 2.0;
export const ViewMinScale = 0.8;

export const ViewLogicalLeft = -1.0;
export const ViewLogicalRight = 1.0;
export const ViewLogicalBottom = -1.0;
export const ViewLogicalTop = 1.0;

export const ViewLogicalMaxLeft = -2.0;
export const ViewLogicalMaxRight = 2.0;
export const ViewLogicalMaxBottom = -2.0;
export const ViewLogicalMaxTop = 2.0;

// 상대 경로
export const ResourcesPath = '../../Resources/';

// 모델 뒤의 배경 이미지 파일
export const BackImageName = 'image.png';

// 기어
export const GearImageName = 'icon_gear.png';

// 종료 버튼
export const PowerImageName = 'CloseNormal.png';

// 모델 정의 ----
// 모델이 위치한 디렉토리 이름 배열
// 디렉토리 이름이 model3.json의 이름과 일치하는지 확인하십시오.
export const ModelDir: string[] = [
  'ANIYA',
  'Mao'
];
export const ModelDirSize: number = ModelDir.length;

// 외부 정의 파일 (JSON)과 일치
export const MotionGroupIdle = 'Idle'; // アイドリング
export const MotionGroupTapBody = 'TapBody'; // 体をタップしたとき

// 외부 정의 파일 (JSON)과 일치
export const HitAreaNameHead = 'Head';
export const HitAreaNameBody = 'Body';

// 모션 우선 순위 상수
export const PriorityNone = 0;
export const PriorityIdle = 1;
export const PriorityNormal = 2;
export const PriorityForce = 3;

// MOC3 무결성 확인 옵션
export const MOCConsistencyValidationEnable = true;
// motion3.json의 무결성 확인 옵션
export const MotionConsistencyValidationEnable = true;

// 디버그 로그에 대한 옵션보기
export const DebugLogEnable = true;
export const DebugTouchLogEnable = false;

// 프레임 워크에서 로그 출력 레벨을 설정합니다
export const CubismLoggingLevel: LogLevel = LogLevel.LogLevel_Verbose;

// 기본값 렌더링 대상 크기
export const RenderTargetWidth = 1900;
export const RenderTargetHeight = 1000;
